'use client'

// ============================================================
// SIVAR — Prototype Theme Scope (نطاق هوية النموذج الأولي)
// Task 2-a-cont — يغلّف النموذج بمتغيرات CSS خاصة به (--pt-*)
// مستقلة تماماً عن هوية المنصة، مع اشتقاق قيم داكنة عند mode=dark.
// Task 9-a — خلفية المشروع كلّه (صورة + غسلة لون الخلفية) خلف
// كل المحتوى عبر طبقة z-index سالبة داخل سياق عزل، + حركات
// الرسوم (pt-draw/pt-fade-in/pt-bar) ومؤشر الكتابة (pt-typing).
// ============================================================
import type { ReactElement, CSSProperties, ReactNode } from 'react'
import type { ProjectTheme } from '@/lib/types'

// ---------- أدوات HEX ----------

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

/** يقرأ #rgb أو #rrggbb ويرجع [r,g,b] أو null */
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`
}

/** مزج لونين — ratio = وزن اللون الثاني (0..1) */
function mix(a: string, b: string, ratio: number): string {
  const ca = parseHex(a)
  const cb = parseHex(b)
  if (!ca || !cb) return a
  const t = Math.max(0, Math.min(1, ratio))
  return toHex(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t)
}

/** تفتيح نحو الأبيض (ratio 0..1) */
export function hexLighten(hex: string, ratio: number): string {
  return mix(hex, '#ffffff', ratio)
}

/** تغميق نحو الأسود (ratio 0..1) */
export function hexDarken(hex: string, ratio: number): string {
  return mix(hex, '#000000', ratio)
}

// ---------- الظلال ----------

const SHADOWS: Record<ProjectTheme['shadow'], string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,.08)',
  md: '0 4px 12px rgba(0,0,0,.08)',
  lg: '0 12px 32px rgba(0,0,0,.12)',
}

// ---------- ptVars ----------

/**
 * يحوّل ProjectTheme إلى متغيرات CSS (نمط React).
 * عند mode=dark تُشتق قيم داكنة منطقية من نفس الهوية.
 */
export function ptVars(theme: ProjectTheme): CSSProperties {
  const dark = theme.mode === 'dark'
  const bg = dark ? hexDarken(theme.background, 0.72) : theme.background
  const surface = dark ? hexLighten(bg, 0.09) : theme.surface
  const text = dark ? hexLighten(theme.text, 0.88) : theme.text
  const mutedText = dark ? hexLighten(theme.text, 0.6) : theme.mutedText
  const border = dark ? hexLighten(bg, 0.16) : theme.border
  const secondary = dark ? hexDarken(theme.secondary, 0.78) : theme.secondary
  const primary = dark ? hexLighten(theme.primary, 0.18) : theme.primary

  return {
    '--pt-primary': primary,
    '--pt-primary-fg': theme.primaryForeground || '#ffffff',
    '--pt-secondary': secondary,
    '--pt-accent': dark ? hexLighten(theme.accent, 0.12) : theme.accent,
    '--pt-bg': bg,
    '--pt-surface': surface,
    '--pt-text': text,
    '--pt-muted': mutedText,
    '--pt-border': border,
    '--pt-radius': `${Math.max(0, Math.min(40, Number(theme.radius) || 0))}px`,
    '--pt-shadow': SHADOWS[theme.shadow] ?? SHADOWS.md,
    '--pt-font': `'${(theme.fontFamily || 'IBM Plex Sans Arabic').replace(/'/g, '')}', 'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', sans-serif`,
    background: 'var(--pt-bg)',
    color: 'var(--pt-text)',
    fontFamily: 'var(--pt-font)',
  } as CSSProperties
}

// ---------- PrototypeThemeScope ----------

// حركات النطاق: دخول الكتل + موجة الفيديو (8) + مؤشر الكتابة
// + رسم الخط تدريجياً وظهور المساحة ونمو الأعمدة (9) —
// كلها تتعطل عند prefers-reduced-motion.
const PT_RISE_CSS =
  '@keyframes pt-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
  '.pt-rise{animation:pt-rise .5s cubic-bezier(.22,.61,.36,1) both}' +
  '@keyframes pt-wave{from{transform:scaleY(.45)}to{transform:scaleY(1)}}' +
  '@keyframes pt-typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}' +
  '@keyframes pt-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
  '.pt-anim-line{animation:pt-draw 1.1s cubic-bezier(.22,.61,.36,1) both}' +
  '@keyframes pt-fade-in{from{opacity:0}to{opacity:1}}' +
  '.pt-anim-area{animation:pt-fade-in .8s ease-out both}' +
  '@keyframes pt-bar{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
  '.pt-anim-bar{animation:pt-bar .5s cubic-bezier(.22,.61,.36,1) both;transform-box:fill-box;transform-origin:bottom}' +
  '@media (prefers-reduced-motion: reduce){.pt-anim-line,.pt-anim-area,.pt-anim-bar{animation:none}}'

/** شدة غسلة لون الخلفية فوق صورة المشروع (كلما زادت قلّ ظهور الصورة) */
const BG_WASH_OPACITY: Record<'strong' | 'medium' | 'soft' | 'none', number> = {
  strong: 0.9,
  medium: 0.74,
  soft: 0.55,
  none: 0,
}

export function PrototypeThemeScope({
  theme,
  children,
  className,
  bgImage,
  bgOverlay = 'medium',
}: {
  theme: ProjectTheme
  children: ReactNode
  className?: string
  /** خلفية المشروع كلّه (Task 9) — من schema.branding.bgImage */
  bgImage?: string
  /** قوة ظهور الخلفية — medium افتراضياً عند وجود صورة */
  bgOverlay?: 'none' | 'strong' | 'medium' | 'soft'
}): ReactElement {
  const hasBg = typeof bgImage === 'string' && bgImage.trim() !== ''
  const wash = hasBg ? BG_WASH_OPACITY[bgOverlay ?? 'medium'] : 0

  // مع صورة: النطاق يصبح شفافاً معزولاً والطبقة تحته (z سالب)
  const style: CSSProperties = hasBg
    ? { ...ptVars(theme), background: 'transparent', position: 'relative', isolation: 'isolate' }
    : ptVars(theme)

  return (
    <div dir="rtl" style={style} className={className}>
      <style dangerouslySetInnerHTML={{ __html: PT_RISE_CSS }} />
      {hasBg ? (
        /* طبقة خلفية المشروع: صورة + غسلة لون الخلفية — تغطي كامل ارتفاع المحتوى */
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: -1, backgroundImage: `url("${bgImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0" style={{ background: 'var(--pt-bg)', opacity: wash }} />
        </div>
      ) : null}
      {children}
    </div>
  )
}
