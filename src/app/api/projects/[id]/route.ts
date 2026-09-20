// ============================================================
// SIVAR — GET/PATCH/DELETE /api/projects/[id]
// Task 3-b — جلب المشروع / الحفظ مع إصدار / الحذف
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createProjectVersion,
  findOwnedProject,
  getSessionUserId,
  projectToDTO,
  projectToSummaryDTO,
} from '@/lib/server/session'
import { stripTransientImages } from '@/lib/project/tools'
import type { ProjectSchema, ProjectStatus } from '@/lib/types'

const MAX_SCHEMA_BYTES = 2 * 1024 * 1024 // 2MB
const STATUSES: string[] = ['draft', 'building', 'ready', 'downloaded']

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
    const versionCount = await db.projectVersion.count({ where: { projectId: project.id } })
    return NextResponse.json({ project: projectToDTO(project, versionCount) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteContext): Promise<NextResponse> {
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

    const rawBody = await request.text()
    if (rawBody.length > MAX_SCHEMA_BYTES + 4096) {
      return NextResponse.json({ error: 'المشروع كبير جداً' }, { status: 413 })
    }
    const body = (JSON.parse(rawBody || '{}') as Record<string, unknown>) ?? {}

    // ---------- المخطط ----------
    const schema = body.schema
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return NextResponse.json({ error: 'مخطط المشروع غير صالح' }, { status: 400 })
    }
    const s = schema as Partial<ProjectSchema>
    if (s.version !== 1 || !Array.isArray(s.pages) || s.pages.length === 0) {
      return NextResponse.json({ error: 'مخطط المشروع غير صالح' }, { status: 400 })
    }
    const schemaJson = JSON.stringify(schema)
    if (schemaJson.length > MAX_SCHEMA_BYTES) {
      return NextResponse.json({ error: 'المشروع كبير جداً' }, { status: 413 })
    }

    // ---------- الاسم والحالة ----------
    const data: { schemaJson: string; name?: string; status?: string } = { schemaJson }
    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim().slice(0, 60)
    } else {
      data.name = (s.metadata?.name || project.name || 'مشروع').toString().slice(0, 60)
    }
    if (typeof body.status === 'string' && STATUSES.includes(body.status)) {
      data.status = body.status as ProjectStatus
    }

    const updated = await db.project.update({ where: { id: project.id }, data })

    // ---------- إصدار جديد (بلا صور مؤقتة — لا تبقى في قاعدة البيانات) ----------
    const versionLabel =
      typeof body.versionLabel === 'string' && body.versionLabel.trim()
        ? body.versionLabel.trim().slice(0, 80)
        : 'تحديث المشروع'
    await createProjectVersion(project.id, versionLabel, JSON.stringify(stripTransientImages(schema as ProjectSchema)))

    const versionCount = await db.projectVersion.count({ where: { projectId: project.id } })
    return NextResponse.json({ project: projectToSummaryDTO(updated, versionCount) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext): Promise<NextResponse> {
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
    await db.project.delete({ where: { id: project.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
