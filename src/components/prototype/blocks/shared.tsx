'use client'

// ============================================================
// نموذج — مشترك بين مكوّنات النموذج الأولي:
// سياق العرض + قُرّاء خصائص آمنين + عناوين الأقسام التسويقية
// ============================================================
import type { ReactElement, ReactNode } from 'react'
import type { ProjectSchema } from '@/lib/types'

/** سياق يُمرَّر لكل مكوّن أثناء العرض */
export interface BlockCtx {
  schema: ProjectSchema
  /** وضع المعاينة: الأزرار والروابط حيّة */
  interactive: boolean
  /** معاينة مصغّرة (مثل بطاقات القوالب) — تجنّب تحميل إطارات HTML */
  mini?: boolean
  /** تنقّل بين صفحات النموذج */
  onNavigate?: (pageId: string) => void
  /** بحث التروستة العلوية للوحة — يفلتر جداول الصفحة (Task 8) */
  tableSearch?: string
}

// ---------- قُرّاء الخصائص (آمنة ضد أي مدخلات) ----------

export function S(props: Record<string, unknown>, key: string, fallback = ''): string {
  const v = props?.[key]
  return typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : fallback
}

export function N(props: Record<string, unknown>, key: string, fallback = 0): number {
  const v = props?.[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return fallback
}

export function B(props: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = props?.[key]
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

/** قائمة عناصر (كائنات) — ترجع [] دائماً */
export function L(props: Record<string, unknown>, key: string): Array<Record<string, unknown>> {
  const v = props?.[key]
  if (!Array.isArray(v)) return []
  return v.filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null && !Array.isArray(it))
}

// قُرّاء حقول عنصر داخل قائمة
export function iS(item: Record<string, unknown>, key: string, fallback = ''): string {
  return S(item, key, fallback)
}
export function iN(item: Record<string, unknown>, key: string, fallback = 0): number {
  return N(item, key, fallback)
}
export function iB(item: Record<string, unknown>, key: string, fallback = false): boolean {
  return B(item, key, fallback)
}

/** هل قيمة التغيّر سلبية؟ (تبدأ بـ -) */
export function isNegativeChange(change: string): boolean {
  return change.trim().startsWith('-')
}

/** تمرير سلس إلى مرساة قسم داخل الصفحة (وضع المعاينة التفاعلي) */
export function scrollToAnchor(anchor: string): void {
  if (typeof document === 'undefined') return
  const el = document.getElementById(anchor)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ---------- عناصر تخطيط مشتركة ----------

/** حاوية أقسام التسويق: فراغات سخية + قناة مركزية */
export function SectionShell({
  children,
  className = '',
  id,
  tight = false,
}: {
  children: ReactNode
  className?: string
  id?: string
  /** تباعد مضغوط للأقسام المدمجة */
  tight?: boolean
}): ReactElement {
  return (
    <section id={id} className={`px-4 ${tight ? 'py-8 md:py-12' : 'py-14 md:py-20'} md:px-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

/** عنوان قسم تسويقي: كبير + فرعي تحته */
export function SectionHeading({
  title,
  subtitle,
  align = 'center',
}: {
  title: string
  subtitle?: string
  align?: 'center' | 'start'
}): ReactElement | null {
  if (!title && !subtitle) return null
  return (
    <div className={`mb-10 md:mb-12 ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl text-start'}`}>
      {title ? (
        <h2 className="text-2xl font-bold leading-tight text-[var(--pt-text)] md:text-4xl">{title}</h2>
      ) : null}
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--pt-muted)] md:text-base">{subtitle}</p>
      ) : null}
    </div>
  )
}
