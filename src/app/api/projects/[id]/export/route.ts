// ============================================================
// نموذج — GET /api/projects/[id]/export
// Task 3-b — تصدير الموقع الثابت كملف ZIP (JSZip) + Netlify
// ============================================================
import JSZip from 'jszip'
import { db } from '@/lib/db'
import {
  createProjectVersion,
  findOwnedProject,
  getSessionUserId,
  readProjectSchema,
} from '@/lib/server/session'
import { generateStaticSite } from '@/lib/export/generate'
import { validateSchema } from '@/lib/project/validate'
import { slugify } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const { id } = await params
    const userId = await getSessionUserId()
    if (!userId) {
      return Response.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const project = await findOwnedProject(id, userId)
    if (!project) {
      return Response.json({ error: 'المشروع غير موجود' }, { status: 404 })
    }

    // ---------- التحقق قبل التصدير ----------
    let schema
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

    // ---------- توليد الموقع + الضغط ----------
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
    const base = slugify(project.name || 'namudhaj-project')
    const asciiBase = base.replace(/[^\x20-\x7E]/g, '').replace(/[^a-zA-Z0-9-]/g, '') || 'namudhaj-project'
    const encodedBase = encodeURIComponent(base)

    // ---------- تحديث الحالة + إصدار (المخطط دون تغيير) ----------
    await db.project.update({
      where: { id: project.id },
      data: { status: 'downloaded' },
    })
    await createProjectVersion(project.id, 'تم تحميل المشروع', project.schemaJson)

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${asciiBase}.zip"; filename*=UTF-8''${encodedBase}.zip`,
        'Cache-Control': 'no-store',
        'X-Project-Name': encodeURIComponent(project.name || ''),
      },
    })
  } catch {
    return Response.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
