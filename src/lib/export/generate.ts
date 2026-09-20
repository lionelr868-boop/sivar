// ============================================================
// نموذج — Static Site Generator (خادم فقط)
// Task 3-b — يحوّل ProjectSchema إلى موقع ثابت كامل (HTML/CSS/JS)
// جاهز للنشر على Netlify: styles.css + script.js + كل صفحة.
// كل نصوص المستخدم تُهرَّب (htmlEscape) — لا حقن HTML إطلاقاً.
// Task 7-f — ترقيات الجودة: بطل موسّع (eyebrow/visual/titleSize/نموذج بريد)،
// custom-html، الشعار (assets/logo + favicon)، SEO/OG، ظهور الأقسام عند
// التمرير، زر العودة للأعلى، وتحسينات الوصول (skip link/focus-visible).
// ============================================================
import type {
  Block,
  ChartData,
  EntityColumn,
  ProjectPage,
  ProjectSchema,
  ProjectTheme,
} from '@/lib/types'
import { slugify } from '@/lib/types'
import { ENTITY_LABELS } from '@/lib/content/mock-data'

// ============================================================
// أدوات عامة
// ============================================================

/** تهريب HTML لكل نص قادم من المستخدم */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** تنسيق الأرقام بالأسلوب الجزائري (فاصلة عشرية) مع بديل آمن */
function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return '0'
  try {
    const s = v.toLocaleString('ar-DZ')
    return /^[\d\s.,'’]+$/.test(s) ? s : v.toLocaleString('en-US')
  } catch {
    return v.toLocaleString('en-US')
  }
}

/** اختصار رقمي للمحاور (3.4م / 12ألف) — مطابق لعارض React */
function compactNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) {
    const m = v / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(1)}م`
  }
  if (Math.abs(v) >= 1000) {
    const k = v / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}ألف`
  }
  return String(v)
}

/** قصّ النص لحدّ أقصى من المحارف (آمن مع أزواج UTF-16) للوصف والوسوم */
function truncateText(value: string, max: number): string {
  const t = (value ?? '').trim()
  const chars = Array.from(t)
  if (chars.length <= max) return t
  return `${chars.slice(0, Math.max(0, max - 1)).join('')}…`
}

// ============================================================
// الشعار — data URL → ملف داخل الحزمة
// ============================================================
const LOGO_MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

/** تحويل data URL لصورة إلى { buffer, ext, mime } — null إن لم تكن صالحة */
export function dataUrlToAsset(dataUrl: string): { buffer: Uint8Array; ext: string; mime: string } | null {
  const raw = typeof dataUrl === 'string' ? dataUrl.trim() : ''
  if (!/^data:image\//i.test(raw)) return null
  const comma = raw.indexOf(',')
  if (comma < 0) return null
  const header = raw.slice(5, comma)
  const payload = raw.slice(comma + 1)
  const mime = (header.split(';')[0] ?? '').toLowerCase()
  let ext: string | undefined
  if (mime === 'image/png') ext = 'png'
  else if (mime === 'image/jpeg' || mime === 'image/jpg') ext = 'jpg'
  else if (mime === 'image/webp') ext = 'webp'
  else if (mime === 'image/gif') ext = 'gif'
  else if (mime === 'image/svg+xml') ext = 'svg'
  if (!ext) return null
  const isBase64 = /;base64$/i.test(header)
  let buffer: Uint8Array
  try {
    buffer = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8')
  } catch {
    return null
  }
  if (buffer.byteLength === 0) return null
  return { buffer, ext, mime: LOGO_MIME_BY_EXT[ext] ?? 'image/png' }
}

// قُرّاء خصائص آمنة (مطابقة لعارض React)
function S(props: Record<string, unknown>, key: string, fallback = ''): string {
  const v = props?.[key]
  return typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : fallback
}
function N(props: Record<string, unknown>, key: string, fallback = 0): number {
  const v = props?.[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return fallback
}
function B(props: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = props?.[key]
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}
function L(props: Record<string, unknown>, key: string): Array<Record<string, unknown>> {
  const v = props?.[key]
  if (!Array.isArray(v)) return []
  return v.filter((it): it is Record<string, unknown> => !!it && typeof it === 'object' && !Array.isArray(it))
}
function iS(item: Record<string, unknown>, key: string, fallback = ''): string {
  return S(item, key, fallback)
}
function iN(item: Record<string, unknown>, key: string, fallback = 0): number {
  return N(item, key, fallback)
}
function iB(item: Record<string, unknown>, key: string, fallback = false): boolean {
  return B(item, key, fallback)
}
function isNegChange(change: string): boolean {
  return change.trim().startsWith('-')
}

// ============================================================
// الأفاتار (مطابق لعارض React — حرفان + لون مشتق من الاسم)
// ============================================================
const AVATAR_TONES: string[] = ['#0d9488', '#7c5cd6', '#c2610c', '#bd4b7f', '#3d6bd6', '#6a8f1f']

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return h
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return (parts[0][0] ?? '') + (parts[1][0] ?? '')
}

function avatarHtml(name: string, size = 32): string {
  const tone = AVATAR_TONES[hashName(name || '؟') % AVATAR_TONES.length]
  const fontSize = Math.max(10, Math.round(size * 0.38))
  return `<span class="pt-avatar" style="width:${size}px;height:${size}px;background:${tone};font-size:${fontSize}px" role="img" aria-label="${esc(name || 'مستخدم')}">${esc(initialsOf(name || '؟'))}</span>`
}

// ============================================================
// خريطة حالات الجداول (مطابقة لعارض React)
// ============================================================
const STATUS_TONES: Record<string, string> = {
  مكتمل: 'success', نشط: 'success', مدفوع: 'success', متاح: 'success', مؤكد: 'success', نشطة: 'success',
  جديد: 'warning', 'قيد المعالجة': 'warning', معلق: 'warning', 'معلّقة': 'warning', 'قيد المراجعة': 'warning', متأخرة: 'warning',
  ملغى: 'danger', فاشل: 'danger', ملغاة: 'danger', نفد: 'danger', 'نفد المخزون': 'danger', متوقف: 'danger', موقوفة: 'danger', 'غير نشط': 'danger',
}

function statusTone(status: string): string {
  return STATUS_TONES[status] ?? 'default'
}

function badgeHtml(text: string, tone: string): string {
  return `<span class="pt-badge pt-badge--${esc(tone)}">${esc(text)}</span>`
}

// ============================================================
// أدوات HEX (نفس اشتقاق الوضع الداكن في عارض React)
// ============================================================
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}
function mixHex(a: string, b: string, ratio: number): string {
  const ca = parseHex(a)
  const cb = parseHex(b)
  if (!ca || !cb) return a
  const t = Math.max(0, Math.min(1, ratio))
  return toHex(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t)
}
function hexLighten(hex: string, ratio: number): string {
  return mixHex(hex, '#ffffff', ratio)
}
function hexDarken(hex: string, ratio: number): string {
  return mixHex(hex, '#000000', ratio)
}

const SHADOW_CSS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,.08)',
  md: '0 4px 12px rgba(0,0,0,.08)',
  lg: '0 12px 32px rgba(0,0,0,.12)',
}

function themeVarsCss(theme: ProjectTheme): string {
  const dark = theme.mode === 'dark'
  const bg = dark ? hexDarken(theme.background, 0.72) : theme.background
  const surface = dark ? hexLighten(bg, 0.09) : theme.surface
  const text = dark ? hexLighten(theme.text, 0.88) : theme.text
  const muted = dark ? hexLighten(theme.text, 0.6) : theme.mutedText
  const border = dark ? hexLighten(bg, 0.16) : theme.border
  const secondary = dark ? hexDarken(theme.secondary, 0.78) : theme.secondary
  const primary = dark ? hexLighten(theme.primary, 0.18) : theme.primary
  const accent = dark ? hexLighten(theme.accent, 0.12) : theme.accent
  const radius = Math.max(0, Math.min(40, Number(theme.radius) || 0))
  const shadow = SHADOW_CSS[theme.shadow] ?? SHADOW_CSS.md
  const fontName = (theme.fontFamily || 'IBM Plex Sans Arabic').replace(/'/g, '')
  return [
    `:root{`,
    `--pt-primary:${primary};`,
    `--pt-primary-fg:${theme.primaryForeground || '#ffffff'};`,
    `--pt-secondary:${secondary};`,
    `--pt-accent:${accent};`,
    `--pt-bg:${bg};`,
    `--pt-surface:${surface};`,
    `--pt-text:${text};`,
    `--pt-muted:${muted};`,
    `--pt-border:${border};`,
    `--pt-radius:${radius}px;`,
    `--pt-shadow:${shadow};`,
    `--pt-font:'${fontName}','IBM Plex Sans Arabic','Tajawal','Cairo',sans-serif;`,
    `}`,
  ].join('')
}

// ============================================================
// styles.css
// ============================================================
function buildStylesCss(theme: ProjectTheme): string {
  return `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap');
${themeVarsCss(theme)}

/* ===== أساسيات ===== */
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
@media (prefers-reduced-motion: no-preference){html{scroll-behavior:smooth}}
html{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--pt-primary) 40%,transparent) transparent}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--pt-primary) 40%,transparent);border-radius:999px}
body{font-family:var(--pt-font);background:var(--pt-bg);color:var(--pt-text);direction:rtl;text-align:right;line-height:1.65;-webkit-font-smoothing:antialiased}
img,svg{max-width:100%}
a{color:inherit;text-decoration:none}
ul,ol{list-style:none}
button,input,select,textarea{font:inherit;color:inherit}
[hidden]{display:none!important}
.container{max-width:1120px;margin-inline:auto;padding-inline:16px}
main{display:block}
:focus-visible{outline:2px solid var(--pt-primary);outline-offset:2px}
::selection{background:color-mix(in srgb,var(--pt-primary) 22%,transparent)}

/* ===== الأزرار ===== */
.pt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-weight:600;border-radius:var(--pt-radius);min-height:40px;padding:0 20px;font-size:14px;transition:filter .15s ease,background .15s ease,transform .1s ease}
.pt-btn:hover{filter:brightness(1.08)}
.pt-btn:active{transform:translateY(1px)}
.pt-btn--primary{background:var(--pt-primary);color:var(--pt-primary-fg);box-shadow:0 1px 2px rgba(0,0,0,.06)}
.pt-btn--secondary{background:var(--pt-secondary);color:var(--pt-text);border:1px solid var(--pt-border)}
.pt-btn--outline{background:transparent;color:var(--pt-text);border:1px solid var(--pt-border)}
.pt-btn--ghost{background:transparent;color:var(--pt-text)}
.pt-btn--outline:hover,.pt-btn--ghost:hover{background:var(--pt-secondary)}
.pt-btn--sm{min-height:36px;padding:0 14px;font-size:12px}
.pt-btn--lg{min-height:44px;padding:0 28px;font-size:16px}
.pt-btn--block{width:100%}
.pt-btn--on-dark{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.28)}
.pt-btn--on-dark:hover{background:rgba(255,255,255,.2);filter:none}

/* ===== البطاقات والشارات والتنبيهات ===== */
.pt-card{background:var(--pt-surface);border:1px solid var(--pt-border);border-radius:var(--pt-radius);box-shadow:var(--pt-shadow)}
.pt-badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:700;line-height:20px;white-space:nowrap;background:color-mix(in srgb,var(--pt-muted) 14%,transparent);color:var(--pt-muted);border:1px solid color-mix(in srgb,var(--pt-muted) 22%,transparent)}
.pt-badge--primary{background:color-mix(in srgb,var(--pt-primary) 12%,transparent);color:var(--pt-primary);border-color:color-mix(in srgb,var(--pt-primary) 25%,transparent)}
.pt-badge--success{background:color-mix(in srgb,#16a34a 12%,transparent);color:#15803d;border-color:color-mix(in srgb,#16a34a 24%,transparent)}
.pt-badge--warning{background:color-mix(in srgb,#d97706 12%,transparent);color:#b45309;border-color:color-mix(in srgb,#d97706 24%,transparent)}
.pt-badge--danger{background:color-mix(in srgb,#dc2626 12%,transparent);color:#b91c1c;border-color:color-mix(in srgb,#dc2626 24%,transparent)}
.pt-badge--info{background:color-mix(in srgb,#0284c7 12%,transparent);color:#0369a1;border-color:color-mix(in srgb,#0284c7 24%,transparent)}
.pt-avatar{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;color:#fff;font-weight:700;flex-shrink:0;user-select:none}
.pt-alert{display:flex;gap:10px;align-items:flex-start;border-radius:calc(var(--pt-radius) - 2px);padding:12px 16px;font-size:13.5px;border:1px solid}
.pt-alert--success{background:color-mix(in srgb,#16a34a 10%,transparent);color:#166534;border-color:color-mix(in srgb,#16a34a 26%,transparent)}
.pt-alert--info{background:color-mix(in srgb,#0284c7 10%,transparent);color:#075985;border-color:color-mix(in srgb,#0284c7 26%,transparent)}
.pt-alert--warning{background:color-mix(in srgb,#d97706 10%,transparent);color:#92400e;border-color:color-mix(in srgb,#d97706 26%,transparent)}

/* ===== حقول الإدخال ===== */
.pt-input,.pt-textarea,.pt-select{width:100%;min-height:44px;border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-bg);color:var(--pt-text);padding:10px 14px;font-size:14px;transition:border-color .15s}
.pt-input::placeholder,.pt-textarea::placeholder{color:var(--pt-muted)}
.pt-input:focus,.pt-textarea:focus,.pt-select:focus{outline:2px solid var(--pt-primary);outline-offset:1px;border-color:var(--pt-primary)}
.pt-textarea{min-height:110px;resize:vertical}
.pt-select{cursor:pointer}
.pt-label{display:block;margin-bottom:6px;font-size:14px;font-weight:600}
.pt-required{color:var(--pt-primary)}
.pt-switch{position:relative;width:42px;height:24px;border-radius:999px;border:1px solid var(--pt-border);background:var(--pt-bg);cursor:pointer;flex-shrink:0;transition:background .15s}
.pt-switch__knob{position:absolute;top:2px;inset-inline-start:2px;width:18px;height:18px;border-radius:999px;background:var(--pt-muted);transition:inset-inline-start .15s,background .15s}
.pt-switch.on{background:color-mix(in srgb,var(--pt-primary) 25%,transparent);border-color:var(--pt-primary)}
.pt-switch.on .pt-switch__knob{inset-inline-start:20px;background:var(--pt-primary)}
.pt-checkbox{width:18px;height:18px;accent-color:var(--pt-primary);cursor:pointer}

/* ===== الترويسة (nav) ===== */
.pt-nav{position:sticky;top:0;z-index:30;border-bottom:1px solid var(--pt-border);background:color-mix(in srgb,var(--pt-bg) 95%,transparent);backdrop-filter:blur(8px)}
.pt-nav__inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-block:12px}
.pt-nav__brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:17px;min-height:40px}
.pt-nav__logo{width:32px;height:32px;border-radius:calc(var(--pt-radius) - 2px);background:var(--pt-primary);flex-shrink:0}
.pt-nav__links{display:flex;align-items:center;gap:4px}
.pt-nav__link{display:inline-flex;align-items:center;min-height:40px;padding-inline:14px;border-radius:calc(var(--pt-radius) - 2px);font-size:14px;font-weight:500;transition:color .15s}
.pt-nav__link:hover,.pt-nav__link.active{color:var(--pt-primary)}
.pt-nav__cta{margin-inline-start:8px}
.pt-nav__burger{display:none;width:40px;height:40px;border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);background:transparent;cursor:pointer;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.pt-nav__burger span{display:block;width:18px;height:2px;background:var(--pt-text);border-radius:2px}

/* ===== لوحة التحكم (sidebar) ===== */
.pt-sidebar-layout{display:grid;grid-template-columns:240px minmax(0,1fr);min-height:100vh;background:var(--pt-bg)}
.pt-sidebar{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;border-inline-end:1px solid var(--pt-border);background:var(--pt-surface)}
.pt-sidebar__brand{display:flex;align-items:center;gap:10px;padding:16px;border-bottom:1px solid var(--pt-border);font-size:14px;font-weight:800}
.pt-sidebar__nav{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:4px}
.pt-sidebar__item{display:flex;align-items:center;gap:10px;min-height:40px;padding:8px 12px;border-radius:calc(var(--pt-radius) - 2px);font-size:14px;font-weight:500;transition:background .15s}
.pt-sidebar__item:hover{background:var(--pt-secondary)}
.pt-sidebar__item.active{background:var(--pt-secondary);color:var(--pt-primary)}
.pt-sidebar__dot{width:9px;height:9px;border-radius:999px;background:var(--pt-muted);flex-shrink:0}
.pt-sidebar__item.active .pt-sidebar__dot,.pt-sidebar__item:hover .pt-sidebar__dot{background:var(--pt-primary)}
.pt-sidebar__user{border-top:1px solid var(--pt-border);padding:12px;display:flex;align-items:center;gap:10px}
.pt-sidebar__user-info{min-width:0;flex:1}
.pt-sidebar__user-name{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pt-sidebar-top{display:none;border-bottom:1px solid var(--pt-border);background:var(--pt-surface)}
.pt-sidebar-top__head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--pt-border);font-size:14px;font-weight:800}
.pt-sidebar-top__pills{display:flex;gap:8px;overflow-x:auto;padding:10px 16px;scrollbar-width:thin}
.pt-sidebar-top__pill{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;white-space:nowrap;border-radius:999px;border:1px solid var(--pt-border);padding:6px 14px;font-size:13px;font-weight:500}
.pt-sidebar-top__pill.active{background:var(--pt-secondary);color:var(--pt-primary);border-color:transparent}
.pt-sidebar-content{padding:20px 16px}
.pt-sidebar-content__inner{max-width:960px;margin-inline:auto;display:flex;flex-direction:column;gap:20px}

/* ===== التذييل ===== */
.pt-footer{margin-top:auto;border-top:1px solid var(--pt-border);background:var(--pt-surface)}
.pt-footer__inner{padding-block:32px}
.pt-footer__row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
.pt-footer__brand{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700}
.pt-footer__links{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px}
.pt-footer__link{min-height:40px;display:inline-flex;align-items:center;font-size:13px;color:var(--pt-muted);transition:color .15s}
.pt-footer__link:hover{color:var(--pt-primary)}
.pt-footer__note{margin-top:16px;border-top:1px solid var(--pt-border);padding-top:16px;text-align:center;font-size:12px;color:var(--pt-muted)}

/* ===== شارة البيانات التجريبية ===== */
.pt-demo-badge{position:fixed;bottom:14px;inset-inline-start:14px;z-index:50;border-radius:999px;padding:6px 14px;font-size:11.5px;font-weight:700;background:color-mix(in srgb,var(--pt-primary) 92%,#000);color:var(--pt-primary-fg);box-shadow:0 4px 14px rgba(0,0,0,.18);user-select:none}

/* ===== عناوين الأقسام ===== */
.blk-section{padding-block:56px}
.blk-section--tight{padding-block:32px}
.blk-section__inner{max-width:1120px;margin-inline:auto;padding-inline:16px}
.blk-heading{margin-bottom:40px;max-width:640px;margin-inline:auto;text-align:center}
.blk-heading h2{font-size:clamp(24px,4vw,36px);font-weight:700;line-height:1.25}
.blk-heading p{margin-top:12px;font-size:15px;color:var(--pt-muted)}

/* ===== hero ===== */
.blk-hero{padding-block:64px}
.blk-hero--muted{background:var(--pt-secondary)}
.blk-hero--dark{background:#16121f}
.blk-hero--dark .blk-hero__title{color:#fff}
.blk-hero--dark .blk-hero__subtitle{color:rgba(255,255,255,.8)}
.blk-hero--gradient{background:linear-gradient(135deg,var(--pt-primary),#db2777)}
.blk-hero--gradient .blk-hero__title{color:#fff}
.blk-hero--gradient .blk-hero__subtitle{color:rgba(255,255,255,.85)}
.blk-hero__inner{max-width:1120px;margin-inline:auto;padding-inline:16px}
.blk-hero__split{display:flex;flex-direction:column-reverse;align-items:center;gap:40px}
.blk-hero__text{max-width:640px}
.blk-hero--centered .blk-hero__text{margin-inline:auto;text-align:center;max-width:640px}
.blk-hero__title{font-size:clamp(30px,6vw,48px);font-weight:800;line-height:1.2}
.blk-hero__subtitle{margin-top:16px;font-size:clamp(15px,2vw,18px);color:var(--pt-muted)}
.blk-hero__actions{margin-top:28px;display:flex;flex-wrap:wrap;gap:12px}
.blk-hero--centered .blk-hero__actions{justify-content:center}
/* الرسم المجرد */
.blk-hero__visual{position:relative;width:100%;max-width:520px}
.blk-hero__glow1{position:absolute;top:-32px;inset-inline-end:-24px;width:176px;height:176px;border-radius:999px;background:var(--pt-accent);opacity:.3;filter:blur(40px)}
.blk-hero__glow2{position:absolute;bottom:-40px;inset-inline-start:-32px;width:208px;height:208px;border-radius:999px;background:var(--pt-primary);opacity:.2;filter:blur(48px)}
.blk-hero__panel{position:relative;border-radius:calc(var(--pt-radius) + 6px);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);padding:20px}
.blk-hero__dots{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.blk-hero__dot{width:10px;height:10px;border-radius:999px}
.blk-hero__line{margin-inline-start:8px;width:96px;height:10px;border-radius:999px;background:var(--pt-secondary)}
.blk-hero__ministats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.blk-hero__ministat{border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-bg);padding:12px}
.blk-hero__minibar{height:8px;border-radius:999px;background:var(--pt-secondary);margin-bottom:8px;width:66%}
.blk-hero__minival{display:block;height:12px;border-radius:4px}
.blk-hero__bars{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;height:128px;border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-bg);padding:12px}
.blk-hero__bar{flex:1;border-radius:6px 6px 0 0}
.blk-hero__skel{margin-top:16px}
.blk-hero__skel span{display:block;height:10px;border-radius:999px;background:var(--pt-secondary)}
.blk-hero__skel span+span{margin-top:8px;width:75%}

/* ===== hero: eyebrow / أحجام العنوان / الهاتف / الفيديو / نموذج البريد ===== */
.pt-eyebrow{display:inline-flex;align-items:center;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;border:1px solid var(--pt-border);background:var(--pt-secondary);color:var(--pt-text);margin-bottom:16px}
.pt-eyebrow--dark{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff}
.blk-hero__title--lg{font-size:clamp(2rem,5vw,3.75rem)}
.blk-hero__title--xl{font-size:clamp(2.5rem,6.5vw,4.5rem);letter-spacing:-.015em}
.blk-hero__stack{margin-top:40px;display:flex;justify-content:center}
/* موك الهاتف */
.pt-phone-wrap{display:flex;align-items:center;justify-content:center;width:280px;max-width:100%}
.pt-phone{position:relative;width:min(280px,100%);aspect-ratio:9/19;border:8px solid var(--pt-border);border-radius:28px;background:var(--pt-surface);box-shadow:var(--pt-shadow);overflow:hidden;padding:14px 12px 16px;display:flex;flex-direction:column;gap:12px}
.pt-phone__notch{width:72px;height:7px;border-radius:999px;background:color-mix(in srgb,var(--pt-text) 22%,transparent);margin-inline:auto;flex-shrink:0}
.pt-phone__header{display:flex;align-items:center;gap:8px}
.pt-phone__avatar{width:26px;height:26px;border-radius:999px;background:var(--pt-primary);flex-shrink:0}
.pt-phone__lines{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.pt-phone__line{height:6px;border-radius:999px;background:var(--pt-secondary)}
.pt-phone__stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pt-phone__stat{border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 4px);background:var(--pt-bg);padding:10px;display:flex;flex-direction:column;gap:7px}
.pt-phone__stat-bar{height:6px;border-radius:999px;background:var(--pt-secondary)}
.pt-phone__stat-val{height:9px;border-radius:4px;background:var(--pt-primary);opacity:.85}
.pt-phone__chart{flex:1;min-height:70px;display:flex;align-items:flex-end;gap:7px;border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 4px);background:var(--pt-bg);padding:10px}
.pt-phone__chart-bar{flex:1;border-radius:5px 5px 0 0}
.pt-phone__cta{height:30px;border-radius:999px;background:var(--pt-primary);flex-shrink:0}
/* بطاقة الفيديو */
.pt-video-wrap{width:520px;max-width:100%}
.pt-video{position:relative;aspect-ratio:16/9;border:1px solid var(--pt-border);background:var(--pt-surface);border-radius:calc(var(--pt-radius) + 6px);box-shadow:var(--pt-shadow);display:flex;align-items:center;justify-content:center;overflow:hidden}
.pt-video__veil{position:absolute;inset:0;background:linear-gradient(160deg,var(--pt-secondary),transparent);pointer-events:none}
.pt-video__caption{position:absolute;bottom:14px;inset-inline:16px;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.pt-video__caption span{height:8px;border-radius:999px;background:color-mix(in srgb,var(--pt-text) 14%,transparent)}
.pt-play{position:relative;width:60px;height:60px;border-radius:999px;border:none;background:var(--pt-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.22);transition:transform .2s ease,opacity .2s ease}
.pt-play:hover{filter:brightness(1.08)}
.pt-play--clicked{opacity:.35;transform:scale(.88)}
.pt-play__triangle{display:block;width:0;height:0;border-style:solid;border-width:11px 0 11px 18px;border-color:transparent transparent transparent #fff;margin-left:5px}
/* نموذج جمع البريد */
.pt-lead-wrap{margin-top:24px;max-width:440px}
.pt-lead-wrap--centered{margin-inline:auto}
.pt-lead-form{display:flex;gap:8px}
.pt-lead-form .pt-btn{flex-shrink:0}
.pt-lead-form__input{flex:1;min-width:0;min-height:44px;border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-bg);color:var(--pt-text);padding:10px 14px;font-size:14px}
.pt-lead-form__input::placeholder{color:var(--pt-muted)}
.pt-lead-form__input:focus{outline:2px solid var(--pt-primary);outline-offset:1px;border-color:var(--pt-primary)}
.pt-lead-form--dark .pt-lead-form__input{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);color:#fff}
.pt-lead-form--dark .pt-lead-form__input::placeholder{color:rgba(255,255,255,.6)}
.pt-lead-social{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:12.5px;color:var(--pt-muted)}
.pt-lead-wrap--centered .pt-lead-social{justify-content:center}
.pt-lead-social__avatars{display:flex;align-items:center}
.pt-lead-social__av .pt-avatar{box-shadow:0 0 0 2px var(--pt-bg)}
.blk-hero--dark .pt-lead-social,.blk-hero--gradient .pt-lead-social{color:rgba(255,255,255,.78)}
.blk-hero--dark .pt-lead-social__av .pt-avatar,.blk-hero--gradient .pt-lead-social__av .pt-avatar{box-shadow:0 0 0 2px #16121f}

/* ===== features ===== */
.blk-features__grid{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:20px}
.blk-feature{padding:24px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);transition:transform .2s}
.blk-feature:hover{transform:translateY(-3px)}
.blk-feature__icon{width:44px;height:44px;border-radius:calc(var(--pt-radius) - 2px);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;background:color-mix(in srgb,var(--pt-primary) 12%,transparent);color:var(--pt-primary);margin-bottom:14px}
.blk-feature__title{font-size:16.5px;font-weight:700}
.blk-feature__desc{margin-top:6px;font-size:14px;color:var(--pt-muted)}

/* ===== stats ===== */
.blk-stats{background:var(--pt-surface);border-block:1px solid var(--pt-border)}
.blk-stats__grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding-block:40px}
.blk-stat{text-align:center}
.blk-stat__value{font-size:30px;font-weight:800;color:var(--pt-primary)}
.blk-stat__label{margin-top:4px;font-size:13px;color:var(--pt-muted)}
.blk-stat__change{display:block;margin-top:6px}

/* ===== steps ===== */
.blk-steps__list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;counter-reset:step}
.blk-step{position:relative;padding:24px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow)}
.blk-step__num{width:38px;height:38px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--pt-secondary);color:var(--pt-primary);margin-bottom:14px}
.blk-step__title{font-size:16px;font-weight:700}
.blk-step__desc{margin-top:6px;font-size:14px;color:var(--pt-muted)}

/* ===== pricing ===== */
.blk-pricing__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;align-items:stretch}
.blk-plan{display:flex;flex-direction:column;padding:28px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);position:relative}
.blk-plan--highlight{border:2px solid var(--pt-primary);transform:scale(1.02)}
.blk-plan__flag{position:absolute;top:-13px;inset-inline-start:50%;transform:translateX(50%)}
.blk-plan__name{font-size:17px;font-weight:700}
.blk-plan__price{margin-top:10px;display:flex;align-items:baseline;gap:6px}
.blk-plan__amount{font-size:34px;font-weight:800;color:var(--pt-primary)}
.blk-plan__period{font-size:13px;color:var(--pt-muted)}
.blk-plan__features{margin:20px 0;display:flex;flex-direction:column;gap:10px;flex:1}
.blk-plan__feature{display:flex;gap:8px;font-size:14px;color:var(--pt-muted)}
.blk-plan__feature::before{content:'✓';color:var(--pt-primary);font-weight:700;flex-shrink:0}

/* ===== testimonials ===== */
.blk-testimonials__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.blk-testimonial{padding:24px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow)}
.blk-testimonial__stars{color:#f59e0b;letter-spacing:2px;font-size:15px}
.blk-testimonial__text{margin-top:12px;font-size:14.5px}
.blk-testimonial__person{margin-top:18px;display:flex;align-items:center;gap:10px}
.blk-testimonial__name{font-size:14px;font-weight:700}
.blk-testimonial__role{font-size:12.5px;color:var(--pt-muted)}

/* ===== faq ===== */
.blk-faq__list{max-width:760px;margin-inline:auto;display:flex;flex-direction:column;gap:12px}
.blk-faq__item{border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-surface);overflow:hidden}
.blk-faq__item summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;font-weight:700;font-size:15px}
.blk-faq__item summary::-webkit-details-marker{display:none}
.blk-faq__item summary::after{content:'+';font-size:20px;color:var(--pt-primary);flex-shrink:0}
.blk-faq__item[open] summary::after{content:'−'}
.blk-faq__answer{padding:0 20px 18px;font-size:14px;color:var(--pt-muted)}

/* ===== cta / banner ===== */
.blk-cta__card{border-radius:calc(var(--pt-radius) + 4px);padding:44px 24px;text-align:center;box-shadow:var(--pt-shadow)}
.blk-cta__card--gradient{background:linear-gradient(135deg,var(--pt-primary),#db2777);color:#fff}
.blk-cta__card--dark{background:#16121f;color:#fff}
.blk-cta__card--default{background:var(--pt-secondary);border:1px solid var(--pt-border)}
.blk-cta__title{font-size:clamp(22px,4vw,32px);font-weight:800}
.blk-cta__subtitle{margin-top:10px;opacity:.85;font-size:15px}
.blk-cta__actions{margin-top:26px}
.blk-banner{padding:22px 24px;border-radius:var(--pt-radius)}
.blk-banner--gradient{background:linear-gradient(135deg,var(--pt-primary),var(--pt-accent));color:#fff}
.blk-banner--dark{background:#16121f;color:#fff}
.blk-banner__inner{max-width:1120px;margin-inline:auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}
.blk-banner__title{font-size:17px;font-weight:800}
.blk-banner__subtitle{margin-top:2px;font-size:13.5px;opacity:.85}

/* ===== contact / forms ===== */
.blk-contact__card{max-width:560px;margin-inline:auto;padding:28px}
.blk-form__grid{display:flex;flex-direction:column;gap:16px}
.blk-form__actions{margin-top:4px}
.blk-form__check{display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer;font-size:14px}

/* ===== gallery ===== */
.blk-gallery__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px}
.blk-gallery__item{border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);overflow:hidden;transition:transform .2s}
.blk-gallery__item:hover{transform:translateY(-4px)}
.blk-gallery__thumb{position:relative;height:168px;display:flex;align-items:center;justify-content:center}
.blk-gallery__letter{font-size:52px;font-weight:800;color:rgba(255,255,255,.95)}
.blk-gallery__badge{position:absolute;top:12px;inset-inline-start:12px}
.blk-gallery__body{padding:18px}
.blk-gallery__row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.blk-gallery__title{font-size:16px;font-weight:700;flex:1}
.blk-gallery__price{font-size:16px;font-weight:800;color:var(--pt-primary);flex-shrink:0}
.blk-gallery__price small{font-size:11px;font-weight:500;color:var(--pt-muted)}
.blk-gallery__desc{margin-top:6px;font-size:13.5px;color:var(--pt-muted)}

/* ===== list / team ===== */
.blk-list__items{display:flex;flex-direction:column;gap:12px;max-width:760px;margin-inline:auto}
.blk-list__item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow)}
.blk-list__content{flex:1;min-width:0}
.blk-list__title{font-size:15px;font-weight:700}
.blk-list__subtitle{margin-top:2px;font-size:13.5px;color:var(--pt-muted)}
.blk-list__meta{flex-shrink:0;font-size:12px;color:var(--pt-muted);border-radius:999px;background:var(--pt-secondary);padding:4px 12px}
.blk-team__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px}
.blk-team__card{padding:28px 20px;text-align:center;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);display:flex;flex-direction:column;align-items:center;gap:12px}
.blk-team__name{font-size:15.5px;font-weight:700}
.blk-team__role{font-size:13px;color:var(--pt-muted)}

/* ===== custom-html ===== */
.blk-custom-label{display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12.5px;font-weight:600;color:var(--pt-muted)}
.pt-custom-html{display:block;width:100%;border:1px solid var(--pt-border);border-radius:var(--pt-radius);background:var(--pt-bg)}

/* ===== auth ===== */
.blk-auth{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 16px}
.blk-auth__brand{display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:18px;font-weight:800}
.blk-auth__logo{width:40px;height:40px;border-radius:calc(var(--pt-radius) - 2px);background:var(--pt-primary)}
.blk-auth__card{width:100%;max-width:420px;padding:32px}
.blk-auth__head{text-align:center;margin-bottom:24px}
.blk-auth__icon{width:56px;height:56px;border-radius:999px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--pt-primary) 12%,transparent);color:var(--pt-primary);font-size:24px}
.blk-auth__title-row{display:flex;align-items:center;justify-content:center;gap:8px}
.blk-auth__title{font-size:22px;font-weight:800}
.blk-auth__subtitle{margin-top:8px;font-size:14px;color:var(--pt-muted)}
.blk-auth__hint{margin-top:20px}

/* ===== dashboard blocks ===== */
.blk-dash-header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}
.blk-dash-header__title{font-size:22px;font-weight:800}
.blk-dash-header__subtitle{margin-top:4px;font-size:13.5px;color:var(--pt-muted)}
.blk-dash-header__actions{display:flex;flex-wrap:wrap;gap:10px}
.blk-stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.blk-stat-card{padding:18px 20px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow)}
.blk-stat-card__label{font-size:13px;color:var(--pt-muted)}
.blk-stat-card__value{margin-top:6px;font-size:22px;font-weight:800}
.blk-stat-card__change{margin-top:8px;display:inline-flex}
.blk-chart{padding:0}
.blk-chart__head{border-bottom:1px solid var(--pt-border);padding:14px 20px;font-size:14px;font-weight:700}
.blk-chart__body{padding:16px 20px}
.blk-chart svg{width:100%;height:auto;display:block}
.blk-donut-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:24px}
.blk-donut{position:relative;width:176px;height:176px;flex-shrink:0}
.blk-donut__center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.blk-donut__total{font-size:22px;font-weight:800}
.blk-donut__total-label{font-size:11px;color:var(--pt-muted);margin-top:2px}
.blk-donut__legend{flex:1;min-width:200px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 20px}
.blk-donut__legend li{display:flex;align-items:center;gap:8px;font-size:14px}
.blk-donut__legend .dot{width:10px;height:10px;border-radius:999px;flex-shrink:0}
.blk-donut__legend .pct{margin-inline-start:auto;font-weight:700}

/* ===== data table ===== */
.blk-table{overflow:hidden}
.blk-table__head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--pt-border);padding:14px 20px}
.blk-table__head h3{font-size:14px;font-weight:700}
.blk-table__search{position:relative;min-width:220px}
.blk-table__search .pt-input{padding-inline-start:36px}
.blk-table__search::before{content:'⌕';position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);color:var(--pt-muted);font-size:17px;pointer-events:none}
.pt-table-scroll{overflow-x:auto}
.pt-table{width:100%;border-collapse:collapse;text-align:right;min-width:max-content}
.pt-table thead tr{background:var(--pt-secondary);border-bottom:1px solid var(--pt-border)}
.pt-table th{padding:12px 20px;font-size:12px;font-weight:700;color:var(--pt-muted);white-space:nowrap}
.pt-table tbody tr{border-bottom:1px solid var(--pt-border);transition:background .1s}
.pt-table tbody tr:hover{background:var(--pt-secondary)}
.pt-table td{padding:12px 20px;vertical-align:middle;font-size:14px}
.pt-cell-avatar{display:flex;align-items:center;gap:10px;font-weight:600}
.pt-currency{white-space:nowrap;font-weight:700}
.pt-currency small{font-size:11px;font-weight:500;color:var(--pt-muted)}
.pt-ltr{direction:ltr;display:inline-block;text-align:right;font-size:13px;color:var(--pt-muted)}
.pt-progress{display:flex;align-items:center;gap:8px;min-width:120px}
.pt-progress__track{width:64px;height:6px;border-radius:999px;background:var(--pt-secondary);overflow:hidden}
.pt-progress__fill{display:block;height:100%;border-radius:999px;background:var(--pt-primary)}
.pt-progress__pct{font-size:12px;font-weight:700;color:var(--pt-muted)}
.blk-table__foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--pt-border);padding:12px 20px;font-size:12px;color:var(--pt-muted)}

/* ===== settings / profile / states / calendar ===== */
.blk-settings__card{max-width:760px;margin-inline:auto;padding:0;overflow:hidden}
.blk-settings__title{padding:20px 24px;border-bottom:1px solid var(--pt-border);font-size:18px;font-weight:800}
.blk-settings__section{padding:22px 24px}
.blk-settings__section+.blk-settings__section{border-top:1px solid var(--pt-border)}
.blk-settings__section h3{font-size:14.5px;font-weight:700;margin-bottom:16px}
.blk-settings__field{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-block:10px}
.blk-settings__field-label{font-size:14px;font-weight:600}
.blk-settings__hint{display:block;font-size:12px;color:var(--pt-muted);margin-top:2px}
.blk-settings__field-control{flex-shrink:0;max-width:240px}
.blk-settings__actions{padding:18px 24px;border-top:1px solid var(--pt-border);display:flex;justify-content:flex-end}
.blk-profile__card{max-width:560px;margin-inline:auto;padding:32px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
.blk-profile__name{margin-top:14px;font-size:20px;font-weight:800}
.blk-profile__role{font-size:14px;color:var(--pt-primary);font-weight:600}
.blk-profile__bio{margin-top:14px;font-size:14px;color:var(--pt-muted);max-width:400px}
.blk-profile__contacts{margin-top:20px;padding-top:20px;border-top:1px solid var(--pt-border);display:flex;flex-direction:column;gap:8px;width:100%;font-size:13.5px;color:var(--pt-muted)}
.blk-state{padding:48px 24px;text-align:center}
.blk-state__icon{width:64px;height:64px;border-radius:999px;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;font-size:26px;background:var(--pt-secondary)}
.blk-state__title{font-size:18px;font-weight:800}
.blk-state__subtitle{margin-top:8px;font-size:14px;color:var(--pt-muted)}
.blk-state__actions{margin-top:22px}
.blk-loading__spinner{width:38px;height:38px;border:3px solid color-mix(in srgb,var(--pt-primary) 18%,transparent);border-top-color:var(--pt-primary);border-radius:999px;margin:0 auto 18px;animation:pt-spin 1s linear infinite}
@keyframes pt-spin{to{transform:rotate(360deg)}}
.blk-calendar{max-width:640px;margin-inline:auto}
.blk-calendar__head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--pt-border);padding:14px 20px}
.blk-calendar__title{font-size:14px;font-weight:700}
.blk-calendar__month{margin-top:2px;font-size:12px;color:var(--pt-primary);font-weight:600}
.blk-calendar__body{padding:16px 20px}
.blk-calendar__weekdays,.blk-calendar__days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.blk-calendar__weekday{padding-block:4px;text-align:center;font-size:11px;font-weight:700;color:var(--pt-muted)}
.blk-calendar__day{position:relative;display:flex;min-height:44px;align-items:center;justify-content:center;border-radius:calc(var(--pt-radius) - 4px);font-size:14px;font-weight:500;background:var(--pt-bg);border:1px solid color-mix(in srgb,var(--pt-border) 60%,transparent)}
.blk-calendar__day--event{background:color-mix(in srgb,var(--pt-primary) 10%,transparent);color:var(--pt-primary);font-weight:700}
.blk-calendar__day--today{border:2px solid var(--pt-primary)}
.blk-calendar__dot{position:absolute;bottom:6px;width:6px;height:6px;border-radius:999px;background:var(--pt-primary)}
.blk-calendar__events{margin-top:16px;padding-top:16px;border-top:1px solid var(--pt-border);display:flex;flex-direction:column;gap:8px}
.blk-calendar__event{display:flex;align-items:center;gap:10px;font-size:14px}
.blk-calendar__event-day{width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--pt-secondary);color:var(--pt-primary);font-size:11px;font-weight:700;flex-shrink:0}

/* ===== الشعار ===== */
.pt-logo{display:block;height:32px;width:auto;max-width:120px;object-fit:contain}
.pt-sidebar .pt-logo,.pt-sidebar-top .pt-logo{height:28px;max-width:140px}
.blk-auth__brand .pt-logo{height:34px;max-width:140px}
.pt-footer__logo{display:flex;justify-content:center;margin-bottom:12px}
.pt-footer__logo .pt-logo{height:24px;max-width:96px}

/* ===== رابط التخطي + زر العودة للأعلى + الظهور عند التمرير ===== */
.pt-skip{position:fixed;top:8px;inset-inline-start:8px;z-index:100;padding:10px 18px;border-radius:calc(var(--pt-radius) - 2px);background:var(--pt-primary);color:var(--pt-primary-fg);font-weight:700;font-size:14px;opacity:0;pointer-events:none;transform:translateY(-10px);transition:opacity .15s ease,transform .15s ease}
.pt-skip:focus{opacity:1;pointer-events:auto;transform:none}
.pt-top{position:fixed;bottom:20px;inset-inline-end:20px;z-index:40;width:44px;height:44px;border:none;border-radius:999px;background:var(--pt-primary);color:var(--pt-primary-fg);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.22);opacity:0;pointer-events:none;transform:translateY(6px);transition:opacity .25s ease,transform .25s ease}
.pt-top:hover{filter:brightness(1.08)}
.pt-top--show{opacity:1;pointer-events:auto;transform:none}
.pt-reveal{opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.22,.61,.36,1),transform .6s cubic-bezier(.22,.61,.36,1)}
.pt-reveal.pt-in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){
  .pt-reveal{opacity:1;transform:none;transition:none}
  .pt-top{transition:none}
}

/* ===== 404 ===== */
.pt-404{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px}
.pt-404__code{font-size:72px;font-weight:800;color:var(--pt-primary)}
.pt-404__text{font-size:16px;color:var(--pt-muted)}

/* ===== استجابة ===== */
@media (max-width:768px){
  .pt-nav__links{display:none;position:absolute;inset-inline:0;top:100%;flex-direction:column;align-items:stretch;background:var(--pt-surface);border-bottom:1px solid var(--pt-border);padding:12px 16px;gap:2px}
  .pt-nav__links.open{display:flex}
  .pt-nav__burger{display:flex}
  .pt-sidebar-layout{grid-template-columns:1fr}
  .pt-sidebar{display:none}
  .pt-sidebar-top{display:block}
  .blk-hero__split{flex-direction:column-reverse}
  .blk-hero__visual{max-width:100%}
  .blk-features__grid{grid-template-columns:1fr 1fr}
  .blk-stats__grid{grid-template-columns:1fr 1fr}
  .blk-plan--highlight{transform:none}
  .blk-list__meta{display:none}
  .blk-donut-wrap{justify-content:center}
}
@media (max-width:480px){
  .blk-features__grid{grid-template-columns:1fr}
  .blk-hero{padding-block:44px}
  .pt-lead-form{flex-direction:column}
}
`
}

// ============================================================
// script.js
// ============================================================
function buildScriptJs(): string {
  return `// نموذج — سلوك الموقع الثابت (بدون أي مكتبات)
(function () {
  'use strict'

  // قائمة الهاتف
  document.querySelectorAll('[data-nav-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nav = document.getElementById('site-nav')
      if (!nav) return
      var open = nav.classList.toggle('open')
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  })

  // النماذج: نجاح أو إعادة توجيه (الدخول إلى لوحة التحكم)
  document.querySelectorAll('form.pt-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var redirect = form.getAttribute('data-redirect')
      if (redirect) {
        window.location.href = redirect
        return
      }
      var success = form.getAttribute('data-success') || 'تم الإرسال بنجاح'
      var alertEl = document.createElement('div')
      alertEl.className = 'pt-alert pt-alert--success'
      alertEl.setAttribute('role', 'status')
      alertEl.textContent = '✓ ' + success
      form.replaceWith(alertEl)
    })
  })

  // بحث الجداول
  document.querySelectorAll('[data-table-search]').forEach(function (input) {
    input.addEventListener('input', function () {
      var table = document.getElementById(input.getAttribute('data-table-search'))
      if (!table) return
      var q = input.value.trim().toLowerCase()
      var rows = table.querySelectorAll('tbody tr')
      var visible = 0
      rows.forEach(function (row) {
        var match = !q || row.textContent.toLowerCase().indexOf(q) !== -1
        row.style.display = match ? '' : 'none'
        if (match) visible++
      })
      var counter = document.getElementById(input.getAttribute('data-table-search') + '-count')
      if (counter) counter.textContent = 'عرض ' + visible + ' من ' + rows.length + ' صف'
    })
  })

  // مفاتيح الإعدادات
  document.querySelectorAll('[data-switch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.classList.toggle('on')
      btn.setAttribute('aria-checked', on ? 'true' : 'false')
    })
  })

  // نموذج جمع البريد في البطل
  document.querySelectorAll('form.pt-lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var alertEl = document.createElement('div')
      alertEl.className = 'pt-alert pt-alert--success'
      alertEl.setAttribute('role', 'status')
      alertEl.textContent = 'تم تسجيل بريدك بنجاح ✓ شكراً لاهتمامك!'
      form.replaceWith(alertEl)
    })
  })

  // زر تشغيل الفيديو (ديكوري — لا فيديو حقيقي)
  document.querySelectorAll('.pt-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.add('pt-play--clicked')
    })
  })

  // ظهور الأقسام عند التمرير
  var revealEls = document.querySelectorAll('.pt-reveal')
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pt-in')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' })
    revealEls.forEach(function (el) { io.observe(el) })
  } else {
    revealEls.forEach(function (el) { el.classList.add('pt-in') })
  }

  // زر العودة إلى الأعلى (صفحات الموقع فقط)
  var topBtn = document.querySelector('.pt-top')
  if (topBtn) {
    var syncTop = function () {
      var y = window.scrollY || document.documentElement.scrollTop || 0
      topBtn.classList.toggle('pt-top--show', y > 400)
    }
    window.addEventListener('scroll', syncTop, { passive: true })
    syncTop()
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
})()
`
}

// ============================================================
// netlify.toml + README.md
// ============================================================
function buildNetlifyToml(): string {
  return `# نموذج — إعداد النشر على Netlify (موقع ثابت، لا خطوات بناء)
[build]
  publish = "."
`
}

function buildReadmeMd(schema: ProjectSchema): string {
  const name = schema.metadata.name || 'مشروعك'
  const hasLogo = !!dataUrlToAsset(schema.branding?.logo ?? '')
  return `# ${name} — نموذج أولي جاهز للنشر

مشروعك جاهز! هذه حزمة موقع ثابت (HTML + CSS + JS بدون أي مكتبات) أُنشئت بواسطة منصة **نموذج**.

## محتويات الملفات

| الملف / المجلد | الوصف |
| --- | --- |
| \`index.html\` | الصفحة الرئيسية لموقعك |
| \`styles.css\` | كل التنسيقات والألوان (سهل التعديل) |
| \`script.js\` | تفاعلات خفيفة: القائمة، النماذج، بحث الجداول، ظهور الأقسام عند التمرير، زر العودة للأعلى |
| \`404.html\` | صفحة الخطأ |
| \`netlify.toml\` | إعداد النشر على Netlify |
${hasLogo ? '| \`assets/\` | شعار مشروعك — يظهر في الترويسة والتذييل وكأيقونة المتصفح |\n' : ''}| باقي المجلدات | صفحة لكل قسم من موقعك |

## خطوات النشر على Netlify

1. حمّلت ملف ZIP وفككت ضغطه في مجلد على جهازك.
2. أنشئ حساباً مجانياً على [netlify.com](https://netlify.com).
3. من لوحة حسابك اضغط **Add new site → Deploy manually**.
4. اسحب مجلد المشروع كاملاً (وليس ملف ZIP) وأفلته في منطقة الرفع.
5. انتظر دقيقة تقريباً حتى يكتمل الرفع.
6. رابط موقعك جاهز — انسخه وشاركه مع أي شخص!

> **ملاحظة:** هذا نموذج أولي (Prototype) ببيانات تجريبية جزائرية — ليس نظاماً خلفياً حقيقياً. النماذج والجداول للعرض فقط.

## تخصيص لاحق

- **الألوان والخطوط:** افتح \`styles.css\` وعدّل متغيرات \`:root\` في أعلى الملف (مثل \`--pt-primary\`).
- **النصوص:** افتح أي ملف \`index.html\` داخل مجلد الصفحة وعدّل النص مباشرة.

## دعم

أُنشئ هذا النموذج بواسطة منصة **نموذج** — منصة جزائرية لتحويل الأفكار إلى نماذج أولية.
`
}

// ============================================================
// الرسوم البيانية (SVG يدوي — مطابق لعارض React)
// ============================================================
interface ChartDatum {
  label: string
  value: number
}

const CHART_PALETTE: string[] = ['var(--pt-primary)', '#0d9488', '#d97706', '#db2777', '#2563eb', '#64748b']

function chartRows(data: unknown): ChartDatum[] {
  if (!Array.isArray(data)) return []
  return data
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object' && !Array.isArray(d))
    .map((d) => ({ label: String(d.label ?? ''), value: Number(d.value) }))
    .filter((d) => d.label && Number.isFinite(d.value))
}

function topRoundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

function barChartSvg(data: ChartDatum[], gid: string): string {
  const W = 600
  const H = 260
  const padX = 40
  const padTop = 16
  const padBottom = 38
  const rtl = [...data].reverse()
  const max = Math.max(...rtl.map((d) => d.value), 1)
  const areaW = W - padX * 2
  const areaH = H - padTop - padBottom
  const baseline = padTop + areaH
  const slot = areaW / rtl.length
  const barW = Math.min(slot * 0.58, 56)
  const skipLabels = rtl.length > 8

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني بالأعمدة">`
  svg += `<defs><linearGradient id="bar-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-primary);stop-opacity:1"/><stop offset="100%" style="stop-color:var(--pt-primary);stop-opacity:.62"/></linearGradient></defs>`

  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = baseline - areaH * f
    svg += `<line x1="${padX}" y1="${y}" x2="${W - padX}" y2="${y}" style="stroke:var(--pt-border);stroke-width:1"${f === 0 ? '' : ' stroke-dasharray="4 6"'}/>`
    svg += `<text x="${W - padX + 8}" y="${y + 3.5}" text-anchor="start" style="fill:var(--pt-muted);font-size:10px">${esc(compactNum(max * f))}</text>`
  }
  rtl.forEach((d, i) => {
    const h = Math.max(2, (d.value / max) * areaH)
    const cx = padX + slot * i + slot / 2
    const x = cx - barW / 2
    const y = baseline - h
    svg += `<g><title>${esc(d.label)}: ${esc(d.value.toLocaleString('en-US'))}</title><path d="${topRoundedRect(x, y, barW, h, 6)}" style="fill:url(#bar-${gid})"/></g>`
  })
  rtl.forEach((d, i) => {
    if (skipLabels && i % 2 === 1) return
    const cx = padX + slot * i + slot / 2
    svg += `<text x="${cx}" y="${H - 12}" text-anchor="middle" style="fill:var(--pt-muted);font-size:10.5px">${esc(d.label)}</text>`
  })
  svg += '</svg>'
  return svg
}

function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

function lineChartSvg(data: ChartDatum[], gid: string): string {
  const W = 600
  const H = 260
  const padX = 40
  const padTop = 16
  const padBottom = 38
  const rtl = [...data].reverse()
  if (rtl.length < 2) return ''
  const values = rtl.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || max || 1
  const areaW = W - padX * 2
  const areaH = H - padTop - padBottom
  const baseline = padTop + areaH

  const pts = rtl.map((d, i) => ({
    x: padX + (areaW / (rtl.length - 1)) * i,
    y: padTop + areaH - ((d.value - min + span * 0.06) / (span * 1.12)) * areaH,
  }))
  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z`

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم بياني خطي">`
  svg += `<defs><linearGradient id="area-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-primary);stop-opacity:.26"/><stop offset="100%" style="stop-color:var(--pt-primary);stop-opacity:.02"/></linearGradient></defs>`
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = baseline - areaH * f
    svg += `<line x1="${padX}" y1="${y}" x2="${W - padX}" y2="${y}" style="stroke:var(--pt-border);stroke-width:1"${f === 0 ? '' : ' stroke-dasharray="4 6"'}/>`
    svg += `<text x="${W - padX + 8}" y="${y + 3.5}" text-anchor="start" style="fill:var(--pt-muted);font-size:10px">${esc(compactNum(min + span * f))}</text>`
  }
  svg += `<path d="${area}" style="fill:url(#area-${gid})"/>`
  svg += `<path d="${line}" style="fill:none;stroke:var(--pt-primary);stroke-width:2.5;stroke-linecap:round"/>`
  pts.forEach((p, i) => {
    svg += `<g><title>${esc(rtl[i].label)}: ${esc(rtl[i].value.toLocaleString('en-US'))}</title><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3.5" style="fill:var(--pt-primary);stroke:var(--pt-surface);stroke-width:2"/></g>`
  })
  const skipLabels = rtl.length > 8
  rtl.forEach((d, i) => {
    if (skipLabels && i % 2 === 1) return
    const x = padX + (areaW / (rtl.length - 1)) * i
    svg += `<text x="${x.toFixed(2)}" y="${H - 12}" text-anchor="middle" style="fill:var(--pt-muted);font-size:10.5px">${esc(d.label)}</text>`
  })
  svg += '</svg>'
  return svg
}

function donutChartSvg(data: ChartDatum[]): string {
  const raw = data.filter((d) => d.value > 0)
  if (raw.length === 0) return ''
  const rows =
    raw.length > 6
      ? [...raw.slice(0, 5), { label: 'أخرى', value: raw.slice(5).reduce((a, d) => a + d.value, 0) }]
      : raw
  const total = rows.reduce((a, d) => a + d.value, 0)
  const R = 60
  const C = 2 * Math.PI * R

  let cum = 0
  const segments = rows.map((d) => {
    const frac = d.value / total
    const seg = { label: d.label, value: d.value, frac, start: cum }
    cum += frac
    return seg
  })

  const compactTotal = total >= 1000 ? total.toLocaleString('en-US') : String(total)

  let svg = `<div class="blk-donut-wrap"><div class="blk-donut"><svg viewBox="0 0 160 160" style="transform:rotate(-90deg)" role="img" aria-label="رسم بياني دائري">`
  svg += `<circle cx="80" cy="80" r="${R}" style="fill:none;stroke:var(--pt-border);stroke-width:20"/>`
  segments.forEach((seg, i) => {
    const len = seg.frac * C
    const offset = -seg.start * C
    const color = CHART_PALETTE[i % CHART_PALETTE.length]
    svg += `<g><title>${esc(seg.label)}: ${esc(seg.value.toLocaleString('en-US'))} (${Math.round(seg.frac * 100)}%)</title><circle cx="80" cy="80" r="${R}" style="fill:none;stroke:${color};stroke-width:20;stroke-dasharray:${len} ${C - len};stroke-dashoffset:${offset}"/></g>`
  })
  svg += `</svg><div class="blk-donut__center"><span class="blk-donut__total">${esc(compactTotal)}</span><span class="blk-donut__total-label">الإجمالي</span></div></div>`
  svg += `<ul class="blk-donut__legend">`
  segments.forEach((seg, i) => {
    const color = CHART_PALETTE[i % CHART_PALETTE.length]
    svg += `<li><span class="dot" style="background:${color}"></span><span>${esc(seg.label)}</span><span class="pct">${Math.round(seg.frac * 100)}%</span></li>`
  })
  svg += `</ul></div>`
  return svg
}

// ============================================================
// سياق العرض
// ============================================================
interface RenderCtx {
  schema: ProjectSchema
  /** بادئة المسار النسبي ('' للجذر، '../' للمجلدات) */
  rel: string
  /** رابط صفحة عبر pageId */
  hrefOf: (pageId: string) => string
  /** عدّاد لتوليد معرّفات فريدة */
  seq: { n: number }
  /** الشعار المُصدَّر (مسار نسبي من هذه الصفحة) أو null إن لا شعار */
  logo: { src: string; mime: string } | null
}

function nextId(ctx: RenderCtx, prefix: string): string {
  ctx.seq.n += 1
  return `${prefix}${ctx.seq.n}`
}

// ============================================================
// عناوين الأقسام
// ============================================================
function sectionHeading(title: string, subtitle: string): string {
  if (!title && !subtitle) return ''
  return `<div class="blk-heading">${title ? `<h2>${esc(title)}</h2>` : ''}${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>`
}

function sectionWrap(inner: string, tight = false): string {
  return `<section class="blk-section${tight ? ' blk-section--tight' : ''}"><div class="blk-section__inner">${inner}</div></section>`
}

// ============================================================
// الظهور عند التمرير (reveal) — يُطبَّق على أقسام الكتل التسويقية
// ============================================================
const REVEAL_SECTION_TYPES: ReadonlySet<string> = new Set([
  'features',
  'stats',
  'steps',
  'pricing',
  'testimonials',
  'faq',
  'cta',
  'contact-form',
  'gallery',
  'banner',
  'list',
  'team',
  'custom-html',
])

/** إضافة صنف pt-reveal + تأخير تتابع إلى وسم القسم الأول في المقطع */
function applyReveal(html: string, delayMs: number): string {
  const gt = html.indexOf('>')
  if (gt < 0) return html
  const head = html.slice(0, gt)
  const rest = html.slice(gt)
  const classIdx = head.indexOf('class="')
  const withClass =
    classIdx >= 0
      ? `${head.slice(0, classIdx)}class="pt-reveal ${head.slice(classIdx + 7)}`
      : `${head} class="pt-reveal"`
  const styleAttr = delayMs > 0 ? ` style="transition-delay:${delayMs}ms"` : ''
  return `${withClass}${styleAttr}${rest}`
}

// ============================================================
// عرض المكوّنات — 25 نوعاً
// ============================================================
function renderBlock(block: Block, ctx: RenderCtx): string {
  const p = block.props ?? {}
  switch (block.type) {
    case 'hero':
      return renderHero(p, ctx)
    case 'features':
      return renderFeatures(p)
    case 'stats':
      return renderStats(p)
    case 'steps':
      return renderSteps(p)
    case 'pricing':
      return renderPricing(p)
    case 'testimonials':
      return renderTestimonials(p)
    case 'faq':
      return renderFaq(p)
    case 'cta':
      return renderCta(p)
    case 'contact-form':
      return renderContactForm(p)
    case 'gallery':
      return renderGallery(p)
    case 'banner':
      return renderBanner(p)
    case 'list':
      return renderList(p)
    case 'team':
      return renderTeam(p)
    case 'auth-card':
      return renderAuthCard(p, ctx)
    case 'dashboard-header':
      return renderDashboardHeader(p)
    case 'stats-row':
      return renderStatsRow(p)
    case 'chart':
      return renderChart(p, ctx)
    case 'data-table':
      return renderDataTable(p, ctx)
    case 'form-fields':
      return renderFormFields(p)
    case 'settings-form':
      return renderSettingsForm(p)
    case 'profile-card':
      return renderProfileCard(p)
    case 'empty-state':
      return renderState('empty', p)
    case 'loading-state':
      return renderState('loading', p)
    case 'error-state':
      return renderState('error', p)
    case 'calendar':
      return renderCalendar(p)
    case 'custom-html':
      return renderCustomHtml(p)
    default:
      return ''
  }
}

// ---------- hero ----------
const HERO_DASH_BARS: number[] = [38, 62, 45, 78, 56, 88, 70]
const PHONE_BARS: number[] = [40, 65, 50, 80, 60, 90]
const LEAD_SOCIAL_NAMES: string[] = ['أحمد بن علي', 'سارة بوزيد', 'ياسين مراد']

/** الرسم المجرد لواجهة لوحة تحكم (كما في السابق) */
function heroDashboardVisualHtml(): string {
  const barsHtml = HERO_DASH_BARS.map((h, i) => {
    const color = i % 3 === 0 ? 'var(--pt-accent)' : 'var(--pt-primary)'
    const opacity = 0.45 + (i / HERO_DASH_BARS.length) * 0.55
    return `<span class="blk-hero__bar" style="height:${h}%;background:${color};opacity:${opacity.toFixed(2)}"></span>`
  }).join('')

  return `<div class="blk-hero__visual" role="img" aria-label="رسم توضيحي لواجهة المنتج">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="blk-hero__panel">
    <div class="blk-hero__dots" aria-hidden="true">
      <span class="blk-hero__dot" style="background:var(--pt-primary)"></span>
      <span class="blk-hero__dot" style="background:var(--pt-accent);opacity:.6"></span>
      <span class="blk-hero__dot" style="background:var(--pt-border);opacity:.4"></span>
      <span class="blk-hero__line"></span>
    </div>
    <div class="blk-hero__ministats" aria-hidden="true">
      ${[0, 1, 2]
        .map(
          (i) => `<div class="blk-hero__ministat"><span class="blk-hero__minibar"></span><span class="blk-hero__minival" style="width:${70 - i * 12}%;background:${i === 0 ? 'var(--pt-primary)' : 'var(--pt-border)'}"></span></div>`
        )
        .join('')}
    </div>
    <div class="blk-hero__bars" aria-hidden="true">${barsHtml}</div>
    <div class="blk-hero__skel" aria-hidden="true"><span></span><span></span></div>
  </div>
</div>`
}

/** موك هاتف يعرض واجهة تطبيق مصغّرة (visual = phone) */
function heroPhoneVisualHtml(): string {
  const barsHtml = PHONE_BARS.map((h, i) => {
    const color = i % 2 === 0 ? 'var(--pt-primary)' : 'var(--pt-accent)'
    const opacity = 0.5 + (i / PHONE_BARS.length) * 0.5
    return `<span class="pt-phone__chart-bar" style="height:${h}%;background:${color};opacity:${opacity.toFixed(2)}"></span>`
  }).join('')
  return `<div class="blk-hero__visual pt-phone-wrap" role="img" aria-label="موك هاتف يعرض واجهة التطبيق">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-phone" aria-hidden="true">
    <span class="pt-phone__notch"></span>
    <div class="pt-phone__header">
      <span class="pt-phone__avatar"></span>
      <span class="pt-phone__lines"><span class="pt-phone__line" style="width:55%"></span><span class="pt-phone__line" style="width:34%"></span></span>
    </div>
    <div class="pt-phone__stats">
      <span class="pt-phone__stat"><span class="pt-phone__stat-bar" style="width:70%"></span><span class="pt-phone__stat-val" style="width:52%"></span></span>
      <span class="pt-phone__stat"><span class="pt-phone__stat-bar" style="width:56%"></span><span class="pt-phone__stat-val" style="width:64%"></span></span>
    </div>
    <div class="pt-phone__chart">${barsHtml}</div>
    <span class="pt-phone__cta"></span>
  </div>
</div>`
}

/** بطاقة فيديو 16:9 بزر تشغيل ديكوري (visual = video) */
function heroVideoVisualHtml(): string {
  return `<div class="blk-hero__visual pt-video-wrap">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-video">
    <span class="pt-video__veil" aria-hidden="true"></span>
    <button type="button" class="pt-play" aria-label="تشغيل الفيديو"><span class="pt-play__triangle" aria-hidden="true"></span></button>
    <div class="pt-video__caption" aria-hidden="true"><span style="width:62%"></span><span style="width:42%"></span></div>
  </div>
</div>`
}

/** نموذج جمع البريد داخل عمود نص البطل (visual = form) */
function heroLeadFormHtml(p: Record<string, unknown>, dark: boolean, centered: boolean): string {
  const placeholder = S(p, 'emailPlaceholder') || 'بريدك الإلكتروني'
  const buttonText = S(p, 'emailButton') || 'سجّلني'
  const avatars = LEAD_SOCIAL_NAMES.map(
    (name, i) =>
      `<span class="pt-lead-social__av"${i > 0 ? ' style="margin-inline-start:-8px"' : ''}>${avatarHtml(name, 32)}</span>`
  ).join('')
  return `<div class="pt-lead-wrap${centered ? ' pt-lead-wrap--centered' : ''}">
  <form class="pt-lead-form${dark ? ' pt-lead-form--dark' : ''}" dir="ltr" novalidate>
    <input class="pt-lead-form__input" type="email" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" required>
    <button class="pt-btn pt-btn--primary" type="submit">${esc(buttonText)}</button>
  </form>
  <div class="pt-lead-social">
    <span class="pt-lead-social__avatars" aria-hidden="true">${avatars}</span>
    <span>انضم إلى 2,400+ مهتم</span>
  </div>
</div>`
}

function renderHero(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const eyebrow = S(p, 'eyebrow')
  const primaryButton = S(p, 'primaryButton')
  const primaryButtonPage = S(p, 'primaryButtonPage')
  const secondaryButton = S(p, 'secondaryButton')
  const layout = S(p, 'layout', 'split') === 'centered' ? 'centered' : 'split'
  const background = (['default', 'muted', 'dark', 'gradient'] as const).includes(S(p, 'background') as 'default')
    ? S(p, 'background')
    : 'default'
  const align = S(p, 'align', 'start') === 'center' ? 'center' : 'start'
  const dark = background === 'dark' || background === 'gradient'
  const visual = (['dashboard', 'phone', 'video', 'form', 'none'] as const).includes(S(p, 'visual') as 'dashboard')
    ? S(p, 'visual')
    : 'dashboard'
  const titleSize = (['md', 'lg', 'xl'] as const).includes(S(p, 'titleSize') as 'md') ? S(p, 'titleSize') : 'md'

  let primaryHref = '#'
  if (primaryButtonPage.trim()) {
    const page = ctx.schema.pages.find((pg) => pg.id === primaryButtonPage.trim())
    if (page) primaryHref = ctx.hrefOf(page.id)
  } else {
    const auth = ctx.schema.pages.find((pg) => pg.type === 'auth' && pg.authVariant !== 'forgot')
    if (auth) primaryHref = ctx.hrefOf(auth.id)
  }

  const actions =
    primaryButton || secondaryButton
      ? `<div class="blk-hero__actions">${primaryButton ? `<a class="pt-btn pt-btn--primary pt-btn--lg" href="${esc(primaryHref)}">${esc(primaryButton)}</a>` : ''}${secondaryButton ? `<a class="pt-btn pt-btn--${dark ? 'on-dark' : 'outline'} pt-btn--lg" href="#">${esc(secondaryButton)}</a>` : ''}</div>`
      : ''

  // الرسم الجانبي: فقط في التخطيط المقسّم (dashboard/phone/video)
  const hasSideVisual = layout === 'split' && (visual === 'dashboard' || visual === 'phone' || visual === 'video')
  // في التخطيط الموسّط نعرض الهاتف/الفيديو أسفل النص (مطابق لمنطق عارض React)
  const hasStackedVisual = layout === 'centered' && (visual === 'phone' || visual === 'video')
  const centeredCol = !hasSideVisual
  const visualHtml =
    hasSideVisual || hasStackedVisual
      ? visual === 'phone'
        ? heroPhoneVisualHtml()
        : visual === 'video'
          ? heroVideoVisualHtml()
          : heroDashboardVisualHtml()
      : ''

  const textCol = `<div class="blk-hero__text" style="${align === 'center' ? 'text-align:center' : ''}">
  ${eyebrow ? `<span class="pt-eyebrow${dark ? ' pt-eyebrow--dark' : ''}">${esc(eyebrow)}</span>` : ''}
  ${title ? `<h1 class="blk-hero__title${titleSize === 'lg' || titleSize === 'xl' ? ` blk-hero__title--${titleSize}` : ''}">${esc(title)}</h1>` : ''}
  ${subtitle ? `<p class="blk-hero__subtitle">${esc(subtitle)}</p>` : ''}
  ${actions}
  ${visual === 'form' ? heroLeadFormHtml(p, dark, centeredCol) : ''}
</div>`

  let inner: string
  if (hasSideVisual) {
    inner = `<div class="blk-hero__split">${textCol}<div style="flex:1;min-width:0">${visualHtml}</div></div>`
  } else if (hasStackedVisual) {
    inner = `${textCol}<div class="blk-hero__stack">${visualHtml}</div>`
  } else {
    inner = textCol
  }

  return `<section class="blk-hero blk-hero--${esc(background)}"><div class="blk-hero__inner${centeredCol ? ' blk-hero--centered' : ''}">${inner}</div></section>`
}

// ---------- features ----------
function renderFeatures(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const columns = Math.max(1, Math.min(4, Math.round(N(p, 'columns', 3))))
  const items = L(p, 'items')
  const cards = items
    .map((item) => {
      const t = iS(item, 'title')
      const d = iS(item, 'description')
      const letter = t.trim().charAt(0) || '؟'
      return `<article class="blk-feature">
      <div class="blk-feature__icon" aria-hidden="true">${esc(letter)}</div>
      ${t ? `<h3 class="blk-feature__title">${esc(t)}</h3>` : ''}
      ${d ? `<p class="blk-feature__desc">${esc(d)}</p>` : ''}
    </article>`
    })
    .join('')
  return sectionWrap(
    `${sectionHeading(title, subtitle)}<div class="blk-features__grid" style="--cols:${columns}">${cards}</div>`
  )
}

// ---------- stats ----------
function renderStats(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const items = L(p, 'items')
  const cells = items
    .map((item) => {
      const label = iS(item, 'label')
      const value = iS(item, 'value')
      const change = iS(item, 'change')
      return `<div class="blk-stat">
      <span class="blk-stat__value">${esc(value)}</span>
      <span class="blk-stat__label">${esc(label)}</span>
      ${change ? `<span class="blk-stat__change">${badgeHtml(change, isNegChange(change) ? 'danger' : 'success')}</span>` : ''}
    </div>`
    })
    .join('')
  const heading = title ? `<div class="blk-heading" style="padding-block:0 0;margin-bottom:20px"><h2 style="font-size:20px">${esc(title)}</h2></div>` : ''
  return `<section class="blk-stats"><div class="blk-section__inner">${heading}<div class="blk-stats__grid">${cells}</div></div></section>`
}

// ---------- steps ----------
function renderSteps(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const steps = L(p, 'steps')
  const items = steps
    .map((step, i) => {
      const t = iS(step, 'title')
      const d = iS(step, 'description')
      return `<li class="blk-step">
      <span class="blk-step__num">${i + 1}</span>
      ${t ? `<h3 class="blk-step__title">${esc(t)}</h3>` : ''}
      ${d ? `<p class="blk-step__desc">${esc(d)}</p>` : ''}
    </li>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, subtitle)}<ol class="blk-steps__list">${items}</ol>`)
}

// ---------- pricing ----------
function renderPricing(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const currency = S(p, 'currency', 'دج') || 'دج'
  const plans = L(p, 'plans')
  const cards = plans
    .map((plan) => {
      const name = iS(plan, 'name')
      const price = iN(plan, 'price')
      const period = iS(plan, 'period')
      const features = iS(plan, 'features')
      const highlighted = iB(plan, 'highlighted')
      const buttonText = iS(plan, 'buttonText')
      const featureList = features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => `<li class="blk-plan__feature">${esc(f)}</li>`)
        .join('')
      return `<article class="blk-plan${highlighted ? ' blk-plan--highlight' : ''}">
      ${highlighted ? `<span class="blk-plan__flag">${badgeHtml('الأكثر شيوعاً', 'primary')}</span>` : ''}
      ${name ? `<h3 class="blk-plan__name">${esc(name)}</h3>` : ''}
      <p class="blk-plan__price"><span class="blk-plan__amount">${esc(fmtNum(price))}</span><span class="blk-plan__period">${esc(currency)} / ${esc(period)}</span></p>
      <ul class="blk-plan__features">${featureList}</ul>
      ${buttonText ? `<a class="pt-btn ${highlighted ? 'pt-btn--primary' : 'pt-btn--outline'} pt-btn--block" href="#">${esc(buttonText)}</a>` : ''}
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, subtitle)}<div class="blk-pricing__grid">${cards}</div>`)
}

// ---------- testimonials ----------
function renderTestimonials(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const items = L(p, 'items')
  const cards = items
    .map((item) => {
      const name = iS(item, 'name')
      const role = iS(item, 'role')
      const text = iS(item, 'text')
      const rating = Math.max(0, Math.min(5, Math.round(iN(item, 'rating', 5))))
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
      return `<article class="blk-testimonial">
      <div class="blk-testimonial__stars" aria-label="التقييم ${rating} من 5">${stars}</div>
      ${text ? `<p class="blk-testimonial__text">${esc(text)}</p>` : ''}
      <div class="blk-testimonial__person">
        ${avatarHtml(name, 40)}
        <div><p class="blk-testimonial__name">${esc(name)}</p><p class="blk-testimonial__role">${esc(role)}</p></div>
      </div>
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, '')}<div class="blk-testimonials__grid">${cards}</div>`)
}

// ---------- faq ----------
function renderFaq(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const items = L(p, 'items')
  const list = items
    .map((item) => {
      const q = iS(item, 'q')
      const a = iS(item, 'a')
      return `<details class="blk-faq__item"><summary>${esc(q)}</summary><div class="blk-faq__answer">${esc(a)}</div></details>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, subtitle)}<div class="blk-faq__list">${list}</div>`)
}

// ---------- cta ----------
function renderCta(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = (['default', 'gradient', 'dark'] as const).includes(S(p, 'style') as 'default') ? S(p, 'style') : 'default'
  return sectionWrap(
    `<div class="blk-cta__card blk-cta__card--${esc(style)}">
  ${title ? `<h2 class="blk-cta__title">${esc(title)}</h2>` : ''}
  ${subtitle ? `<p class="blk-cta__subtitle">${esc(subtitle)}</p>` : ''}
  ${buttonText ? `<div class="blk-cta__actions"><a class="pt-btn ${style === 'default' ? 'pt-btn--primary' : 'pt-btn--on-dark'} pt-btn--lg" href="#">${esc(buttonText)}</a></div>` : ''}
</div>`,
    true
  )
}

// ---------- contact-form ----------
function renderContactForm(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText', 'إرسال الرسالة')
  const successText = S(p, 'successText', 'تم إرسال رسالتك بنجاح.')
  const formId = `cf-${Math.random().toString(36).slice(2, 8)}`
  return sectionWrap(
    `${sectionHeading(title, subtitle)}
<div class="pt-card blk-contact__card">
  <form class="pt-form blk-form__grid" data-success="${esc(successText)}" novalidate>
    <div><label class="pt-label" for="${formId}-name">الاسم الكامل</label><input class="pt-input" id="${formId}-name" type="text" placeholder="مثال: أحمد بن علي" required></div>
    <div><label class="pt-label" for="${formId}-email">البريد الإلكتروني</label><input class="pt-input" id="${formId}-email" type="email" dir="ltr" placeholder="name@gmail.com" required></div>
    <div><label class="pt-label" for="${formId}-msg">رسالتك</label><textarea class="pt-textarea" id="${formId}-msg" placeholder="اكتب رسالتك هنا..." required></textarea></div>
    <div class="blk-form__actions"><button class="pt-btn pt-btn--primary pt-btn--lg pt-btn--block" type="submit">${esc(buttonText)}</button></div>
  </form>
</div>`,
    true
  )
}

// ---------- gallery ----------
const GALLERY_GRADIENTS: string[] = [
  'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))',
  'linear-gradient(135deg, var(--pt-accent), color-mix(in srgb, var(--pt-primary) 55%, #db2777))',
  'linear-gradient(135deg, color-mix(in srgb, var(--pt-primary) 70%, #16121f), var(--pt-primary))',
  'linear-gradient(135deg, var(--pt-accent), color-mix(in srgb, var(--pt-primary) 45%, #0d9488))',
]

function renderGallery(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const items = L(p, 'items')
  const cards = items
    .map((item, i) => {
      const t = iS(item, 'title')
      const d = iS(item, 'description')
      const price = iN(item, 'price')
      const badge = iS(item, 'badge')
      const tone =
        badge === 'جديد' || badge === 'قريباً'
          ? 'info'
          : badge === 'تخفيض' || badge === 'الأكثر مبيعاً' || badge === 'الأكثر طلباً'
            ? 'warning'
            : 'primary'
      const letter = t.trim().charAt(0) || '؟'
      return `<article class="blk-gallery__item">
      <div class="blk-gallery__thumb" style="background:${GALLERY_GRADIENTS[i % GALLERY_GRADIENTS.length]}" role="img" aria-label="صورة رمزية لـ ${esc(t)}">
        <span class="blk-gallery__letter" aria-hidden="true">${esc(letter)}</span>
        ${badge ? `<span class="blk-gallery__badge">${badgeHtml(badge, tone)}</span>` : ''}
      </div>
      <div class="blk-gallery__body">
        <div class="blk-gallery__row">
          ${t ? `<h3 class="blk-gallery__title">${esc(t)}</h3>` : ''}
          ${price > 0 ? `<p class="blk-gallery__price">${esc(fmtNum(price))} <small>دج</small></p>` : ''}
        </div>
        ${d ? `<p class="blk-gallery__desc">${esc(d)}</p>` : ''}
      </div>
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, subtitle)}<div class="blk-gallery__grid">${cards}</div>`)
}

// ---------- banner ----------
function renderBanner(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = S(p, 'style') === 'dark' ? 'dark' : 'gradient'
  return `<section class="blk-section blk-section--tight"><div class="blk-section__inner">
<div class="blk-banner blk-banner--${esc(style)}"><div class="blk-banner__inner">
  <div>${title ? `<p class="blk-banner__title">${esc(title)}</p>` : ''}${subtitle ? `<p class="blk-banner__subtitle">${esc(subtitle)}</p>` : ''}</div>
  ${buttonText ? `<a class="pt-btn pt-btn--on-dark" href="#">${esc(buttonText)}</a>` : ''}
</div></div>
</div></section>`
}

// ---------- list ----------
function renderList(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const items = L(p, 'items')
  const rows = items
    .map((item) => {
      const t = iS(item, 'title')
      const sub = iS(item, 'subtitle')
      const meta = iS(item, 'meta')
      return `<li class="blk-list__item">
      ${avatarHtml(t || '؟', 36)}
      <div class="blk-list__content">
        ${t ? `<p class="blk-list__title">${esc(t)}</p>` : ''}
        ${sub ? `<p class="blk-list__subtitle">${esc(sub)}</p>` : ''}
      </div>
      ${meta ? `<span class="blk-list__meta">${esc(meta)}</span>` : ''}
    </li>`
    })
    .join('')
  return sectionWrap(`${title ? `<div class="blk-heading"><h2 style="font-size:22px">${esc(title)}</h2></div>` : ''}<ul class="blk-list__items">${rows}</ul>`)
}

// ---------- team ----------
function renderTeam(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const items = L(p, 'items')
  const cards = items
    .map((item) => {
      const name = iS(item, 'name')
      const role = iS(item, 'role')
      return `<article class="blk-team__card">
      ${avatarHtml(name, 56)}
      <p class="blk-team__name">${esc(name)}</p>
      <p class="blk-team__role">${esc(role)}</p>
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, '')}<div class="blk-team__grid">${cards}</div>`)
}

// ---------- custom-html ----------
function renderCustomHtml(p: Record<string, unknown>): string {
  const name = S(p, 'name', 'قسم HTML مخصص')
  const html = S(p, 'html')
  if (!html.trim()) return ''
  const height = Math.max(100, Math.min(4000, Math.round(N(p, 'height', 560)) || 560))
  return sectionWrap(
    `${name ? `<div class="blk-custom-label"><span aria-hidden="true">⌨</span><span>${esc(name)}</span></div>` : ''}
<iframe class="pt-custom-html" srcdoc="${esc(html)}" sandbox="allow-scripts allow-popups allow-forms" title="${esc(name)}" style="height:${height}px" loading="lazy"></iframe>`
  )
}

// ---------- auth-card ----------
function renderAuthCard(p: Record<string, unknown>, ctx: RenderCtx): string {
  const variant = (['login', 'signup', 'forgot'] as const).includes(S(p, 'variant') as 'login')
    ? S(p, 'variant')
    : 'login'
  const title = S(p, 'title', 'تسجيل الدخول')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText', 'دخول')
  const demoHint = S(p, 'demoHint')

  const dash = ctx.schema.pages.find((pg) => pg.type === 'dashboard')
  const redirect = variant === 'login' && dash ? ctx.hrefOf(dash.id) : ''
  const success =
    variant === 'forgot'
      ? 'أرسلنا لك رابط الاستعادة — تحقق من بريدك الوارد.'
      : variant === 'signup'
        ? 'تم إنشاء حسابك التجريبي بنجاح. مرحباً بك!'
        : 'تم تسجيل الدخول بنجاح (وضع تجريبي).'
  const formId = `auth-${Math.random().toString(36).slice(2, 8)}`

  const fields: string[] = []
  if (variant === 'signup') {
    fields.push(`<div><label class="pt-label" for="${formId}-name">الاسم الكامل</label><input class="pt-input" id="${formId}-name" type="text" placeholder="مثال: أحمد بن علي" required></div>`)
  }
  fields.push(`<div><label class="pt-label" for="${formId}-email">البريد الإلكتروني</label><input class="pt-input" id="${formId}-email" type="email" dir="ltr" placeholder="name@gmail.com" required></div>`)
  if (variant !== 'forgot') {
    fields.push(`<div><label class="pt-label" for="${formId}-pass">كلمة المرور</label><input class="pt-input" id="${formId}-pass" type="password" placeholder="••••••••" required></div>`)
  }

  return `<div class="blk-auth">
  <div class="pt-card blk-auth__card">
    <div class="blk-auth__head">
      <div class="blk-auth__icon" aria-hidden="true">🔒</div>
      <div class="blk-auth__title-row"><h1 class="blk-auth__title">${esc(title)}</h1>${badgeHtml('بيانات تجريبية', 'primary')}</div>
      ${subtitle ? `<p class="blk-auth__subtitle">${esc(subtitle)}</p>` : ''}
    </div>
    <form class="pt-form blk-form__grid" ${redirect ? `data-redirect="${esc(redirect)}"` : `data-success="${esc(success)}"`} novalidate>
      ${fields.join('')}
      <button class="pt-btn pt-btn--primary pt-btn--lg pt-btn--block" type="submit">${esc(buttonText)}</button>
    </form>
    ${demoHint ? `<div class="blk-auth__hint"><div class="pt-alert pt-alert--info">${esc(demoHint)}</div></div>` : ''}
  </div>
</div>`
}

// ---------- dashboard-header ----------
function renderDashboardHeader(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const actions = S(p, 'actions')
  const buttons = actions
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a, i) => `<button class="pt-btn ${i === 0 ? 'pt-btn--primary' : 'pt-btn--outline'} pt-btn--sm" type="button">${esc(a)}</button>`)
    .join('')
  return `<div class="blk-dash-header">
  <div>${title ? `<h1 class="blk-dash-header__title">${esc(title)}</h1>` : ''}${subtitle ? `<p class="blk-dash-header__subtitle">${esc(subtitle)}</p>` : ''}</div>
  ${buttons ? `<div class="blk-dash-header__actions">${buttons}</div>` : ''}
</div>`
}

// ---------- stats-row ----------
function renderStatsRow(p: Record<string, unknown>): string {
  const items = L(p, 'items')
  const cards = items
    .map((item) => {
      const label = iS(item, 'label')
      const value = iS(item, 'value')
      const change = iS(item, 'change')
      return `<div class="blk-stat-card">
      <p class="blk-stat-card__label">${esc(label)}</p>
      <p class="blk-stat-card__value">${esc(value)}</p>
      ${change ? badgeHtml(change, isNegChange(change) ? 'danger' : 'success') : ''}
    </div>`
    })
    .join('')
  return `<div class="blk-stats-row">${cards}</div>`
}

// ---------- chart ----------
function renderChart(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const chartType = (['bar', 'line', 'donut'] as const).includes(S(p, 'chartType') as 'bar') ? S(p, 'chartType') : 'bar'
  const dataKey = S(p, 'dataKey')
  const inlineData = Array.isArray(p.data) ? p.data : undefined

  let rows: ChartDatum[] = []
  if (Array.isArray(inlineData)) {
    rows = chartRows(inlineData)
  } else if (dataKey) {
    const chart: ChartData | undefined = ctx.schema.mockData.charts[dataKey]
    rows = chart ? chartRows(chart.data) : []
  }
  if (rows.length === 0) {
    const fallback = ctx.schema.mockData.charts.revenueMonthly
    rows = fallback ? chartRows(fallback.data) : []
  }
  if (rows.length === 0) return ''

  const gid = nextId(ctx, 'g')
  let body = ''
  if (chartType === 'bar') body = barChartSvg(rows, gid)
  else if (chartType === 'line') body = lineChartSvg(rows, gid)
  else body = donutChartSvg(rows)

  return `<div class="pt-card blk-chart">
  ${title ? `<div class="blk-chart__head"><h3>${esc(title)}</h3></div>` : ''}
  <div class="blk-chart__body">${body}</div>
</div>`
}

// ---------- data-table ----------
function renderDataTable(p: Record<string, unknown>, ctx: RenderCtx): string {
  const entityKey = S(p, 'entity', 'customers')
  const title = S(p, 'title')
  const entity = ctx.schema.mockData.entities[entityKey]
  const headerTitle = title || ENTITY_LABELS[entityKey] || 'البيانات'
  const tableId = nextId(ctx, 'tbl')

  if (!entity || entity.rows.length === 0) {
    return renderState('empty', {
      title: 'لا توجد بيانات',
      subtitle: 'ستظهر العناصر هنا بعد إضافتها أو توليدها.',
      actionText: '',
    })
  }

  const columns: EntityColumn[] = entity.columns
  const head = columns.map((col) => `<th scope="col">${esc(col.label)}</th>`).join('')

  const cellHtml = (col: EntityColumn, value: unknown): string => {
    switch (col.type) {
      case 'avatar':
        return `<span class="pt-cell-avatar">${avatarHtml(typeof value === 'string' ? value : '', 32)}<span>${esc(typeof value === 'string' && value ? value : '—')}</span></span>`
      case 'badge':
        return badgeHtml(String(value ?? '—'), statusTone(String(value ?? '')))
      case 'currency':
        return `<span class="pt-currency">${esc(fmtNum(Number(value) || 0))} <small>دج</small></span>`
      case 'number':
        return `<span>${esc(fmtNum(Number(value) || 0))}</span>`
      case 'progress': {
        const v = Math.max(0, Math.min(100, Number(value) || 0))
        return `<span class="pt-progress"><span class="pt-progress__track"><span class="pt-progress__fill" style="width:${v}%"></span></span><span class="pt-progress__pct">${v}%</span></span>`
      }
      case 'email':
      case 'phone':
        return `<span class="pt-ltr">${esc(typeof value === 'string' && value ? value : '—')}</span>`
      case 'date':
        return `<span style="white-space:nowrap;font-size:13px;color:var(--pt-muted)">${esc(typeof value === 'string' && value ? value : '—')}</span>`
      default:
        return `<span>${esc(typeof value === 'string' && value ? value : typeof value === 'number' ? fmtNum(value) : '—')}</span>`
    }
  }

  const rows = entity.rows
    .map((row) => `<tr>${columns.map((col) => `<td>${cellHtml(col, row[col.key])}</td>`).join('')}</tr>`)
    .join('')

  return `<div class="pt-card blk-table">
  <div class="blk-table__head">
    <h3>${esc(headerTitle)}</h3>
    <div class="blk-table__search"><input class="pt-input" type="search" placeholder="بحث..." aria-label="بحث في الجدول" data-table-search="${tableId}"></div>
  </div>
  <div class="pt-table-scroll">
    <table class="pt-table" id="${tableId}">
      <thead><tr>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="blk-table__foot"><p id="${tableId}-count">عرض ${entity.rows.length} من ${entity.rows.length} صف</p><p>بيانات تجريبية</p></div>
</div>`
}

// ---------- form-fields ----------
function optionsOf(item: Record<string, unknown>): string[] {
  const v = item['options']
  if (Array.isArray(v)) return v.filter((o): o is string => typeof o === 'string' && o.trim() !== '')
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

function renderFormFields(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const submitText = S(p, 'submitText', 'إرسال')
  const successText = S(p, 'successText', 'تم إرسال بياناتك بنجاح.')
  const fields = L(p, 'fields')
  const formId = `ff-${Math.random().toString(36).slice(2, 8)}`

  const inputs = fields
    .map((f, i) => {
      const label = iS(f, 'label')
      const type = iS(f, 'type', 'text')
      const required = iB(f, 'required')
      const placeholder = iS(f, 'placeholder')
      const id = `${formId}-${i}`
      if (type === 'checkbox') {
        return `<label class="blk-form__check" for="${id}"><input class="pt-checkbox" id="${id}" type="checkbox"><span>${esc(label)}${required ? '<span class="pt-required">*</span>' : ''}</span></label>`
      }
      if (type === 'select') {
        const options = optionsOf(f)
          .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
          .join('')
        return `<div><label class="pt-label" for="${id}">${esc(label)}${required ? '<span class="pt-required">*</span>' : ''}</label><select class="pt-select" id="${id}" ${required ? 'required' : ''}><option value="" disabled selected>${esc(placeholder || 'اختر...')}</option>${options}</select></div>`
      }
      if (type === 'textarea') {
        return `<div><label class="pt-label" for="${id}">${esc(label)}${required ? '<span class="pt-required">*</span>' : ''}</label><textarea class="pt-textarea" id="${id}" rows="4" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}></textarea></div>`
      }
      const inputType = ['text', 'email', 'password', 'number'].includes(type) ? type : 'text'
      return `<div><label class="pt-label" for="${id}">${esc(label)}${required ? '<span class="pt-required">*</span>' : ''}</label><input class="pt-input" id="${id}" type="${esc(inputType)}" ${type === 'email' ? 'dir="ltr"' : ''} placeholder="${esc(placeholder)}" ${required ? 'required' : ''}></div>`
    })
    .join('')

  return `<div>
  ${title || subtitle ? `<div style="margin-bottom:20px">${title ? `<h2 style="font-size:22px;font-weight:800">${esc(title)}</h2>` : ''}${subtitle ? `<p style="margin-top:4px;font-size:14px;color:var(--pt-muted)">${esc(subtitle)}</p>` : ''}</div>` : ''}
  <div class="pt-card" style="padding:28px">
    <form class="pt-form blk-form__grid" data-success="${esc(successText)}" novalidate>
      ${inputs}
      <div class="blk-form__actions"><button class="pt-btn pt-btn--primary pt-btn--lg" type="submit">${esc(submitText)}</button></div>
    </form>
  </div>
</div>`
}

// ---------- settings-form ----------
function renderSettingsForm(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const sections = L(p, 'sections')
  const sectionsHtml = sections
    .map((section) => {
      const secTitle = iS(section, 'title')
      const fields = L(section, 'fields')
      const fieldsHtml = fields
        .map((f) => {
          const label = iS(f, 'label')
          const type = iS(f, 'type', 'text')
          const value = iS(f, 'value')
          const hint = iS(f, 'hint')
          let control = ''
          if (type === 'switch') {
            const on = value === 'true' || value === '1'
            control = `<button type="button" class="pt-switch${on ? ' on' : ''}" role="switch" aria-checked="${on ? 'true' : 'false'}" data-switch><span class="pt-switch__knob"></span></button>`
          } else if (type === 'select') {
            const options = optionsOf(f)
              .map((o) => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`)
              .join('')
            control = `<select class="pt-select">${options}</select>`
          } else if (type === 'password') {
            control = `<input class="pt-input" type="password" placeholder="••••••••" value="">`
          } else {
            control = `<input class="pt-input" type="text" value="${esc(value)}">`
          }
          return `<div class="blk-settings__field">
          <div><span class="blk-settings__field-label">${esc(label)}</span>${hint ? `<span class="blk-settings__hint">${esc(hint)}</span>` : ''}</div>
          <div class="blk-settings__field-control">${control}</div>
        </div>`
        })
        .join('')
      return `<div class="blk-settings__section">${secTitle ? `<h3>${esc(secTitle)}</h3>` : ''}${fieldsHtml}</div>`
    })
    .join('')

  return `<div class="pt-card blk-settings__card">
  ${title ? `<div class="blk-settings__title"><h2>${esc(title)}</h2></div>` : ''}
  <form class="pt-form" data-success="تم حفظ الإعدادات بنجاح." novalidate>
    ${sectionsHtml}
    <div class="blk-settings__actions"><button class="pt-btn pt-btn--primary" type="submit">حفظ التغييرات</button></div>
  </form>
</div>`
}

// ---------- profile-card ----------
function renderProfileCard(p: Record<string, unknown>): string {
  const name = S(p, 'name')
  const role = S(p, 'role')
  const email = S(p, 'email')
  const phone = S(p, 'phone')
  const bio = S(p, 'bio')
  return `<div class="pt-card blk-profile__card">
  ${avatarHtml(name, 72)}
  <h2 class="blk-profile__name">${esc(name)}</h2>
  ${role ? `<p class="blk-profile__role">${esc(role)}</p>` : ''}
  ${bio ? `<p class="blk-profile__bio">${esc(bio)}</p>` : ''}
  <div class="blk-profile__contacts">
    ${email ? `<span dir="ltr">✉ ${esc(email)}</span>` : ''}
    ${phone ? `<span dir="ltr">☎ ${esc(phone)}</span>` : ''}
  </div>
</div>`
}

// ---------- states ----------
function renderState(kind: 'empty' | 'loading' | 'error', p: Record<string, unknown>): string {
  const title = S(p, 'title', kind === 'error' ? 'حدث خطأ ما' : 'لا توجد بيانات بعد')
  const subtitle = S(p, 'subtitle', kind === 'loading' ? '' : 'ستظهر العناصر هنا بمجرد إضافتها.')
  const actionText = S(p, 'actionText')
  const icon = kind === 'error' ? '⚠' : kind === 'loading' ? '' : '📦'
  return `<div class="pt-card blk-state">
  ${kind === 'loading' ? '<div class="blk-loading__spinner" aria-hidden="true"></div>' : `<div class="blk-state__icon" aria-hidden="true">${icon}</div>`}
  <h3 class="blk-state__title">${esc(title)}</h3>
  ${subtitle ? `<p class="blk-state__subtitle">${esc(subtitle)}</p>` : ''}
  ${actionText ? `<div class="blk-state__actions"><button class="pt-btn pt-btn--primary" type="button">${esc(actionText)}</button></div>` : ''}
</div>`
}

// ---------- calendar ----------
const WEEKDAYS_AR: string[] = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function renderCalendar(p: Record<string, unknown>): string {
  const title = S(p, 'title')
  const month = S(p, 'month', 'ديسمبر 2024')
  const events = L(p, 'events')
  const eventByDay = new Map<number, string>()
  for (const e of events) {
    const day = iN(e, 'day')
    if (day >= 1 && day <= 30) eventByDay.set(day, iS(e, 'label'))
  }

  const weekdayHeaders = WEEKDAYS_AR.map((d) => `<div class="blk-calendar__weekday">${esc(d)}</div>`).join('')
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
    .map((day) => {
      const ev = eventByDay.get(day)
      const cls = `blk-calendar__day${ev ? ' blk-calendar__day--event' : ''}${day === 15 ? ' blk-calendar__day--today' : ''}`
      return `<div class="${cls}" ${ev ? `title="${esc(ev)}"` : ''}>${day}${ev ? '<span class="blk-calendar__dot" aria-hidden="true"></span>' : ''}</div>`
    })
    .join('')

  const eventsList = events
    .map((e) => {
      const day = iN(e, 'day')
      const label = iS(e, 'label')
      return `<li class="blk-calendar__event"><span class="blk-calendar__event-day">${day}</span><span>${esc(label)}</span></li>`
    })
    .join('')

  return `<div class="pt-card blk-calendar">
  <div class="blk-calendar__head">
    <div>${title ? `<h2 class="blk-calendar__title">${esc(title)}</h2>` : ''}<p class="blk-calendar__month">${esc(month)}</p></div>
  </div>
  <div class="blk-calendar__body">
    <div class="blk-calendar__weekdays">${weekdayHeaders}</div>
    <div class="blk-calendar__days">${days}</div>
    ${eventsList ? `<ul class="blk-calendar__events">${eventsList}</ul>` : ''}
  </div>
</div>`
}

// ============================================================
// قشور الصفحات
// ============================================================
function siteShell(page: ProjectPage, ctx: RenderCtx): string {
  const nav = ctx.schema.navigation
  const homeHref = ctx.hrefOf(
    (ctx.schema.pages.find((pg) => pg.type === 'landing') ?? ctx.schema.pages[0])?.id ?? page.id
  )
  const links = nav.items
    .map((item) => {
      const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
      if (!target) return ''
      const active = target.id === page.id
      return `<a class="pt-nav__link${active ? ' active' : ''}" href="${esc(ctx.hrefOf(target.id))}" ${active ? 'aria-current="page"' : ''}>${esc(item.label)}</a>`
    })
    .join('')
  const cta = nav.cta
    ? ctx.schema.pages.find((pg) => pg.id === nav.cta?.pageId)
      ? `<a class="pt-btn pt-btn--primary pt-btn--sm pt-nav__cta" href="${esc(ctx.hrefOf(nav.cta.pageId))}">${esc(nav.cta.label)}</a>`
      : ''
    : ''

  const footerLinks = nav.items
    .map((item) => {
      const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
      return target ? `<a class="pt-footer__link" href="${esc(ctx.hrefOf(target.id))}">${esc(item.label)}</a>` : ''
    })
    .join('')

  const brandMark = ctx.logo
    ? `<img class="pt-logo" src="${esc(ctx.logo.src)}" alt="${esc(nav.brand)}" loading="lazy">`
    : `<span class="pt-nav__logo" aria-hidden="true"></span>`

  // أقسام الكتل التسويقية تظهر تدريجياً عند التمرير (البطل يظهر فوراً)
  let revealIdx = 0
  const blocks = page.blocks
    .map((b) => {
      const html = renderBlock(b, ctx)
      if (!html) return ''
      if (b.type === 'hero' || !REVEAL_SECTION_TYPES.has(b.type)) return html
      const delay = Math.min(revealIdx, 2) * 60
      revealIdx += 1
      return applyReveal(html, delay)
    })
    .join('\n')

  return `<header class="pt-nav">
  <div class="container pt-nav__inner">
    <a class="pt-nav__brand" href="${esc(homeHref)}" aria-label="الذهاب إلى ${esc(nav.brand)}">${brandMark}<span>${esc(nav.brand)}</span></a>
    <nav class="pt-nav__links" id="site-nav" aria-label="التنقل الرئيسي">${links}${cta}</nav>
    <button class="pt-nav__burger" type="button" data-nav-toggle aria-label="فتح القائمة" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>
  </div>
</header>
<main id="pt-main">${blocks}</main>
<footer class="pt-footer">
  <div class="container pt-footer__inner">
    <div class="pt-footer__row">
      <div class="pt-footer__brand"><span class="pt-nav__logo" style="width:24px;height:24px;border-radius:calc(var(--pt-radius) - 4px)" aria-hidden="true"></span><span>${esc(nav.brand)}</span>${badgeHtml('بيانات تجريبية', 'primary')}</div>
      <nav class="pt-footer__links" aria-label="تنقل التذييل">${footerLinks}</nav>
    </div>
    ${ctx.logo ? `<div class="pt-footer__logo"><img class="pt-logo" src="${esc(ctx.logo.src)}" alt="${esc(nav.brand)}" loading="lazy"></div>` : ''}
    ${nav.footerNote ? `<p class="pt-footer__note">${esc(nav.footerNote)}</p>` : ''}
  </div>
</footer>
<button type="button" class="pt-top" aria-label="العودة إلى الأعلى"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg></button>`
}

function authShell(page: ProjectPage, ctx: RenderCtx): string {
  const home = ctx.schema.pages.find((pg) => pg.type === 'landing') ?? ctx.schema.pages[0]
  const blocks = page.blocks.map((b) => renderBlock(b, ctx)).join('\n')
  const brandMark = ctx.logo
    ? `<img class="pt-logo" src="${esc(ctx.logo.src)}" alt="${esc(ctx.schema.navigation.brand)}" loading="lazy">`
    : `<span class="blk-auth__logo" aria-hidden="true"></span>`
  return `<div class="blk-auth">
  <a class="blk-auth__brand" href="${esc(home ? ctx.hrefOf(home.id) : '#')}" aria-label="الذهاب إلى ${esc(ctx.schema.navigation.brand)}">${brandMark}<span>${esc(ctx.schema.navigation.brand)}</span></a>
  <main id="pt-main" style="width:100%">${blocks}</main>
</div>`
}

function dashboardShell(page: ProjectPage, ctx: RenderCtx): string {
  const items = ctx.schema.dashboardNav.items
  const navHtml = items
    .map((item) => {
      const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
      if (!target) return ''
      const active = target.id === page.id
      return `<a class="pt-sidebar__item${active ? ' active' : ''}" href="${esc(ctx.hrefOf(target.id))}" ${active ? 'aria-current="page"' : ''}><span class="pt-sidebar__dot" aria-hidden="true"></span><span>${esc(item.label)}</span></a>`
    })
    .join('')

  const pills = items
    .map((item) => {
      const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
      if (!target) return ''
      const active = target.id === page.id
      return `<a class="pt-sidebar-top__pill${active ? ' active' : ''}" href="${esc(ctx.hrefOf(target.id))}"><span class="pt-sidebar__dot" aria-hidden="true"></span><span>${esc(item.label)}</span></a>`
    })
    .join('')

  const blocks = page.blocks.map((b) => renderBlock(b, ctx)).join('\n')

  const brand = ctx.schema.navigation.brand
  const logoImg = ctx.logo
    ? `<img class="pt-logo" src="${esc(ctx.logo.src)}" alt="${esc(brand)}" loading="lazy">`
    : ''
  const sidebarMark = logoImg || `<span class="pt-nav__logo" aria-hidden="true"></span>`
  const topMark =
    logoImg ||
    `<span class="pt-nav__logo" style="width:28px;height:28px;border-radius:calc(var(--pt-radius) - 4px)" aria-hidden="true"></span>`

  return `<div class="pt-sidebar-layout">
  <aside class="pt-sidebar">
    <div class="pt-sidebar__brand">${sidebarMark}<span>${esc(brand)}</span></div>
    <nav class="pt-sidebar__nav" aria-label="تنقل لوحة التحكم">${navHtml}</nav>
    <div class="pt-sidebar__user">
      ${avatarHtml('م', 34)}
      <div class="pt-sidebar__user-info"><p class="pt-sidebar__user-name">مستخدم تجريبي</p>${badgeHtml('بيانات تجريبية', 'primary')}</div>
    </div>
  </aside>
  <div>
    <div class="pt-sidebar-top">
      <div class="pt-sidebar-top__head">${topMark}<span>${esc(brand)}</span></div>
      <nav class="pt-sidebar-top__pills" aria-label="تنقل لوحة التحكم">${pills}</nav>
    </div>
    <main id="pt-main" class="pt-sidebar-content"><div class="pt-sidebar-content__inner">${blocks}</div></main>
  </div>
</div>`
}

// ============================================================
// مستند HTML كامل
// ============================================================
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap'

/** أيقونة افتراضية: حرف العلامة داخل مربع بحافة دائرية بلون السمة الأساسي */
function letterFavicon(schema: ProjectSchema): string {
  const brand = (schema.navigation.brand || schema.metadata.name || 'ن').trim()
  const letter = Array.from(brand)[0] ?? 'ن'
  const primary = schema.theme.mode === 'dark' ? hexLighten(schema.theme.primary, 0.18) : schema.theme.primary
  const fg = schema.theme.primaryForeground || '#ffffff'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${esc(primary)}"/><text x="16" y="22.5" font-size="16" font-weight="700" text-anchor="middle" fill="${esc(fg)}" font-family="system-ui,sans-serif">${esc(letter)}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** وسم الأيقونة: ملف الشعار إن وُجد، وإلا حرف العلامة */
function faviconLink(schema: ProjectSchema, logo: { src: string; mime: string } | null): string {
  if (logo) {
    return `<link rel="icon" type="${esc(logo.mime)}" href="${esc(logo.src)}">`
  }
  return `<link rel="icon" href="${esc(letterFavicon(schema))}">`
}

function htmlDocument(
  schema: ProjectSchema,
  page: ProjectPage,
  body: string,
  ctx: RenderCtx
): string {
  const brand = schema.navigation.brand || schema.metadata.name
  const isLanding = page.type === 'landing'
  const title = isLanding
    ? `${brand} — ${schema.metadata.description.slice(0, 70)}`
    : `${page.name} | ${brand}`
  const description = truncateText(page.subtitle || schema.metadata.description, 160)
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_AR">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS_HREF}" rel="stylesheet">
<link rel="stylesheet" href="${esc(ctx.rel)}styles.css">
${faviconLink(schema, ctx.logo)}
<noscript><style>.pt-reveal{opacity:1;transform:none}</style></noscript>
</head>
<body>
<a class="pt-skip" href="#pt-main">تخطَّ إلى المحتوى</a>
${body}
<div class="pt-demo-badge" aria-hidden="true">بيانات تجريبية</div>
<script src="${esc(ctx.rel)}script.js"></script>
</body>
</html>`
}

function shellFor(page: ProjectPage, ctx: RenderCtx): string {
  if (page.type === 'auth') return authShell(page, ctx)
  if (['dashboard', 'table', 'form', 'settings', 'profile'].includes(page.type)) {
    return dashboardShell(page, ctx)
  }
  return siteShell(page, ctx)
}

function pageHtml(
  schema: ProjectSchema,
  page: ProjectPage,
  rel: string,
  hrefOf: (pageId: string) => string,
  logo: { src: string; mime: string } | null
): string {
  const ctx: RenderCtx = { schema, rel, hrefOf, seq: { n: 0 }, logo }
  return htmlDocument(schema, page, shellFor(page, ctx), ctx)
}

// ============================================================
// 404
// ============================================================
function notFoundHtml(
  schema: ProjectSchema,
  rel: string,
  homeHref: string,
  logo: { src: string; mime: string } | null
): string {
  const brand = schema.navigation.brand || 'نموذج'
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>الصفحة غير موجودة | ${esc(brand)}</title>
<meta name="description" content="عذراً، هذه الصفحة غير موجودة.">
<meta property="og:title" content="الصفحة غير موجودة | ${esc(brand)}">
<meta property="og:description" content="عذراً، هذه الصفحة غير موجودة.">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_AR">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="${esc(rel)}styles.css">
${faviconLink(schema, logo)}
</head>
<body>
<a class="pt-skip" href="#pt-main">تخطَّ إلى المحتوى</a>
<main id="pt-main" class="pt-404">
  <p class="pt-404__code">404</p>
  <h1>الصفحة غير موجودة</h1>
  <p class="pt-404__text">عذراً، لم نجد الصفحة التي تبحث عنها.</p>
  <a class="pt-btn pt-btn--primary pt-btn--lg" href="${esc(homeHref)}">العودة إلى الرئيسية</a>
</main>
<div class="pt-demo-badge" aria-hidden="true">بيانات تجريبية</div>
</body>
</html>
`
}

// ============================================================
// نقطة الدخول — generateStaticSite
// ============================================================
export function generateStaticSite(schema: ProjectSchema): {
  /** نص الملفات كنص، والشعار كـ Uint8Array ثنائي */
  files: Record<string, string | Uint8Array>
  landingSlug: string
} {
  const pages = Array.isArray(schema.pages) ? schema.pages : []
  const landing = pages.find((p) => p.type === 'landing') ?? pages[0]

  // ---------- slugs فريدة ----------
  const slugOf = new Map<string, string>()
  const used = new Set<string>()
  for (const page of pages) {
    let slug = (page.slug || slugify(page.name) || 'page').trim() || 'page'
    if (slug === 'index' || slug === '404') slug = `${slug}-page`
    let candidate = slug
    let i = 2
    while (used.has(candidate)) {
      candidate = `${slug}-${i}`
      i += 1
    }
    used.add(candidate)
    slugOf.set(page.id, candidate)
  }

  const landingSlug = landing ? slugOf.get(landing.id) ?? 'home' : 'home'

  // ---------- الروابط النسبية ----------
  const hrefFromRoot = (pageId: string): string => {
    const slug = slugOf.get(pageId)
    if (!slug) return '#'
    if (landing && pageId === landing.id) return './'
    return `${slug}/`
  }
  const hrefFromFolder = (pageId: string): string => {
    const slug = slugOf.get(pageId)
    if (!slug) return '#'
    if (landing && pageId === landing.id) return '../'
    return `../${slug}/`
  }

  // ---------- الشعار: data URL → ملف ثنائي في الحزمة ----------
  const logoAsset = schema.branding?.logo ? dataUrlToAsset(schema.branding.logo) : null
  const rootLogo = logoAsset ? { src: `assets/logo.${logoAsset.ext}`, mime: logoAsset.mime } : null
  const folderLogo = logoAsset ? { src: `../assets/logo.${logoAsset.ext}`, mime: logoAsset.mime } : null

  const files: Record<string, string | Uint8Array> = {}

  // ---------- الملفات المشتركة ----------
  if (logoAsset) files[`assets/logo.${logoAsset.ext}`] = logoAsset.buffer
  files['styles.css'] = buildStylesCss(schema.theme)
  files['script.js'] = buildScriptJs()
  files['netlify.toml'] = buildNetlifyToml()
  files['README.md'] = buildReadmeMd(schema)

  // ---------- الصفحات ----------
  for (const page of pages) {
    const slug = slugOf.get(page.id) ?? 'page'
    files[`${slug}/index.html`] = pageHtml(schema, page, '../', hrefFromFolder, folderLogo)
  }

  // ---------- الجذر: الصفحة الرئيسية + 404 ----------
  files['index.html'] = landing
    ? pageHtml(schema, landing, '', hrefFromRoot, rootLogo)
    : notFoundHtml(schema, '', './', rootLogo)
  files['404.html'] = notFoundHtml(schema, '', './', rootLogo)

  return { files, landingSlug }
}
