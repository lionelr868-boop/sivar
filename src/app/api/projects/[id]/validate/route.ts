// ============================================================
// SIVAR — GET /api/projects/[id]/validate
// Task 3-b — التحقق من سلامة المخطط قبل التصدير
// ============================================================
import { NextResponse } from 'next/server'
import { findOwnedProject, getSessionUserId, readProjectSchema } from '@/lib/server/session'
import { validateSchema } from '@/lib/project/validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const project = await findOwnedProject(id, userId)
    if (!project) {
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 })
    }
    try {
      const schema = readProjectSchema(project)
      const result = validateSchema(schema)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({
        ok: false,
        checks: [
          {
            id: 'schema',
            label: 'المخطط',
            status: 'error',
            detail: 'مخطط المشروع تالف أو غير قابل للقراءة',
          },
        ],
      })
    }
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
