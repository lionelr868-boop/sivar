// ============================================================
// نموذج — Project Factory (من تحليل الفكرة إلى مشروع)
// Task 2-a — ينطلق من قالب كامل ثم يطبّق نتائج تحليل الذكاء
// الاصطناعي: الاسم، الوصف، الجمهور، النمط، الألوان، والصفحات.
// ============================================================
import { getTemplateMeta, buildTemplateSchema, TEMPLATES } from '@/lib/project/templates'
import { addPageToSchema } from '@/lib/project/tools'
import { changeLandingVariant, LANDING_VARIANTS } from '@/lib/project/landing-kit'
import { PROJECT_TYPE_LABELS } from '@/lib/types'
import type {
  IdeaAnalysis,
  PageType,
  ProjectSchema,
  ProjectStyle,
  ProjectTheme,
  ProjectType,
  SuggestedPage,
} from '@/lib/types'

/** اختيار القالب: من التحليل، ثم حسب النوع، وإلا saas-suite */
function pickTemplateId(analysis: IdeaAnalysis): string {
  if (analysis.templateId && getTemplateMeta(analysis.templateId)) {
    return analysis.templateId
  }
  const byType = TEMPLATES.find((t) => t.category === (analysis.type as ProjectType))
  return byType?.id ?? 'saas-suite'
}

/** هل توجد صفحة مكافئة بالفعل (نفس النوع + نفس الكيان/نوع المصادقة)؟ */
function hasEquivalentPage(
  schema: ProjectSchema,
  type: PageType,
  entity: string | undefined,
  authVariant: string | undefined
): boolean {
  return schema.pages.some((p) => {
    if (p.type !== type) return false
    if (type === 'table') return (p.entity ?? '') === (entity ?? '')
    if (type === 'auth') return (p.authVariant ?? 'login') === (authVariant ?? 'login')
    return true
  })
}

/**
 * يبني مشروعاً كاملاً من تحليل الفكرة:
 * يبدأ من القالب الأنسب ثم يعيد التسمية والتخصيص ويضيف الصفحات المقترحة الناقصة.
 */
export function createProjectFromAnalysis(
  analysis: IdeaAnalysis,
  opts?: {
    style?: ProjectStyle
    palette?: { primary: string; secondary: string; accent: string }
    /** نمط صفحة الهبوط المختار من مكتبة الأنماط الـ12 */
    landingVariant?: string
  }
): ProjectSchema {
  const templateId = pickTemplateId(analysis)
  const schema = buildTemplateSchema(templateId)

  // ---------- التسمية والوصف ----------
  const name = analysis.name?.trim()
  if (name) {
    schema.metadata.name = name
    schema.settings.projectName = name
    schema.navigation.brand = name
  }
  if (analysis.description?.trim()) schema.metadata.description = analysis.description.trim()
  if (analysis.audience?.trim()) schema.metadata.audience = analysis.audience.trim()

  // نوع المشروع (إن كان صالحاً يُعتمد، وإلا يبقى نوع القالب)
  if (analysis.type && analysis.type in PROJECT_TYPE_LABELS) {
    schema.metadata.type = analysis.type as ProjectType
  }

  // نمط التصميم
  if (opts?.style) schema.metadata.style = opts.style

  // ---------- الألوان ----------
  const palette = opts?.palette
  if (palette) {
    const themePatch: Partial<ProjectTheme> = {}
    if (palette.primary && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(palette.primary)) {
      themePatch.primary = palette.primary
    }
    if (palette.secondary && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(palette.secondary)) {
      themePatch.secondary = palette.secondary
    }
    if (palette.accent && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(palette.accent)) {
      themePatch.accent = palette.accent
    }
    schema.theme = { ...schema.theme, ...themePatch }
  }

  // ---------- مطابقة الصفحات المقترحة ----------
  // نضيف الأنواع الناقصة بكتل بداية مناسبة، دون حذف صفحات القالب (إلا التكرار الواضح)
  const suggestions: SuggestedPage[] = Array.isArray(analysis.suggestedPages) ? analysis.suggestedPages : []
  const addedNames: string[] = []

  for (const sp of suggestions) {
    if (!sp || typeof sp.type !== 'string') continue
    const type = sp.type as PageType
    const entity = typeof sp.entity === 'string' && sp.entity.trim() ? sp.entity.trim() : undefined
    const authVariant = sp.authVariant
    if (hasEquivalentPage(schema, type, entity, authVariant)) continue

    const name = (typeof sp.name === 'string' && sp.name.trim()) || undefined
    const { schema: next } = addPageToSchema(schema, {
      name: name ?? '',
      type,
      entity,
      authVariant,
    })
    schema.pages = next.pages
    addedNames.push(name ?? PROJECT_TYPE_LABELS[type as PageType] ?? type)
  }

  // إزالة تكرار واضح: صفحات جدول متعددة على نفس الكيان (نبقي الأولى)
  const seenEntities = new Set<string>()
  schema.pages = schema.pages.filter((p) => {
    if (p.type === 'table' && p.entity) {
      if (seenEntities.has(p.entity)) return false
      seenEntities.add(p.entity)
    }
    return true
  })

  // ---------- نمط صفحة الهبوط المختار ----------
  // إن اختار المستخدم نمطاً من مكتبة أنماط الهبوط، نعيد بناء أول صفحة هبوط به
  if (opts?.landingVariant && LANDING_VARIANTS.some((v) => v.id === opts.landingVariant)) {
    const landing = schema.pages.find((p) => p.type === 'landing')
    if (landing) {
      const rebuilt = changeLandingVariant(schema, landing.id, opts.landingVariant)
      schema.pages = rebuilt.pages
    }
  }

  // وقت إنشاء حقيقي للمشروع الجديد
  schema.metadata.createdAt = new Date().toISOString()

  void addedNames
  return schema
}
