// ============================================================
// SIVAR — Navigation Targets (عقد الأزرار الذكية)
// Task 8-a — دوال نقية مشتركة بين عارض React ومولّد التصدير:
// تحدد هدف كل زر في النموذج (صفحة أو مرساة قسم) وفق أفضل
// صفحة متاحة — نفس القواعد في الطرفين، بلا ازدواج منطق.
// ============================================================
import type { ProjectPage, ProjectSchema } from '@/lib/types'

/** أول صفحة هبوط، وإلا أول صفحة (الصفحة الرئيسية) */
export function findHomePage(schema: ProjectSchema): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  return pages.find((p) => p.type === 'landing') ?? pages[0] ?? null
}

/** صفحة دخول/تسجيل — يُفضّل signup عند الطلب أو توفره، وإلا login، وإلا forgot */
export function findAuthPage(schema: ProjectSchema, prefer?: 'signup' | 'login'): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  const auths = pages.filter((p) => p.type === 'auth')
  const want = prefer ?? 'signup'
  return (
    auths.find((p) => (p.authVariant ?? 'login') === want) ??
    auths.find((p) => (p.authVariant ?? 'login') === 'login') ??
    auths.find((p) => (p.authVariant ?? 'login') === 'signup') ??
    auths[0] ??
    null
  )
}

export function findPricingPage(schema: ProjectSchema): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  return (
    pages.find((p) => p.type === 'pricing') ??
    pages.find((p) => p.type === 'landing' && p.blocks.some((b) => b.type === 'pricing')) ??
    null
  )
}

export function findDashboardPage(schema: ProjectSchema): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  // (الجولة 16) لوحة المدير فقط — صفحات فضاء الزبون (audience=client) ليست هدف أزرار المدير
  return pages.find((p) => p.type === 'dashboard' && (p.audience ?? 'admin') === 'admin') ?? null
}

/** (الجولة 16) أول صفحة من نوع dashboard بجمهور admin — هدف «الدخول كمدير» */
export function findAdminDashboardPage(schema: ProjectSchema): ProjectPage | null {
  return findDashboardPage(schema)
}

/** (الجولة 16) أول صفحة فضاء الزبون (audience=client من أنواع منطقة اللوحة) — هدف «الدخول كزبون» */
export function findClientPage(schema: ProjectSchema): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  return (
    pages.find((p) => p.audience === 'client' && (p.type === 'dashboard' || p.type === 'table' || p.type === 'profile')) ??
    null
  )
}

export function findFormPage(schema: ProjectSchema): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  return pages.find((p) => p.type === 'form') ?? null
}

export function findTablePage(schema: ProjectSchema): ProjectPage | null {
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  return pages.find((p) => p.type === 'table') ?? null
}

/** مراسي الأقسام المتاحة للتمرير داخل صفحة ما */
const ANCHORABLE: Array<{ type: string; anchor: string }> = [
  { type: 'features', anchor: 'features' },
  { type: 'pricing', anchor: 'pricing' },
  { type: 'testimonials', anchor: 'testimonials' },
  { type: 'faq', anchor: 'faq' },
]

// ============================================================
// حلقات الأزرار — كل زر يحصل دائماً على هدف صالح
// ============================================================

/** هدف الزر الأساسي في البطل: صريح ← دخول ← تسعير ← لوحة ← رئيسية */
export function heroPrimaryTarget(schema: ProjectSchema, explicitPageId?: string): string {
  const explicit = (explicitPageId ?? '').trim()
  if (explicit && schema.pages.some((p) => p.id === explicit)) return explicit
  const auth = findAuthPage(schema)
  if (auth) return auth.id
  const pricing = findPricingPage(schema)
  if (pricing) return pricing.id
  const dash = findDashboardPage(schema)
  if (dash) return dash.id
  const home = findHomePage(schema)
  return home?.id ?? ''
}

/** هدف الزر الثانوي في البطل: مرساة قسم في نفس الصفحة، وإلا تسعير، وإلا رئيسية */
export function heroSecondaryTarget(
  schema: ProjectSchema,
  currentPageId: string
): { anchor?: string; pageId?: string } {
  const current = schema.pages.find((p) => p.id === currentPageId)
  if (current) {
    for (const { type, anchor } of ANCHORABLE) {
      if (current.blocks.some((b) => b.type === type)) return { anchor }
    }
  }
  const pricing = findPricingPage(schema)
  if (pricing && pricing.id !== currentPageId) return { pageId: pricing.id }
  const home = findHomePage(schema)
  return home && home.id !== currentPageId ? { pageId: home.id } : { anchor: 'features' }
}

/** زر خطة التسعير: إنشاء حساب ← نموذج ← رئيسية */
export function pricingButtonTarget(schema: ProjectSchema): string {
  const auth = findAuthPage(schema)
  if (auth) return auth.id
  const form = findFormPage(schema)
  if (form) return form.id
  return findHomePage(schema)?.id ?? ''
}

/** زر دعوة الإجراء: دخول ← تسعير ← رئيسية */
export function ctaButtonTarget(schema: ProjectSchema): string {
  const auth = findAuthPage(schema)
  if (auth) return auth.id
  const pricing = findPricingPage(schema)
  if (pricing) return pricing.id
  return findHomePage(schema)?.id ?? ''
}

/** زر الشريط الإعلاني: تسعير ← دخول ← رئيسية */
export function bannerButtonTarget(schema: ProjectSchema): string {
  const pricing = findPricingPage(schema)
  if (pricing) return pricing.id
  const auth = findAuthPage(schema)
  if (auth) return auth.id
  return findHomePage(schema)?.id ?? ''
}

/** زر الحالات (فارغ/خطأ): لوحة التحكم داخل اللوحات، وإلا الرئيسية */
export function stateActionTarget(schema: ProjectSchema, fromDashboard = false): string {
  if (fromDashboard) {
    const dash = findDashboardPage(schema)
    if (dash) return dash.id
  }
  return findHomePage(schema)?.id ?? ''
}

/** أزرار ترويسة اللوحة: نموذج ← جدول ← اللوحة نفسها */
export function dashboardActionTarget(schema: ProjectSchema): string {
  const form = findFormPage(schema)
  if (form) return form.id
  const table = findTablePage(schema)
  if (table) return table.id
  return findDashboardPage(schema)?.id ?? findHomePage(schema)?.id ?? ''
}
