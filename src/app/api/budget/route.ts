import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const budget = await prisma.budget.findUnique({ where: { userId: payload.userId } })
    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }
    return NextResponse.json({ 
      inflationRate: budget.inflationRate,
      projectEndDate: budget.projectEndDate?.toISOString().split('T')[0] || null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { inflationRate, projectEndDate } = await request.json()
    const budget = await prisma.budget.update({
      where: { userId: payload.userId },
      data: { 
        inflationRate,
        projectEndDate: projectEndDate ? new Date(projectEndDate) : null
      },
    })
    return NextResponse.json({ 
      inflationRate: budget.inflationRate,
      projectEndDate: budget.projectEndDate?.toISOString().split('T')[0] || null
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 