import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'

const incomeSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  frequency: z.enum(['MONTHLY', 'ANNUAL']),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  increaseType: z.enum(['FIXED', 'INFLATION_LINKED']),
  increaseRate: z.number(),
  isTaxed: z.boolean().default(true),
  classificationId: z.string().nullable().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = payload.userId
    const { id } = await params
    const body = await request.json()
    const parsed = incomeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
    }
    // Ensure the income belongs to the user
    const existing = await prisma.income.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const updated = await prisma.income.update({
      where: { id },
      data: {
        ...parsed.data,
        amount: parsed.data.amount,
        increaseRate: parsed.data.increaseRate,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
      include: { classification: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating income:', error)
    return NextResponse.json({ error: 'Failed to update income' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = payload.userId
    const { id } = await params
    // Ensure the income belongs to the user
    const existing = await prisma.income.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.income.delete({ where: { id } })
    return NextResponse.json({ message: 'Income deleted' })
  } catch (error) {
    console.error('Error deleting income:', error)
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 })
  }
} 