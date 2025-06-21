import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { generateProjection } from '@/lib/calculations'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
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
      totalAssets: assets.reduce((sum, a) => sum + a.value, 0),
      totalIncome: currentMonth.totalIncome,
      totalExpenses: currentMonth.totalExpenses,
      netCashFlow: currentMonth.cashFlow,
      assetBreakdown,
      projectionMonths: projection.length,
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