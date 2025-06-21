import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { generateProjection, projectExpense, projectAsset, roundToGBP, calculateTax } from '@/lib/calculations'
import { addMonths, startOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId

    // Get user's data with classifications
    const [expenses, incomes, assets, budget] = await Promise.all([
      prisma.expense.findMany({ 
        where: { userId },
        include: { classification: true }
      }),
      prisma.income.findMany({ 
        where: { userId },
        include: { classification: true }
      }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.budget.findFirst({ where: { userId } }),
    ])

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Calculate projection period
    let months = 360
    if (budget.projectEndDate) {
      const start = new Date()
      const end = new Date(budget.projectEndDate)
      months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
      if (months < 1) months = 1
    }

    // Generate detailed projections
    const detailedProjection = []
    let currentDate = startOfMonth(new Date())
    let assetValues: { [assetId: string]: number } = {}
    
    // Initialize asset values
    assets.forEach(asset => {
      assetValues[asset.id] = roundToGBP(asset.value)
    })

    for (let i = 0; i < months; i++) {
      const projectionDate = addMonths(currentDate, i)
      
      // Project expenses with breakdown
      const expenseBreakdown: { [expenseId: string]: { name: string; amount: number; classification?: string } } = {}
      const totalExpenses = expenses.reduce((sum, expense) => {
        const amount = projectExpense(
          expense.amount,
          expense.frequency,
          expense.increaseType,
          expense.increaseRate,
          budget.inflationRate,
          expense.startDate,
          expense.endDate,
          projectionDate
        )
        
        if (amount > 0) {
          expenseBreakdown[expense.id] = {
            name: expense.name,
            amount: roundToGBP(amount),
            classification: expense.classification?.name
          }
        }
        
        return sum + amount
      }, 0)

      // Project incomes with breakdown
      const incomeBreakdown: { [incomeId: string]: { name: string; amount: number; classification?: string } } = {}
      let taxedIncome = 0
      let nonTaxedIncome = 0
      
      incomes.forEach(income => {
        const amount = projectExpense(
          income.amount,
          income.frequency,
          income.increaseType,
          income.increaseRate,
          budget.inflationRate,
          income.startDate,
          income.endDate,
          projectionDate
        )
        
        if (amount > 0) {
          incomeBreakdown[income.id] = {
            name: income.name,
            amount: roundToGBP(amount),
            classification: income.classification?.name
          }
          
          if ((income as any).isTaxed) {
            taxedIncome += amount
          } else {
            nonTaxedIncome += amount
          }
        }
      })

      // Project assets with breakdown
      const assetBreakdown: { [assetId: string]: { name: string; value: number; monthlyReturn: number; monthlyDividend: number; isSold: boolean } } = {}
      let investmentIncome = 0
      const newAssetValues: { [assetId: string]: number } = {}
      let assetSaleProceeds = 0 // Track proceeds from asset sales
      
      assets.forEach(asset => {
        const projection = projectAsset(asset, budget.inflationRate, projectionDate, assetValues[asset.id] || 0)
        
        if (projection.isSold) {
          // Asset was sold - add its value to cash proceeds
          assetSaleProceeds += assetValues[asset.id] || 0
          newAssetValues[asset.id] = 0
          
          assetBreakdown[asset.id] = {
            name: asset.name,
            value: 0,
            monthlyReturn: 0,
            monthlyDividend: 0,
            isSold: true
          }
        } else {
          // Asset continues to exist
          newAssetValues[asset.id] = projection.value
          investmentIncome += projection.monthlyDividend
          
          assetBreakdown[asset.id] = {
            name: asset.name,
            value: projection.value,
            monthlyReturn: projection.monthlyReturn,
            monthlyDividend: projection.monthlyDividend,
            isSold: false
          }
        }
      })

      // Calculate total income before tax (including investment income)
      const totalIncomeBeforeTax = taxedIncome + nonTaxedIncome + investmentIncome

      // Calculate tax only on taxed income and taxed investment income
      const totalTaxedIncome = taxedIncome + (investmentIncome * 0.8) // Assume 80% of investment income is taxed
      const tax = calculateTax(totalTaxedIncome)

      // Calculate total income after tax
      const totalIncomeAfterTax = totalIncomeBeforeTax - tax

      // Calculate net income
      const netIncome = totalIncomeAfterTax - totalExpenses

      // Calculate cash flow (income after tax minus expenses)
      const cashFlow = totalIncomeAfterTax - totalExpenses

      // Update cash asset
      const cashAsset = assets.find(a => a.type === 'CASH')
      if (cashAsset) {
        // The cash asset has already been projected with returns in the asset projection loop
        // We just need to add the cash flow and asset sale proceeds
        const currentCashValue = newAssetValues[cashAsset.id] || 0
        const finalCashValue = currentCashValue + cashFlow + assetSaleProceeds
        
        newAssetValues[cashAsset.id] = finalCashValue
      }

      detailedProjection.push({
        month: projectionDate.toISOString(),
        totalIncome: roundToGBP(totalIncomeBeforeTax),
        totalIncomeBeforeTax: roundToGBP(totalIncomeBeforeTax),
        totalIncomeAfterTax: roundToGBP(totalIncomeAfterTax),
        totalExpenses: roundToGBP(totalExpenses),
        netIncome: roundToGBP(netIncome),
        tax: roundToGBP(tax),
        cashFlow: roundToGBP(cashFlow),
        investmentIncome: roundToGBP(investmentIncome),
        cashValue: roundToGBP(newAssetValues[cashAsset?.id || ''] || 0),
        expenseBreakdown,
        incomeBreakdown,
        assetBreakdown,
      })

      assetValues = newAssetValues
    }

    const summary = {
      inflationRate: budget.inflationRate,
      totalMonths: months,
    }

    return NextResponse.json({ detailedProjection, summary })
  } catch (error) {
    console.error('Debug projection error:', error)
    return NextResponse.json(
      { error: 'Failed to generate debug projection' },
      { status: 500 }
    )
  }
} 