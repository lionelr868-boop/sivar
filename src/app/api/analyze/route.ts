// ============================================================
// نموذج — POST /api/analyze
// Task 3-b — تحليل فكرة المشروع
// ============================================================
import { NextResponse } from 'next/server'
import { analyzeIdea } from '@/lib/server/analyze'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const idea = typeof body.idea === 'string' ? body.idea.trim() : ''
    if (!idea) {
      return NextResponse.json({ error: 'اكتب فكرتك أولاً' }, { status: 400 })
    }
    if (idea.length > 2000) {
      return NextResponse.json({ error: 'الفكرة طويلة جداً — اختصرها قليلاً' }, { status: 400 })
    }
    const analysis = await analyzeIdea(idea)
    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
