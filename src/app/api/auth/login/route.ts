// ============================================================
// SIVAR — POST /api/auth/login
// Task 3-b — تسجيل الدخول بالبريد وكلمة المرور
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserDTO, hashPassword, setSession } from '@/lib/server/session'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { email } })
    if (!user || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }
    await setSession(user.id)
    return NextResponse.json({ user: getUserDTO(user) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
