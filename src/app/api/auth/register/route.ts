import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, password, name } = validationResult.data

    // Test database connection
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
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
        name: name || null,
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
    const defaultAssets = [
      { name: 'Cash', type: 'CASH' as const, value: 0, annualReturn: 0, annualDividend: 0 },
      { name: 'Savings', type: 'SAVINGS' as const, value: 0, annualReturn: 2.5, annualDividend: 0 },
      { name: 'Pension', type: 'EQUITY' as const, value: 0, annualReturn: 6.0, annualDividend: 2.0 },
      { name: 'ISA', type: 'EQUITY' as const, value: 0, annualReturn: 7.0, annualDividend: 2.5 },
      { name: 'Home Value', type: 'PROPERTY' as const, value: 0, annualReturn: 3.0, annualDividend: 0 },
      { name: 'Mortgage', type: 'OTHER' as const, value: 0, annualReturn: 0, annualDividend: 0 },
    ]

    for (const asset of defaultAssets) {
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
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 