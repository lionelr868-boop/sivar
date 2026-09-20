// ============================================================
// نموذج — POST /api/auth/signup
// Task 3-b — إنشاء حساب جديد
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserDTO, hashPassword, setSession } from '@/lib/server/session'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (name.length < 2) {
      return NextResponse.json({ error: 'الاسم قصير جداً — حرفان على الأقل' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور قصيرة جداً — 6 أحرف على الأقل' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'هذا البريد مسجل بالفعل — سجّل الدخول' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name: name.slice(0, 60),
        email,
        passwordHash: hashPassword(password),
        onboarded: false,
      },
    })
    await setSession(user.id)
    return NextResponse.json({ user: getUserDTO(user) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
