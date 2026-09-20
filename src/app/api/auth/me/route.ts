// ============================================================
// SIVAR — GET/PATCH /api/auth/me
// Task 3-b — المستخدم الحالي / تحديث الملف الشخصي
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId, getUserDTO } from '@/lib/server/session'

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) return NextResponse.json({ user: null })
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({ user: getUserDTO(user) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const data: { name?: string; idea?: string; style?: string } = {}
    if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim()
    if (typeof body.idea === 'string') data.idea = body.idea.slice(0, 2000)
    if (typeof body.style === 'string' && body.style.trim()) data.style = body.style.trim().slice(0, 40)
    const updated = await db.user.update({ where: { id: userId }, data })
    return NextResponse.json({ user: getUserDTO(updated) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
