import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'
import { DEFAULT_ASSETS } from '@/lib/defaults'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    // Create default budget
    await prisma.budget.create({
      data: {
        userId: user.id,
        inflationRate: 2.5,
      },
    })

    // Create default classifications
    const classifications = [
      { name: 'Housing', type: 'EXPENSE' as const, color: '#3B82F6' },
      { name: 'Transport', type: 'EXPENSE' as const, color: '#10B981' },
      { name: 'Living Costs', type: 'EXPENSE' as const, color: '#F59E0B' },
      { name: 'Entertainment', type: 'EXPENSE' as const, color: '#EF4444' },
      { name: 'Savings & Investment', type: 'EXPENSE' as const, color: '#8B5CF6' },
      { name: 'Employment', type: 'INCOME' as const, color: '#06B6D4' },
      { name: 'Investment Income', type: 'INCOME' as const, color: '#84CC16' },
    ]

    for (const classification of classifications) {
      await prisma.classification.create({
        data: {
          ...classification,
          userId: user.id,
        },
      })
    }

    // Create default assets
    for (const asset of DEFAULT_ASSETS) {
      await prisma.asset.create({
        data: {
          name: asset.name,
          type: asset.type,
          value: asset.value,
          annualReturn: asset.annualReturn,
          returnType: 'FIXED',
          annualDividend: asset.annualDividend,
          dividendStartDate: null,
          dividendEndDate: null,
          isDividendTaxed: true,
          saleDate: null,
          userId: user.id,
        },
      })
    }

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
} 