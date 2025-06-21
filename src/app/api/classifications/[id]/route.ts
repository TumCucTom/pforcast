import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateClassificationSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  type: z.enum(['EXPENSE', 'INCOME']).optional(),
  color: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = updateClassificationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const userId = payload.userId
    const classificationId = params.id

    // Check if classification exists and belongs to user
    const existingClassification = await prisma.classification.findFirst({
      where: { 
        id: classificationId,
        userId 
      }
    })

    if (!existingClassification) {
      return NextResponse.json(
        { error: 'Classification not found' },
        { status: 404 }
      )
    }

    // If updating name, check for duplicates
    if (validationResult.data.name && validationResult.data.name !== existingClassification.name) {
      const duplicateClassification = await prisma.classification.findFirst({
        where: { 
          userId,
          name: validationResult.data.name,
          id: { not: classificationId }
        }
      })

      if (duplicateClassification) {
        return NextResponse.json(
          { error: 'Classification with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedClassification = await prisma.classification.update({
      where: { id: classificationId },
      data: validationResult.data,
    })

    return NextResponse.json(updatedClassification)
  } catch (error) {
    console.error('Error updating classification:', error)
    return NextResponse.json(
      { error: 'Failed to update classification' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const classificationId = params.id

    // Check if classification exists and belongs to user
    const existingClassification = await prisma.classification.findFirst({
      where: { 
        id: classificationId,
        userId 
      }
    })

    if (!existingClassification) {
      return NextResponse.json(
        { error: 'Classification not found' },
        { status: 404 }
      )
    }

    // Check if classification is being used by any expenses or incomes
    const [expenseCount, incomeCount] = await Promise.all([
      prisma.expense.count({ where: { classificationId } }),
      prisma.income.count({ where: { classificationId } })
    ])

    if (expenseCount > 0 || incomeCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete classification that is being used by expenses or incomes' },
        { status: 400 }
      )
    }

    await prisma.classification.delete({
      where: { id: classificationId },
    })

    return NextResponse.json({ message: 'Classification deleted successfully' })
  } catch (error) {
    console.error('Error deleting classification:', error)
    return NextResponse.json(
      { error: 'Failed to delete classification' },
      { status: 500 }
    )
  }
} 