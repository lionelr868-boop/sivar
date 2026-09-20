// ============================================================
// نموذج — POST /api/snippets/[id]/use
// Task 7-e — إضافة صفحة HTML من المكتبة إلى مشروع قائم
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { findOwnedProject, getSessionUserId, projectToDTO, createProjectVersion } from '@/lib/server/session'
import { addHtmlPageToSchema } from '@/lib/project/tools'
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

    const snippet = await db.htmlSnippet.findFirst({ where: { id, userId } })
    if (!snippet) {
      return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 })
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

    const projectId = typeof body.projectId === 'string' ? body.projectId : ''
    const placement = body.placement === 'dashboard' ? 'dashboard' : 'site'
    const pageName =
      typeof body.pageName === 'string' && body.pageName.trim() ? body.pageName.trim().slice(0, 60) : ''

    const project = await findOwnedProject(projectId, userId)
    if (!project) {
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 })
    }

    let schema: ProjectSchema
    try {
      schema = JSON.parse(project.schemaJson) as ProjectSchema
    } catch {
      return NextResponse.json({ error: 'تعذّر قراءة بيانات المشروع' }, { status: 500 })
    }

    const { schema: next } = addHtmlPageToSchema(schema, {
      name: pageName || snippet.name,
      html: snippet.html,
      placement,
    })

    const schemaJson = JSON.stringify(next)
    await db.project.update({
      where: { id: project.id },
      data: { schemaJson, status: project.status === 'draft' ? 'building' : project.status },
    })
    await createProjectVersion(project.id, `إضافة صفحة HTML: ${snippet.name}`, schemaJson)

    const updated = await db.project.findUnique({
      where: { id: project.id },
      include: { _count: { select: { versions: true } } },
    })
    if (!updated) {
      return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
    }
    return NextResponse.json({ project: projectToDTO(updated, updated._count.versions) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
