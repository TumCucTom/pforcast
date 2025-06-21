import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { generateProjection, calculateTotalAnnualIncome, roundToGBP } from '@/lib/calculations'

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

    // Get selected month from query parameters (default to current month)
    const { searchParams } = new URL(request.url)
    const selectedMonth = searchParams.get('month')
    let targetMonth = new Date()
    
    if (selectedMonth) {
      targetMonth = new Date(selectedMonth)
      if (isNaN(targetMonth.getTime())) {
        targetMonth = new Date()
      }
    }

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

    // Calculate projection
    let months = 360
    if (budget.projectEndDate) {
      const start = new Date()
      const end = new Date(budget.projectEndDate)
      months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
      if (months < 1) months = 1
    }
    const projection = generateProjection(expenses, incomes, assets, budget.inflationRate, months)

    // Find the projection for the selected month
    const selectedMonthProjection = projection.find(p => 
      p.month.getFullYear() === targetMonth.getFullYear() && 
      p.month.getMonth() === targetMonth.getMonth()
    ) || projection[0]

    console.log('Selected month projection:', {
      month: selectedMonthProjection.month,
      totalIncomeBeforeTax: selectedMonthProjection.totalIncomeBeforeTax,
      totalIncomeAfterTax: selectedMonthProjection.totalIncomeAfterTax,
      totalExpenses: selectedMonthProjection.totalExpenses,
      investmentIncome: selectedMonthProjection.investmentIncome,
      netIncome: selectedMonthProjection.netIncome,
      cashFlow: selectedMonthProjection.cashFlow
    })

    // Calculate summary statistics
    const currentMonth = selectedMonthProjection
    const assetBreakdown = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + roundToGBP(asset.value)
      return acc
    }, {} as Record<string, number>)

    // Calculate total annual income correctly
    const totalAnnualIncome = calculateTotalAnnualIncome(incomes)

    // Format projection data for charts (keep all fields, just round and serialize month)
    const formattedProjection = projection.map(p => ({
      ...p,
      month: p.month.toISOString(),
      totalIncomeBeforeTax: roundToGBP(p.totalIncomeBeforeTax),
      totalIncomeAfterTax: roundToGBP(p.totalIncomeAfterTax),
      totalExpenses: roundToGBP(p.totalExpenses),
      netIncome: roundToGBP(p.netIncome),
      tax: roundToGBP(p.tax),
      cashFlow: roundToGBP(p.cashFlow),
      investmentIncome: roundToGBP(p.investmentIncome),
      assetValues: Object.fromEntries(Object.entries(p.assetValues).map(([k, v]) => [k, roundToGBP(v)])),
    }))

    const summary = {
      currentMonth: {
        totalIncome: currentMonth.totalIncomeAfterTax,
        totalExpenses: currentMonth.totalExpenses,
        netIncome: currentMonth.netIncome,
        tax: currentMonth.tax || 0,
        cashFlow: currentMonth.cashFlow,
        investmentIncome: currentMonth.investmentIncome || 0,
      },
      totalAssetValue: roundToGBP(assets.reduce((sum, a) => sum + a.value, 0)),
      totalAnnualIncome: roundToGBP(totalAnnualIncome),
      assetBreakdown,
      cashFlowIssues: projection.filter(p => p.cashFlow < 0).length,
      inflationRate: budget.inflationRate,
      selectedMonth: targetMonth.toISOString().slice(0, 7), // YYYY-MM format
    }

    return NextResponse.json({ projection: formattedProjection, summary: { ...summary, projection: formattedProjection } })
  } catch (error) {
    console.error('Projection error:', error)
    return NextResponse.json(
      { error: 'Failed to generate projection' },
      { status: 500 }
    )
  }
} 