// ============================================================
// نموذج — POST /api/auth/logout
// Task 3-b — تسجيل الخروج (حذف الجلسة)
// ============================================================
import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/server/session'

export async function POST(): Promise<NextResponse> {
  try {
    await clearSession()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
