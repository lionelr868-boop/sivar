// ============================================================
// SIVAR — POST /api/auth/demo
// Task 3-b — دخول تجريبي + بذر 3 مشاريع من القوالب
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserDTO, hashPassword, setSession } from '@/lib/server/session'
import { buildTemplateSchema } from '@/lib/project/templates'
import { renameProjectInSchema } from '@/lib/project/tools'

const DEMO_EMAIL = 'demo@sivar.dz'

/** مشاريع البذر التجريبية: [قالب، اسم، حالة] */
const DEMO_PROJECTS: Array<{ templateId: string; name: string; status: string }> = [
  { templateId: 'booking-pro', name: 'حجزتي', status: 'ready' },
  { templateId: 'ecommerce-store', name: 'متجرتي', status: 'draft' },
  { templateId: 'saas-suite', name: 'منصتي', status: 'draft' },
]

export async function POST(): Promise<NextResponse> {
  try {
    let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } })
    if (!user) {
      user = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: 'مستخدم تجريبي',
          passwordHash: hashPassword('demo1234'),
          onboarded: true,
        },
      })
    }

    // بذر المشاريع عند أول زيارة
    const count = await db.project.count({ where: { userId: user.id } })
    if (count === 0) {
      for (const seed of DEMO_PROJECTS) {
        let schema = buildTemplateSchema(seed.templateId)
        schema = renameProjectInSchema(schema, seed.name)
        const schemaJson = JSON.stringify(schema)
        await db.project.create({
          data: {
            userId: user.id,
            name: seed.name,
            type: schema.metadata.type,
            status: seed.status,
            schemaJson,
            versions: {
              create: { number: 1, label: 'إنشاء المشروع', schemaJson },
            },
          },
        })
      }
    }

    await setSession(user.id)
    return NextResponse.json({ user: getUserDTO(user) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
