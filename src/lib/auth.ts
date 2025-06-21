import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
    return jwt.verify(token, secret) as { userId: string }
  } catch {
    return null
  }
} 