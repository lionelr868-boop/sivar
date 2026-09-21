'use client'

// ============================================================
// SIVAR — مشترك بين مكوّنات النموذج الأولي:
// سياق العرض + قُرّاء خصائص آمنين + عناوين الأقسام التسويقية
// Task 9-a — sectionImageStyle: خلفية صورة موحّدة لأقسام الصفحة
// (bgImage + bgOverlay بنفس دلالات البطل) + SectionHeading داكن.
// Task 12 — أدوات ألوان كل قسم: sectionHexColor/hexLuminance/
// sectionBgGradient (لون خلفية القسم + السطوع + التدرّج المشتق).
// ============================================================
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import type { ProjectSchema } from '@/lib/types'
import { hexDarken } from '../theme-provider'

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

// ---------- خلفية صورة الأقسام (Task 9) ----------

export type SectionOverlay = 'dark' | 'medium' | 'light' | 'none'

const SECTION_OVERLAYS: readonly SectionOverlay[] = ['dark', 'medium', 'light', 'none']

/** غطاء تعتيم فوق صورة القسم — نفس قيم البطل حرفياً */
function sectionOverlayCss(overlay: SectionOverlay): string | undefined {
  switch (overlay) {
    case 'dark':
      return 'linear-gradient(180deg, rgba(13,10,25,.62), rgba(13,10,25,.78))'
    case 'medium':
      return 'linear-gradient(180deg, rgba(13,10,25,.38), rgba(13,10,25,.55))'
    case 'light':
      return 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.72))'
    default:
      return undefined
  }
}

/** يقرأ bgImage/bgOverlay من خصائص الكتلة ويُنتج نمط الخلفية + نبرة النص */
export function sectionImageStyle(p: Record<string, unknown>): { style?: CSSProperties; dark: boolean } {
  const bgImage = S(p, 'bgImage')
  if (!bgImage.trim()) return { dark: false }
  const overlayRaw = S(p, 'bgOverlay', 'dark') as SectionOverlay
  const overlay = SECTION_OVERLAYS.includes(overlayRaw) ? overlayRaw : 'dark'
  const css = sectionOverlayCss(overlay)
  return {
    style: {
      backgroundImage: `${css ? `${css}, ` : ''}url("${bgImage}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    },
    dark: overlay !== 'light',
  }
}

/** ظل نص فوق الصورة عند غياب التعتيم (نفس قيمة البطل) */
export const IMAGE_TEXT_SHADOW = '0 2px 12px rgba(0,0,0,.45)' as const

/** هل القسم ذو صورة بلا تعتيم؟ (لإضافة ظل النصوص) */
export function isImageNoOverlay(p: Record<string, unknown>): boolean {
  const bgImage = S(p, 'bgImage')
  if (!bgImage.trim()) return false
  return S(p, 'bgOverlay', 'dark') === 'none'
}

// ---------- ألوان كل قسم (Task 12) ----------

/** لون قسم صالح (#rgb أو #rrggbb — بحروف صغيرة) أو '' عند الفراغ/الفساد */
export function sectionHexColor(v: unknown): string {
  if (typeof v !== 'string') return ''
  const t = v.trim().toLowerCase()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(t) ? t : ''
}

/** السطوع النسبي للون (0..1 — WCAG) لاختيار نبرة النص التلقائية */
export function hexLuminance(hex: string): number {
  let h = hex.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0
  const lin = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/** تدرّج لطيف مبني على لون القسم (بدل التدرّج/الداكن الافتراضي) */
export function sectionBgGradient(hex: string): string {
  return `linear-gradient(180deg, ${hex}, ${hexDarken(hex, 0.14)})`
}

// ---------- عناصر تخطيط مشتركة ----------

/** حاوية أقسام التسويق: فراغات سخية + قناة مركزية (+ خلفية صورة اختيارية) */
export function SectionShell({
  children,
  className = '',
  id,
  tight = false,
  style,
}: {
  children: ReactNode
  className?: string
  id?: string
  /** تباعد مضغوط للأقسام المدمجة */
  tight?: boolean
  /** نمط جذر القسم — يُستعمل لخلفية صورة القسم (Task 9) */
  style?: CSSProperties
}): ReactElement {
  return (
    <section id={id} style={style} className={`px-4 ${tight ? 'py-8 md:py-12' : 'py-14 md:py-20'} md:px-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

/** عنوان قسم تسويقي: كبير + فرعي تحته (+ نبرة داكنة فوق صورة القسم) */
export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  dark = false,
  textShadow = false,
}: {
  title: string
  subtitle?: string
  align?: 'center' | 'start'
  /** نص أبيض — عند صورة خلفية مع تأتيم داكن/متوسط أو بلا تأتيم */
  dark?: boolean
  /** ظل نص خفيف — عند صورة بلا تعتيم */
  textShadow?: boolean
}): ReactElement | null {
  if (!title && !subtitle) return null
  const shadowStyle = textShadow ? { textShadow: IMAGE_TEXT_SHADOW } : undefined
  return (
    <div className={`mb-10 md:mb-12 ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl text-start'}`}>
      {title ? (
        <h2
          style={shadowStyle}
          className={`text-2xl font-bold leading-tight md:text-4xl ${dark ? 'text-white' : 'text-[var(--pt-text)]'}`}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className={`mt-3 text-sm leading-relaxed md:text-base ${dark ? 'text-white/80' : 'text-[var(--pt-muted)]'}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
