// ============================================================
// SIVAR — GET/POST /api/templates
// Task 7-e — قوالبي المحفوظة: قائمة القوالب / حفظ مشروع كقالب
// ============================================================
import { NextResponse } from 'next/server'
import type { SavedTemplate } from '@prisma/client'
import { db } from '@/lib/db'
import { findOwnedProject, getSessionUserId } from '@/lib/server/session'
import type { ProjectSchema, ProjectType, SavedTemplateDTO } from '@/lib/types'

const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB

// ============================================================
// DTO mapper — SavedTemplate (DB) → SavedTemplateDTO
// ============================================================
function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function templateToDTO(template: SavedTemplate): SavedTemplateDTO {
  let pageCount = 0
  const parsed = safeParseJson(template.schemaJson)
  if (parsed && typeof parsed === 'object') {
    const schema = parsed as Partial<ProjectSchema>
    if (Array.isArray(schema.pages)) pageCount = schema.pages.length
  }
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    type: template.type as ProjectType,
    pageCount,
    sourceProjectId: template.sourceProjectId,
    createdAt: template.createdAt.toISOString(),
  }
}

// ============================================================
// GET — قوالب المستخدم (الأحدث أولاً)
// ============================================================
export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const templates = await db.savedTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ templates: templates.map(templateToDTO) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

// ============================================================
// POST — حفظ مشروع كقالب { projectId, name?, description? }
// ============================================================
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'الطلب كبير جداً' }, { status: 413 })
    }
    const body = (JSON.parse(rawBody || '{}') as Record<string, unknown>) ?? {}

    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
    if (!projectId) {
      return NextResponse.json({ error: 'معرّف المشروع مطلوب' }, { status: 400 })
    }

    const project = await findOwnedProject(projectId, userId)
    if (!project) {
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 })
    }

    // بيانات المخطط (أيقونة/نوع) — بأمان ضد المخططات القديمة
    const parsed = safeParseJson(project.schemaJson)
    const schema = parsed && typeof parsed === 'object' ? (parsed as Partial<ProjectSchema>) : null
    const icon =
      schema?.metadata && typeof schema.metadata.icon === 'string' && schema.metadata.icon.trim()
        ? schema.metadata.icon.trim()
        : 'layers'
    const type =
      schema?.metadata && typeof schema.metadata.type === 'string' && schema.metadata.type.trim()
        ? schema.metadata.type.trim()
        : project.type

    const name =
      typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 60) : project.name
    const description =
      typeof body.description === 'string' ? body.description.trim().slice(0, 280) : ''

    const template = await db.savedTemplate.create({
      data: {
        userId,
        name,
        description,
        icon,
        type,
        schemaJson: project.schemaJson,
        sourceProjectId: project.id,
      },
    })

    return NextResponse.json({ template: templateToDTO(template) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
