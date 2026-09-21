// ============================================================
// SIVAR — POST /api/templates/[id]/use
// Task 7-e — إنشاء مشروع جديد من قالب محفوظ
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId, projectToDTO } from '@/lib/server/session'
import type { ProjectSchema } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

const MAX_BODY_BYTES = 64 * 1024

export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
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

    let body: Record<string, unknown> = {}
    try {
      const raw = await request.text()
      if (raw.length > MAX_BODY_BYTES) {
        return NextResponse.json({ error: 'الطلب كبير جداً' }, { status: 413 })
      }
      body = (JSON.parse(raw || '{}') as Record<string, unknown>) ?? {}
    } catch {
      body = {}
    }

    const nameOverride =
      typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 60) : ''

    // استنساخ المخطط مع تسمية جديدة
    let schema: ProjectSchema
    try {
      schema = JSON.parse(template.schemaJson) as ProjectSchema
    } catch {
      return NextResponse.json({ error: 'تعذّر قراءة بيانات القالب' }, { status: 500 })
    }

    const newName = nameOverride || `${template.name} (نسخة)`
    schema.metadata = { ...schema.metadata, name: newName, createdAt: new Date().toISOString() }
    schema.settings = { ...schema.settings, projectName: newName }
    schema.navigation = { ...schema.navigation, brand: newName }

    const schemaJson = JSON.stringify(schema)

    const project = await db.project.create({
      data: {
        userId,
        name: newName,
        type: schema.metadata?.type ?? template.type,
        status: 'draft',
        schemaJson,
        analysisJson: null,
        versions: {
          create: { number: 1, label: `نسخة من قالب «${template.name}»`, schemaJson },
        },
      },
      include: { _count: { select: { versions: true } } },
    })

    return NextResponse.json({ project: projectToDTO(project, project._count.versions) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
