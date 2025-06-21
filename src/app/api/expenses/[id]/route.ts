import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const expenseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(['MONTHLY', 'ANNUAL']).optional(),
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
  increaseType: z.enum(['FIXED', 'INFLATION_LINKED']).optional(),
  increaseRate: z.number().min(0).optional(),
  classificationId: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const data = expenseUpdateSchema.parse(body)

    const toDateOrNull = (val: string | null | undefined) => {
      if (!val) return null
      return new Date(val + 'T00:00:00.000Z')
    }

    // Verify expense belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: id,
        userId: payload.userId,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    const expense = await prisma.expense.update({
      where: { id: id },
      data: {
        ...data,
        startDate: toDateOrNull(data.startDate),
        endDate: toDateOrNull(data.endDate),
      },
      include: {
        classification: true,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Update expense error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Verify expense belongs to user
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Delete expense error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 