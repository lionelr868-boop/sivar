// ============================================================
// SIVAR — POST /api/projects/[id]/agent
// Task 3-b — دردشة المساعد الذكي: تنفيذ → تحقق → إصلاح تلقائي → حفظ
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createProjectVersion,
  findOwnedProject,
  getSessionUserId,
  readProjectSchema,
} from '@/lib/server/session'
import { runAgent, type AgentHistoryMessage } from '@/lib/server/agent'
import { applyActions, dashboardNavIconFor, isDashboardAreaPage } from '@/lib/project/tools'
import { validateSchema } from '@/lib/project/validate'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import type { Block, ProjectPage, ProjectSchema } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

// ============================================================
// الإصلاح التلقائي للمخطط (يُطبّق فقط عند فشل التحقق)
// ============================================================
function autoFixSchema(schema: ProjectSchema): ProjectSchema {
  const pageIds = new Set(schema.pages.map((p) => p.id))

  // 1. تقليم قوائم التنقل المشيرة لصفحات محذوفة
  schema.navigation.items = schema.navigation.items.filter((it) => pageIds.has(it.pageId))
  if (schema.navigation.cta && !pageIds.has(schema.navigation.cta.pageId)) {
    schema.navigation.cta = undefined
  }

  // 2. تقليم قائمة لوحة التحكم + إعادة ملئها إن فرغت — (الجولة 13) بأنواع منطقة اللوحة كاملة وأيقونات دقيقة مطابقة
  schema.dashboardNav.items = schema.dashboardNav.items.filter((it) => pageIds.has(it.pageId))
  if (schema.dashboardNav.items.length === 0) {
    for (const page of schema.pages) {
      if (isDashboardAreaPage(page)) {
        schema.dashboardNav.items.push({ label: page.name, pageId: page.id, icon: dashboardNavIconFor(page) })
      }
    }
  }

  // 3. حذف المكونات بأنواع مجهولة + جداول بكيانات مفقودة + تنظيف كيان الصفحات
  for (const page of schema.pages as ProjectPage[]) {
    page.blocks = page.blocks.filter((block: Block) => {
      if (!BLOCK_REGISTRY[block.type as Block['type']]) return false
      if (block.type === 'data-table') {
        const entity = block.props['entity']
        if (typeof entity === 'string' && entity.trim() && !schema.mockData.entities[entity.trim()]) {
          return false
        }
      }
      return true
    })
    if (page.entity && !schema.mockData.entities[page.entity]) {
      page.entity = undefined
    }
  }

  // 4. إصلاح أقسام HTML المخصصة الفارغة — استبدالها بمثال افتراضي
  const defaultHtml = String(BLOCK_REGISTRY['custom-html'].defaults().html)
  for (const page of schema.pages as ProjectPage[]) {
    for (const block of page.blocks) {
      if (block.type === 'custom-html') {
        const html = block.props['html']
        if (typeof html !== 'string' || !html.trim() || !html.includes('<')) {
          block.props = { ...block.props, html: defaultHtml }
        }
      }
    }
  }

  return schema
}

// ============================================================
// POST
// ============================================================
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
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json({ error: 'اكتب رسالتك للمساعد الذكي' }, { status: 400 })
    }
    const history: AgentHistoryMessage[] = Array.isArray(body.history)
      ? (body.history as Array<Record<string, unknown>>)
          .filter((m) => !!m && typeof m === 'object')
          .map((m) => ({
            role: typeof m.role === 'string' ? (m.role === 'agent' ? 'agent' : 'user') : 'user',
            text: typeof m.text === 'string' ? m.text.slice(0, 300) : '',
          }))
          .slice(-8)
      : []

    let schema: ProjectSchema
    try {
      schema = readProjectSchema(project)
    } catch {
      return NextResponse.json({ error: 'مخطط المشروع تالف' }, { status: 500 })
    }

    // ---------- تشغيل العقل ----------
    const result = await runAgent(schema, message, history)

    // ---------- لا إجراءات: نرجع المخطط الحالي كما هو ----------
    if (result.actions.length === 0) {
      return NextResponse.json({
        explanation: result.explanation,
        actions: [],
        schema,
        versionLabel: '',
      })
    }

    // ---------- تنفيذ الإجراءات ----------
    const applied = applyActions(schema, result.actions)
    if (applied.applied.length === 0) {
      // لم يُنفَّذ أي إجراء بنجاح — لا داعي لحفظ إصدار جديد
      const failureNote = applied.errors.length
        ? `تعذّر تنفيذ الطلب: ${applied.errors[0]}`
        : result.explanation
      return NextResponse.json({
        explanation: failureNote,
        actions: [],
        schema,
        versionLabel: '',
      })
    }

    let nextSchema = applied.schema
    let explanation = result.explanation

    // ---------- التحقق + الإصلاح التلقائي ----------
    let validation = validateSchema(nextSchema)
    if (!validation.ok) {
      nextSchema = autoFixSchema(nextSchema)
      validation = validateSchema(nextSchema)
      if (validation.ok) {
        explanation = `${explanation} أصلحنا تلقائياً مشكلة صغيرة في البنية.`
      }
    }

    // ---------- الحفظ + إصدار جديد ----------
    const schemaJson = JSON.stringify(nextSchema)
    const versionLabel = (applied.applied[0] ?? 'تحديث عبر المساعد الذكي').slice(0, 60)
    await db.project.update({
      where: { id: project.id },
      data: {
        schemaJson,
        status: project.status === 'ready' ? 'ready' : 'building',
      },
    })
    await createProjectVersion(project.id, versionLabel, schemaJson)

    return NextResponse.json({
      explanation,
      actions: applied.applied,
      schema: nextSchema,
      versionLabel,
    })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
