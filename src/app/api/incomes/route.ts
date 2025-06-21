import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const incomeSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(['MONTHLY', 'ANNUAL']),
  startDate: z.string().nullable().optional().transform(val => val === '' ? null : val),
  endDate: z.string().nullable().optional().transform(val => val === '' ? null : val),
  increaseType: z.enum(['FIXED', 'INFLATION_LINKED']),
  increaseRate: z.number().min(0),
  isTaxed: z.boolean().default(true),
  classificationId: z.string().nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const incomes = await prisma.income.findMany({
      where: { userId: payload.userId },
      include: { classification: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(incomes)
  } catch (error) {
    console.error('Get incomes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = incomeSchema.parse(body)

    const income = await prisma.income.create({
      data: {
        ...data,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        classificationId: data.classificationId || null,
        userId: payload.userId,
      },
      include: {
        classification: true,
      },
    })

    return NextResponse.json(income, { status: 201 })
  } catch (error) {
    console.error('Create income error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
} 