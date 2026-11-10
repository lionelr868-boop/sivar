// ============================================================
// SIVAR — GET/POST /api/projects/[id]/versions
// Task 3-b — قائمة الإصدارات / استعادة إصدار سابق
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createProjectVersion,
  findOwnedProject,
  getSessionUserId,
  projectToDTO,
} from '@/lib/server/session'

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
    const versions = await db.projectVersion.findMany({
      where: { projectId: project.id },
      orderBy: { number: 'desc' },
      select: { id: true, number: true, label: true, createdAt: true },
    })
    return NextResponse.json({
      versions: versions.map((v) => ({
        id: v.id,
        number: v.number,
        label: v.label,
        createdAt: v.createdAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteContext): Promise<NextResponse> {
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

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const versionId = typeof body.versionId === 'string' ? body.versionId : ''
    if (!versionId) {
      return NextResponse.json({ error: 'حدّد الإصدار المطلوب استعادته' }, { status: 400 })
    }

    const version = await db.projectVersion.findFirst({
      where: { id: versionId, projectId: project.id },
    })
    if (!version) {
      return NextResponse.json({ error: 'الإصدار غير موجود' }, { status: 404 })
    }

    // نسخ مخطط الإصدار إلى المشروع + إنشاء إصدار استعادة جديد
    let restoredName: string | undefined
    try {
      const restored = JSON.parse(version.schemaJson) as { metadata?: { name?: unknown } }
      if (restored.metadata && typeof restored.metadata.name === 'string' && restored.metadata.name.trim()) {
        restoredName = restored.metadata.name.trim().slice(0, 60)
      }
    } catch {
      /* المخطط بدون اسم صالح — نُبقي اسم المشروع الحالي */
    }
    const updated = await db.project.update({
      where: { id: project.id },
      // (الجولة 14) استعادة = تحرير نشط: يُصفّر عدّاد الاحتفاظ بعد التصدير
      data: { schemaJson: version.schemaJson, exportedAt: null, ...(restoredName ? { name: restoredName } : {}) },
    })
    const restoredNumber = await createProjectVersion(
      project.id,
      `استعادة الإصدار ${version.number}`,
      version.schemaJson
    )
    void restoredNumber

    const versionCount = await db.projectVersion.count({ where: { projectId: project.id } })
    return NextResponse.json({ project: projectToDTO(updated, versionCount) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
