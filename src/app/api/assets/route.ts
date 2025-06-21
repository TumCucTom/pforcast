import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const assetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['CASH', 'SAVINGS', 'PROPERTY', 'EQUITY', 'BONDS', 'OTHER']),
  value: z.number(),
  annualReturn: z.number(),
  returnType: z.enum(['FIXED', 'INFLATION_LINKED']),
  annualDividend: z.number().min(0),
  dividendStartDate: z.string().nullable().optional(),
  dividendEndDate: z.string().nullable().optional(),
  isDividendTaxed: z.boolean(),
  saleDate: z.string().nullable().optional(),
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

    const assets = await prisma.asset.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(assets)
  } catch (error) {
    console.error('Get assets error:', error)
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
    const data = assetSchema.parse(body)

    const asset = await prisma.asset.create({
      data: {
        ...data,
        dividendStartDate: data.dividendStartDate || null,
        dividendEndDate: data.dividendEndDate || null,
        saleDate: data.saleDate || null,
        userId: payload.userId,
      },
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error('Create asset error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
} 