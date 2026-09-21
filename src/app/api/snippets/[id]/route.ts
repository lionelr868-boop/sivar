// ============================================================
// SIVAR — DELETE /api/snippets/[id]
// Task 7-e — حذف كود من مكتبة HTML (ملكية المستخدم)
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
    const snippet = await db.htmlSnippet.findFirst({ where: { id, userId } })
    if (!snippet) {
      return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 })
    }
    await db.htmlSnippet.delete({ where: { id: snippet.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
