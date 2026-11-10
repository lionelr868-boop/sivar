// ============================================================
// SIVAR — GET /api/projects/[id]/export
// Task 3-b — تصدير الموقع الثابت كملف ZIP (JSZip) + Netlify
// (الجولة 14) المشروع المعدَّل يُصدَّر كاملاً بصوره وخلفياته،
// ويبقى محفوظاً كاملاً في قاعدة البيانات 24 ساعة قبل تنقية
// الصور المؤقتة — لا حذف ولا فقدان بعد التحميل.
// ============================================================
import JSZip from 'jszip'
import { db } from '@/lib/db'
import {
  createProjectVersion,
  enforceExportRetention,
  findOwnedProject,
  getSessionUserId,
  readProjectSchema,
} from '@/lib/server/session'
import { generateStaticSite } from '@/lib/export/generate'
import { validateSchema } from '@/lib/project/validate'
import { slugify } from '@/lib/types'
import type { ProjectSchema } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { id } = await params
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const owned = await findOwnedProject(id, userId)
    if (!owned) {
      return Response.json({ error: 'المشروع غير موجود' }, { status: 404 })
    }
    // (الجولة 14) احترام سياسة الاحتفاظ: إن انقضت 24 ساعة على تصدير سابق
    // نُنقّي الصور المؤقتة أولاً — وإلا يُصدَّر المشروع كاملاً بصوره
    const project = await enforceExportRetention(owned)

    // ---------- التحقق قبل التصدير ----------
    let schema: ProjectSchema
    try {
      schema = readProjectSchema(project)
    } catch {
      return Response.json(
        {
          error: 'المشروع يحتاج إصلاحاً قبل التحميل — استخدم المساعد الذكي أو أعد المحاولة',
          checks: [
            { id: 'schema', label: 'المخطط', status: 'error', detail: 'مخطط المشروع تالف' },
          ],
        },
        { status: 503 }
      )
    }
    const validation = validateSchema(schema)
    if (!validation.ok) {
      return Response.json(
        {
          error: 'المشروع يحتاج إصلاحاً قبل التحميل — استخدم المساعد الذكي أو أعد المحاولة',
          checks: validation.checks,
        },
        { status: 503 }
      )
    }

    // ---------- توليد الموقع + الضغط (الصور مضمّنة في ZIP) ----------
    const { files } = generateStaticSite(schema)
    const zip = new JSZip()
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content)
    }
    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    // ---------- اسم الملف (ASCII + امتداد UTF-8) ----------
    const base = slugify(project.name || 'sivar-project')
    const asciiBase = base.replace(/[^\x20-\x7E]/g, '').replace(/[^a-zA-Z0-9-]/g, '') || 'sivar-project'
    const encodedBase = encodeURIComponent(base)

    // ---------- (الجولة 14) الحفظ الكامل + عدّاد الاحتفاظ 24 ساعة ----------
    // المخطط يبقى كما هو تماماً (بالصور والتعديلات)؛ نكتفي بوسم لحظة
    // التحميل — بعد 24 ساعة تُنقّى الصور المؤقتة تلقائياً عند أول وصول.
    const schemaJson = project.schemaJson
    await db.project.update({
      where: { id: project.id },
      data: { status: 'downloaded', exportedAt: new Date(), schemaJson },
    })
    await createProjectVersion(project.id, 'تم تحميل المشروع', schemaJson)

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${asciiBase}.zip"; filename*=UTF-8''${encodedBase}.zip`,
        'Cache-Control': 'no-store',
        'X-Project-Name': encodeURIComponent(project.name || ''),
        'X-Retention-Hours': '24',
      },
    })
  } catch {
    return Response.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
