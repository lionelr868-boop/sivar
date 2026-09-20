// ============================================================
// نموذج — GET/POST /api/projects
// Task 3-b — قائمة المشاريع / إنشاء مشروع جديد
// ============================================================
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUserId, projectToDTO, projectToSummaryDTO } from '@/lib/server/session'
import { analyzeIdea, sanitizeAnalysis } from '@/lib/server/analyze'
import { createProjectFromAnalysis } from '@/lib/project/factory'
import { renameProjectInSchema } from '@/lib/project/tools'
import { getTemplateMeta } from '@/lib/project/templates'
import type { IdeaAnalysis, ProjectSchema, ProjectStyle, ProjectType } from '@/lib/types'

const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB
const PROJECT_TYPES: string[] = [
  'saas', 'ai', 'ecommerce', 'marketplace', 'education', 'health', 'realestate',
  'booking', 'services', 'restaurant', 'agency', 'app', 'fintech', 'admin', 'delivery', 'other',
]
const PROJECT_STYLES: string[] = ['modern', 'minimal', 'professional', 'luxury', 'youthful', 'tech']
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export async function GET(): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }
    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { versions: true } } },
    })
    return NextResponse.json({
      projects: projects.map((p) => projectToSummaryDTO(p, p._count.versions)),
    })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 })
    }

    const rawBody = await request.text()
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'المشروع كبير جداً' }, { status: 413 })
    }
    const body = (JSON.parse(rawBody || '{}') as Record<string, unknown>) ?? {}

    const idea = typeof body.idea === 'string' ? body.idea.trim() : ''
    if (!idea) {
      return NextResponse.json({ error: 'اكتب فكرتك أولاً' }, { status: 400 })
    }

    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 60) : ''
    const typeOverride =
      typeof body.type === 'string' && PROJECT_TYPES.includes(body.type) ? (body.type as ProjectType) : undefined
    const style =
      typeof body.style === 'string' && PROJECT_STYLES.includes(body.style)
        ? (body.style as ProjectStyle)
        : undefined
    const audience =
      typeof body.audience === 'string' && body.audience.trim() ? body.audience.trim().slice(0, 140) : ''
    const templateMeta = typeof body.templateId === 'string' ? getTemplateMeta(body.templateId) : undefined
    const templateId = templateMeta?.id

    // ---------- التحليل ----------
    let analysis: IdeaAnalysis | null = null
    if (body.analysis && typeof body.analysis === 'object' && !Array.isArray(body.analysis)) {
      analysis = sanitizeAnalysis(body.analysis, idea)
    }
    if (!analysis && templateMeta) {
      analysis = {
        name: name || templateMeta.name,
        type: templateMeta.category,
        audience: '',
        description: templateMeta.tagline,
        suggestedPages: [],
        templateId: templateMeta.id,
      }
    }
    if (!analysis) {
      analysis = await analyzeIdea(idea)
    }

    // ---------- التجاوزات ----------
    if (name) analysis.name = name
    if (typeOverride) analysis.type = typeOverride
    if (audience) analysis.audience = audience

    // ---------- الألوان ----------
    const rawPalette = body.palette
    let palette: { primary: string; secondary: string; accent: string } | undefined
    if (rawPalette && typeof rawPalette === 'object' && !Array.isArray(rawPalette)) {
      const p = rawPalette as Record<string, unknown>
      const primary = typeof p.primary === 'string' && HEX_RE.test(p.primary) ? p.primary : undefined
      const secondary = typeof p.secondary === 'string' && HEX_RE.test(p.secondary) ? p.secondary : undefined
      const accent = typeof p.accent === 'string' && HEX_RE.test(p.accent) ? p.accent : undefined
      if (primary || secondary || accent) {
        palette = { primary: primary ?? '#7c3aed', secondary: secondary ?? '#f5f3ff', accent: accent ?? '#a78bfa' }
      }
    }

    // ---------- بناء المخطط ----------
    let schema: ProjectSchema = createProjectFromAnalysis(analysis, { style, palette })
    if (name) schema = renameProjectInSchema(schema, name)

    const schemaJson = JSON.stringify(schema)

    const project = await db.project.create({
      data: {
        userId,
        name: schema.metadata.name || name || 'مشروع جديد',
        type: schema.metadata.type,
        status: 'draft',
        schemaJson,
        analysisJson: JSON.stringify(analysis),
        versions: {
          create: { number: 1, label: 'إنشاء المشروع', schemaJson },
        },
      },
      include: { _count: { select: { versions: true } } },
    })

    return NextResponse.json({ project: projectToDTO(project, project._count.versions) })
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
