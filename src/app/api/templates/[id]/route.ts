// ============================================================
// نموذج — DELETE /api/templates/[id]
// Task 7-e — حذف قالب محفوظ (ملكية المستخدم)
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId } from '@/lib/server/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const template = await db.savedTemplate.findFirst({ where: { id, userId } })
    if (!template) {
      return NextResponse.json({ error: 'القالب غير موجود' }, { status: 404 })
    }
    await db.savedTemplate.delete({ where: { id: template.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
