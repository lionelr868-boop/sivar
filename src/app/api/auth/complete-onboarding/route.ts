// ============================================================
// SIVAR — POST /api/auth/complete-onboarding
// Task 3-b — إكمال التهيئة الأولى (اسم/نوع/فكرة/نمط)
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId, getUserDTO } from '@/lib/server/session'

const PROJECT_TYPES = [
  'saas', 'ai', 'ecommerce', 'marketplace', 'education', 'health', 'realestate',
  'booking', 'services', 'restaurant', 'agency', 'app', 'fintech', 'admin', 'delivery', 'other',
]
const PROJECT_STYLES = ['modern', 'minimal', 'professional', 'luxury', 'youthful', 'tech']

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const data: {
      onboarded: boolean
      name?: string
      projectType?: string
      idea?: string
      style?: string
    } = { onboarded: true }
    if (typeof body.name === 'string' && body.name.trim().length >= 2) data.name = body.name.trim().slice(0, 60)
    if (typeof body.projectType === 'string' && PROJECT_TYPES.includes(body.projectType)) {
      data.projectType = body.projectType
    }
    if (typeof body.idea === 'string') data.idea = body.idea.slice(0, 2000)
    if (typeof body.style === 'string' && PROJECT_STYLES.includes(body.style)) {
      data.style = body.style
    }
    const user = await db.user.update({ where: { id: userId }, data })
    return NextResponse.json({ user: getUserDTO(user) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
