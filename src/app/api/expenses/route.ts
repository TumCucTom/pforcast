import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const expenseSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(['MONTHLY', 'ANNUAL']),
  startDate: z.string().nullable().optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null
    // Validate that if a date is provided, it's a valid date string
    if (typeof val !== 'string' || val.trim() === '') return null
    
    // Check if it's a valid ISO date string (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      throw new Error('Invalid start date format. Use YYYY-MM-DD format.')
    }
    
    const date = new Date(val + 'T00:00:00.000Z') // Ensure consistent timezone handling
    if (isNaN(date.getTime())) {
      throw new Error('Invalid start date')
    }
    return val
  }),
  endDate: z.string().nullable().optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null
    // Validate that if a date is provided, it's a valid date string
    if (typeof val !== 'string' || val.trim() === '') return null
    
    // Check if it's a valid ISO date string (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      throw new Error('Invalid end date format. Use YYYY-MM-DD format.')
    }
    
    const date = new Date(val + 'T00:00:00.000Z') // Ensure consistent timezone handling
    if (isNaN(date.getTime())) {
      throw new Error('Invalid end date')
    }
    return val
  }),
  increaseType: z.enum(['FIXED', 'INFLATION_LINKED']),
  increaseRate: z.number().min(0),
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

    const expenses = await prisma.expense.findMany({
      where: { userId: payload.userId },
      include: { classification: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Get expenses error:', error)
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
    const data = expenseSchema.parse(body)

    const toDateOrNull = (val: string | null | undefined) => {
      if (!val) return null
      return new Date(val + 'T00:00:00.000Z')
    }

    const expense = await prisma.expense.create({
      data: {
        ...data,
        startDate: toDateOrNull(data.startDate),
        endDate: toDateOrNull(data.endDate),
        classificationId: data.classificationId || null,
        userId: payload.userId,
      },
      include: {
        classification: true,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Create expense error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
} 