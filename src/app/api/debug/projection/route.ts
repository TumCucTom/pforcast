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
      const totalIncomes = incomes.reduce((sum, income) => {
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
        }
        
        return sum + amount
      }, 0)

      // Project assets with breakdown
      const assetBreakdown: { [assetId: string]: { name: string; value: number; monthlyReturn: number; monthlyDividend: number; isSold: boolean } } = {}
      let investmentIncome = 0
      const newAssetValues: { [assetId: string]: number } = {}
      
      assets.forEach(asset => {
        const projection = projectAsset(asset, budget.inflationRate, projectionDate, assetValues[asset.id] || 0)
        newAssetValues[asset.id] = projection.value
        
        assetBreakdown[asset.id] = {
          name: asset.name,
          value: projection.value,
          monthlyReturn: projection.monthlyReturn,
          monthlyDividend: projection.monthlyDividend,
          isSold: projection.isSold
        }
        
        if (!projection.isSold) {
          investmentIncome += projection.monthlyDividend
        }
      })

      // Calculate total income including investment income
      const totalIncome = totalIncomes + investmentIncome

      // Calculate tax using the proper tax function
      const tax = calculateTax(totalIncome)

      // Calculate net income
      const netIncome = totalIncome - tax

      // Calculate cash flow
      const cashFlow = netIncome - totalExpenses

      // Update cash asset
      const cashAsset = assets.find(a => a.type === 'CASH')
      if (cashAsset) {
        newAssetValues[cashAsset.id] = (newAssetValues[cashAsset.id] || 0) + cashFlow
      }

      detailedProjection.push({
        month: projectionDate.toISOString(),
        totalIncome: roundToGBP(totalIncome),
        totalExpenses: roundToGBP(totalExpenses),
        netIncome: roundToGBP(netIncome),
        tax: roundToGBP(tax),
        cashFlow: roundToGBP(cashFlow),
        investmentIncome: roundToGBP(investmentIncome),
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