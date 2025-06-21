import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const assetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['CASH', 'SAVINGS', 'PROPERTY', 'EQUITY', 'BONDS', 'OTHER']),
  value: z.number().refine(val => !isNaN(val), 'Asset value must be a valid number'),
  annualReturn: z.number().refine(val => !isNaN(val), 'Annual return must be a valid number'),
  returnType: z.enum(['FIXED', 'INFLATION_LINKED']),
  annualDividend: z.number().min(0, 'Annual dividend cannot be negative'),
  dividendStartDate: z.string().nullable().optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null
    // Validate that if a date is provided, it's a valid date string
    if (typeof val !== 'string' || val.trim() === '') return null
    
    // Check if it's a valid ISO date string (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      throw new Error('Invalid dividend start date format. Use YYYY-MM-DD format.')
    }
    
    const date = new Date(val + 'T00:00:00.000Z') // Ensure consistent timezone handling
    if (isNaN(date.getTime())) {
      throw new Error('Invalid dividend start date')
    }
    return val
  }),
  dividendEndDate: z.string().nullable().optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null
    // Validate that if a date is provided, it's a valid date string
    if (typeof val !== 'string' || val.trim() === '') return null
    
    // Check if it's a valid ISO date string (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      throw new Error('Invalid dividend end date format. Use YYYY-MM-DD format.')
    }
    
    const date = new Date(val + 'T00:00:00.000Z') // Ensure consistent timezone handling
    if (isNaN(date.getTime())) {
      throw new Error('Invalid dividend end date')
    }
    return val
  }),
  isDividendTaxed: z.boolean(),
  saleDate: z.string().nullable().optional().transform((val) => {
    if (val === '' || val === null || val === undefined) return null
    // Validate that if a date is provided, it's a valid date string
    if (typeof val !== 'string' || val.trim() === '') return null
    
    // Check if it's a valid ISO date string (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(val)) {
      throw new Error('Invalid sale date format. Use YYYY-MM-DD format.')
    }
    
    const date = new Date(val + 'T00:00:00.000Z') // Ensure consistent timezone handling
    if (isNaN(date.getTime())) {
      throw new Error('Invalid sale date')
    }
    return val
  }),
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
    const data = assetSchema.parse(body)

    const toDateOrNull = (val: string | null | undefined) => {
      if (!val) return null
      return new Date(val + 'T00:00:00.000Z')
    }

    // Check if asset exists and belongs to user
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: id,
        userId: payload.userId,
      },
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    const asset = await prisma.asset.update({
      where: { id: id },
      data: {
        ...data,
        dividendStartDate: toDateOrNull(data.dividendStartDate),
        dividendEndDate: toDateOrNull(data.dividendEndDate),
        saleDate: toDateOrNull(data.saleDate),
      },
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Update asset error:', error)
    
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

    // Check if asset exists and belongs to user
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }

    await prisma.asset.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete asset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 