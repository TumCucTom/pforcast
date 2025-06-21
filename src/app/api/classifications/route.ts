import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const classificationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['EXPENSE', 'INCOME']),
  color: z.string().optional(),
})

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
    const classifications = await prisma.classification.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(classifications)
  } catch (error) {
    console.error('Error fetching classifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const validationResult = classificationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, type, color } = validationResult.data
    const userId = payload.userId

    // Check if classification with same name already exists for this user
    const existingClassification = await prisma.classification.findFirst({
      where: { 
        userId,
        name: name
      }
    })

    if (existingClassification) {
      return NextResponse.json(
        { error: 'Classification with this name already exists' },
        { status: 400 }
      )
    }

    const classification = await prisma.classification.create({
      data: {
        name,
        type,
        color: color || '#3B82F6',
        userId,
      },
    })

    return NextResponse.json(classification, { status: 201 })
  } catch (error) {
    console.error('Error creating classification:', error)
    return NextResponse.json(
      { error: 'Failed to create classification' },
      { status: 500 }
    )
  }
} 