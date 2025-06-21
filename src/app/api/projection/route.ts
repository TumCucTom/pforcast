import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { generateProjection } from '@/lib/calculations'

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

    // Get user's data
    const [expenses, incomes, assets, budget] = await Promise.all([
      prisma.expense.findMany({ where: { userId } }),
      prisma.income.findMany({ where: { userId } }),
      prisma.asset.findMany({ where: { userId } }),
      prisma.budget.findFirst({ where: { userId } }),
    ])

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Calculate projection
    const projection = generateProjection(expenses, incomes, assets, budget.inflationRate)

    // Calculate summary statistics
    const currentMonth = projection[0]
    const assetBreakdown = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.value
      return acc
    }, {} as Record<string, number>)

    const summary = {
      currentMonth: {
        totalIncome: currentMonth.totalIncome,
        totalExpenses: currentMonth.totalExpenses,
        netIncome: currentMonth.totalIncome - currentMonth.totalExpenses,
        tax: currentMonth.tax || 0,
        cashFlow: currentMonth.cashFlow,
        investmentIncome: currentMonth.investmentIncome || 0,
      },
      totalAssetValue: assets.reduce((sum, a) => sum + a.value, 0),
      assetBreakdown,
      cashFlowIssues: projection.filter(p => p.cashFlow < 0).length,
      inflationRate: budget.inflationRate,
    }

    return NextResponse.json({ projection, summary })
  } catch (error) {
    console.error('Projection error:', error)
    return NextResponse.json(
      { error: 'Failed to generate projection' },
      { status: 500 }
    )
  }
} 