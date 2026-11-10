// ============================================================
// SIVAR — Static Site Generator (خادم فقط)
// Task 3-b — يحوّل ProjectSchema إلى موقع ثابت كامل (HTML/CSS/JS)
// جاهز للنشر على Netlify: styles.css + script.js + كل صفحة.
// كل نصوص المستخدم تُهرَّب (htmlEscape) — لا حقن HTML إطلاقاً.
// Task 7-f — ترقيات الجودة: بطل موسّع (eyebrow/visual/titleSize/نموذج بريد)،
// custom-html، الشعار (assets/logo + favicon)، SEO/OG، ظهور الأقسام عند
// التمرير، زر العودة للأعلى، وتحسينات الوصول (skip link/focus-visible).
// Task 8-b — أزرار عاملة (عقد nav-targets المشترك)، زر عودة للخلف في كل
// صفحة غير رئيسية، تروستة لوحة تحكم (بحث/إشعارات/قائمة مستخدم)، ترقيم
// الجداول، خلفية صور البطل (assets/hero-bg)، خلفيتا gradient-soft/mesh،
// كتل جديدة (activity-feed/tasks-list/quick-actions) وتحسينات جمالية.
// Task 9-b — رسوم جانبية واقعية للبطل (dashboard/phone/analytics/orders/
// chat/calendar/testimonial) بـ .pt-mock، صور لكل قسم (bgImage/bgOverlay →
// assets/img-{n})، خلفية مشروع ثابتة (branding.bgImage → assets/bg)، رسوم
// بيانية متحركة بتلميحات hover (pt-tip/pt-draw/pt-grow)، ومعرض/فريق بصور.
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
import { DEMO_CLIENT, ENTITY_LABELS, ENTITY_SINGULARS } from '@/lib/content/mock-data'
import {
  bannerButtonTarget,
  ctaButtonTarget,
  dashboardActionTarget,
  findAdminDashboardPage,
  findClientPage,
  findDashboardPage,
  findHomePage,
  heroPrimaryTarget,
  heroSecondaryTarget,
  pricingButtonTarget,
  stateActionTarget,
} from '@/lib/project/nav-targets'

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

/** (الجولة 16) أنواع صفحات منطقة اللوحة — تحمل جمهور admin/client وتخضع لحراسة الجلسة */
const DASHBOARD_PAGE_TYPES: ReadonlySet<string> = new Set(['dashboard', 'table', 'form', 'settings', 'profile'])

/** (الجولة 16) أفاتار بخطّ تعويض الهوية: script.js يستبدله بأفاتار اسم الجلسة (data-user-avatar) */
function sessionAvatarHtml(name: string, size: number): string {
  return avatarHtml(name, size).replace('<span class="pt-avatar"', '<span class="pt-avatar" data-user-avatar="1"')
}

// ============================================================
// أيقونات SVG مضمّنة (بدون أي مكتبات) — مسارات بنمط lucide
// stroke يتبع currentColor — تُستخدم في التروستة/الزر الخلفي/الكتل الجديدة
// ============================================================
const ICON_SVG: Record<string, string> = {
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  'credit-card': '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  award: '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  wifi: '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
  battery: '<rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/>',
  signal: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  'more-horizontal': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  // (الجولة 13) أيقونات الشريط الجانبي للوحة التحكم — مطابقة لخريطة أيقونات عارض React
  'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  'shopping-cart': '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'calendar-days': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
  'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  // (الجولة 15) أيقونتا إجراءات صفوف الجداول — تعديل وحذف (نمط lucide)
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
}

/** أيقونة مضمّنة بالاسم (Sparkles بديلاً عند الاسم غير المعروف) */
function iconSvg(name: string, size = 20): string {
  const inner = ICON_SVG[name] ?? ICON_SVG.sparkles
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
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

// ============================================================
// ألوان كل قسم (Task 12) — أدوات مشتركة
// ============================================================

/** السطوع النسبي للون (0..1 — WCAG) لاختيار نبرة النص التلقائية */
function relativeLuminance(hex: string): number {
  const c = parseHex(hex)
  if (!c) return 0
  const lin = c.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/** لون قسم صالح (#rgb أو #rrggbb — بحروف صغيرة) أو '' عند الفراغ/الفساد */
function sectionHex(v: unknown): string {
  if (typeof v !== 'string') return ''
  const t = v.trim().toLowerCase()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(t) ? t : ''
}

/** تدرّج لطيف مبني على لون القسم (بدل التدرّج/الداكن الافتراضي) */
function sectionBgGradient(hex: string): string {
  return `linear-gradient(180deg,${hex},${hexDarken(hex, 0.14)})`
}

/**
 * نمط غلاف متغيرات ألوان القسم (bgColor/textColor) — نفس منطق
 * sectionVars في عارض React حرفياً: متغيرات CSS تتوارثها العناصر
 * الداخلية + خلفية + نص تلقائي ذكي (داكن على الفاتح/أبيض على الداكن).
 * تُرجع '' عندما لا ألوان مخصّصة (سلوك قديم مطابق بالبايت).
 */
function sectionVarsStyle(p: Record<string, unknown>): string {
  const bg = sectionHex(p.bgColor)
  const tx = sectionHex(p.textColor)
  if (!bg && !tx) return ''
  const decls: string[] = []
  if (bg) {
    const bright = relativeLuminance(bg) > 0.55
    decls.push(`--pt-bg:${bg}`)
    decls.push(`--pt-surface:${bright ? hexLighten(bg, 0.42) : hexDarken(bg, 0.42)}`)
    decls.push(`--pt-border:${bright ? hexLighten(bg, 0.18) : hexDarken(bg, 0.18)}`)
  }
  let text = tx
  if (bg && !tx) text = relativeLuminance(bg) > 0.5 ? '#17151f' : '#ffffff'
  if (text) {
    decls.push(`--pt-text:${text}`)
    decls.push(`--pt-muted:${mixHex(text, bg || '#ffffff', 0.38)}`)
  }
  decls.push('color:var(--pt-text)')
  if (bg) decls.push(`background:${bg}`)
  return decls.join(';')
}

/** يغلّف HTML الكتلة بغلاف متغيرات ألوان القسم عند وجود bgColor/textColor */
function wrapSectionVars(html: string, p: Record<string, unknown>): string {
  if (!html) return html
  const style = sectionVarsStyle(p)
  if (!style) return html
  return `<div class="pt-secvars" style="${style}">${html}</div>`
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

/* ===== خلفية المشروع الثابتة (branding.bgImage → assets/bg) ===== */
.pt-pagebg{position:fixed;inset:0;z-index:-1;background-size:cover;background-position:center}
body.pt-hasbg{background:transparent}
body.pt-hasbg .pt-sidebar-layout{background:transparent}
body.pt-hasbg--strong::after{content:'';position:fixed;inset:0;z-index:-1;background:var(--pt-bg);opacity:.9}
body.pt-hasbg--medium::after{content:'';position:fixed;inset:0;z-index:-1;background:var(--pt-bg);opacity:.74}
body.pt-hasbg--soft::after{content:'';position:fixed;inset:0;z-index:-1;background:var(--pt-bg);opacity:.55}

/* ===== الأزرار ===== */
.pt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-weight:600;border-radius:var(--pt-radius);min-height:40px;padding:0 20px;font-size:14px;transition:filter .15s ease,background .15s ease,transform .1s ease}
.pt-btn:hover{filter:brightness(1.08)}
.pt-btn:active{transform:translateY(1px)}
.pt-btn--primary{background:var(--pt-primary);color:var(--pt-primary-fg);box-shadow:0 4px 14px color-mix(in srgb,var(--pt-primary) 35%,transparent)}
.pt-btn--primary:hover{transform:translateY(-1px)}
.pt-btn:disabled{opacity:.5;cursor:not-allowed}
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
.pt-sidebar__item svg,.pt-sidebar-top__pill svg{flex-shrink:0}
.pt-sidebar__bottom{border-top:1px solid var(--pt-border);padding:12px;display:flex;flex-direction:column;gap:8px}
.pt-sidebar__user{display:flex;align-items:center;gap:10px}
.pt-sidebar__item--muted{color:var(--pt-muted);font-size:13px}
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
.blk-section{padding-block:56px;scroll-margin-top:76px}
.blk-section--tight{padding-block:32px}
.blk-section__inner{max-width:1120px;margin-inline:auto;padding-inline:16px}
.blk-heading{margin-bottom:40px;max-width:640px;margin-inline:auto;text-align:center}
.blk-heading h2{font-size:clamp(24px,4vw,36px);font-weight:700;line-height:1.25}
.blk-heading p{margin-top:12px;font-size:15px;color:var(--pt-muted)}

/* ===== أقسام بخلفية صورة (bgImage/bgOverlay) — دلالات مطابقة للبطل ===== */
.blk-section--onimage{background-size:cover;background-position:center}
.blk-section--onimage .blk-heading h2{color:#fff}
.blk-section--onimage .blk-heading p{color:rgba(255,255,255,.82)}
.blk-section--onimage .blk-stat__label{color:rgba(255,255,255,.8)}
.blk-section--onimage .blk-cta__title{color:#fff}
.blk-section--onimage .blk-cta__subtitle{color:rgba(255,255,255,.88)}
.blk-section--onimage .blk-cta__card{background:rgba(13,10,25,.42);border:1px solid rgba(255,255,255,.24);backdrop-filter:blur(10px)}
.blk-section--onimage .blk-banner{background:rgba(13,10,25,.42);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(10px)}
.blk-section--onimage-none .blk-heading h2,.blk-section--onimage-none .blk-cta__title{text-shadow:0 2px 12px rgba(0,0,0,.45)}
.blk-section--onimage-light .blk-heading h2{color:var(--pt-text)}
.blk-section--onimage-light .blk-heading p{color:var(--pt-muted)}
.blk-section--onimage-light .blk-stat__label{color:var(--pt-muted)}
.blk-section--onimage-light .blk-cta__title{color:var(--pt-text)}
.blk-section--onimage-light .blk-cta__subtitle{color:var(--pt-muted)}
.blk-section--onimage-light .blk-cta__card--default{background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.75)}

/* ===== hero ===== */
.blk-hero{padding-block:64px}
.blk-hero--muted{background:var(--pt-secondary)}
.blk-hero--dark{background:#16121f}
.blk-hero--dark .blk-hero__title{color:#fff}
.blk-hero--dark .blk-hero__subtitle{color:rgba(255,255,255,.8)}
.blk-hero--gradient{background:linear-gradient(135deg,var(--pt-primary),#db2777)}
.blk-hero--gradient .blk-hero__title{color:#fff}
.blk-hero--gradient .blk-hero__subtitle{color:rgba(255,255,255,.85)}
.blk-hero--gradient-soft{background:linear-gradient(180deg,color-mix(in srgb,var(--pt-primary) 10%,var(--pt-bg)) 0%,var(--pt-bg) 100%)}
.blk-hero--mesh{background:radial-gradient(42rem 24rem at 85% -10%,color-mix(in srgb,var(--pt-primary) 14%,transparent),transparent 60%),radial-gradient(38rem 22rem at 8% 0%,color-mix(in srgb,var(--pt-accent) 16%,transparent),transparent 55%),var(--pt-bg)}
.blk-hero--image{background-size:cover;background-position:center}
.blk-hero--image-dark .blk-hero__title{color:#fff}
.blk-hero--image-dark .blk-hero__subtitle{color:rgba(255,255,255,.85)}
.blk-hero--image-none .blk-hero__title{text-shadow:0 2px 12px rgba(0,0,0,.45)}
.blk-hero__inner{max-width:1120px;margin-inline:auto;padding-inline:16px}
.blk-hero__split{display:flex;flex-direction:column-reverse;align-items:center;gap:40px}
.blk-hero__text{max-width:640px}
.blk-hero--centered .blk-hero__text{margin-inline:auto;text-align:center;max-width:640px}
.blk-hero__title{font-size:clamp(30px,6vw,48px);font-weight:800;line-height:1.2}
.blk-hero__subtitle{margin-top:16px;font-size:clamp(15px,2vw,18px);color:var(--pt-muted)}
.blk-hero__actions{margin-top:28px;display:flex;flex-wrap:wrap;gap:12px}
.blk-hero--centered .blk-hero__actions{justify-content:center}
/* الرسوم الجانبية (visual) — Task 9-b */
.blk-hero__visual{position:relative;width:100%;max-width:520px}
.blk-hero__viscol{flex:1;min-width:0;display:flex;justify-content:center}
.blk-hero__glow1{position:absolute;top:-32px;inset-inline-end:-24px;width:176px;height:176px;border-radius:999px;background:var(--pt-accent);opacity:.3;filter:blur(40px)}
.blk-hero__glow2{position:absolute;bottom:-40px;inset-inline-start:-32px;width:208px;height:208px;border-radius:999px;background:var(--pt-primary);opacity:.2;filter:blur(48px)}

/* ===== hero: eyebrow / أحجام العنوان / الهاتف / الفيديو / نموذج البريد ===== */
.pt-eyebrow{display:inline-flex;align-items:center;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;border:1px solid var(--pt-border);background:var(--pt-secondary);color:var(--pt-text);margin-bottom:16px}
.pt-eyebrow--dark{border-color:rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff}
.blk-hero__title--lg{font-size:clamp(2rem,5vw,3.75rem)}
.blk-hero__title--xl{font-size:clamp(2.5rem,6.5vw,4.5rem);letter-spacing:-.015em}
.blk-hero__stack{margin-top:40px;display:flex;justify-content:center}
/* ===== الرسوم التوضيحية الواقعية (.pt-mock) — عقد مشترك مع عارض React ===== */
.pt-mock{position:relative;border-radius:calc(var(--pt-radius) + 6px);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow)}
/* لوحة التحكم */
.pt-mock-dash__topbar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--pt-border);background:var(--pt-bg)}
.pt-mock-dots{display:flex;gap:5px;flex-shrink:0}
.pt-mock-dots span{width:8px;height:8px;border-radius:999px}
.pt-mock-dots span:nth-child(1){background:#f87171}
.pt-mock-dots span:nth-child(2){background:#fbbf24}
.pt-mock-dots span:nth-child(3){background:#34d399}
.pt-mock-dash__addr{flex:1;min-width:0;direction:ltr;text-align:center;font-size:10.5px;color:var(--pt-muted);background:var(--pt-secondary);border:1px solid var(--pt-border);border-radius:999px;padding:2px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pt-mock-dash__bell{position:relative;color:var(--pt-muted);display:inline-flex;flex-shrink:0}
.pt-mock-dash__belldot{position:absolute;top:-2px;inset-inline-end:-3px;width:7px;height:7px;border-radius:999px;background:#dc2626}
.pt-mock-dash__body{display:grid;grid-template-columns:126px minmax(0,1fr)}
.pt-mock-dash__side{border-inline-end:1px solid var(--pt-border);background:color-mix(in srgb,var(--pt-bg) 45%,var(--pt-surface));padding:12px 10px;display:flex;flex-direction:column;gap:3px}
.pt-mock-dash__brand{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;margin-bottom:9px;padding-inline:7px}
.pt-mock-dash__brand i{width:18px;height:18px;border-radius:5px;background:var(--pt-primary);flex-shrink:0}
.pt-mock-nav{display:flex;align-items:center;gap:8px;min-height:30px;padding:4px 8px;border-radius:calc(var(--pt-radius) - 4px);border-inline-start:2px solid transparent;font-size:11px;font-weight:600;color:var(--pt-muted);white-space:nowrap}
.pt-mock-nav svg{flex-shrink:0}
.pt-mock-nav--active{background:var(--pt-secondary);color:var(--pt-primary);border-inline-start-color:var(--pt-primary)}
.pt-mock-dash__main{padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}
.pt-mock-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pt-mock-kpi{background:var(--pt-bg);border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);padding:10px 12px}
.pt-mock-kpi span{display:block;font-size:10px;color:var(--pt-muted)}
.pt-mock-kpi b{display:block;margin-top:3px;font-size:14px;font-weight:800;letter-spacing:-.01em}
.pt-mock-kpi .pt-badge{margin-top:7px;font-size:9px;padding:1px 7px;line-height:16px}
.pt-mock-chart,.pt-mock-chart-lg{background:var(--pt-bg);border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);padding:10px 10px 4px}
.pt-mock-chart svg,.pt-mock-chart-lg svg{display:block;width:100%;height:auto}
.pt-mock-chart-lg{padding:12px 12px 8px}
.pt-mock-rows{display:flex;flex-direction:column}
.pt-mock-row{display:flex;align-items:center;gap:9px;padding:8px 2px}
.pt-mock-row+.pt-mock-row{border-top:1px solid color-mix(in srgb,var(--pt-border) 60%,transparent)}
.pt-mock-row__name{font-size:11.5px;font-weight:700}
.pt-mock-row__amount{margin-inline-start:auto;font-size:11.5px;font-weight:800;flex-shrink:0;white-space:nowrap}
.pt-mock-row .pt-badge{flex-shrink:0;font-size:9px;padding:1px 7px;line-height:16px}
/* شريحة الإشعار العائمة */
.pt-mock-chip--float{position:absolute;top:46px;inset-inline-start:-16px;z-index:3;display:flex;align-items:center;gap:9px;max-width:236px;background:var(--pt-surface);border:1px solid var(--pt-border);border-radius:999px;box-shadow:var(--pt-shadow);padding:8px 14px 8px 10px;animation:pt-float 5.5s ease-in-out infinite}
.pt-mock-chip__dot{width:8px;height:8px;border-radius:999px;background:#16a34a;flex-shrink:0}
.pt-mock-chip__text{min-width:0}
.pt-mock-chip__text b{display:block;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pt-mock-chip__text span{display:block;font-size:9.5px;color:var(--pt-muted);white-space:nowrap}
@keyframes pt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
/* الهاتف */
.pt-mock-phone-wrap{display:flex;justify-content:center;width:100%}
.pt-mock-phone{position:relative;width:min(262px,88vw);aspect-ratio:9/19;border-radius:34px;background:var(--pt-surface);border:1px solid var(--pt-border);box-shadow:var(--pt-shadow),0 0 0 7px color-mix(in srgb,var(--pt-border) 65%,transparent);padding:10px 12px 8px;display:flex;flex-direction:column;gap:10px;overflow:hidden}
.pt-mock-phone__status{display:flex;align-items:center;justify-content:space-between;direction:ltr;font-size:10px;font-weight:700;color:var(--pt-muted);padding-inline:8px;flex-shrink:0}
.pt-mock-phone__status-icons{display:flex;align-items:center;gap:4px}
.pt-mock-phone__notch{width:74px;height:7px;border-radius:999px;background:color-mix(in srgb,var(--pt-text) 20%,transparent);margin:-3px auto 0;flex-shrink:0}
.pt-mock-phone__head{display:flex;align-items:center;gap:8px;flex-shrink:0}
.pt-mock-phone__hi{flex:1;min-width:0}
.pt-mock-phone__hi b{display:block;font-size:11.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pt-mock-phone__hi span{display:block;font-size:9px;color:var(--pt-muted)}
.pt-mock-phone__bell{position:relative;color:var(--pt-muted);display:inline-flex;flex-shrink:0}
.pt-mock-phone__belldot{position:absolute;top:-2px;inset-inline-end:-3px;width:7px;height:7px;border-radius:999px;background:#dc2626}
.pt-mock-phone__balance{position:relative;border-radius:calc(var(--pt-radius) + 2px);background:linear-gradient(135deg,var(--pt-primary),var(--pt-accent));color:#fff;padding:12px 14px;flex-shrink:0;overflow:hidden}
.pt-mock-phone__balance::before{content:'';position:absolute;top:-40%;inset-inline-end:-20%;width:70%;height:120%;background:radial-gradient(closest-side,rgba(255,255,255,.22),transparent);pointer-events:none}
.pt-mock-phone__balance>span{display:block;font-size:9.5px;opacity:.85}
.pt-mock-phone__balance b{display:block;margin-top:3px;font-size:18px;font-weight:800;letter-spacing:-.01em}
.pt-mock-phone__bchip{display:inline-flex;margin-top:7px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:2px 9px;font-size:9px;font-weight:700}
.pt-mock-phone__actions{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;flex-shrink:0}
.pt-mock-phone__action{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}
.pt-mock-phone__action i{width:34px;height:34px;border-radius:999px;background:color-mix(in srgb,var(--pt-primary) 10%,transparent);color:var(--pt-primary);display:inline-flex;align-items:center;justify-content:center}
.pt-mock-phone__action span{font-size:8.5px;color:var(--pt-muted);font-weight:600}
.pt-mock-phone__chart{background:var(--pt-bg);border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);padding:10px 12px;flex-shrink:0}
.pt-mock-phone__chart-title{display:flex;align-items:center;justify-content:space-between;font-size:9.5px;font-weight:700;margin-bottom:8px}
.pt-mock-phone__chart-title span{color:var(--pt-muted);font-weight:500;font-size:8.5px}
.pt-mock-phone__bars{display:flex;align-items:flex-end;gap:7px;height:54px}
.pt-mock-phone__bar{flex:1;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--pt-primary),color-mix(in srgb,var(--pt-primary) 45%,transparent));transform-origin:bottom}
.pt-mock-phone__txs{display:flex;flex-direction:column}
.pt-mock-tx{display:flex;align-items:center;gap:8px;padding:7px 2px}
.pt-mock-tx+.pt-mock-tx{border-top:1px solid color-mix(in srgb,var(--pt-border) 60%,transparent)}
.pt-mock-tx__body{flex:1;min-width:0}
.pt-mock-tx__name{font-size:10.5px;font-weight:700}
.pt-mock-tx__sub{margin-top:1px;font-size:8.5px;color:var(--pt-muted)}
.pt-mock-tx__amt{font-size:10.5px;font-weight:800;flex-shrink:0;white-space:nowrap}
.pt-mock-tx__amt--in{color:#16a34a}
.pt-mock-phone__tabs{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--pt-border);padding-top:7px;flex-shrink:0}
.pt-mock-tab{display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--pt-muted);font-size:8px;font-weight:600}
.pt-mock-tab--active{color:var(--pt-primary)}
.pt-mock-phone__homebar{width:92px;height:4px;border-radius:999px;background:color-mix(in srgb,var(--pt-text) 22%,transparent);margin:6px auto 0;flex-shrink:0}
/* بطاقة التحليلات */
.pt-mock-analytics{padding:16px;display:flex;flex-direction:column;gap:12px}
.pt-mock-analytics__head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.pt-mock-analytics__head b{font-size:14.5px;font-weight:800}
.pt-mock-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pt-mock-chipstat{display:flex;flex-direction:column;gap:2px;background:var(--pt-bg);border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);padding:9px 11px}
.pt-mock-chipstat span{font-size:9px;color:var(--pt-muted)}
.pt-mock-chipstat b{font-size:12px;font-weight:800;white-space:nowrap}
.pt-mock-chipstat--up b{color:#16a34a}
/* بطاقة الطلبات */
.pt-mock-orders__head{padding:14px 16px;border-bottom:1px solid var(--pt-border);font-size:14.5px;font-weight:800}
.pt-mock-orders__list{padding:2px 16px}
.pt-mock-order{display:flex;align-items:center;gap:10px;padding:11px 0}
.pt-mock-order+.pt-mock-order{border-top:1px solid color-mix(in srgb,var(--pt-border) 60%,transparent)}
.pt-mock-order__body{flex:1;min-width:0}
.pt-mock-order__name{font-size:12.5px;font-weight:700}
.pt-mock-order__city{margin-top:1px;font-size:10px;color:var(--pt-muted)}
.pt-mock-order__end{text-align:end;flex-shrink:0}
.pt-mock-order__amount{display:block;font-size:12px;font-weight:800;white-space:nowrap}
.pt-mock-order__date{display:block;margin-top:1px;font-size:9.5px;color:var(--pt-muted);white-space:nowrap}
.pt-mock-order .pt-badge{flex-shrink:0}
.pt-mock-orders__foot{padding:10px 16px 14px;border-top:1px solid var(--pt-border);text-align:center}
/* بطاقة المحادثة */
.pt-mock-chat__head{display:flex;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid var(--pt-border)}
.pt-mock-chat__who{flex:1;min-width:0}
.pt-mock-chat__who b{display:block;font-size:13.5px;font-weight:800}
.pt-mock-chat__status{display:inline-flex;align-items:center;gap:5px;margin-top:2px;font-size:10.5px;font-weight:600;color:#16a34a}
.pt-mock-chat__status i{width:7px;height:7px;border-radius:999px;background:#16a34a;flex-shrink:0}
.pt-mock-chat__body{padding:16px;display:flex;flex-direction:column;gap:10px}
.pt-mock-bubble{max-width:84%;border-radius:14px;padding:9px 13px;font-size:12.5px;line-height:1.7}
.pt-mock-bubble__who{display:block;margin-bottom:3px;font-size:9.5px;font-weight:700;color:var(--pt-primary)}
.pt-mock-bubble--in{background:var(--pt-bg);border:1px solid var(--pt-border);align-self:flex-start;border-start-start-radius:4px}
.pt-mock-bubble--out{background:var(--pt-primary);color:var(--pt-primary-fg);align-self:flex-end;border-start-end-radius:4px}
.pt-mock-typing{display:inline-flex;align-items:center;gap:4px;align-self:flex-start;background:var(--pt-bg);border:1px solid var(--pt-border);border-radius:14px;border-start-start-radius:4px;padding:11px 13px}
.pt-mock-typing span{width:6px;height:6px;border-radius:999px;background:var(--pt-muted);animation:pt-typing 1.2s ease-in-out infinite}
.pt-mock-typing span:nth-child(2){animation-delay:.15s}
.pt-mock-typing span:nth-child(3){animation-delay:.3s}
@keyframes pt-typing{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
.pt-mock-chat__input{display:flex;align-items:center;gap:8px;margin:0 16px 16px;padding:5px 5px 5px 14px;border:1px solid var(--pt-border);border-radius:999px;background:var(--pt-bg)}
.pt-mock-chat__placeholder{flex:1;min-width:0;font-size:11px;color:var(--pt-muted)}
.pt-mock-chat__send{width:32px;height:32px;border-radius:999px;background:var(--pt-primary);color:var(--pt-primary-fg);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
/* بطاقة التقويم */
.pt-mock-cal__head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px;border-bottom:1px solid var(--pt-border)}
.pt-mock-cal__head b{font-size:13.5px;font-weight:800}
.pt-mock-cal__navs{display:flex;gap:6px}
.pt-mock-cal__nav{width:26px;height:26px;border-radius:8px;border:1px solid var(--pt-border);background:transparent;color:var(--pt-muted);display:inline-flex;align-items:center;justify-content:center}
.pt-mock-cal__body{padding:14px 16px}
.pt-mock-cal__week{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:7px}
.pt-mock-cal__wd{text-align:center;font-size:9px;font-weight:700;color:var(--pt-muted)}
.pt-mock-cal__days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.pt-mock-cal__day{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--pt-text);border-radius:999px}
.pt-mock-cal__day--today{background:var(--pt-primary);color:var(--pt-primary-fg);font-weight:800}
.pt-mock-cal__day--dot::after{content:'';position:absolute;bottom:2.5px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:999px;background:var(--pt-accent)}
.pt-mock-cal__foot{padding:0 16px 16px;text-align:center}
.pt-mock-chipnote{display:inline-flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--pt-primary) 10%,transparent);color:var(--pt-primary);font-size:11px;font-weight:700;border-radius:999px;padding:6px 13px}
/* بطاقة رأي العميل */
.pt-mock-quote{padding:26px 24px 22px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.pt-mock-quote__glyph{position:absolute;top:-10px;inset-inline-start:10px;font-size:92px;line-height:1;font-weight:900;font-family:Georgia,'Times New Roman',serif;color:color-mix(in srgb,var(--pt-primary) 15%,transparent);pointer-events:none;user-select:none}
.pt-mock-quote__stars{position:relative;color:#f59e0b;letter-spacing:2.5px;font-size:15px}
.pt-mock-quote__text{position:relative;margin-top:2px;font-size:14.5px;line-height:1.85}
.pt-mock-quote__person{position:relative;display:flex;align-items:center;gap:10px;padding-top:13px;border-top:1px solid color-mix(in srgb,var(--pt-border) 70%,transparent)}
.pt-mock-quote__who{flex:1;min-width:0}
.pt-mock-quote__who b{display:block;font-size:13px;font-weight:800}
.pt-mock-quote__who span{display:block;margin-top:1px;font-size:10.5px;color:var(--pt-muted)}
.pt-mock-verified{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;font-size:10px;font-weight:700;color:#16a34a;background:color-mix(in srgb,#16a34a 10%,transparent);border-radius:999px;padding:4px 9px}
/* بطاقة الفيديو */
.pt-video-wrap{width:520px;max-width:100%}
.pt-video{position:relative;aspect-ratio:16/9;border:1px solid var(--pt-border);background:var(--pt-surface);border-radius:calc(var(--pt-radius) + 6px);box-shadow:var(--pt-shadow);display:flex;align-items:center;justify-content:center;overflow:hidden}
.pt-video__veil{position:absolute;inset:0;background:linear-gradient(160deg,var(--pt-secondary),transparent);pointer-events:none}
.pt-video__caption{position:absolute;bottom:14px;inset-inline:16px;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.pt-video__caption span{height:8px;border-radius:999px;background:color-mix(in srgb,var(--pt-text) 14%,transparent)}
.pt-play{position:relative;width:60px;height:60px;border-radius:999px;border:none;background:var(--pt-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.22);transition:transform .2s ease,opacity .2s ease}
.pt-play:hover{filter:brightness(1.08)}
.pt-play.playing .pt-play__triangle{display:none}
.pt-play__pause{display:none;gap:5px;direction:ltr}
.pt-play__pause span{display:block;width:6px;height:22px;border-radius:3px;background:var(--pt-primary-fg)}
.pt-play.playing .pt-play__pause{display:flex}
.pt-wave{display:none;position:absolute;bottom:14px;inset-inline-end:14px;align-items:flex-end;gap:4px;pointer-events:none;z-index:2}
.pt-video.playing .pt-wave{display:flex}
.pt-wave span{display:block;width:4px;border-radius:999px;background:var(--pt-primary);opacity:.85;transform-origin:bottom center;animation:pt-wave .9s ease-in-out infinite alternate}
.pt-wave span:nth-child(1){height:10px}
.pt-wave span:nth-child(2){height:18px;animation-delay:.12s}
.pt-wave span:nth-child(3){height:12px;animation-delay:.24s}
.pt-wave span:nth-child(4){height:22px;animation-delay:.36s}
.pt-wave span:nth-child(5){height:14px;animation-delay:.48s}
@keyframes pt-wave{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
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
.blk-feature{padding:24px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);transition:transform .2s,border-color .2s}
.blk-feature:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--pt-primary) 35%,transparent)}
.blk-feature__icon{width:44px;height:44px;border-radius:calc(var(--pt-radius) - 2px);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;background:linear-gradient(135deg,color-mix(in srgb,var(--pt-primary) 14%,transparent),color-mix(in srgb,var(--pt-accent) 18%,transparent));color:var(--pt-primary);margin-bottom:14px}
.blk-feature__title{font-size:16.5px;font-weight:700}
.blk-feature__desc{margin-top:6px;font-size:14px;color:var(--pt-muted)}

/* ===== stats ===== */
.blk-stats{background:var(--pt-surface);border-block:1px solid var(--pt-border)}
.blk-stats__grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding-block:40px}
.blk-stat{text-align:center}
.blk-stat__value{font-size:30px;font-weight:800;background:linear-gradient(135deg,var(--pt-primary),var(--pt-accent));-webkit-background-clip:text;background-clip:text;color:transparent}
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
.blk-testimonial{position:relative;overflow:hidden;padding:24px;border-radius:var(--pt-radius);border:1px solid var(--pt-border);background:var(--pt-surface);box-shadow:var(--pt-shadow);transition:transform .2s}
.blk-testimonial:hover{transform:translateY(-4px)}
.blk-testimonial::before{content:'”';position:absolute;top:12px;inset-inline-start:16px;font-size:48px;line-height:1;font-weight:900;pointer-events:none;background:linear-gradient(135deg,color-mix(in srgb,var(--pt-primary) 30%,transparent),color-mix(in srgb,var(--pt-accent) 12%,transparent));-webkit-background-clip:text;background-clip:text;color:transparent}
.blk-testimonial__person .pt-avatar{box-shadow:0 0 0 2px color-mix(in srgb,var(--pt-primary) 30%,transparent)}
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
.blk-cta__card{position:relative;overflow:hidden;border-radius:calc(var(--pt-radius) + 4px);padding:44px 24px;text-align:center;box-shadow:var(--pt-shadow)}
.blk-cta__card::before{content:'';position:absolute;top:0;inset-inline:0;height:160px;background:radial-gradient(60% 100% at 50% 0%,rgba(255,255,255,.18),transparent 70%);pointer-events:none;z-index:0}
.blk-cta__card>*{position:relative;z-index:1}
.blk-cta__card--gradient{background:linear-gradient(135deg,var(--pt-primary),var(--pt-accent));color:#fff}
.blk-cta__card--dark{background:#16121f;color:#fff}
.blk-cta__card--default{background:var(--pt-secondary);border:1px solid var(--pt-border)}
.blk-cta__title{font-size:clamp(22px,4vw,32px);font-weight:800}
.blk-cta__subtitle{margin-top:10px;opacity:.85;font-size:15px}
.blk-cta__actions{margin-top:26px}
.blk-banner{position:relative;overflow:hidden;padding:22px 24px;border-radius:var(--pt-radius)}
.blk-banner::before{content:'';position:absolute;top:0;inset-inline:0;height:96px;background:radial-gradient(55% 100% at 50% 0%,rgba(255,255,255,.16),transparent 70%);pointer-events:none;z-index:0}
.blk-banner--gradient{background:linear-gradient(120deg,var(--pt-primary),var(--pt-accent));color:#fff}
.blk-banner--dark{background:#16121f;color:#fff}
.blk-banner__inner{position:relative;z-index:1;max-width:1120px;margin-inline:auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}
.blk-banner__title{font-size:17px;font-weight:800}
.blk-banner__subtitle{margin-top:2px;font-size:13.5px;opacity:.85}

/* ===== ألوان كل قسم (bgColor/textColor) — Task 12 ===== */
/* القواعد بعد قواعد البطل/الدفعة/الشريط عمداً لتتقدم عليها بالتساوي في الخصوصية */
.blk-hero--secvar .blk-hero__title{color:var(--pt-text)}
.blk-hero--secvar .blk-hero__subtitle{color:var(--pt-muted)}
.blk-cta__card--secvar{color:var(--pt-text)}
.blk-cta__card--secvar .blk-cta__subtitle{color:var(--pt-muted)}
.blk-banner--secvar{color:var(--pt-text)}
.blk-banner--secvar .blk-banner__subtitle{color:var(--pt-muted)}

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
.blk-gallery__photo{display:block;width:100%;height:100%;object-fit:cover}

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
.blk-team__photo{width:56px;height:56px;border-radius:999px;object-fit:cover;box-shadow:0 0 0 3px color-mix(in srgb,var(--pt-primary) 22%,transparent)}

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
.pt-auth{position:relative;overflow:hidden}
.pt-auth .blk-auth{min-height:auto;padding-block:0}
.pt-auth__glow{position:absolute;border-radius:999px;filter:blur(64px);pointer-events:none}
.pt-auth__glow--a{top:-96px;inset-inline-start:-96px;width:384px;height:384px;background:var(--pt-primary);opacity:.14}
.pt-auth__glow--b{bottom:-128px;inset-inline-end:-96px;width:384px;height:384px;background:var(--pt-accent);opacity:.1}
.pt-auth__back{position:relative;display:inline-flex;align-items:center;gap:6px;margin-top:24px;min-height:40px;font-size:14px;font-weight:600;color:var(--pt-muted);transition:color .15s}
.pt-auth__back:hover{color:var(--pt-primary)}

/* ===== (الجولة 16) محدد الأدوار في بطاقة الدخول (كزبون / كمدير) ===== */
.blk-auth__roles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:2px 0 4px}
.blk-role{display:flex;flex-direction:column;gap:3px;align-items:flex-start;padding:10px 12px;border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);background:transparent;cursor:pointer;text-align:start;transition:border-color .15s,background .15s}
.blk-role .blk-role__icon{display:flex}
.blk-role__name{font-size:13.5px;font-weight:700;color:var(--pt-text);display:flex;align-items:center;gap:6px}
.blk-role__hint{font-size:11.5px;color:var(--pt-muted)}
.blk-role.is-on{border-color:var(--pt-primary);background:color-mix(in srgb,var(--pt-primary) 10%,transparent)}
.blk-role.is-on .blk-role__name{color:var(--pt-primary)}
.blk-role:focus-visible{outline:2px solid var(--pt-primary);outline-offset:2px}
.blk-auth__role-note{margin:10px 0 0;font-size:12.5px;color:var(--pt-muted);line-height:1.6}

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

/* ===== حركات الرسوم البيانية + تلميح hover (data-tip) ===== */
.pt-anim-line{stroke-dasharray:1;stroke-dashoffset:1;animation:pt-draw 1.1s cubic-bezier(.25,.6,.3,1) forwards;filter:drop-shadow(0 2px 6px color-mix(in srgb,var(--pt-primary) 45%,transparent))}
.pt-anim-area{opacity:0;animation:pt-fadein .9s ease .4s forwards}
.pt-anim-bar{transform-box:fill-box;transform-origin:bottom;transform:scaleY(0);animation:pt-grow .7s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes pt-draw{to{stroke-dashoffset:0}}
@keyframes pt-fadein{to{opacity:1}}
@keyframes pt-grow{to{transform:scaleY(1)}}
.pt-donut-seg circle{stroke-width:20;transition:stroke-width .18s ease,opacity .18s ease;cursor:default}
.blk-donut:hover .pt-donut-seg{opacity:.55}
.blk-donut .pt-donut-seg:hover{opacity:1}
.pt-donut-seg:hover circle{stroke-width:23}
.pt-tip{position:fixed;z-index:9999;pointer-events:none;background:var(--pt-surface);border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 4px);box-shadow:var(--pt-shadow);padding:6px 10px;font-size:12px;font-weight:600;white-space:nowrap;color:var(--pt-text);opacity:0;transition:opacity .12s ease}
.pt-tip.show{opacity:1}

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
.blk-table__pager{display:flex;align-items:center;gap:10px}
.blk-table__pager-count{font-size:12px;color:var(--pt-muted);white-space:nowrap}
/* ===== (الجولة 15) إدارة الصفوف داخل الجدول: أدوات الترويسة + إجراءات الصف ===== */
.blk-table__tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pt-rowacts{display:inline-flex;gap:6px}
.pt-rowact{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:calc(var(--pt-radius) - 6px);border:1px solid transparent;background:transparent;color:var(--pt-muted);cursor:pointer;transition:all .15s ease}
.pt-rowact:hover{border-color:var(--pt-border);background:var(--pt-secondary);color:var(--pt-text)}
.pt-rowact--danger:hover{color:#dc2626}
.blk-table__act{white-space:nowrap}
.blk-table__empty td{padding:30px 16px;text-align:center;color:var(--pt-muted);font-size:13px}
.pt-linkbtn{background:none;border:none;padding:0;margin:0;color:var(--pt-primary);text-decoration:underline;cursor:pointer;font:inherit;font-size:11px}
/* ===== (الجولة 15) نافذة إضافة/تعديل/حذف + التنبيه العائم ===== */
.pt-modal{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55)}
.pt-modal__card{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--pt-surface);border:1px solid var(--pt-border);border-radius:var(--pt-radius);padding:22px 24px;box-shadow:var(--pt-shadow)}
.pt-modal__card--sm{max-width:390px}
.pt-modal__card--sm .pt-modal__actions{margin-top:18px}
.pt-modal h3{font-size:17px;font-weight:800;color:var(--pt-text);margin:0}
.pt-modal__note{margin:6px 0 0;font-size:12px;color:var(--pt-muted)}
.pt-modal__grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:18px}
@media(min-width:640px){.pt-modal__grid{grid-template-columns:1fr 1fr}}
.pt-modal__actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:12px;margin-top:6px}
.pt-toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%) translateY(10px);background:#16121f;color:#fff;padding:10px 20px;border-radius:999px;font-size:13px;font-weight:600;opacity:0;visibility:hidden;transition:opacity .25s,transform .25s,visibility .25s;z-index:80;box-shadow:0 10px 30px rgba(0,0,0,.3);pointer-events:none;max-width:90vw;text-align:center}
.pt-toast.show{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}

/* ===== تروستة لوحة التحكم (بحث + إشعارات + مستخدم) ===== */
.pt-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:8px;padding:10px 16px;background:color-mix(in srgb,var(--pt-surface) 95%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--pt-border)}
.pt-topbar__search{position:relative;flex:1;min-width:0;max-width:360px}
.pt-topbar__search svg{position:absolute;inset-inline-start:10px;top:50%;transform:translateY(-50%);color:var(--pt-muted);pointer-events:none}
.pt-topbar__search input{width:100%;min-height:36px;border-radius:calc(var(--pt-radius) - 2px);border:1px solid var(--pt-border);background:var(--pt-bg);color:var(--pt-text);padding:6px 12px;padding-inline-start:32px;font-size:13px;transition:border-color .15s}
.pt-topbar__search input::placeholder{color:var(--pt-muted)}
.pt-topbar__search input:focus{outline:2px solid var(--pt-primary);outline-offset:1px;border-color:var(--pt-primary)}
.pt-topbar__actions{display:flex;align-items:center;gap:8px;flex-shrink:0;margin-inline-start:auto}
.pt-topbar__item{position:relative;flex-shrink:0}
.pt-topbar__btn{position:relative;display:inline-flex;align-items:center;gap:8px;min-height:36px;border:1px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 2px);background:transparent;color:var(--pt-text);cursor:pointer;transition:background .15s}
.pt-topbar__btn:hover{background:var(--pt-secondary)}
.pt-bell{width:36px;justify-content:center}
.pt-bell__dot{position:absolute;top:-3px;inset-inline-end:-3px;width:10px;height:10px;border-radius:999px;background:#dc2626;border:2px solid var(--pt-surface)}
.pt-user{padding-inline:10px;border-radius:999px}
.pt-user__name{font-size:13px;font-weight:700}
.pt-dropdown{display:none;position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:60;width:288px;border:1px solid var(--pt-border);border-radius:var(--pt-radius);background:var(--pt-surface);box-shadow:var(--pt-shadow);overflow:hidden}
.pt-dropdown.open{display:block}
.pt-dropdown--user{width:210px}
.pt-dropdown__head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;border-bottom:1px solid var(--pt-border);font-size:14px;font-weight:700}
.pt-dropdown__action{border:none;background:transparent;color:var(--pt-primary);font-size:11px;font-weight:600;cursor:pointer;min-height:32px;padding:2px 8px;border-radius:calc(var(--pt-radius) - 6px);transition:background .15s}
.pt-dropdown__action:hover{background:var(--pt-secondary)}
.pt-dropdown__list{max-height:256px;overflow-y:auto}
.pt-dropdown__list li{display:flex;gap:10px;padding:12px 14px}
.pt-dropdown__list li+li{border-top:1px solid var(--pt-border)}
.pt-dropdown__dot{width:8px;height:8px;border-radius:999px;background:var(--pt-primary);margin-top:6px;flex-shrink:0}
.pt-dropdown__title{font-size:13px;font-weight:700}
.pt-dropdown__detail{margin-top:2px;font-size:12px;color:var(--pt-muted)}
.pt-dropdown__time{margin-top:4px;font-size:10px;color:var(--pt-muted);opacity:.8}
.pt-dropdown__user{padding:10px 14px;border-bottom:1px solid var(--pt-border)}
.pt-dropdown__user p:first-child{font-size:14px;font-weight:700}
.pt-dropdown__user p:last-child{margin-top:2px;font-size:11px;color:var(--pt-muted)}
.pt-dropdown__body{padding:6px}
.pt-dropdown__link{display:flex;align-items:center;gap:8px;min-height:36px;padding:0 10px;border-radius:calc(var(--pt-radius) - 4px);font-size:13px;font-weight:500;color:var(--pt-text);transition:background .15s}
.pt-dropdown__link:hover{background:var(--pt-secondary)}
.pt-dropdown__link--danger{color:#dc2626;font-weight:600}
.pt-dropdown__divider{height:1px;background:var(--pt-border);margin:6px 4px}

/* ===== سجل النشاطات (activity-feed) ===== */
.blk-activity__head{padding:14px 20px;border-bottom:1px solid var(--pt-border);font-size:14px;font-weight:700}
.blk-activity__list li{display:flex;align-items:flex-start;gap:12px;padding:14px 20px}
.blk-activity__list li+li{border-top:1px solid var(--pt-border)}
.blk-activity__dot{width:8px;height:8px;border-radius:999px;background:var(--pt-primary);flex-shrink:0;margin-top:14px}
.blk-activity__body{flex:1;min-width:0}
.blk-activity__text{font-size:13.5px}
.blk-activity__text strong{font-weight:700}
.blk-activity__time{margin-top:3px;font-size:11.5px;color:var(--pt-muted)}

/* ===== قائمة المهام (tasks-list) ===== */
.blk-tasks__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid var(--pt-border)}
.blk-tasks__title{font-size:14px;font-weight:700}
.blk-tasks__sub{margin-top:2px;font-size:12.5px;color:var(--pt-muted)}
.blk-tasks__count{font-size:12px;font-weight:700;color:var(--pt-primary);background:color-mix(in srgb,var(--pt-primary) 10%,transparent);border-radius:999px;padding:4px 12px;white-space:nowrap;flex-shrink:0}
.blk-tasks__progress{height:8px;border-radius:999px;background:var(--pt-secondary);overflow:hidden;margin:16px 20px 0}
.blk-tasks__progress-fill{display:block;height:100%;border-radius:999px;background:var(--pt-primary);transition:width .35s ease}
.blk-tasks__list{padding:12px 20px 16px;display:flex;flex-direction:column}
.blk-tasks__item{display:flex;align-items:center;gap:10px;padding:8px 0}
.blk-tasks__item+.blk-tasks__item{border-top:1px solid color-mix(in srgb,var(--pt-border) 60%,transparent)}
.blk-tasks__check{width:22px;height:22px;flex-shrink:0;border:2px solid var(--pt-border);border-radius:calc(var(--pt-radius) - 6px);background:var(--pt-bg);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:transparent;transition:background .15s,border-color .15s,color .15s}
.blk-tasks__check:hover{border-color:var(--pt-primary)}
.blk-tasks__check.on{background:var(--pt-primary);border-color:var(--pt-primary);color:var(--pt-primary-fg)}
.blk-tasks__item.done .blk-tasks__label{text-decoration:line-through;color:var(--pt-muted)}
.blk-tasks__label{font-size:14px;font-weight:500}
.blk-tasks__meta{margin-inline-start:auto;font-size:12px;color:var(--pt-muted);flex-shrink:0}

/* ===== الإجراءات السريعة (quick-actions) ===== */
.blk-quick__title{font-size:16px;font-weight:800;margin-bottom:14px}
.blk-quick__grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.blk-quick__item{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:16px;border:1px solid var(--pt-border);border-radius:var(--pt-radius);background:var(--pt-surface);box-shadow:var(--pt-shadow);transition:transform .2s,border-color .2s}
.blk-quick__item:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--pt-primary) 35%,transparent)}
.blk-quick__icon{width:40px;height:40px;border-radius:calc(var(--pt-radius) - 2px);display:inline-flex;align-items:center;justify-content:center;color:var(--pt-primary);background:linear-gradient(135deg,color-mix(in srgb,var(--pt-primary) 14%,transparent),color-mix(in srgb,var(--pt-accent) 18%,transparent))}
.blk-quick__row{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%}
.blk-quick__label{font-size:13.5px;font-weight:600}
.blk-quick__arrow{color:var(--pt-muted);flex-shrink:0}
@media (min-width:769px){.blk-quick__grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}}

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
  .pt-wave span{animation:none}
  .pt-back__label{transition:none}
  .pt-anim-line{stroke-dasharray:none;stroke-dashoffset:0;animation:none}
  .pt-anim-area{opacity:1;animation:none}
  .pt-anim-bar{transform:none;animation:none}
  .pt-mock-typing span{animation:none}
  .pt-mock-chip--float{animation:none}
  .pt-donut-seg circle{transition:none}
  .pt-tip{transition:none}
}

/* ===== زر العودة للخلف (صفحات غير الرئيسية) ===== */
.pt-back{position:fixed;bottom:20px;inset-inline-start:20px;z-index:40;display:inline-flex;align-items:center;height:44px;border:none;border-radius:999px;background:var(--pt-primary);color:var(--pt-primary-fg);cursor:pointer;padding-inline:13px;font-size:13px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:filter .15s ease}
.pt-back:hover{filter:brightness(1.08)}
.pt-back:active{transform:translateY(1px)}
.pt-back__label{display:inline-block;max-width:0;overflow:hidden;white-space:nowrap;opacity:0;transition:max-width .25s ease,opacity .25s ease,margin .25s ease}
.pt-back:hover .pt-back__label,.pt-back:focus-visible .pt-back__label{max-width:96px;opacity:1;margin-inline-start:7px}
.pt-back~.pt-demo-badge{display:none}
body:has(.pt-back) .pt-demo-badge{display:none}

/* ===== 404 ===== */
.pt-404{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px}
.pt-404__code{font-size:72px;font-weight:800;color:var(--pt-primary)}
.pt-404__text{font-size:16px;color:var(--pt-muted)}

/* ===== استجابة ===== */
@media (max-width:768px){
  .pt-nav__links{display:none;position:absolute;inset-inline:0;top:100%;flex-direction:column;align-items:stretch;background:var(--pt-surface);border-bottom:1px solid var(--pt-border);padding:12px 16px;gap:2px}
  .pt-nav__links.open{display:flex}
  .pt-nav__burger{display:flex}
  .pt-sidebar-layout{grid-template-columns:minmax(0,1fr)}
  .pt-sidebar{display:none}
  .pt-sidebar-top{display:block}
  .blk-hero__split{flex-direction:column-reverse}
  .blk-hero__visual{max-width:100%}
  .blk-features__grid{grid-template-columns:1fr 1fr}
  .blk-stats__grid{grid-template-columns:1fr 1fr}
  .blk-plan--highlight{transform:none}
  .blk-list__meta{display:none}
  .blk-donut-wrap{justify-content:center}
  .pt-user__name{display:none}
  .pt-topbar{padding:8px 12px}
  .blk-table__tools{width:100%}
}
@media (max-width:480px){
  .blk-features__grid{grid-template-columns:1fr}
  .blk-hero{padding-block:44px}
  .pt-lead-form{flex-direction:column}
  .blk-auth__roles{grid-template-columns:1fr}
}
@media (max-width:640px){
  .pt-mock-dash__body{grid-template-columns:104px minmax(0,1fr)}
  .pt-mock-chip--float{inset-inline-start:-6px;max-width:210px}
  .pt-mock-analytics{padding:14px}
}
@media (max-width:380px){
  .pt-mock-dash__body{grid-template-columns:minmax(0,1fr)}
  .pt-mock-dash__side{display:none}
}
`
}

// ============================================================
// script.js
// ============================================================
function buildScriptJs(): string {
  return `// SIVAR — سلوك الموقع الثابت (بدون أي مكتبات)
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
      // (الجولة 15) نموذج الإعدادات: حفظ محلي + تنبيه — دون استبدال النموذج
      if (form.hasAttribute('data-settings')) { handleSettingsSave(form, e); return }
      e.preventDefault()
      // (الجولة 16) بطاقة الدخول بمحدد الأدوار: اضبط الجلسة حسب الدور المختار
      // ثم انقل إلى فضاء ذلك الدور (بلا data-redirect على هذا النموذج)
      if (form.hasAttribute('data-login-roles')) {
        var authCard = form.closest('.blk-auth__card')
        var selRole = authCard ? authCard.querySelector('.blk-role.is-on') : null
        var role = selRole && selRole.getAttribute('data-role') === 'admin' ? 'admin' : 'client'
        writeSession(role, role === 'client' ? 'أمينة بلقاسم' : 'مستخدم تجريبي', role === 'client' ? 'amina@sivar.dz' : 'demo@sivar.dz')
        window.location.href = role === 'client' ? form.getAttribute('data-client-href') : form.getAttribute('data-admin-href')
        return
      }
      // (الجولة 16) التسجيل العام يصنع جلسة زبون قبل اتباع data-redirect
      if (form.hasAttribute('data-signup-client')) {
        writeSession('client', 'أمينة بلقاسم', 'amina@sivar.dz')
      }
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

  // ===== الجداول: بحث الجدول + بحث التروستة (دمج AND) + ترقيم الصفحات =====
  var topbarSearch = document.querySelector('[data-topbar-search]')
  var allTables = Array.prototype.slice.call(document.querySelectorAll('.pt-table'))

  function refreshTable(table) {
    if (!table || !table.id) return
    var own = document.querySelector('[data-table-search="' + table.id + '"]')
    var q1 = own ? own.value.trim().toLowerCase() : ''
    var q2 = topbarSearch ? topbarSearch.value.trim().toLowerCase() : ''
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr')).filter(function (r) {
      // (الجولة 15) صفّ الإشعار «لا يوجد بعد» ليس بيانات — لا يُحسب في العدّاد
      return !r.classList.contains('blk-table__empty')
    })
    var matched = []
    rows.forEach(function (row) {
      var text = row.textContent.toLowerCase()
      var ok = (!q1 || text.indexOf(q1) !== -1) && (!q2 || text.indexOf(q2) !== -1)
      row.setAttribute('data-match', ok ? '1' : '0')
      if (ok) matched.push(row)
    })
    var counter = document.getElementById(table.id + '-count')
    if (counter) counter.textContent = 'عرض ' + matched.length + ' من ' + rows.length + ' صف'
    var card = table.closest('.blk-table')
    var pager = card ? card.querySelector('[data-pager]') : null
    if (!pager) {
      rows.forEach(function (row) {
        row.style.display = row.getAttribute('data-match') === '1' ? '' : 'none'
      })
      return
    }
    var pageSize = parseInt(pager.getAttribute('data-page-size') || '5', 10) || 5
    var pages = Math.max(1, Math.ceil(matched.length / pageSize))
    var current = parseInt(pager.getAttribute('data-current') || '1', 10) || 1
    if (current > pages) current = pages
    if (current < 1) current = 1
    pager.setAttribute('data-current', String(current))
    if (matched.length <= pageSize) {
      pager.hidden = true
      rows.forEach(function (row) {
        row.style.display = row.getAttribute('data-match') === '1' ? '' : 'none'
      })
      return
    }
    pager.hidden = false
    matched.forEach(function (row, i) {
      row.style.display = Math.floor(i / pageSize) + 1 === current ? '' : 'none'
    })
    var pageCount = pager.querySelector('.blk-table__pager-count')
    if (pageCount) pageCount.textContent = 'صفحة ' + current + ' من ' + pages
    var prevBtn = pager.querySelector('[data-page="prev"]')
    var nextBtn = pager.querySelector('[data-page="next"]')
    if (prevBtn) prevBtn.disabled = current <= 1
    if (nextBtn) nextBtn.disabled = current >= pages
  }

  if (topbarSearch) {
    topbarSearch.addEventListener('input', function () {
      allTables.forEach(refreshTable)
    })
  }
  document.querySelectorAll('[data-table-search]').forEach(function (input) {
    input.addEventListener('input', function () {
      refreshTable(document.getElementById(input.getAttribute('data-table-search')))
    })
  })
  document.querySelectorAll('[data-pager]').forEach(function (pager) {
    pager.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = btn.getAttribute('data-page') === 'next' ? 1 : -1
        var current = parseInt(pager.getAttribute('data-current') || '1', 10) || 1
        pager.setAttribute('data-current', String(current + dir))
        refreshTable(document.getElementById(pager.getAttribute('data-pager')))
      })
    })
  })
  // الحالة الأولى: طبّق البحث والترقيم على كل الجداول
  allTables.forEach(refreshTable)

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

  // زر تشغيل الفيديو: يتبدّل تشغيل/إيقاف + موجة صوت متحركة
  document.querySelectorAll('.pt-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var playing = btn.classList.toggle('playing')
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false')
      btn.setAttribute('aria-label', playing ? 'إيقاف الفيديو' : 'تشغيل الفيديو')
      var stage = btn.closest('.pt-video')
      if (stage) stage.classList.toggle('playing', playing)
    })
  })

  // ===== قوائم التروستة المنسدلة (الإشعارات + قائمة المستخدم) =====
  function closeMenu(menu) {
    menu.classList.remove('open')
    var btn = document.querySelector('[data-menu-toggle="' + menu.id + '"]')
    if (btn) btn.setAttribute('aria-expanded', 'false')
  }
  document.querySelectorAll('[data-menu-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var menu = document.getElementById(btn.getAttribute('data-menu-toggle'))
      if (!menu) return
      var willOpen = !menu.classList.contains('open')
      document.querySelectorAll('.pt-dropdown.open').forEach(function (other) {
        if (other !== menu) closeMenu(other)
      })
      menu.classList.toggle('open', willOpen)
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
    })
  })
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.pt-dropdown.open').forEach(function (menu) {
      if (menu.contains(e.target)) return
      var btn = document.querySelector('[data-menu-toggle="' + menu.id + '"]')
      if (btn && btn.contains(e.target)) return
      closeMenu(menu)
    })
  })
  document.querySelectorAll('[data-read-all]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var dot = document.getElementById(btn.getAttribute('data-read-all'))
      if (dot) dot.hidden = true
    })
  })

  // ===== المهام: تبديل الإنجاز + تحديث التقدّم والعداد داخل نفس البطاقة =====
  document.querySelectorAll('[data-task]').forEach(function (box) {
    box.addEventListener('click', function () {
      var on = box.classList.toggle('on')
      box.setAttribute('aria-checked', on ? 'true' : 'false')
      var item = box.closest('.blk-tasks__item')
      if (item) item.classList.toggle('done', on)
      var card = box.closest('.blk-tasks')
      if (!card) return
      var boxes = card.querySelectorAll('[data-task]')
      var done = 0
      boxes.forEach(function (b) {
        if (b.classList.contains('on')) done++
      })
      var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0
      var fill = card.querySelector('[data-tasks-progress]')
      if (fill) fill.style.width = pct + '%'
      var count = card.querySelector('[data-tasks-count]')
      if (count) count.textContent = done + ' من ' + boxes.length + ' منجزة'
      var bar = card.querySelector('[data-tasks-bar]')
      if (bar) bar.setAttribute('aria-valuenow', String(pct))
    })
  })

  // ===== زر العودة للخلف (الصفحات غير الرئيسية) =====
  document.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var home = btn.getAttribute('data-home')
      if (history.length > 1 && document.referrer && document.referrer.indexOf(location.origin) === 0) {
        history.back()
      } else if (home) {
        window.location.href = home
      }
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

  // ===== تلميحات الرسوم البيانية (data-tip) — معالج مفوَّض واحد =====
  var tipEl = null
  function ensureTip() {
    if (!tipEl) {
      tipEl = document.createElement('div')
      tipEl.className = 'pt-tip'
      tipEl.setAttribute('role', 'tooltip')
      document.body.appendChild(tipEl)
    }
    return tipEl
  }
  function hideTip() {
    if (tipEl) tipEl.classList.remove('show')
  }
  function placeTip(x, y) {
    var t = ensureTip()
    var w = t.offsetWidth
    var h = t.offsetHeight
    var vw = window.innerWidth
    var vh = window.innerHeight
    var left = x + 14
    if (left + w > vw - 8) left = x - w - 14
    if (left < 8) left = Math.max(8, Math.min(x + 14, vw - w - 8))
    var top = y - h - 12
    if (top < 8) top = y + 20
    if (top + h > vh - 8) top = Math.max(8, vh - h - 8)
    t.style.left = left + 'px'
    t.style.top = top + 'px'
  }
  function showTipFor(el, x, y) {
    var text = el.getAttribute('data-tip')
    if (!text) { hideTip(); return }
    var t = ensureTip()
    t.textContent = text
    t.classList.add('show')
    placeTip(x, y)
  }
  document.addEventListener('mousemove', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null
    if (el) showTipFor(el, e.clientX, e.clientY)
    else hideTip()
  })
  document.addEventListener('mouseleave', hideTip)
  document.addEventListener('focusin', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null
    if (!el) return
    var r = el.getBoundingClientRect()
    showTipFor(el, r.left + r.width / 2, r.top)
  })
  document.addEventListener('focusout', hideTip)

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

  // ===== (الجولة 15) إدارة المحتوى داخل الموقع المُصدَّر — وضع تجريبي محلي =====
  // البذرة (window.SIVAR_SEED) مُحقونة في كل صفحة قبل هذا الملف؛ كل التعديلات
  // تُحفظ في متصفح الزائر (localStorage) وتُطبَّق فوراً على الجدول وقسم
  // المعرض/الفريق المقابل — بلا أي خادم. زر «إعادة الضبط» يعيد الأصل.
  var SEED = window.SIVAR_SEED || { key: 'sivar-site', entities: {}, entityByVariant: {} }
  var AVATAR_TONES_JS = ['#0d9488', '#7c5cd6', '#c2610c', '#bd4b7f', '#3d6bd6', '#6a8f1f']
  var STATUS_TONES_JS = {
    'مكتمل': 'success', 'نشط': 'success', 'مدفوع': 'success', 'متاح': 'success', 'مؤكد': 'success', 'نشطة': 'success',
    'جديد': 'warning', 'قيد المعالجة': 'warning', 'معلق': 'warning', 'معلّقة': 'warning', 'قيد المراجعة': 'warning', 'متأخرة': 'warning',
    'ملغى': 'danger', 'فاشل': 'danger', 'ملغاة': 'danger', 'نفد': 'danger', 'نفد المخزون': 'danger', 'متوقف': 'danger', 'موقوفة': 'danger', 'غير نشط': 'danger'
  }
  var BADGES_JS = ['نشط', 'مكتمل', 'مدفوع', 'متاح', 'مؤكد', 'جديد', 'قيد المعالجة', 'معلق', 'متأخرة', 'ملغى', 'نفد المخزون', 'غير نشط']
  var GALLERY_GRADIENTS_JS = [
    'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))',
    'linear-gradient(135deg, var(--pt-accent), color-mix(in srgb, var(--pt-primary) 55%, #db2777))',
    'linear-gradient(135deg, color-mix(in srgb, var(--pt-primary) 70%, #16121f), var(--pt-primary))',
    'linear-gradient(135deg, var(--pt-accent), color-mix(in srgb, var(--pt-primary) 45%, #0d9488))'
  ]
  var ICON_PENCIL_JS = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>'
  var ICON_TRASH_JS = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>'

  // ---- منافذ JS للمولّدات (مطابقة حرفياً لمخرجات SSR) ----
  function escJs(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
  function fmtNumJs(v) {
    v = Number(v)
    if (!isFinite(v)) return '0'
    try {
      var s = v.toLocaleString('ar-DZ')
      return /^[\\d\\s.,'’]+$/.test(s) ? s : v.toLocaleString('en-US')
    } catch (e) {
      return v.toLocaleString('en-US')
    }
  }
  function initialsJs(name) {
    var parts = String(name || '').trim().split(/\\s+/).filter(Boolean)
    if (parts.length === 0) return '؟'
    if (parts.length === 1) return parts[0].slice(0, 2)
    return (parts[0].charAt(0) || '') + (parts[1].charAt(0) || '')
  }
  function hashNameJs(name) {
    var h = 0
    var s = String(name || '')
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0
    }
    return h
  }
  function avatarJs(name, size) {
    var tone = AVATAR_TONES_JS[hashNameJs(name || '؟') % AVATAR_TONES_JS.length]
    var fontSize = Math.max(10, Math.round(size * 0.38))
    return '<span class="pt-avatar" style="width:' + size + 'px;height:' + size + 'px;background:' + tone + ';font-size:' + fontSize + 'px" role="img" aria-label="' + escJs(name || 'مستخدم') + '">' + escJs(initialsJs(name || '؟')) + '</span>'
  }
  function statusToneJs(s) {
    return Object.prototype.hasOwnProperty.call(STATUS_TONES_JS, s) ? STATUS_TONES_JS[s] : 'default'
  }
  function badgeJs(text, tone) {
    return '<span class="pt-badge pt-badge--' + escJs(tone) + '">' + escJs(text) + '</span>'
  }
  function cellJs(col, value) {
    switch (col.type) {
      case 'avatar':
        return '<span class="pt-cell-avatar">' + avatarJs(typeof value === 'string' ? value : '', 32) + '<span>' + escJs(typeof value === 'string' && value ? value : '—') + '</span></span>'
      case 'badge':
        return badgeJs(value == null ? '—' : String(value), statusToneJs(value == null ? '' : String(value)))
      case 'currency':
        return '<span class="pt-currency">' + escJs(fmtNumJs(Number(value) || 0)) + ' <small>دج</small></span>'
      case 'number':
        return '<span>' + escJs(fmtNumJs(Number(value) || 0)) + '</span>'
      case 'progress':
        var pv = Math.max(0, Math.min(100, Number(value) || 0))
        return '<span class="pt-progress"><span class="pt-progress__track"><span class="pt-progress__fill" style="width:' + pv + '%"></span></span><span class="pt-progress__pct">' + pv + '%</span></span>'
      case 'email':
      case 'phone':
        return '<span class="pt-ltr">' + escJs(typeof value === 'string' && value ? value : '—') + '</span>'
      case 'date':
        return '<span style="white-space:nowrap;font-size:13px;color:var(--pt-muted)">' + escJs(typeof value === 'string' && value ? value : '—') + '</span>'
      default:
        return '<span>' + escJs(typeof value === 'string' && value ? value : typeof value === 'number' ? fmtNumJs(value) : '—') + '</span>'
    }
  }
  function cellStrJs(row, key) {
    var v = row ? row[key] : null
    return v == null ? '' : String(v)
  }

  // ---- التخزين المحلي ----
  function readStore() { try { return JSON.parse(localStorage.getItem(SEED.key) || '{}') } catch (e) { return {} } }
  function writeStore(store) { try { localStorage.setItem(SEED.key, JSON.stringify(store)) } catch (e) {} }
  function storedRows(entityKey) {
    var s = readStore()
    return s && s.entities && Object.prototype.hasOwnProperty.call(s.entities, entityKey) ? s.entities[entityKey] : null
  }
  function saveRows(entityKey, rows) {
    var s = readStore()
    s.entities = s.entities || {}
    s.entities[entityKey] = rows
    writeStore(s)
  }
  function clearRows(entityKey) {
    var s = readStore()
    if (s.entities) delete s.entities[entityKey]
    writeStore(s)
  }
  function currentRows(entityKey) {
    var stored = storedRows(entityKey)
    if (stored != null) return stored.slice()
    var ent = SEED.entities && SEED.entities[entityKey]
    return ent && ent.rows ? ent.rows.slice() : []
  }

  // ---- (الجولة 16) الجلسة: داخل نفس مخزن localStorage للموقع (store.session) ----
  // القراءة دائماً read → تغيير .session → كتابة حتى لا تُفقد كيانات/إعدادات المخزن
  function readSession() {
    var s = readStore()
    return s && s.session && (s.session.role === 'client' || s.session.role === 'admin') ? s.session : null
  }
  function writeSession(role, name, email) {
    var s = readStore()
    s.session = { role: role, name: name, email: email }
    writeStore(s)
  }
  function clearSession() {
    var s = readStore()
    if (s.session) delete s.session
    writeStore(s)
  }
  function colJs(entityKey) {
    var ent = SEED.entities && SEED.entities[entityKey]
    return ent && ent.columns ? ent.columns : []
  }
  function singularOf(entityKey) {
    return SEED.labels && SEED.labels[entityKey] ? SEED.labels[entityKey] : 'عنصر'
  }
  function nameColOf(cols) {
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].type === 'text' || cols[i].type === 'avatar') return cols[i]
    }
    return null
  }
  function priceColOf(cols) {
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].type === 'currency') return cols[i]
    }
    return null
  }
  function rowNameJs(cols, row) {
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].type === 'text' || cols[i].type === 'avatar') {
        var v = row ? row[cols[i].key] : null
        if (typeof v === 'string' && v) return v
      }
    }
    return ''
  }

  // ---- التنبيه العائم ----
  var toastEl = null
  var toastTimer = null
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div')
      toastEl.className = 'pt-toast'
      toastEl.setAttribute('role', 'status')
      toastEl.setAttribute('aria-live', 'polite')
      document.body.appendChild(toastEl)
    }
    toastEl.textContent = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastEl.classList.add('show')
    toastTimer = setTimeout(function () { toastEl.classList.remove('show') }, 2400)
  }

  // ---- إعادة بناء صفوف الجدول من المخزن/البذرة ----
  function tableCardOf(entityKey) {
    var cards = document.querySelectorAll('.blk-table[data-entity]')
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute('data-entity') === entityKey) return cards[i]
    }
    return null
  }
  function rowHtmlJs(cols, row, i, singular, readOnly) {
    var cells = ''
    for (var c = 0; c < cols.length; c++) {
      cells += '<td>' + cellJs(cols[c], row ? row[cols[c].key] : null) + '</td>'
    }
    // (الجولة 16) وضع الزبون للقراءة فقط — بلا عمود إجراءات ولا أزرار تعديل/حذف
    if (readOnly) return '<tr data-idx="' + i + '">' + cells + '</tr>'
    var name = rowNameJs(cols, row) || singular
    return '<tr data-idx="' + i + '">' + cells +
      '<td class="blk-table__act"><span class="pt-rowacts">' +
      '<button type="button" class="pt-rowact" data-edit-row aria-label="تعديل ' + escJs(name) + '" title="تعديل">' + ICON_PENCIL_JS + '</button>' +
      '<button type="button" class="pt-rowact pt-rowact--danger" data-del-row aria-label="حذف ' + escJs(name) + '" title="حذف">' + ICON_TRASH_JS + '</button>' +
      '</span></td></tr>'
  }
  // (الجولة 16) صفوف وضع الزبون: قيمة عمود avatar === اسم الزبونة التجريبية؛
  // لا عمود avatar أو صفر مطابقات → كل الصفوف (نفس قاعدة SSR حرفياً — لا يُفرغ الجدول)
  function clientRowsJs(entityKey, rows) {
    var cols = colJs(entityKey)
    var avatarCol = null
    for (var i = 0; i < cols.length; i++) {
      if (cols[i].type === 'avatar') { avatarCol = cols[i]; break }
    }
    if (!avatarCol) return rows
    var matched = []
    for (var j = 0; j < rows.length; j++) {
      if (rows[j] && rows[j][avatarCol.key] === 'أمينة بلقاسم') matched.push(rows[j])
    }
    return matched.length ? matched : rows
  }
  function renderTbody(card) {
    if (!card) return
    var table = card.querySelector('table.pt-table')
    var entityKey = card.getAttribute('data-entity')
    var cols = colJs(entityKey)
    if (!table || !cols.length) return
    var tbody = table.querySelector('tbody')
    if (!tbody) return
    var readOnly = card.getAttribute('data-client-view') === '1'
    var rows = currentRows(entityKey)
    if (readOnly) rows = clientRowsJs(entityKey, rows)
    var singular = singularOf(entityKey)
    var html = ''
    for (var i = 0; i < rows.length; i++) {
      html += rowHtmlJs(cols, rows[i], i, singular, readOnly)
    }
    if (!rows.length) {
      html = '<tr class="blk-table__empty"><td colspan="' + (cols.length + (readOnly ? 0 : 1)) + '">لا يوجد ' + escJs(singular) + ' بعد' + (readOnly ? '.' : ' — اضغط «إضافة» لإضافة أول عنصر من هنا مباشرة.') + '</td></tr>'
    }
    tbody.innerHTML = html
    refreshTable(table)
  }

  // ---- النوافذ (إضافة/تعديل/حذف) ----
  var activeModal = null
  function closeModal() {
    if (activeModal && activeModal.parentNode) activeModal.parentNode.removeChild(activeModal)
    activeModal = null
  }
  function mountModal(innerHtml) {
    closeModal()
    var wrap = document.createElement('div')
    wrap.className = 'pt-modal'
    wrap.setAttribute('role', 'dialog')
    wrap.setAttribute('aria-modal', 'true')
    wrap.setAttribute('aria-labelledby', 'pt-modal-title')
    wrap.innerHTML = innerHtml
    document.body.appendChild(wrap)
    wrap.addEventListener('click', function (e) { if (e.target === wrap) closeModal() })
    var closeBtn = wrap.querySelector('[data-modal-close]')
    if (closeBtn) closeBtn.addEventListener('click', closeModal)
    activeModal = wrap
    return wrap
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeModal) closeModal()
  })
  function badgesDatalistHtml() {
    var out = '<datalist id="pt-badges">'
    for (var i = 0; i < BADGES_JS.length; i++) out += '<option value="' + escJs(BADGES_JS[i]) + '"></option>'
    return out + '</datalist>'
  }
  function openRowModal(entityKey, idx) {
    var cols = colJs(entityKey)
    if (!cols.length) return
    var rows = currentRows(entityKey)
    var row = (idx != null && idx >= 0 && idx < rows.length) ? rows[idx] : null
    var singular = singularOf(entityKey)
    var nameCol = nameColOf(cols)
    var fieldsHtml = ''
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i]
      var val = row && row[col.key] != null ? String(row[col.key]) : ''
      var isReq = !!(nameCol && col.key === nameCol.key)
      var reqAttr = isReq ? ' data-required="1"' : ''
      var control = ''
      if (col.type === 'number' || col.type === 'currency' || col.type === 'progress') {
        control = '<input class="pt-input" type="number" dir="ltr"' + (col.type === 'progress' ? ' min="0" max="100"' : '') + ' data-field="' + escJs(col.key) + '"' + reqAttr + ' value="' + escJs(val) + '">'
      } else if (col.type === 'badge') {
        control = '<input class="pt-input" type="text" list="pt-badges" data-field="' + escJs(col.key) + '"' + reqAttr + ' value="' + escJs(val) + '">'
      } else if (col.type === 'email' || col.type === 'phone') {
        control = '<input class="pt-input" type="text" dir="ltr" data-field="' + escJs(col.key) + '"' + reqAttr + ' value="' + escJs(val) + '">'
      } else {
        var ph = col.type === 'date' ? ' placeholder="مثال: 15 جانفي 2025"' : ''
        control = '<input class="pt-input" type="text" data-field="' + escJs(col.key) + '"' + reqAttr + ph + ' value="' + escJs(val) + '">'
      }
      fieldsHtml += '<div><label class="pt-label">' + escJs(col.label) + (isReq ? '<span class="pt-required">*</span>' : '') + '</label>' + control + '</div>'
    }
    var modalTitle = idx == null ? 'إضافة ' + singular + ' جديد' : 'تعديل ' + singular
    var modal = mountModal(
      '<div class="pt-modal__card">' +
        '<h3 id="pt-modal-title">' + escJs(modalTitle) + '</h3>' +
        '<p class="pt-modal__note">يُحدَّث الجدول وقسم الموقع المقابل تلقائياً عند الحفظ.</p>' +
        '<form class="pt-modal__grid">' + fieldsHtml + badgesDatalistHtml() +
          '<div class="pt-modal__actions">' +
            '<button type="button" class="pt-btn pt-btn--outline" data-modal-close>إلغاء</button>' +
            '<button type="submit" class="pt-btn pt-btn--primary">' + (idx == null ? 'إضافة' : 'حفظ التعديلات') + '</button>' +
          '</div>' +
        '</form>' +
      '</div>'
    )
    var form = modal.querySelector('form')
    if (!form) return
    var submitBtn = form.querySelector('button[type="submit"]')
    var reqInput = form.querySelector('[data-required]')
    function syncSubmitState() {
      if (submitBtn && reqInput) submitBtn.disabled = String(reqInput.value == null ? '' : reqInput.value).trim() === ''
    }
    form.addEventListener('input', syncSubmitState)
    syncSubmitState()
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var byKey = {}
      var els = form.querySelectorAll('[data-field]')
      for (var j = 0; j < els.length; j++) byKey[els[j].getAttribute('data-field')] = els[j]
      var newRow = {}
      for (var c = 0; c < cols.length; c++) {
        var col2 = cols[c]
        var el2 = byKey[col2.key]
        var v = el2 ? String(el2.value == null ? '' : el2.value) : ''
        if (col2.type === 'number' || col2.type === 'currency' || col2.type === 'progress') {
          newRow[col2.key] = Number(v) || 0
        } else {
          newRow[col2.key] = v.trim()
        }
      }
      var next = currentRows(entityKey)
      if (idx != null && idx >= 0 && idx < next.length) next[idx] = newRow
      else next.push(newRow)
      saveRows(entityKey, next)
      closeModal()
      renderTbody(tableCardOf(entityKey))
      toast(idx == null ? 'أُضيف ' + singular + ' بنجاح ✓' : 'حُدّث ' + singular + ' ✓')
      syncLandingNow()
    })
    var firstInput = form.querySelector('input, select, textarea')
    if (firstInput) firstInput.focus()
  }
  function openDeleteModal(entityKey, idx) {
    var cols = colJs(entityKey)
    if (!cols.length) return
    var rows = currentRows(entityKey)
    if (idx == null || idx < 0 || idx >= rows.length) return
    var singular = singularOf(entityKey)
    var name = rowNameJs(cols, rows[idx]) || singular
    var modal = mountModal(
      '<div class="pt-modal__card pt-modal__card--sm">' +
        '<h3 id="pt-modal-title">حذف ' + escJs(singular) + '</h3>' +
        '<p class="pt-modal__note">هل تريد حذف «' + escJs(name) + '»؟ سيُحذف العنصر المقابل من قسم الموقع أيضاً.</p>' +
        '<div class="pt-modal__actions">' +
          '<button type="button" class="pt-btn pt-btn--outline" data-modal-close>إلغاء</button>' +
          '<button type="button" class="pt-btn" data-modal-confirm style="background:#dc2626;color:#fff">حذف</button>' +
        '</div>' +
      '</div>'
    )
    var confirmBtn = modal.querySelector('[data-modal-confirm]')
    if (!confirmBtn) return
    confirmBtn.addEventListener('click', function () {
      var next = currentRows(entityKey)
      if (idx >= 0 && idx < next.length) next.splice(idx, 1)
      saveRows(entityKey, next)
      closeModal()
      renderTbody(tableCardOf(entityKey))
      toast('حُذف ' + singular + ' ✓')
      syncLandingNow()
    })
  }

  // ---- أحداث مفوَّضة: تعمل على الصفوف المعاد بناؤها أيضاً ----
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null
    if (!t) return
    var addBtn = t.closest('[data-add-row]')
    if (addBtn) {
      var card1 = addBtn.closest('.blk-table')
      if (card1) openRowModal(card1.getAttribute('data-entity'), null)
      return
    }
    var editBtn = t.closest('[data-edit-row]')
    if (editBtn) {
      var card2 = editBtn.closest('.blk-table')
      var tr1 = editBtn.closest('tr')
      if (card2 && tr1 && tr1.getAttribute('data-idx') != null) {
        openRowModal(card2.getAttribute('data-entity'), parseInt(tr1.getAttribute('data-idx'), 10))
      }
      return
    }
    var delBtn = t.closest('[data-del-row]')
    if (delBtn) {
      var card3 = delBtn.closest('.blk-table')
      var tr2 = delBtn.closest('tr')
      if (card3 && tr2 && tr2.getAttribute('data-idx') != null) {
        openDeleteModal(card3.getAttribute('data-entity'), parseInt(tr2.getAttribute('data-idx'), 10))
      }
      return
    }
    var resetBtn = t.closest('[data-reset-entity]')
    if (resetBtn) {
      var card4 = resetBtn.closest('.blk-table')
      if (card4) {
        clearRows(card4.getAttribute('data-entity'))
        renderTbody(card4)
        toast('استُعيدت البيانات الأصلية ✓')
        syncLandingNow()
      }
    }
  })

  // ===== (الجولة 16) الأدوار والجلسة: تبديل الدور + تسجيل الخروج + طلب الخطة =====
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null
    if (!t) return
    // تبديل محدد الدور في بطاقة الدخول: is-on + aria-checked + نص الملاحظة
    var roleBtn = t.closest('.blk-role[data-role]')
    if (roleBtn) {
      var group = roleBtn.closest('.blk-auth__roles')
      if (group) {
        var roleVal = roleBtn.getAttribute('data-role')
        group.querySelectorAll('.blk-role').forEach(function (b) {
          var on = b === roleBtn
          b.classList.toggle('is-on', on)
          b.setAttribute('aria-checked', on ? 'true' : 'false')
        })
        var authCard2 = roleBtn.closest('.blk-auth__card')
        var note = authCard2 ? authCard2.querySelector('.blk-auth__role-note') : null
        if (note) note.textContent = roleVal === 'admin' ? (note.getAttribute('data-note-admin') || '') : (note.getAttribute('data-note-client') || '')
      }
      return
    }
    // تسجيل الخروج: فرّغ الجلسة ثم انقل إلى رابط صفحة الدخول
    var logoutLink = t.closest('[data-logout]')
    if (logoutLink) {
      e.preventDefault()
      clearSession()
      var logoutHref = logoutLink.getAttribute('href')
      if (logoutHref) window.location.href = logoutHref
      return
    }
    // زبون مسجّل يضغط زر خطة في صفحة الأسعار → صف حقيقي في كيان orders
    // يظهر في «طلباتي» (فلترة الزبون) وفي جدول طلبات المدير (بلا فلترة)
    var planBtn = t.closest('a.pt-btn[data-plan-name]')
    if (planBtn) {
      var clientHref = document.body.getAttribute('data-client-href')
      var session = readSession()
      if (!clientHref || !session || session.role !== 'client') return
      var ordersEnt = SEED.entities && SEED.entities.orders
      if (!ordersEnt || !ordersEnt.columns || !ordersEnt.columns.length) return
      e.preventDefault()
      var planName = planBtn.getAttribute('data-plan-name') || ''
      var planPrice = Number(planBtn.getAttribute('data-plan-price')) || 0
      var orderRows = currentRows('orders')
      orderRows.push({
        id: 'ORD-' + (Date.now() % 100000),
        customer: session.name,
        item: planName,
        quantity: 1,
        total: planPrice,
        date: new Date().toISOString().slice(0, 10),
        status: 'جديد'
      })
      saveRows('orders', orderRows)
      toast('تم استلام طلبك ✓ — يظهر الآن في «طلباتي»')
      // مهلة قصيرة تُظهر التنبيه قبل الانتقال إلى فضاء الزبون
      setTimeout(function () { window.location.href = clientHref }, 800)
    }
  })

  // ---- تزامن صفحة الموقع: المعرض والفريق يتبعان صفوف الجداول ----
  function applyStoredToLanding() {
    var grids = document.querySelectorAll('.blk-gallery__grid[data-gallery-variant]')
    for (var g = 0; g < grids.length; g++) {
      var grid = grids[g]
      var variant = grid.getAttribute('data-gallery-variant')
      var entityKey = SEED.entityByVariant ? SEED.entityByVariant[variant] : null
      if (!entityKey || storedRows(entityKey) == null) continue
      var rows = storedRows(entityKey)
      var cols = colJs(entityKey)
      var nameCol = nameColOf(cols)
      if (!nameCol) continue
      var priceCol = priceColOf(cols)
      for (var i = 0; i < rows.length; i++) {
        var name = cellStrJs(rows[i], nameCol.key)
        var priceVal = priceCol ? (Number(rows[i][priceCol.key]) || 0) : 0
        var card = grid.children[i]
        if (card) {
          var titleEl = card.querySelector('.blk-gallery__title')
          if (titleEl) titleEl.textContent = name
          var priceEl = card.querySelector('.blk-gallery__price')
          if (priceVal > 0) {
            var priceHtml = escJs(fmtNumJs(priceVal)) + ' <small>دج</small>'
            if (priceEl) priceEl.innerHTML = priceHtml
            else {
              var rowEl = card.querySelector('.blk-gallery__row')
              if (rowEl) {
                var priceP = document.createElement('p')
                priceP.className = 'blk-gallery__price'
                priceP.innerHTML = priceHtml
                rowEl.appendChild(priceP)
              }
            }
          } else if (priceEl && priceEl.parentNode) {
            priceEl.parentNode.removeChild(priceEl)
          }
        } else {
          var letter = name.trim().charAt(0) || '؟'
          var art = document.createElement('article')
          art.className = 'blk-gallery__item'
          art.innerHTML =
            '<div class="blk-gallery__thumb" style="background:' + GALLERY_GRADIENTS_JS[i % 4] + '" role="img" aria-label="صورة رمزية لـ ' + escJs(name) + '">' +
              '<span class="blk-gallery__letter" aria-hidden="true">' + escJs(letter) + '</span>' +
            '</div>' +
            '<div class="blk-gallery__body"><div class="blk-gallery__row">' +
              '<h3 class="blk-gallery__title">' + escJs(name) + '</h3>' +
              (priceVal > 0 ? '<p class="blk-gallery__price">' + escJs(fmtNumJs(priceVal)) + ' <small>دج</small></p>' : '') +
            '</div></div>'
          grid.appendChild(art)
        }
      }
      while (grid.children.length > rows.length) {
        grid.removeChild(grid.children[grid.children.length - 1])
      }
    }
    var teamGrids = document.querySelectorAll('.blk-team__grid[data-team-grid]')
    for (var t = 0; t < teamGrids.length; t++) {
      var tGrid = teamGrids[t]
      var tKey = 'teamMembers'
      if (storedRows(tKey) == null) continue
      var tRows = storedRows(tKey)
      var tCols = colJs(tKey)
      var tNameCol = nameColOf(tCols)
      if (!tNameCol) continue
      var tRoleCol = null
      for (var rc = 0; rc < tCols.length; rc++) {
        if (tCols[rc].key === 'role') { tRoleCol = tCols[rc]; break }
      }
      for (var m = 0; m < tRows.length; m++) {
        var mName = cellStrJs(tRows[m], tNameCol.key)
        var mRole = tRoleCol ? cellStrJs(tRows[m], tRoleCol.key) : ''
        var tCard = tGrid.children[m]
        if (tCard) {
          var nameEl = tCard.querySelector('.blk-team__name')
          if (nameEl) nameEl.textContent = mName
          var roleEl = tCard.querySelector('.blk-team__role')
          if (roleEl) roleEl.textContent = mRole
        } else {
          var member = document.createElement('article')
          member.className = 'blk-team__card'
          member.innerHTML = avatarJs(mName, 56) +
            '<p class="blk-team__name">' + escJs(mName) + '</p>' +
            '<p class="blk-team__role">' + escJs(mRole) + '</p>'
          tGrid.appendChild(member)
        }
      }
      while (tGrid.children.length > tRows.length) {
        tGrid.removeChild(tGrid.children[tGrid.children.length - 1])
      }
    }
  }
  function syncLandingNow() { applyStoredToLanding() }

  // ---- حفظ نموذج الإعدادات محلياً (دون استبدال النموذج) ----
  function settingsStoreKey() { return SEED.key + ':settings' }
  function handleSettingsSave(form, e) {
    if (e && e.preventDefault) e.preventDefault()
    var map = {}
    var els = form.querySelectorAll('[data-skey]')
    for (var i = 0; i < els.length; i++) {
      var el = els[i]
      var k = el.getAttribute('data-skey')
      if (!k) continue
      if (el.tagName === 'BUTTON') {
        map[k] = el.classList.contains('on') ? 'true' : 'false'
      } else if (el.tagName === 'SELECT') {
        map[k] = String(el.value == null ? '' : el.value)
      } else if (el.tagName === 'INPUT') {
        if (String(el.getAttribute('type') || '').toLowerCase() === 'password') continue
        map[k] = String(el.value == null ? '' : el.value)
      }
    }
    try { localStorage.setItem(settingsStoreKey(), JSON.stringify(map)) } catch (err) {}
    toast('تم حفظ الإعدادات محلياً ✓')
  }
  function applyStoredSettings() {
    var raw = null
    try { raw = localStorage.getItem(settingsStoreKey()) } catch (e) { return }
    if (!raw) return
    var map
    try { map = JSON.parse(raw) } catch (e) { return }
    if (!map || typeof map !== 'object') return
    var els = document.querySelectorAll('[data-skey]')
    for (var i = 0; i < els.length; i++) {
      var el = els[i]
      var k = el.getAttribute('data-skey')
      if (!k || !Object.prototype.hasOwnProperty.call(map, k)) continue
      if (el.tagName === 'BUTTON') {
        var on = String(map[k]) === 'true'
        el.classList.toggle('on', on)
        el.setAttribute('aria-checked', on ? 'true' : 'false')
      } else {
        el.value = map[k]
      }
    }
  }

  // ---- (الجولة 16) انعكاس هوية الجلسة على بطاقات المستخدم (الشريط والتروستة) ----
  function applySessionIdentity(session) {
    document.querySelectorAll('[data-user-name]').forEach(function (el) {
      el.textContent = session.name
    })
    document.querySelectorAll('[data-user-email]').forEach(function (el) {
      el.textContent = session.email
    })
    document.querySelectorAll('.pt-avatar[data-user-avatar]').forEach(function (av) {
      var w = parseInt((av.style && av.style.width) || '', 10)
      av.outerHTML = avatarJs(session.name, w || 28)
    })
  }

  // ---- الحالة الأولى: حراسة الجلسة ثم طبّق المخزن المحلي (جداول + صفحة الموقع + الإعدادات) ----
  function initPage() {
    // (الجولة 16) صفحات منطقة اللوحة محروسة: لا جلسة أو دور الجلسة ≠ جمهور
    // الصفحة → أعِد التوجيه إلى صفحة الدخول ووقف بقية التهيئة (لا وميض)
    var audience = document.body.getAttribute('data-audience')
    var loginHref = document.body.getAttribute('data-login-href')
    if (audience && loginHref) {
      var guard = readSession()
      if (!guard || guard.role !== audience) {
        window.location.href = loginHref
        return
      }
    }
    var session = readSession()
    if (session) applySessionIdentity(session)
    applyStoredSettings()
    Array.prototype.slice.call(document.querySelectorAll('.blk-table[data-entity]')).forEach(function (card) {
      if (storedRows(card.getAttribute('data-entity')) != null) renderTbody(card)
    })
    applyStoredToLanding()
  }
  initPage()
})()
`
}

// ============================================================
// netlify.toml + README.md
// ============================================================
function buildNetlifyToml(): string {
  return `# SIVAR — إعداد النشر على Netlify (موقع ثابت، لا خطوات بناء)
[build]
  publish = "."
`
}

function buildReadmeMd(schema: ProjectSchema): string {
  const name = schema.metadata.name || 'مشروعك'
  const hasLogo = !!dataUrlToAsset(schema.branding?.logo ?? '')
  const imageCount = collectSchemaImages(schema).length
  const hasBrandBg = !!dataUrlToAsset(brandingBgImage(schema))
  return `# ${name} — نموذج أولي جاهز للنشر

مشروعك جاهز! هذه حزمة موقع ثابت (HTML + CSS + JS بدون أي مكتبات) أُنشئت بواسطة منصة **SIVAR**.

## محتويات الملفات

| الملف / المجلد | الوصف |
| --- | --- |
| \`index.html\` | الصفحة الرئيسية لموقعك |
| \`styles.css\` | كل التنسيقات والألوان (سهل التعديل) |
| \`script.js\` | تفاعلات خفيفة: القائمة، النماذج، بحث الجداول وترقيم صفحاتها، تروستة اللوحة (بحث/إشعارات/قائمة المستخدم)، مهام قابلة للتحديد، زر العودة للخلف والأعلى، تلميحات الرسوم البيانية عند التمرير، ظهور الأقسام عند التمرير |
| \`404.html\` | صفحة الخطأ |
| \`netlify.toml\` | إعداد النشر على Netlify |
${hasLogo ? '| \`assets/logo.*\` | شعار مشروعك — يظهر في الترويسة والتذييل وكأيقونة المتصفح |\n' : ''}${imageCount > 0 ? '| \`assets/img-*.jpg|png|webp\` | صور الأقسام المرفوعة (خلفية البطل والأقسام وصور بطاقات المعرض والفريق) |\n' : ''}${hasBrandBg ? '| \`assets/bg.*\` | خلفية المشروع الثابتة خلف كل الصفحات |\n' : ''}| باقي المجلدات | صفحة لكل قسم من موقعك |

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

أُنشئ هذا النموذج بواسطة منصة **SIVAR** — منصة جزائرية لتحويل الأفكار إلى نماذج أولية.

## إدارة المحتوى داخل الموقع (وضع تجريبي)
- من أي صفحة جدول في لوحة التحكم يمكنك إضافة وتعديل وحذف العناصر (منتجات، خدمات، أعضاء...) بزر «إضافة» وأيقونات كل صف — بدون أي خادم.
- التعديلات تُطبَّق فوراً على صفحات الموقع المقابلة (المعرض/الفريق) وتُحفظ محلياً في متصفحك (localStorage).
- زر «إعادة الضبط» في تذييل كل جدول يعيد البيانات الأصلية.
- نموذج الإعدادات يحفظ قيمه محلياً في متصفحك أيضاً.

## الدخول بالأدوار (وضع تجريبي)
- من صفحة الدخول اختر كيف تدخل: «كزبون» يأخذك مباشرة إلى فضاء الزبون (طلباتك وملفك الشخصي)، أو «كمدير» يفتح لك لوحة تحكم الموقع الكاملة — أدخل بأي بريد وكلمة مرور.
- تُحفظ جلسة الدخول محلياً في متصفحك فقط (localStorage) — لا حسابات حقيقية في هذا الوضع التجريبي.
- صفحات لوحة التحكم وفضاء الزبون تتحقق من دورك عند الفتح: إن اختلف دور الجلسة عن جمهور الصفحة تُعاد تلقائياً إلى صفحة الدخول.
- زبون مسجّل يضغط زر أي خطة في صفحة الأسعار → يُنشأ طلب حقيقي (محلي تجريبي) يظهر فوراً في «طلباتي» داخل فضاء الزبون وفي جدول طلبات المدير.
- «تسجيل الخروج» في قائمة الحساب أعلى اللوحة يفرّغ الجلسة ويعيدك إلى صفحة الدخول.
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
  svg += `<defs><linearGradient id="bar-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-primary);stop-opacity:1"/><stop offset="100%" style="stop-color:var(--pt-primary);stop-opacity:.62"/></linearGradient><linearGradient id="barhi-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-accent);stop-opacity:1"/><stop offset="100%" style="stop-color:var(--pt-accent);stop-opacity:.62"/></linearGradient></defs>`

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
    // العمود الأعلى بتدرّج accent (أكثر نية تصميمية) + حركة نمو متتابعة
    const isMax = d.value === max && max > 0
    const fill = isMax ? `url(#barhi-${gid})` : `url(#bar-${gid})`
    const tip = `${esc(d.label)}: ${esc(d.value.toLocaleString('en-US'))}`
    svg += `<g data-tip="${tip}"><title>${esc(d.label)}: ${esc(d.value.toLocaleString('en-US'))}</title><path class="pt-anim-bar" d="${topRoundedRect(x, y, barW, h, 6)}" style="fill:${fill};animation-delay:${i * 60}ms"/></g>`
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
  svg += `<defs><linearGradient id="area-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-primary);stop-opacity:.26"/><stop offset="100%" style="stop-color:var(--pt-primary);stop-opacity:.02"/></linearGradient><linearGradient id="line-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-primary);stop-opacity:1"/><stop offset="100%" style="stop-color:color-mix(in srgb,var(--pt-primary) 55%,#fff);stop-opacity:1"/></linearGradient></defs>`
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = baseline - areaH * f
    svg += `<line x1="${padX}" y1="${y}" x2="${W - padX}" y2="${y}" style="stroke:var(--pt-border);stroke-width:1"${f === 0 ? '' : ' stroke-dasharray="4 6"'}/>`
    svg += `<text x="${W - padX + 8}" y="${y + 3.5}" text-anchor="start" style="fill:var(--pt-muted);font-size:10px">${esc(compactNum(min + span * f))}</text>`
  }
  svg += `<path d="${area}" class="pt-anim-area" style="fill:url(#area-${gid})"/>`
  svg += `<path d="${line}" pathLength="1" class="pt-anim-line" style="fill:none;stroke:url(#line-${gid});stroke-width:3;stroke-linecap:round"/>`
  pts.forEach((p, i) => {
    const tip = `${esc(rtl[i].label)}: ${esc(rtl[i].value.toLocaleString('en-US'))}`
    svg += `<g data-tip="${tip}"><title>${esc(rtl[i].label)}: ${esc(rtl[i].value.toLocaleString('en-US'))}</title><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3.5" style="fill:var(--pt-primary);stroke:var(--pt-surface);stroke-width:2"/><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="14" fill="transparent" tabindex="0" data-tip="${tip}"/></g>`
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
    const pct = Math.round(seg.frac * 100)
    const tip = `${esc(seg.label)}: ${esc(seg.value.toLocaleString('en-US'))} (${pct}%)`
    svg += `<g class="pt-donut-seg" data-tip="${tip}"><title>${esc(seg.label)}: ${esc(seg.value.toLocaleString('en-US'))} (${pct}%)</title><circle cx="80" cy="80" r="${R}" style="fill:none;stroke:${color};stroke-dasharray:${len} ${C - len};stroke-dashoffset:${offset}"/></g>`
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
  /** مسار نسبي لصورة مجمّعة (assets/img-{n}) من هذه الصفحة أو null إن لم تُجمّع */
  imgSrc: (dataUrl: string) => string | null
  /** خلفية المشروع الثابتة (assets/bg) أو null إن لا خلفية */
  pageBg: { src: string; overlay: string } | null
  /** معرّف الصفحة الجاري عرضها (لأهداف الأزرار الذكية) */
  pageId: string
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

function sectionWrap(inner: string, tight = false, id = '', bg: SectionBg = EMPTY_SECTION_BG): string {
  return `<section${id ? ` id="${esc(id)}"` : ''} class="blk-section${tight ? ' blk-section--tight' : ''}${bg.cls}"${bg.style}><div class="blk-section__inner">${inner}</div></section>`
}

/** خلفية صورة لقسم تسويقي (bgImage/bgOverlay) — نفس دلالات البطل (Task 9-b) */
interface SectionBg {
  cls: string
  style: string
}
const EMPTY_SECTION_BG: SectionBg = { cls: '', style: '' }

const SECTION_BG_OVERLAY_KINDS: ReadonlySet<string> = new Set(['dark', 'medium', 'light', 'none'])

/** يقرأ bgImage/bgOverlay من خصائص القسم ويعيد صنف+نمط الخلفية (فارغ دون صورة) */
function sectionBgOf(p: Record<string, unknown>, ctx: RenderCtx): SectionBg {
  const bgImage = S(p, 'bgImage')
  if (!bgImage.trim()) return EMPTY_SECTION_BG
  const src = ctx.imgSrc(bgImage)
  if (!src) return EMPTY_SECTION_BG
  const overlayRaw = S(p, 'bgOverlay')
  const overlay = SECTION_BG_OVERLAY_KINDS.has(overlayRaw) ? overlayRaw : 'dark'
  const layers = overlay === 'none' ? '' : `${HERO_OVERLAY_GRADIENTS[overlay]},`
  const cls =
    overlay === 'light'
      ? ' blk-section--onimage blk-section--onimage-light'
      : overlay === 'none'
        ? ' blk-section--onimage blk-section--onimage-none'
        : ' blk-section--onimage'
  return {
    cls,
    style: ` style="background-image:${layers}url('${esc(src)}');background-size:cover;background-position:center"`,
  }
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
  if (delayMs <= 0) return `${withClass}${rest}`
  // Task 12-c — دمج التأخير داخل سمة style موجودة (غلاف pt-secvars أو
  // خلفية صورة القسم) بدل إضافة سمة ثانية مكررة يتجاهلها المتصفح ويصبح
  // معها الـ HTML غير صالح وتضيع قيمة التأخير.
  const delayDecl = `transition-delay:${delayMs}ms`
  const styleIdx = withClass.indexOf('style="')
  if (styleIdx >= 0) {
    const open = styleIdx + 'style="'.length
    const close = withClass.indexOf('"', open)
    if (close >= 0) {
      const existing = withClass.slice(open, close)
      const merged = existing ? `${delayDecl};${existing}` : delayDecl
      return `${withClass.slice(0, open)}${merged}${withClass.slice(close)}${rest}`
    }
  }
  return `${withClass} style="${delayDecl}"${rest}`
}

// ============================================================
// عرض المكوّنات — 28 نوعاً (+ غلاف ألوان القسم من Task 12)
// ============================================================
function renderBlockInner(block: Block, ctx: RenderCtx): string {
  const p = block.props ?? {}
  switch (block.type) {
    case 'hero':
      return renderHero(p, ctx)
    case 'features':
      return renderFeatures(p, ctx)
    case 'stats':
      return renderStats(p, ctx)
    case 'steps':
      return renderSteps(p, ctx)
    case 'pricing':
      return renderPricing(p, ctx)
    case 'testimonials':
      return renderTestimonials(p, ctx)
    case 'faq':
      return renderFaq(p, ctx)
    case 'cta':
      return renderCta(p, ctx)
    case 'contact-form':
      return renderContactForm(p)
    case 'gallery':
      return renderGallery(p, ctx)
    case 'banner':
      return renderBanner(p, ctx)
    case 'list':
      return renderList(p)
    case 'team':
      return renderTeam(p, ctx)
    case 'auth-card':
      return renderAuthCard(p, ctx)
    case 'dashboard-header':
      return renderDashboardHeader(p, ctx)
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
      return renderState('empty', p, ctx)
    case 'loading-state':
      return renderState('loading', p, ctx)
    case 'error-state':
      return renderState('error', p, ctx)
    case 'calendar':
      return renderCalendar(p)
    case 'custom-html':
      return renderCustomHtml(p)
    case 'activity-feed':
      return renderActivityFeed(p)
    case 'tasks-list':
      return renderTasksList(p)
    case 'quick-actions':
      return renderQuickActions(p, ctx)
    default:
      return ''
  }
}

/**
 * عرض مكوّن واحد مع غلاف ألوان القسم (Task 12) — نقطة واحدة
 * يستفيدها كل القشور الثلاث (site/auth/dashboard): متغيرات CSS
 * تتوارثها عناصر القسم الداخلية تلقائياً — بلا ألوان: كما كان.
 */
function renderBlock(block: Block, ctx: RenderCtx): string {
  const html = renderBlockInner(block, ctx)
  if (!html) return html
  return wrapSectionVars(html, block.props ?? {})
}

// ---------- hero ----------
const LEAD_SOCIAL_NAMES: string[] = ['أحمد بن علي', 'سارة بوزيد', 'ياسين مراد']

/** أنواع الرسم الجانبي (عقد R9 المشترك مع عارض React) */
const HERO_VISUAL_KINDS: ReadonlySet<string> = new Set([
  'dashboard', 'phone', 'video', 'form', 'analytics', 'orders', 'chat', 'calendar', 'testimonial', 'none',
])
/** رسوم جانبية في التخطيط المقسّم */
const SIDE_VISUAL_KINDS: ReadonlySet<string> = new Set([
  'dashboard', 'phone', 'video', 'analytics', 'orders', 'chat', 'calendar', 'testimonial',
])
/** ما يُكدَّس أسفل النص في التخطيط الموسّط (قاعدة قائمة) */
const STACK_VISUAL_KINDS: ReadonlySet<string> = new Set(['phone', 'video'])

/** عدّاد معرّفات فريدة لمنحنيات الرسوم التوضيحية */
let MOCK_SEQ = 0

/** منحنى SVG أملس (Catmull-Rom عبر smoothPath) للرسوم التوضيحية — بتلميح hover */
function mockCurveSvg(
  points: Array<{ label: string; value: number }>,
  o: { w: number; h: number; padX: number; padTop: number; padBottom: number; grid: number; strokeW: number; visibleLabels: number[] }
): string {
  MOCK_SEQ += 1
  const gid = `mock${MOCK_SEQ}`
  const { w, h, padX, padTop, padBottom, grid, strokeW } = o
  const areaW = w - padX * 2
  const areaH = h - padTop - padBottom
  const baseline = padTop + areaH
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const span = (Math.max(...values) - min) || 1
  const pts = points.map((p, i) => ({
    x: padX + (points.length > 1 ? (areaW / (points.length - 1)) * i : areaW / 2),
    y: padTop + areaH * (1 - 0.08 - ((p.value - min) / span) * 0.84),
  }))
  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},${baseline} L${pts[0].x.toFixed(2)},${baseline} Z`

  let svg = `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">`
  svg += `<defs><linearGradient id="area-${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style="stop-color:var(--pt-primary);stop-opacity:.28"/><stop offset="100%" style="stop-color:var(--pt-primary);stop-opacity:.02"/></linearGradient></defs>`
  for (let i = 1; i <= grid; i++) {
    const y = padTop + areaH * (i / (grid + 1))
    svg += `<line x1="${padX}" y1="${y.toFixed(1)}" x2="${w - padX}" y2="${y.toFixed(1)}" style="stroke:var(--pt-border);stroke-width:1;stroke-dasharray:4 6"/>`
  }
  svg += `<path d="${area}" class="pt-anim-area" style="fill:url(#area-${gid})"/>`
  svg += `<path d="${line}" pathLength="1" class="pt-anim-line" style="fill:none;stroke:var(--pt-primary);stroke-width:${strokeW};stroke-linecap:round"/>`
  points.forEach((p, i) => {
    const tip = `${esc(p.label)}: ${esc(p.value.toLocaleString('en-US'))}`
    svg += `<g data-tip="${tip}"><circle cx="${pts[i].x.toFixed(1)}" cy="${pts[i].y.toFixed(1)}" r="3.5" style="fill:#fff;stroke:var(--pt-primary);stroke-width:2"/><circle cx="${pts[i].x.toFixed(1)}" cy="${pts[i].y.toFixed(1)}" r="13" fill="transparent" data-tip="${tip}"/></g>`
  })
  for (const i of o.visibleLabels) {
    if (!points[i]) continue
    svg += `<text x="${pts[i].x.toFixed(1)}" y="${h - 5}" text-anchor="middle" style="fill:var(--pt-muted);font-size:9.5px">${esc(points[i].label)}</text>`
  }
  svg += '</svg>'
  return svg
}

/** موك لوحة تحكم واقعية: نافذة بشريط علوي + شريط جانبي + مؤشرات ومنحنى وطلبات */
const DASH_CURVE: Array<{ label: string; value: number }> = [
  { label: 'جانفي', value: 32 },
  { label: 'فيفري', value: 45 },
  { label: 'مارس', value: 38 },
  { label: 'أفريل', value: 56 },
  { label: 'ماي', value: 50 },
  { label: 'جوان', value: 68 },
  { label: 'جويلية', value: 82 },
]
const DASH_ORDERS: Array<{ name: string; status: string; tone: string; amount: string }> = [
  { name: 'أحمد بن علي', status: 'جديد', tone: 'warning', amount: '12,500 دج' },
  { name: 'سارة بوزيد', status: 'مكتمل', tone: 'success', amount: '8,200 دج' },
  { name: 'ياسين مراد', status: 'قيد المعالجة', tone: 'warning', amount: '24,300 دج' },
]

function heroDashboardVisualHtml(): string {
  const navRows = [
    { label: 'لوحة التحكم', icon: 'home', active: true },
    { label: 'الطلبات', icon: 'shopping-bag', active: false },
    { label: 'العملاء', icon: 'users', active: false },
    { label: 'الإعدادات', icon: 'settings', active: false },
  ]
    .map(
      (r) =>
        `<span class="pt-mock-nav${r.active ? ' pt-mock-nav--active' : ''}">${iconSvg(r.icon, 13)}<span>${esc(r.label)}</span></span>`
    )
    .join('')
  const kpis = [
    { label: 'الإيرادات', value: '3.4م دج', change: '+12.5%' },
    { label: 'الطلبات', value: '1,248', change: '+8.2%' },
    { label: 'العملاء', value: '5,880', change: '+4.6%' },
  ]
    .map((k) => `<div class="pt-mock-kpi"><span>${esc(k.label)}</span><b>${esc(k.value)}</b>${badgeHtml(k.change, 'success')}</div>`)
    .join('')
  const orders = DASH_ORDERS.map(
    (o) =>
      `<div class="pt-mock-row">${avatarHtml(o.name, 26)}<div class="pt-mock-row__body"><p class="pt-mock-row__name">${esc(o.name)}</p></div>${badgeHtml(o.status, o.tone)}<span class="pt-mock-row__amount">${esc(o.amount)}</span></div>`
  ).join('')

  return `<div class="blk-hero__visual" role="img" aria-label="رسم توضيحي لواجهة لوحة تحكم — إيرادات وطلبات عملاء">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock pt-mock-dash" aria-hidden="true">
    <div class="pt-mock-dash__topbar">
      <span class="pt-mock-dots"><span></span><span></span><span></span></span>
      <span class="pt-mock-dash__addr" dir="ltr">app.example.dz</span>
      <span class="pt-mock-dash__bell">${iconSvg('bell', 14)}<span class="pt-mock-dash__belldot"></span></span>
    </div>
    <div class="pt-mock-dash__body">
      <div class="pt-mock-dash__side">
        <span class="pt-mock-dash__brand"><i></i><b>لوحتي</b></span>
        ${navRows}
      </div>
      <div class="pt-mock-dash__main">
        <div class="pt-mock-kpis">${kpis}</div>
        <div class="pt-mock-chart">${mockCurveSvg(DASH_CURVE, { w: 340, h: 128, padX: 12, padTop: 12, padBottom: 20, grid: 2, strokeW: 2.5, visibleLabels: [0, 2, 4] })}</div>
        <div class="pt-mock-rows">${orders}</div>
      </div>
    </div>
  </div>
  <div class="pt-mock-chip--float" aria-hidden="true">
    <span class="pt-mock-chip__dot"></span>
    <span class="pt-mock-chip__text"><b>طلب جديد من وهران</b><span>12,500 دج — قبل دقيقتين</span></span>
  </div>
</div>`
}

/** موك هاتف واقعي: حالة النظام + رصيد متدرج + إجراءات + مخطط أعمدة + حركات */
const PHONE_BARS_PCT: number[] = [40, 65, 50, 80, 60, 90]

function heroPhoneVisualHtml(): string {
  const bars = PHONE_BARS_PCT.map(
    (p, i) => `<span class="pt-mock-phone__bar pt-anim-bar" style="height:${p}%;animation-delay:${160 + i * 70}ms"></span>`
  ).join('')
  const actions = [
    { label: 'تحويل', icon: 'send' },
    { label: 'طلب', icon: 'shopping-bag' },
    { label: 'فواتير', icon: 'file-text' },
    { label: 'المزيد', icon: 'more-horizontal' },
  ]
    .map((a) => `<span class="pt-mock-phone__action"><i>${iconSvg(a.icon, 15)}</i><span>${esc(a.label)}</span></span>`)
    .join('')
  const tabs = [
    { label: 'الرئيسية', icon: 'home', active: true },
    { label: 'الطلبات', icon: 'shopping-bag', active: false },
    { label: 'الرسائل', icon: 'message-circle', active: false },
    { label: 'الحساب', icon: 'user', active: false },
  ]
    .map((t) => `<span class="pt-mock-tab${t.active ? ' pt-mock-tab--active' : ''}">${iconSvg(t.icon, 15)}<span>${esc(t.label)}</span></span>`)
    .join('')
  const txs = [
    { name: 'أحمد بن علي', sub: 'تحويل صادر', amount: '−2,400 دج', incoming: false },
    { name: 'سارة بوزيد', sub: 'طلب جديد', amount: '+12,500 دج', incoming: true },
  ]
    .map(
      (t) =>
        `<div class="pt-mock-tx">${avatarHtml(t.name, 26)}<div class="pt-mock-tx__body"><p class="pt-mock-tx__name">${esc(t.name)}</p><p class="pt-mock-tx__sub">${esc(t.sub)}</p></div><span class="pt-mock-tx__amt${t.incoming ? ' pt-mock-tx__amt--in' : ''}">${esc(t.amount)}</span></div>`
    )
    .join('')

  return `<div class="blk-hero__visual pt-mock-phone-wrap" role="img" aria-label="موك هاتف يعرض واجهة تطبيق — رصيد وإجراءات سريعة وحركات مالية">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock-phone" aria-hidden="true">
    <div class="pt-mock-phone__status" dir="ltr"><span>9:41</span><span class="pt-mock-phone__status-icons">${iconSvg('signal', 12)}${iconSvg('wifi', 12)}${iconSvg('battery', 14)}</span></div>
    <span class="pt-mock-phone__notch"></span>
    <div class="pt-mock-phone__head">
      ${avatarHtml('س', 30)}
      <div class="pt-mock-phone__hi"><b>صباح الخير، سارة</b><span>إليك ملخص اليوم</span></div>
      <span class="pt-mock-phone__bell">${iconSvg('bell', 15)}<span class="pt-mock-phone__belldot"></span></span>
    </div>
    <div class="pt-mock-phone__balance">
      <span>الرصيد الحالي</span>
      <b>248,500 دج</b>
      <span class="pt-mock-phone__bchip">+12.5% هذا الشهر</span>
    </div>
    <div class="pt-mock-phone__actions">${actions}</div>
    <div class="pt-mock-phone__chart">
      <div class="pt-mock-phone__chart-title"><b>آخر 7 أيام</b><span>دج</span></div>
      <div class="pt-mock-phone__bars">${bars}</div>
    </div>
    <div class="pt-mock-phone__txs">${txs}</div>
    <div class="pt-mock-phone__tabs">${tabs}</div>
    <span class="pt-mock-phone__homebar"></span>
  </div>
</div>`
}

/** بطاقة تحليلات: منحنى أداء كبير + 3 مؤشرات */
const ANALYTICS_CURVE: Array<{ label: string; value: number }> = [
  { label: 'يوم 3', value: 18 },
  { label: 'يوم 6', value: 26 },
  { label: 'يوم 9', value: 22 },
  { label: 'يوم 12', value: 34 },
  { label: 'يوم 15', value: 46 },
  { label: 'يوم 18', value: 58 },
  { label: 'يوم 21', value: 66 },
  { label: 'يوم 24', value: 78 },
  { label: 'يوم 27', value: 86 },
  { label: 'يوم 30', value: 94 },
]

function heroAnalyticsVisualHtml(): string {
  const chips = [
    { label: 'النمو', value: '+12.5%', up: true },
    { label: 'معدل التحويل', value: '3.8%', up: false },
    { label: 'متوسط الطلب', value: '4,200 دج', up: false },
  ]
    .map((c) => `<div class="pt-mock-chipstat${c.up ? ' pt-mock-chipstat--up' : ''}"><span>${esc(c.label)}</span><b>${esc(c.value)}</b></div>`)
    .join('')
  return `<div class="blk-hero__visual" role="img" aria-label="بطاقة تقرير أداء — منحنى نمو صاعد ومؤشرات رئيسية">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock pt-mock-analytics" aria-hidden="true">
    <div class="pt-mock-analytics__head"><b>تقرير الأداء</b>${badgeHtml('آخر 30 يوماً', 'primary')}</div>
    <div class="pt-mock-chart-lg">${mockCurveSvg(ANALYTICS_CURVE, { w: 520, h: 180, padX: 14, padTop: 18, padBottom: 16, grid: 4, strokeW: 3, visibleLabels: [] })}</div>
    <div class="pt-mock-chips">${chips}</div>
  </div>
</div>`
}

/** بطاقة أحدث الطلبات: 5 صفوف بمدن وحالات ومبالغ */
const MOCK_ORDERS: Array<{ name: string; city: string; status: string; tone: string; amount: string; date: string }> = [
  { name: 'أحمد بن علي', city: 'الجزائر', status: 'مكتمل', tone: 'success', amount: '12,500 دج', date: 'اليوم 10:24' },
  { name: 'سارة بوزيد', city: 'وهران', status: 'جديد', tone: 'warning', amount: '8,200 دج', date: 'اليوم 09:51' },
  { name: 'ياسين مراد', city: 'قسنطينة', status: 'قيد المعالجة', tone: 'warning', amount: '24,300 دج', date: 'أمس 18:05' },
  { name: 'ليلى مزيان', city: 'سطيف', status: 'مكتمل', tone: 'success', amount: '5,900 دج', date: 'أمس 14:32' },
  { name: 'محمد قادري', city: 'عنابة', status: 'ملغى', tone: 'danger', amount: '15,700 دج', date: 'أمس 11:18' },
]

function heroOrdersVisualHtml(): string {
  const rows = MOCK_ORDERS.map(
    (o) =>
      `<div class="pt-mock-order">${avatarHtml(o.name, 32)}<div class="pt-mock-order__body"><p class="pt-mock-order__name">${esc(o.name)}</p><p class="pt-mock-order__city">${esc(o.city)}</p></div>${badgeHtml(o.status, o.tone)}<div class="pt-mock-order__end"><span class="pt-mock-order__amount">${esc(o.amount)}</span><span class="pt-mock-order__date">${esc(o.date)}</span></div></div>`
  ).join('')
  return `<div class="blk-hero__visual" role="img" aria-label="بطاقة أحدث الطلبات — خمسة طلبات بمدن جزائرية وحالات مختلفة">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock pt-mock-orders" aria-hidden="true">
    <div class="pt-mock-orders__head"><b>أحدث الطلبات</b></div>
    <div class="pt-mock-orders__list">${rows}</div>
    <div class="pt-mock-orders__foot"><span class="pt-mock-chipnote">${iconSvg('package', 13)}<span>5 طلبات جديدة هذا الأسبوع</span></span></div>
  </div>
</div>`
}

/** بطاقة محادثة دعم: فقاعات + مؤشر كتابة + شريط إدخال */
function heroChatVisualHtml(): string {
  return `<div class="blk-hero__visual" role="img" aria-label="بطاقة محادثة دعم — رسائل واردة وصادرة ومؤشر كتابة">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock pt-mock-chat" aria-hidden="true">
    <div class="pt-mock-chat__head">
      ${avatarHtml('د', 36)}
      <div class="pt-mock-chat__who"><b>فريق الدعم</b><span class="pt-mock-chat__status"><i></i>متصل الآن</span></div>
    </div>
    <div class="pt-mock-chat__body">
      <div class="pt-mock-bubble pt-mock-bubble--in"><span class="pt-mock-bubble__who">سارة</span>السلام عليكم، متى يصل طلبي؟</div>
      <div class="pt-mock-bubble pt-mock-bubble--out">وصل طلبك إلى مركز التوزيع — سيصلك غداً إن شاء الله</div>
      <div class="pt-mock-typing"><span></span><span></span><span></span></div>
    </div>
    <div class="pt-mock-chat__input">
      <span class="pt-mock-chat__placeholder">اكتب رسالتك...</span>
      <span class="pt-mock-chat__send">${iconSvg('send', 15)}</span>
    </div>
  </div>
</div>`
}

/** بطاقة تقويم: ديسمبر 2024 — اليوم 12 دائرة primary و3 نقاط مواعيد */
function heroCalendarVisualHtml(): string {
  const weekdays = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    .map((d) => `<span class="pt-mock-cal__wd">${esc(d)}</span>`)
    .join('')
  const dotDays = new Set([3, 18, 25])
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
    .map((d) => {
      const cls = `pt-mock-cal__day${d === 12 ? ' pt-mock-cal__day--today' : ''}${dotDays.has(d) ? ' pt-mock-cal__day--dot' : ''}`
      return `<span class="${cls}">${d}</span>`
    })
    .join('')
  return `<div class="blk-hero__visual" role="img" aria-label="بطاقة تقويم ديسمبر 2024 — اليوم 12 وثلاثة مواعيد ملونة">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock pt-mock-cal" aria-hidden="true">
    <div class="pt-mock-cal__head">
      <b>ديسمبر 2024</b>
      <span class="pt-mock-cal__navs">
        <span class="pt-mock-cal__nav">${iconSvg('chevron-right', 14)}</span>
        <span class="pt-mock-cal__nav">${iconSvg('chevron-left', 14)}</span>
      </span>
    </div>
    <div class="pt-mock-cal__body">
      <div class="pt-mock-cal__week">${weekdays}</div>
      <div class="pt-mock-cal__days">${days}</div>
    </div>
    <div class="pt-mock-cal__foot"><span class="pt-mock-chipnote">${iconSvg('calendar', 13)}<span>3 مواعيد هذا الأسبوع</span></span></div>
  </div>
</div>`
}

/** بطاقة رأي عميل: اقتباس كبير + 5 نجوم + شخص موثّق */
function heroTestimonialVisualHtml(): string {
  return `<div class="blk-hero__visual" role="img" aria-label="بطاقة رأي عميل — تقييم خمس نجوم واقتباس توصي بالمنصة">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-mock pt-mock-quote" aria-hidden="true">
    <span class="pt-mock-quote__glyph">”</span>
    <div class="pt-mock-quote__stars">★★★★★</div>
    <p class="pt-mock-quote__text">«وفّرت علينا المنصة أسابيع من العمل — تجربة ممتازة من البداية للنهاية.»</p>
    <div class="pt-mock-quote__person">
      ${avatarHtml('أحمد بن علي', 44)}
      <div class="pt-mock-quote__who"><b>أحمد بن علي</b><span>مدير تقنية — شركة ناشئة</span></div>
      <span class="pt-mock-verified">${iconSvg('check', 12)}<span>عميل موثّق</span></span>
    </div>
  </div>
</div>`
}

/** خريطة مولدات الرسوم الجانبية حسب نوع visual */
const HERO_VISUAL_RENDERERS: Record<string, () => string> = {
  dashboard: heroDashboardVisualHtml,
  phone: heroPhoneVisualHtml,
  video: heroVideoVisualHtml,
  analytics: heroAnalyticsVisualHtml,
  orders: heroOrdersVisualHtml,
  chat: heroChatVisualHtml,
  calendar: heroCalendarVisualHtml,
  testimonial: heroTestimonialVisualHtml,
}

/** بطاقة فيديو 16:9 بزر تشغيل حقيقي يتبدّل + موجة صوت (visual = video) */
function heroVideoVisualHtml(): string {
  return `<div class="blk-hero__visual pt-video-wrap">
  <span class="blk-hero__glow1" aria-hidden="true"></span>
  <span class="blk-hero__glow2" aria-hidden="true"></span>
  <div class="pt-video">
    <span class="pt-video__veil" aria-hidden="true"></span>
    <span class="pt-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>
    <button type="button" class="pt-play" aria-label="تشغيل الفيديو" aria-pressed="false"><span class="pt-play__triangle" aria-hidden="true"></span><span class="pt-play__pause" aria-hidden="true"><span></span><span></span></span></button>
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

/** غطاء تدرّج الصورة الخلفية حسب شدة التعتيم (مطابق لعارض React) */
const HERO_OVERLAY_GRADIENTS: Record<string, string> = {
  dark: 'linear-gradient(180deg,rgba(13,10,25,.62),rgba(13,10,25,.78))',
  medium: 'linear-gradient(180deg,rgba(13,10,25,.38),rgba(13,10,25,.55))',
  light: 'linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.72))',
}

function renderHero(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const eyebrow = S(p, 'eyebrow')
  const primaryButton = S(p, 'primaryButton')
  const primaryButtonPage = S(p, 'primaryButtonPage')
  const secondaryButton = S(p, 'secondaryButton')
  const layout = S(p, 'layout', 'split') === 'centered' ? 'centered' : 'split'
  const background = (
    ['default', 'muted', 'dark', 'gradient', 'gradient-soft', 'mesh'] as const
  ).includes(S(p, 'background') as 'default')
    ? S(p, 'background')
    : 'default'
  const align = S(p, 'align', 'start') === 'center' ? 'center' : 'start'
  // أنواع الرسم الجانبي (عقد R9): + analytics/orders/chat/calendar/testimonial
  const visualRaw = S(p, 'visual')
  const visual = HERO_VISUAL_KINDS.has(visualRaw) ? visualRaw : 'dashboard'
  const titleSize = (['md', 'lg', 'xl'] as const).includes(S(p, 'titleSize') as 'md') ? S(p, 'titleSize') : 'md'

  // ---- خلفية الصورة المرفوعة: ملف assets/img-{n} داخل الحزمة (لا data URL) ----
  const bgImage = S(p, 'bgImage')
  const bgOverlay = (['dark', 'medium', 'light', 'none'] as const).includes(S(p, 'bgOverlay') as 'dark')
    ? S(p, 'bgOverlay')
    : 'dark'
  const heroSrc = bgImage.trim() !== '' ? ctx.imgSrc(bgImage) : null
  const hasImage = heroSrc !== null

  // ---- لون خلفية القسم (Task 12) — تدرّج منه + نص تلقائي ذكي ----
  // (صورة المستخدم المرفوعة تتقدم على اللون — توافق خلفي كامل)
  const bgColor = sectionHex(p.bgColor)
  const hasCustomBg = bgColor !== '' && !hasImage
  const customDark = hasCustomBg && relativeLuminance(bgColor) <= 0.5
  const dark = hasImage ? bgOverlay !== 'light' : hasCustomBg ? customDark : background === 'dark' || background === 'gradient'

  // ---- الأزرار: أهداف ذكية دائماً (نفس عقد عارض React / nav-targets) ----
  const primaryId = heroPrimaryTarget(ctx.schema, primaryButtonPage)
  const primaryHref = primaryId ? ctx.hrefOf(primaryId) : '#'
  const secondary = heroSecondaryTarget(ctx.schema, ctx.pageId)
  const secondaryHref = secondary.anchor
    ? `#${secondary.anchor}`
    : secondary.pageId
      ? ctx.hrefOf(secondary.pageId)
      : '#'

  const actions =
    primaryButton || secondaryButton
      ? `<div class="blk-hero__actions">${primaryButton ? `<a class="pt-btn pt-btn--primary pt-btn--lg" href="${esc(primaryHref)}">${esc(primaryButton)}</a>` : ''}${secondaryButton ? `<a class="pt-btn pt-btn--${dark ? 'on-dark' : 'outline'} pt-btn--lg" href="${esc(secondaryHref)}">${esc(secondaryButton)}</a>` : ''}</div>`
      : ''

  // الرسم الجانبي: كل الأنواع البصرية في التخطيط المقسّم (عقد R9)
  const hasSideVisual = layout === 'split' && SIDE_VISUAL_KINDS.has(visual)
  // في التخطيط الموسّط نعرض الهاتف/الفيديو أسفل النص (قاعدة قائمة)
  const hasStackedVisual = layout === 'centered' && STACK_VISUAL_KINDS.has(visual)
  const centeredCol = !hasSideVisual
  const renderVisual = HERO_VISUAL_RENDERERS[visual]
  const visualHtml = (hasSideVisual || hasStackedVisual) && renderVisual ? renderVisual() : ''

  const textCol = `<div class="blk-hero__text" style="${align === 'center' ? 'text-align:center' : ''}">
  ${eyebrow ? `<span class="pt-eyebrow${dark ? ' pt-eyebrow--dark' : ''}">${esc(eyebrow)}</span>` : ''}
  ${title ? `<h1 class="blk-hero__title${titleSize === 'lg' || titleSize === 'xl' ? ` blk-hero__title--${titleSize}` : ''}">${esc(title)}</h1>` : ''}
  ${subtitle ? `<p class="blk-hero__subtitle">${esc(subtitle)}</p>` : ''}
  ${actions}
  ${visual === 'form' ? heroLeadFormHtml(p, dark, centeredCol) : ''}
</div>`

  let inner: string
  if (hasSideVisual) {
    inner = `<div class="blk-hero__split">${textCol}<div class="blk-hero__viscol">${visualHtml}</div></div>`
  } else if (hasStackedVisual) {
    inner = `${textCol}<div class="blk-hero__stack">${visualHtml}</div>`
  } else {
    inner = textCol
  }

  // خلفية الصورة: تدرّج الغطاء + الصورة — أو تدرّج لون القسم المخصّص (Task 12)
  const heroStyle = hasImage
    ? ` style="background-image:${HERO_OVERLAY_GRADIENTS[bgOverlay] ? `${HERO_OVERLAY_GRADIENTS[bgOverlay]},` : ''}url('${esc(heroSrc ?? '')}');background-size:cover;background-position:center"`
    : hasCustomBg
      ? ` style="background:${sectionBgGradient(bgColor)}"`
      : ''
  const heroClass = `blk-hero blk-hero--${esc(background)}${hasImage ? ' blk-hero--image blk-hero--image-' + (bgOverlay === 'light' ? 'light' : 'dark') : ''}${hasImage && bgOverlay === 'none' ? ' blk-hero--image-none' : ''}${hasCustomBg ? ' blk-hero--secvar' : ''}`

  return `<section class="${heroClass}"${heroStyle}><div class="blk-hero__inner${centeredCol ? ' blk-hero--centered' : ''}">${inner}</div></section>`
}

// ---------- features ----------
function renderFeatures(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const columns = Math.max(1, Math.min(4, Math.round(N(p, 'columns', 3))))
  const items = L(p, 'items')
  const bg = sectionBgOf(p, ctx)
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
    `${sectionHeading(title, subtitle)}<div class="blk-features__grid" style="--cols:${columns}">${cards}</div>`,
    false,
    'features',
    bg
  )
}

// ---------- stats ----------
function renderStats(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const items = L(p, 'items')
  const bg = sectionBgOf(p, ctx)
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
  return `<section class="blk-stats${bg.cls}"${bg.style}><div class="blk-section__inner">${heading}<div class="blk-stats__grid">${cells}</div></div></section>`
}

// ---------- steps ----------
function renderSteps(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const bg = sectionBgOf(p, ctx)
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
  return sectionWrap(`${sectionHeading(title, subtitle)}<ol class="blk-steps__list">${items}</ol>`, false, '', bg)
}

// ---------- pricing ----------
function renderPricing(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const currency = S(p, 'currency', 'دج') || 'دج'
  const plans = L(p, 'plans')
  // كل الخطط تنقل إلى نفس الهدف الذكي: إنشاء حساب ← نموذج ← رئيسية
  const targetId = pricingButtonTarget(ctx.schema)
  const targetHref = targetId ? ctx.hrefOf(targetId) : '#'
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
      ${buttonText ? `<a class="pt-btn ${highlighted ? 'pt-btn--primary' : 'pt-btn--outline'} pt-btn--block" href="${esc(targetHref)}" data-plan-name="${esc(name)}" data-plan-price="${price}">${esc(buttonText)}</a>` : ''}
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, subtitle)}<div class="blk-pricing__grid">${cards}</div>`, false, 'pricing')
}

// ---------- testimonials ----------
function renderTestimonials(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const bg = sectionBgOf(p, ctx)
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
      ${text ? `<p class="blk-testimonial__text">«${esc(text)}»</p>` : ''}
      <div class="blk-testimonial__person">
        ${avatarHtml(name, 40)}
        <div><p class="blk-testimonial__name">${esc(name)}</p><p class="blk-testimonial__role">${esc(role)}</p></div>
      </div>
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, '')}<div class="blk-testimonials__grid">${cards}</div>`, false, 'testimonials', bg)
}

// ---------- faq ----------
function renderFaq(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const bg = sectionBgOf(p, ctx)
  const items = L(p, 'items')
  const list = items
    .map((item) => {
      const q = iS(item, 'q')
      const a = iS(item, 'a')
      return `<details class="blk-faq__item"><summary>${esc(q)}</summary><div class="blk-faq__answer">${esc(a)}</div></details>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, subtitle)}<div class="blk-faq__list">${list}</div>`, false, 'faq', bg)
}

// ---------- cta ----------
function renderCta(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = (['default', 'gradient', 'dark'] as const).includes(S(p, 'style') as 'default') ? S(p, 'style') : 'default'
  const bg = sectionBgOf(p, ctx)
  const hasImage = bg.cls !== ''

  // ---- لون خلفية القسم (Task 12) — تدرّج منه + زر حسب سطوعه ----
  // (صورة المستخدم المرفوعة تتقدم على اللون — توافق خلفي كامل)
  const bgColor = sectionHex(p.bgColor)
  const hasCustomBg = bgColor !== '' && !hasImage
  const customDark = hasCustomBg && relativeLuminance(bgColor) <= 0.5
  const btnClass = hasCustomBg
    ? customDark
      ? 'pt-btn--on-dark'
      : 'pt-btn--primary'
    : style === 'default'
      ? 'pt-btn--primary'
      : 'pt-btn--on-dark'

  const targetId = ctaButtonTarget(ctx.schema)
  const targetHref = targetId ? ctx.hrefOf(targetId) : '#'
  return sectionWrap(
    `<div class="blk-cta__card blk-cta__card--${esc(style)}${hasCustomBg ? ' blk-cta__card--secvar' : ''}"${hasCustomBg ? ` style="background:${sectionBgGradient(bgColor)}"` : ''}>
  ${title ? `<h2 class="blk-cta__title">${esc(title)}</h2>` : ''}
  ${subtitle ? `<p class="blk-cta__subtitle">${esc(subtitle)}</p>` : ''}
  ${buttonText ? `<div class="blk-cta__actions"><a class="pt-btn ${btnClass} pt-btn--lg" href="${esc(targetHref)}">${esc(buttonText)}</a></div>` : ''}
</div>`,
    true,
    '',
    bg
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

function renderGallery(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const bg = sectionBgOf(p, ctx)
  const items = L(p, 'items')
  // (الجولة 15) وسم النوع يربط المعرض بكيانه — لتزامن الإضافة/الحذف من الجداول
  const variant = S(p, 'variant', 'products')
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
      // صورة مرفوعة للعنصر → ملف assets/img-{n} (لا data URL) — وإلا تدرّج رمزي
      const itemImage = iS(item, 'image')
      const photoSrc = itemImage.trim() !== '' ? ctx.imgSrc(itemImage) : null
      const thumbInner = photoSrc
        ? `<img class="blk-gallery__photo" src="${esc(photoSrc)}" alt="" loading="lazy">`
        : `<span class="blk-gallery__letter" aria-hidden="true">${esc(letter)}</span>`
      const thumbAttrs = photoSrc
        ? ''
        : ` style="background:${GALLERY_GRADIENTS[i % GALLERY_GRADIENTS.length]}" role="img" aria-label="صورة رمزية لـ ${esc(t)}"`
      return `<article class="blk-gallery__item">
      <div class="blk-gallery__thumb"${thumbAttrs}>
        ${thumbInner}
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
  return sectionWrap(`${sectionHeading(title, subtitle)}<div class="blk-gallery__grid" data-gallery-variant="${esc(variant)}">${cards}</div>`, false, '', bg)
}

// ---------- banner ----------
function renderBanner(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = S(p, 'style') === 'dark' ? 'dark' : 'gradient'
  const bg = sectionBgOf(p, ctx)
  const hasImage = bg.cls !== ''

  // ---- لون خلفية القسم (Task 12) — تدرّج منه + زر حسب سطوعه ----
  // (صورة المستخدم المرفوعة تتقدم على اللون — توافق خلفي كامل)
  const bgColor = sectionHex(p.bgColor)
  const hasCustomBg = bgColor !== '' && !hasImage
  const customDark = hasCustomBg && relativeLuminance(bgColor) <= 0.5
  const btnClass = hasCustomBg && !customDark ? 'pt-btn--primary' : 'pt-btn--on-dark'

  const targetId = bannerButtonTarget(ctx.schema)
  const targetHref = targetId ? ctx.hrefOf(targetId) : '#'
  return `<section class="blk-section blk-section--tight${bg.cls}"${bg.style}><div class="blk-section__inner">
<div class="blk-banner blk-banner--${esc(style)}${hasCustomBg ? ' blk-banner--secvar' : ''}"${hasCustomBg ? ` style="background:${sectionBgGradient(bgColor)}"` : ''}><div class="blk-banner__inner">
  <div>${title ? `<p class="blk-banner__title">${esc(title)}</p>` : ''}${subtitle ? `<p class="blk-banner__subtitle">${esc(subtitle)}</p>` : ''}</div>
  ${buttonText ? `<a class="pt-btn ${btnClass}" href="${esc(targetHref)}">${esc(buttonText)}</a>` : ''}
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
function renderTeam(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const bg = sectionBgOf(p, ctx)
  const items = L(p, 'items')
  const cards = items
    .map((item) => {
      const name = iS(item, 'name')
      const role = iS(item, 'role')
      // صورة مرفوعة للعضو → أفاتار صوري دائري (ملف assets/img-{n}) — وإلا أفاتار الحروف
      const itemImage = iS(item, 'image')
      const photoSrc = itemImage.trim() !== '' ? ctx.imgSrc(itemImage) : null
      const mark = photoSrc
        ? `<img class="blk-team__photo" src="${esc(photoSrc)}" alt="" loading="lazy">`
        : avatarHtml(name, 56)
      return `<article class="blk-team__card">
      ${mark}
      <p class="blk-team__name">${esc(name)}</p>
      <p class="blk-team__role">${esc(role)}</p>
    </article>`
    })
    .join('')
  return sectionWrap(`${sectionHeading(title, '')}<div class="blk-team__grid" data-team-grid="1">${cards}</div>`, false, '', bg)
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
/** (الجولة 16) ملاحظتا محدد الأدوار — حرفياً من مواصفة §5 (تُبدّلان من script.js) */
const ROLE_NOTE_CLIENT = 'أدخل بأي بريد وكلمة مرور — سنتجول مباشرة في فضاء الزبون (وضع تجريبي).'
const ROLE_NOTE_ADMIN = 'أدخل بأي بريد وكلمة مرور — سنتجول في لوحة تحكم المدير (وضع تجريبي).'

function renderAuthCard(p: Record<string, unknown>, ctx: RenderCtx): string {
  const variant = (['login', 'signup', 'forgot'] as const).includes(S(p, 'variant') as 'login')
    ? S(p, 'variant')
    : 'login'
  const title = S(p, 'title', 'تسجيل الدخول')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText', 'دخول')
  const demoHint = S(p, 'demoHint')

  // (الجولة 16) نظام الأدوار — يُفعّل فقط حين توجد صفحة فضاء الزبون (audience=client)
  const clientPage = findClientPage(ctx.schema)
  const adminDash = findAdminDashboardPage(ctx.schema)
  const rolesEnabled = variant === 'login' && !!clientPage

  // الدخول والتسجيل كلاهما ينتقلان إلى لوحة التحكم (data-redirect) —
  // الاستعادة تُظهر رسالة نجاح كما هي.
  // (الجولة 16) التسجيل العام يصنع حساب زبون: هدفه صفحة فضاء الزبون إن وُجدت.
  const dash = findDashboardPage(ctx.schema)
  const submitTarget = clientPage ?? dash
  const redirect = (variant === 'login' || variant === 'signup') && submitTarget ? ctx.hrefOf(submitTarget.id) : ''
  const success =
    variant === 'forgot'
      ? 'أرسلنا لك رابط الاستعادة — تحقق من بريدك الوارد.'
      : variant === 'signup'
        ? 'تم إنشاء حسابك التجريبي بنجاح. مرحباً بك!'
        : 'تم تسجيل الدخول بنجاح (وضع تجريبي).'
  const formId = `auth-${Math.random().toString(36).slice(2, 8)}`

  // (الجولة 16) محدد الأدوار أعلى النموذج (داخل البطاقة تحت الترويسة) —
  // كزبون مختاراً افتراضياً، والتبديل من script.js (is-on + aria-checked + الملاحظة)
  const rolesHtml = rolesEnabled && clientPage
    ? `<div class="blk-auth__roles" role="radiogroup" aria-label="نوع الدخول">
    <button type="button" class="blk-role is-on" data-role="client" role="radio" aria-checked="true">
      <span class="blk-role__name"><span class="blk-role__icon">${iconSvg('user', 16)}</span><span>كزبون</span></span>
      <span class="blk-role__hint">فضاء حسابي وطلباتي</span>
    </button>
    <button type="button" class="blk-role" data-role="admin" role="radio" aria-checked="false">
      <span class="blk-role__name"><span class="blk-role__icon">${iconSvg('shield', 16)}</span><span>كمدير</span></span>
      <span class="blk-role__hint">لوحة تحكم الموقع الكاملة</span>
    </button>
  </div>
  <p class="blk-auth__role-note" id="${formId}-note" data-note-client="${esc(ROLE_NOTE_CLIENT)}" data-note-admin="${esc(ROLE_NOTE_ADMIN)}">${esc(ROLE_NOTE_CLIENT)}</p>`
    : ''

  // (الجولة 16) نموذج الدخول بمحدد الأدوار: script.js يضبط الجلسة حسب الدور
  // المختار ثم ينقل لفضاء ذلك الدور (بلا data-redirect هنا). التسجيل يحمل
  // data-signup-client ليدخل فضاء الزبون بجلسة زبون. بلا صفحة client:
  // السلوك القديم حرفياً (data-redirect إلى لوحة المدير).
  const formAttrs = rolesEnabled && clientPage
    ? `data-login-roles="1" data-client-href="${esc(ctx.hrefOf(clientPage.id))}" data-admin-href="${esc(adminDash ? ctx.hrefOf(adminDash.id) : '#')}"`
    : redirect
      ? `data-redirect="${esc(redirect)}"${variant === 'signup' && clientPage ? ' data-signup-client="1"' : ''}`
      : `data-success="${esc(success)}"`

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
    ${rolesHtml}
    <form class="pt-form blk-form__grid" ${formAttrs} novalidate>
      ${fields.join('')}
      <button class="pt-btn pt-btn--primary pt-btn--lg pt-btn--block" type="submit">${esc(buttonText)}</button>
    </form>
    ${demoHint ? `<div class="blk-auth__hint"><div class="pt-alert pt-alert--info">${esc(demoHint)}</div></div>` : ''}
  </div>
</div>`
}

// ---------- dashboard-header ----------
function renderDashboardHeader(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const actions = S(p, 'actions')
  // كل أزرار الترويسة تنقل إلى نفس الهدف الذكي: نموذج ← جدول ← اللوحة
  const targetId = dashboardActionTarget(ctx.schema)
  const targetHref = targetId && ctx.schema.pages.some((pg) => pg.id === targetId) ? ctx.hrefOf(targetId) : '#'
  const buttons = actions
    .split(/[,،]/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map(
      (a, i) =>
        `<a class="pt-btn ${i === 0 ? 'pt-btn--primary' : 'pt-btn--outline'} pt-btn--sm" href="${esc(targetHref)}">${i === 0 ? iconSvg('plus', 16) : ''}${esc(a)}</a>`
    )
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

  // (الجولة 15) كيان مفقود أو بلا أعمدة → حالة الفراغ؛ كيان بأعمدة ولو صفر
  // صفوف → جدول كامل قابل للإدارة من الموقع نفسه («إضافة» تعمل على الفراغ).
  if (!entity || !Array.isArray(entity.columns) || entity.columns.length === 0) {
    return renderState(
      'empty',
      {
        title: 'لا توجد بيانات',
        subtitle: 'ستظهر العناصر هنا بعد إضافتها أو توليدها.',
        actionText: '',
      },
      ctx
    )
  }

  const columns: EntityColumn[] = entity.columns
  const rowsAll: Array<Record<string, unknown>> = Array.isArray(entity.rows) ? entity.rows : []
  // (الجولة 16) وضع الزبون (clientView): جدول للقراءة فقط وصفوف الزبونة
  // التجريبية فقط إن كان للكيان عمود avatar — لا عمود أو صفر مطابقات → كل
  // الصفوف (لا يظهر الجدول فارغاً أبداً — نفس القاعدة في script.js والمعاينة)
  const clientView = B(p, 'clientView')
  let rowsShow = rowsAll
  if (clientView) {
    const avatarCol = columns.find((col) => col.type === 'avatar')
    if (avatarCol) {
      const matched = rowsAll.filter((row) => row[avatarCol.key] === DEMO_CLIENT.name)
      if (matched.length > 0) rowsShow = matched
    }
  }
  const singular = ENTITY_SINGULARS[entityKey] || ENTITY_LABELS[entityKey] || 'عنصر'
  const head = `${columns.map((col) => `<th scope="col">${esc(col.label)}</th>`).join('')}${clientView ? '' : '<th scope="col">إجراءات</th>'}`

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

  /** اسم الصف = قيمة أول عمود نص/أفاتار (لتسميات أزرار الإجراءات) */
  const rowNameOf = (row: Record<string, unknown>): string => {
    for (const col of columns) {
      if (col.type === 'text' || col.type === 'avatar') {
        const v = row[col.key]
        if (typeof v === 'string' && v) return v
      }
    }
    return ''
  }

  const rowsHtml =
    rowsShow.length === 0
      ? `<tr class="blk-table__empty"><td colspan="${columns.length + (clientView ? 0 : 1)}">لا يوجد ${esc(singular)} بعد${clientView ? '.' : ' — اضغط «إضافة» لإضافة أول عنصر من هنا مباشرة.'}</td></tr>`
      : rowsShow
          .map((row, i) => {
            const name = rowNameOf(row) || singular
            return `<tr data-idx="${i}">${columns.map((col) => `<td>${cellHtml(col, row[col.key])}</td>`).join('')}${clientView ? '' : `<td class="blk-table__act"><span class="pt-rowacts"><button type="button" class="pt-rowact" data-edit-row aria-label="تعديل ${esc(name)}" title="تعديل">${iconSvg('pencil', 15)}</button><button type="button" class="pt-rowact pt-rowact--danger" data-del-row aria-label="حذف ${esc(name)}" title="حذف">${iconSvg('trash-2', 15)}</button></span></td>`}</tr>`
          })
          .join('')

  return `<div class="pt-card blk-table" data-entity="${esc(entityKey)}"${clientView ? ' data-client-view="1"' : ''}>
  <div class="blk-table__head">
    <h3>${esc(headerTitle)}</h3>
    <div class="blk-table__tools">
      <div class="blk-table__search"><input class="pt-input" type="search" placeholder="بحث..." aria-label="بحث في الجدول" data-table-search="${tableId}"></div>
      ${clientView ? '' : `<button type="button" class="pt-btn pt-btn--sm pt-btn--primary" data-add-row>${iconSvg('plus', 14)}<span>إضافة ${esc(singular)}</span></button>`}
    </div>
  </div>
  <div class="pt-table-scroll">
    <table class="pt-table" id="${tableId}">
      <thead><tr>${head}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
  <div class="blk-table__foot">
    <p id="${tableId}-count">عرض ${rowsShow.length} من ${rowsShow.length} صف</p>
    <div class="blk-table__pager" data-pager="${tableId}" data-page-size="5" data-current="1" hidden>
      <button type="button" class="pt-btn pt-btn--sm pt-btn--outline" data-page="prev" aria-label="الصفحة السابقة">${iconSvg('arrow-right', 16)}</button>
      <span class="blk-table__pager-count">صفحة 1 من 1</span>
      <button type="button" class="pt-btn pt-btn--sm pt-btn--outline" data-page="next" aria-label="الصفحة التالية">${iconSvg('arrow-left', 16)}</button>
    </div>
    <p class="blk-table__demo">بيانات تجريبية — تُحفظ تعديلاتك محلياً في متصفحك <button type="button" class="pt-linkbtn" data-reset-entity>إعادة الضبط</button></p>
  </div>
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
    .map((section, si) => {
      const secTitle = iS(section, 'title')
      const fields = L(section, 'fields')
      const fieldsHtml = fields
        .map((f, fi) => {
          const label = iS(f, 'label')
          const type = iS(f, 'type', 'text')
          const value = iS(f, 'value')
          const hint = iS(f, 'hint')
          // (الجولة 15) مفتاح الحقل لحفظ قيم النموذج محلياً في المتصفح
          const skey = `f${si}-${fi}`
          let control = ''
          if (type === 'switch') {
            const on = value === 'true' || value === '1'
            control = `<button type="button" class="pt-switch${on ? ' on' : ''}" role="switch" aria-checked="${on ? 'true' : 'false'}" data-switch data-skey="${esc(skey)}"><span class="pt-switch__knob"></span></button>`
          } else if (type === 'select') {
            const options = optionsOf(f)
              .map((o) => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`)
              .join('')
            control = `<select class="pt-select" data-skey="${esc(skey)}">${options}</select>`
          } else if (type === 'password') {
            control = `<input class="pt-input" type="password" placeholder="••••••••" value="" data-skey="${esc(skey)}">`
          } else {
            control = `<input class="pt-input" type="text" value="${esc(value)}" data-skey="${esc(skey)}">`
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
  <form class="pt-form" data-settings="1" data-success="تم حفظ الإعدادات بنجاح." novalidate>
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
function renderState(kind: 'empty' | 'loading' | 'error', p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title', kind === 'error' ? 'حدث خطأ ما' : 'لا توجد بيانات بعد')
  const subtitle = S(p, 'subtitle', kind === 'loading' ? '' : 'ستظهر العناصر هنا بمجرد إضافتها.')
  const actionText = S(p, 'actionText')
  const icon = kind === 'error' ? '⚠' : kind === 'loading' ? '' : '📦'
  // زر الحالة: لوحة التحكم داخل صفحات اللوحات، وإلا الرئيسية (عقد nav-targets)
  const page = ctx.schema.pages.find((pg) => pg.id === ctx.pageId)
  const fromDashboard = !!page && ['dashboard', 'table', 'form', 'settings', 'profile'].includes(page.type)
  const actionTarget = stateActionTarget(ctx.schema, fromDashboard)
  const actionHtml = actionText
    ? `<div class="blk-state__actions"><a class="pt-btn pt-btn--primary" href="${esc(actionTarget ? ctx.hrefOf(actionTarget) : '#')}">${esc(actionText)}</a></div>`
    : ''
  return `<div class="pt-card blk-state">
  ${kind === 'loading' ? '<div class="blk-loading__spinner" aria-hidden="true"></div>' : `<div class="blk-state__icon" aria-hidden="true">${icon}</div>`}
  <h3 class="blk-state__title">${esc(title)}</h3>
  ${subtitle ? `<p class="blk-state__subtitle">${esc(subtitle)}</p>` : ''}
  ${actionHtml}
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
// الكتل الجديدة (Task 8) — عقود 8-spec حرفياً
// ============================================================

// ---------- activity-feed (سجل النشاطات) ----------
function renderActivityFeed(p: Record<string, unknown>): string {
  const title = S(p, 'title', 'آخر النشاطات')
  // بحد أقصى 6 عناصر (عقد المواصفات)
  const items = L(p, 'items').slice(0, 6)
  const list = items
    .map((item) => {
      const user = iS(item, 'user')
      const action = iS(item, 'action')
      const target = iS(item, 'target')
      const time = iS(item, 'time')
      return `<li class="blk-activity__item">
      <span class="blk-activity__dot" aria-hidden="true"></span>
      ${avatarHtml(user || '؟', 36)}
      <div class="blk-activity__body">
        <p class="blk-activity__text">${esc(user)} ${esc(action)}${target ? ` <strong>${esc(target)}</strong>` : ''}</p>
        ${time ? `<p class="blk-activity__time">${esc(time)}</p>` : ''}
      </div>
    </li>`
    })
    .join('')
  return `<div class="pt-card blk-activity">
  ${title ? `<div class="blk-activity__head"><h3>${esc(title)}</h3></div>` : ''}
  <ul class="blk-activity__list">${list}</ul>
</div>`
}

// ---------- tasks-list (المهام — مربعات اختيار تعمل) ----------
function renderTasksList(p: Record<string, unknown>): string {
  const title = S(p, 'title', 'مهام اليوم')
  const subtitle = S(p, 'subtitle')
  const items = L(p, 'items')
  const total = items.length
  const doneCount = items.filter((it) => iB(it, 'done')).length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const list = items
    .map((item) => {
      const label = iS(item, 'label')
      const done = iB(item, 'done')
      const meta = iS(item, 'meta')
      return `<li class="blk-tasks__item${done ? ' done' : ''}">
      <button type="button" class="blk-tasks__check${done ? ' on' : ''}" role="checkbox" aria-checked="${done ? 'true' : 'false'}" data-task aria-label="${esc(label)}">${iconSvg('check', 14)}</button>
      <span class="blk-tasks__label">${esc(label)}</span>
      ${meta ? `<span class="blk-tasks__meta">${esc(meta)}</span>` : ''}
    </li>`
    })
    .join('')
  return `<div class="pt-card blk-tasks">
  <div class="blk-tasks__head">
    <div>${title ? `<h3 class="blk-tasks__title">${esc(title)}</h3>` : ''}${subtitle ? `<p class="blk-tasks__sub">${esc(subtitle)}</p>` : ''}</div>
    <span class="blk-tasks__count" data-tasks-count>${doneCount} من ${total} منجزة</span>
  </div>
  <div class="blk-tasks__progress" data-tasks-bar role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span class="blk-tasks__progress-fill" data-tasks-progress style="width:${pct}%"></span></div>
  <ul class="blk-tasks__list">${list}</ul>
</div>`
}

// ---------- quick-actions (إجراءات سريعة — أزرار تعمل) ----------
function renderQuickActions(p: Record<string, unknown>, ctx: RenderCtx): string {
  const title = S(p, 'title', 'إجراءات سريعة')
  const cards = L(p, 'actions')
    .map((action) => {
      const pageId = iS(action, 'pageId')
      const page = ctx.schema.pages.find((pg) => pg.id === pageId)
      // pageId غير صالح → تجاهل الإجراء كلياً (عقد المواصفات)
      if (!page) return ''
      const icon = iS(action, 'icon')
      const label = iS(action, 'label')
      return `<a class="blk-quick__item" href="${esc(ctx.hrefOf(page.id))}">
      <span class="blk-quick__icon">${iconSvg(icon)}</span>
      <span class="blk-quick__row"><span class="blk-quick__label">${esc(label)}</span><span class="blk-quick__arrow" aria-hidden="true">${iconSvg('arrow-left', 16)}</span></span>
    </a>`
    })
    .join('')
  if (!cards) return ''
  return `<div class="blk-quick">${title ? `<h3 class="blk-quick__title">${esc(title)}</h3>` : ''}<div class="blk-quick__grid">${cards}</div></div>`
}

// ============================================================
// قشور الصفحات
// ============================================================

/** زر العودة للخلف العائم (كل صفحة غير الرئيسية) — RTL: السهم يشير يميناً */
function backButtonHtml(homeHref: string): string {
  return `<button type="button" class="pt-back" data-back data-home="${esc(homeHref)}" aria-label="العودة إلى الصفحة السابقة">
  ${iconSvg('arrow-right', 20)}
  <span class="pt-back__label">عودة</span>
</button>`
}

/** إشعارات التروستة (بيانات تجريبية جزائرية — مطابقة لعارض React) */
const TOPBAR_NOTIFICATIONS: Array<{ title: string; detail: string; time: string }> = [
  { title: 'طلب جديد من وهران', detail: 'قيمة 12,500 دج — بانتظار التأكيد', time: 'قبل 4 دقائق' },
  { title: 'تم تحديث تقرير الأسبوع', detail: 'نمو 8.2% عن الأسبوع الماضي', time: 'قبل ساعة' },
  { title: 'رسالة من سارة بوزيد', detail: '«متى يجهز طلبي؟» — تحتاج رداً', time: 'قبل 3 ساعات' },
]

/** تروستة لوحة التحكم: بحث الصفحة + إشعارات + قائمة المستخدم (Task 8).
 *  (الجولة 16) بجمهور الصفحة: صفحات الزبون تعرض أمينة بلقاسم وقائمة حساب
 *  مختصرة (تسجيل الخروج فقط)، وصفحات المدير كما كانت — وكلاهما بخطوط
 *  تعويض الهوية (data-user-*) يستبدلها script.js باسم جلسة الدخول */
function dashboardTopbarHtml(ctx: RenderCtx, audience: 'admin' | 'client'): string {
  const isClient = audience === 'client'
  // روابط المدير فقط تُبحث بين صفحات المدير (لا تُعرض لصفحات الزبون أصلاً)
  const profilePage = isClient
    ? undefined
    : ctx.schema.pages.find((pg) => pg.type === 'profile' && (pg.audience ?? 'admin') === 'admin')
  const settingsPage = isClient
    ? undefined
    : ctx.schema.pages.find((pg) => pg.type === 'settings' && (pg.audience ?? 'admin') === 'admin')
  const loginPage = ctx.schema.pages.find(
    (pg) => pg.type === 'auth' && (pg.authVariant ?? 'login') === 'login'
  )
  const notifMenuId = nextId(ctx, 'notif')
  const userMenuId = nextId(ctx, 'usermenu')
  const dotId = nextId(ctx, 'belldot')

  // (الجولة 16) هوية المستخدم SSR: صفحات الزبون أمينة بلقاسم، والمدير كما كان —
  // وscript.js يستبدلها بجلسة الدخول عند وجودها (كلا الجمهورين)
  const userName = isClient ? DEMO_CLIENT.name : 'مستخدم تجريبي'
  const userEmail = isClient ? DEMO_CLIENT.email : 'demo@sivar.dz'
  const userAvatarName = isClient ? DEMO_CLIENT.name : 'م'

  const notifItems = TOPBAR_NOTIFICATIONS.map(
    (n) => `<li>
      <span class="pt-dropdown__dot" aria-hidden="true"></span>
      <div><p class="pt-dropdown__title">${esc(n.title)}</p><p class="pt-dropdown__detail">${esc(n.detail)}</p><p class="pt-dropdown__time">${esc(n.time)}</p></div>
    </li>`
  ).join('')

  return `<div class="pt-topbar">
  <div class="pt-topbar__search">
    ${iconSvg('search', 16)}
    <input type="search" placeholder="ابحث في الصفحة..." aria-label="ابحث في جداول الصفحة" data-topbar-search>
  </div>
  <div class="pt-topbar__actions">
    <div class="pt-topbar__item">
      <button type="button" class="pt-topbar__btn pt-bell" data-menu-toggle="${notifMenuId}" aria-label="الإشعارات" aria-expanded="false" aria-haspopup="true">
        ${iconSvg('bell', 18)}
        <span class="pt-bell__dot" id="${dotId}" aria-hidden="true"></span>
      </button>
      <div class="pt-dropdown pt-dropdown--notif" id="${notifMenuId}" role="menu" aria-label="الإشعارات">
        <div class="pt-dropdown__head"><p>الإشعارات</p><button type="button" class="pt-dropdown__action" data-read-all="${dotId}">تحديد الكل كمقروء</button></div>
        <ul class="pt-dropdown__list">${notifItems}</ul>
      </div>
    </div>
    <div class="pt-topbar__item">
      <button type="button" class="pt-topbar__btn pt-user" data-menu-toggle="${userMenuId}" aria-label="قائمة الحساب" aria-expanded="false" aria-haspopup="true">
        ${sessionAvatarHtml(userAvatarName, 28)}
        <span class="pt-user__name" data-user-name>${esc(userName)}</span>
      </button>
      <div class="pt-dropdown pt-dropdown--user" id="${userMenuId}" role="menu" aria-label="قائمة الحساب">
        <div class="pt-dropdown__user"><p data-user-name>${esc(userName)}</p><p dir="ltr" data-user-email>${esc(userEmail)}</p></div>
        <div class="pt-dropdown__body">
          ${profilePage ? `<a role="menuitem" class="pt-dropdown__link" href="${esc(ctx.hrefOf(profilePage.id))}">${iconSvg('user', 16)}<span>الملف الشخصي</span></a>` : ''}
          ${settingsPage ? `<a role="menuitem" class="pt-dropdown__link" href="${esc(ctx.hrefOf(settingsPage.id))}">${iconSvg('settings', 16)}<span>الإعدادات</span></a>` : ''}
          ${loginPage ? `<div class="pt-dropdown__divider"></div><a role="menuitem" class="pt-dropdown__link pt-dropdown__link--danger" data-logout="1" href="${esc(ctx.hrefOf(loginPage.id))}">${iconSvg('log-out', 16)}<span>تسجيل الخروج</span></a>` : ''}
        </div>
      </div>
    </div>
  </div>
</div>`
}

function siteShell(page: ProjectPage, ctx: RenderCtx): string {
  const nav = ctx.schema.navigation
  const home = findHomePage(ctx.schema)
  const homeHref = ctx.hrefOf(home?.id ?? page.id)
  const isHome = !!home && home.id === page.id
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
<button type="button" class="pt-top" aria-label="العودة إلى الأعلى"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg></button>
${isHome ? '' : backButtonHtml(homeHref)}`
}

function authShell(page: ProjectPage, ctx: RenderCtx): string {
  const home = findHomePage(ctx.schema)
  const homeHref = home ? ctx.hrefOf(home.id) : '#'
  const blocks = page.blocks.map((b) => renderBlock(b, ctx)).join('\n')
  const brandMark = ctx.logo
    ? `<img class="pt-logo" src="${esc(ctx.logo.src)}" alt="${esc(ctx.schema.navigation.brand)}" loading="lazy">`
    : `<span class="blk-auth__logo" aria-hidden="true"></span>`
  return `<div class="blk-auth pt-auth">
  <span class="pt-auth__glow pt-auth__glow--a" aria-hidden="true"></span>
  <span class="pt-auth__glow pt-auth__glow--b" aria-hidden="true"></span>
  <a class="blk-auth__brand" href="${esc(homeHref)}" aria-label="الذهاب إلى ${esc(ctx.schema.navigation.brand)}">${brandMark}<span>${esc(ctx.schema.navigation.brand)}</span></a>
  <main id="pt-main" style="width:100%">${blocks}</main>
  <a class="pt-auth__back" href="${esc(homeHref)}">${iconSvg('arrow-right', 16)}<span>العودة إلى الرئيسية</span></a>
  ${backButtonHtml(homeHref)}
</div>`
}

function dashboardShell(page: ProjectPage, ctx: RenderCtx): string {
  // (الجولة 16) جمهور الصفحة: الشريط الجانبي (وشريط الجوال العلوي) يعرض عناصر
  // صفحات نفس الجمهور فقط — لا خلط بين فضاء المدير وفضاء الزبون (ترتيب المدير محفوظ)
  const audience: 'admin' | 'client' = page.audience === 'client' ? 'client' : 'admin'
  const items = ctx.schema.dashboardNav.items.filter((item) => {
    const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
    return !!target && (target.audience === 'client' ? 'client' : 'admin') === audience
  })
  const navHtml = items
    .map((item) => {
      const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
      if (!target) return ''
      const active = target.id === page.id
      // (الجولة 13) أيقونة العنصر كما في عارض React — لا خلط بين المعاينة والتصدير
      return `<a class="pt-sidebar__item${active ? ' active' : ''}" href="${esc(ctx.hrefOf(target.id))}" ${active ? 'aria-current="page"' : ''}>${iconSvg(item.icon || 'file-text', 16)}<span>${esc(item.label)}</span></a>`
    })
    .join('')

  const pills = items
    .map((item) => {
      const target = ctx.schema.pages.find((pg) => pg.id === item.pageId)
      if (!target) return ''
      const active = target.id === page.id
      return `<a class="pt-sidebar-top__pill${active ? ' active' : ''}" href="${esc(ctx.hrefOf(target.id))}">${iconSvg(item.icon || 'file-text', 15)}<span>${esc(item.label)}</span></a>`
    })
    .join('')

  const blocks = page.blocks.map((b) => renderBlock(b, ctx)).join('\n')

  const brand = ctx.schema.navigation.brand
  const home = findHomePage(ctx.schema)
  const homeHref = home ? ctx.hrefOf(home.id) : '#'
  const logoImg = ctx.logo
    ? `<img class="pt-logo" src="${esc(ctx.logo.src)}" alt="${esc(brand)}" loading="lazy">`
    : ''
  const sidebarMark = logoImg || `<span class="pt-nav__logo" aria-hidden="true"></span>`
  const topMark =
    logoImg ||
    `<span class="pt-nav__logo" style="width:28px;height:28px;border-radius:calc(var(--pt-radius) - 4px)" aria-hidden="true"></span>`

  // (الجولة 16) هوية بطاقة المستخدم: صفحات الزبون أمينة بلقاسم + شارة «زبون»،
  // وصفحات المدير كما كانت — وscript.js يستبدل الاسم/الأفاتار بجلسة الدخول
  const isClient = audience === 'client'
  const sidebarUserName = isClient ? DEMO_CLIENT.name : 'مستخدم تجريبي'
  const navAriaLabel = isClient ? 'تنقل فضاء الزبون' : 'تنقل لوحة التحكم'

  return `<div class="pt-sidebar-layout">
  <aside class="pt-sidebar">
    <div class="pt-sidebar__brand">${sidebarMark}<span>${esc(brand)}</span></div>
    <nav class="pt-sidebar__nav" aria-label="${esc(navAriaLabel)}">${navHtml}</nav>
    <div class="pt-sidebar__bottom">
      <div class="pt-sidebar__user">
        ${sessionAvatarHtml(isClient ? DEMO_CLIENT.name : 'م', 34)}
        <div class="pt-sidebar__user-info"><p class="pt-sidebar__user-name" data-user-name>${esc(sidebarUserName)}</p>${isClient ? badgeHtml('زبون', 'primary') : badgeHtml('بيانات تجريبية', 'primary')}</div>
      </div>
      ${home ? `<a class="pt-sidebar__item pt-sidebar__item--muted" href="${esc(homeHref)}">${iconSvg('globe', 16)}<span>العودة إلى الموقع</span></a>` : ''}
    </div>
  </aside>
  <div>
    <div class="pt-sidebar-top">
      <div class="pt-sidebar-top__head">${topMark}<span>${esc(brand)}</span></div>
      <nav class="pt-sidebar-top__pills" aria-label="${esc(navAriaLabel)}">${pills}</nav>
    </div>
    ${dashboardTopbarHtml(ctx, audience)}
    <main id="pt-main" class="pt-sidebar-content"><div class="pt-sidebar-content__inner">${blocks}</div></main>
  </div>
</div>
${backButtonHtml(homeHref)}`
}

// ============================================================
// مستند HTML كامل
// ============================================================
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap'

/** أيقونة افتراضية: حرف العلامة داخل مربع بحافة دائرية بلون السمة الأساسي */
function letterFavicon(schema: ProjectSchema): string {
  const brand = (schema.navigation.brand || schema.metadata.name || 'م').trim()
  const letter = Array.from(brand)[0] ?? 'م'
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

// ============================================================
// (الجولة 15) بذرة بيانات الكيانات — تُضمَّر في كل صفحة قبل script.js
// لتشغيل إدارة المحتوى داخل الموقع المُصدَّر (وضع تجريبي محلي)
// ============================================================
/** مفتاح localStorage لكل موقع (مشتق من اسم المشروع — فريد لكل تصدير) */
function siteDataKey(schema: ProjectSchema): string {
  const base = (schema.settings?.projectName || schema.metadata.name || 'site').trim()
  return `sivar-${slugify(base) || 'site'}`
}

/**
 * وسم البذرة: window.SIVAR_SEED = { key, entities, labels, entityByVariant }.
 * يضمّر كل كيان له أعمدة (ولو صفر صفوف — حتى تعمل «إضافة» على الجدول الفارغ)
 * والصفوف بدائيات فقط (لا data URLs)؛ تُهرَّب «<» وفاصلا السطر حتى لا يُكسر
 * وسم <script>.
 */
function buildSeedScript(schema: ProjectSchema): string {
  const entities: Record<string, { columns: EntityColumn[]; rows: Array<Record<string, unknown>> }> = {}
  const labels: Record<string, string> = {}
  const source = schema.mockData?.entities ?? {}
  for (const key of Object.keys(source)) {
    const ent = source[key]
    if (!ent || !Array.isArray(ent.columns) || ent.columns.length === 0) continue
    entities[key] = { columns: ent.columns, rows: Array.isArray(ent.rows) ? ent.rows : [] }
    labels[key] = ENTITY_SINGULARS[key] || ENTITY_LABELS[key] || 'عنصر'
  }
  const payload = {
    key: siteDataKey(schema),
    entities,
    labels,
    entityByVariant: {
      products: 'products',
      services: 'services',
      menu: 'menuItems',
      properties: 'properties',
      courses: 'courses',
    } as Record<string, string>,
  }
  const json = JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return `<script>window.SIVAR_SEED = ${json};</script>`
}

/**
 * (الجولة 16) سمات <body> لنظام الأدوار — فارغة تماماً بلا صفحة فضاء الزبون:
 *  • صفحات منطقة اللوحة: data-audience + data-login-href + data-client-href +
 *    data-admin-href (script.js يحرس الجلسة عند الإقلاع) — لا صفحة دخول → بلا
 *    سمات جمهور إطلاقاً (توافق قديم).
 *  • صفحة التسعير (أو رئيسية بقسم تسعير): data-client-href وحده — هدفه
 *    إنشاء الطلب من زر الخطة لزبون مسجّل.
 *  • landing/auth/faq/custom وبقية الصفحات: لا سمات جمهور.
 */
function guardBodyAttrs(schema: ProjectSchema, page: ProjectPage, ctx: RenderCtx): string {
  const clientPage = findClientPage(schema)
  if (!clientPage) return ''
  const isDashArea = DASHBOARD_PAGE_TYPES.has(page.type)
  const hasPricing = page.type === 'pricing' || (page.type === 'landing' && page.blocks.some((b) => b.type === 'pricing'))
  if (!isDashArea && !hasPricing) return ''
  const clientHref = ` data-client-href="${esc(ctx.hrefOf(clientPage.id))}"`
  if (!isDashArea) return clientHref
  const loginPage = schema.pages.find((pg) => pg.type === 'auth' && (pg.authVariant ?? 'login') === 'login')
  if (!loginPage) return ''
  const adminDash = findAdminDashboardPage(schema)
  return ` data-audience="${page.audience === 'client' ? 'client' : 'admin'}" data-login-href="${esc(ctx.hrefOf(loginPage.id))}"${clientHref}${adminDash ? ` data-admin-href="${esc(ctx.hrefOf(adminDash.id))}"` : ''}`
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
  // خلفية المشروع الثابتة: صنف على body + طبقة pt-pagebg كأول ابن (دون خلفية → بلا تغيير)
  // (الجولة 16) سمات حراسة الجلسة تُدمج بعد صنف الخلفية — لا تُدهس منطق class القائم
  const bodyAttr = `${ctx.pageBg ? ` class="pt-hasbg pt-hasbg--${esc(ctx.pageBg.overlay)}"` : ''}${guardBodyAttrs(schema, page, ctx)}`
  const pageBgDiv = ctx.pageBg
    ? `<div class="pt-pagebg" aria-hidden="true" style="background-image:url('${esc(ctx.pageBg.src)}')"></div>\n`
    : ''
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
<body${bodyAttr}>
${pageBgDiv}<a class="pt-skip" href="#pt-main">تخطَّ إلى المحتوى</a>
${body}
<div class="pt-demo-badge" aria-hidden="true">بيانات تجريبية</div>
${buildSeedScript(schema)}<script src="${esc(ctx.rel)}script.js"></script>
</body>
</html>`
}

function shellFor(page: ProjectPage, ctx: RenderCtx): string {
  if (page.type === 'auth') return authShell(page, ctx)
  if (DASHBOARD_PAGE_TYPES.has(page.type)) {
    return dashboardShell(page, ctx)
  }
  return siteShell(page, ctx)
}

function pageHtml(
  schema: ProjectSchema,
  page: ProjectPage,
  rel: string,
  hrefOf: (pageId: string) => string,
  logo: { src: string; mime: string } | null,
  imgNames: Map<string, string>,
  pageBg: { file: string | null; overlay: string }
): string {
  const ctx: RenderCtx = {
    schema,
    rel,
    hrefOf,
    seq: { n: 0 },
    logo,
    pageId: page.id,
    // مسار نسبي لصورة مجمّعة (assets/img-{n}) من هذه الصفحة — أو null
    imgSrc: (dataUrl: string) => {
      const raw = typeof dataUrl === 'string' ? dataUrl : ''
      const name = imgNames.get(raw) ?? imgNames.get(raw.trim())
      return name ? `${rel}assets/${name}` : null
    },
    pageBg: pageBg.file ? { src: `${rel}assets/${pageBg.file}`, overlay: pageBg.overlay } : null,
  }
  return htmlDocument(schema, page, shellFor(page, ctx), ctx)
}

// ============================================================
// 404
// ============================================================
function notFoundHtml(
  schema: ProjectSchema,
  rel: string,
  homeHref: string,
  logo: { src: string; mime: string } | null,
  pageBg: { file: string | null; overlay: string } = { file: null, overlay: 'medium' }
): string {
  const brand = schema.navigation.brand || schema.metadata.name || 'موقعك'
  const bodyAttr = pageBg.file ? ` class="pt-hasbg pt-hasbg--${esc(pageBg.overlay)}"` : ''
  const pageBgDiv = pageBg.file
    ? `<div class="pt-pagebg" aria-hidden="true" style="background-image:url('${esc(rel)}assets/${esc(pageBg.file)})"></div>\n`
    : ''
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
<body${bodyAttr}>
${pageBgDiv}<a class="pt-skip" href="#pt-main">تخطَّ إلى المحتوى</a>
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

/** خلفية المشروع من branding.bgImage (قد لا تكون معرّفة في الأنواع القديمة) */
function brandingBgImage(schema: ProjectSchema): string {
  const branding = (schema.branding ?? {}) as unknown as Record<string, unknown>
  return S(branding, 'bgImage')
}

/** شدة غسل خلفية المشروع (none|strong|medium|soft — الافتراضي medium) */
function brandingBgOverlay(schema: ProjectSchema): string {
  const branding = (schema.branding ?? {}) as unknown as Record<string, unknown>
  const raw = S(branding, 'bgOverlay')
  return ['none', 'strong', 'medium', 'soft'].includes(raw) ? raw : 'medium'
}

interface CollectedImage {
  /** نص data URL كما ورد في المخطط (مفتاح المطابقة) */
  dataUrl: string
  /** اسم الملف داخل الحزمة: img-{n}.{ext} */
  name: string
  buffer: Uint8Array
  ext: string
  mime: string
}

/**
 * يجمع كل صور المخطط (خلفية البطل والأقسام + صور عناصر المعرض/الفريق):
 * أي خاصية bgImage على أي كتلة + أي image داخل عناصر قوائم الخصائص —
 * إزالة التكرار بالنص الحرفي → assets/img-{n}.{ext} بترتيب الظهور.
 */
function collectSchemaImages(schema: ProjectSchema): CollectedImage[] {
  const byUrl = new Map<string, CollectedImage>()
  let n = 0
  const add = (dataUrl: string) => {
    const raw = typeof dataUrl === 'string' ? dataUrl.trim() : ''
    if (!raw || byUrl.has(raw)) return
    const asset = dataUrlToAsset(raw)
    if (!asset) return
    n += 1
    byUrl.set(raw, { dataUrl: raw, name: `img-${n}.${asset.ext}`, buffer: asset.buffer, ext: asset.ext, mime: asset.mime })
  }
  const pages = Array.isArray(schema?.pages) ? schema.pages : []
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      const props = (block?.props ?? {}) as Record<string, unknown>
      add(S(props, 'bgImage'))
      // عناصر القوائم داخل الخصائص (عناصر المعرض/الفريق قد تحمل image)
      for (const value of Object.values(props)) {
        if (!Array.isArray(value)) continue
        for (const item of value) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) continue
          add(S(item as Record<string, unknown>, 'image'))
        }
      }
    }
  }
  return [...byUrl.values()]
}

export function generateStaticSite(schema: ProjectSchema): {
  /** نص الملفات كنص، والشعار/الصور كـ Uint8Array ثنائي */
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

  // ---------- الشعار + خلفية المشروع + صور الأقسام: data URL → ملفات ثنائية ----------
  const logoAsset = schema.branding?.logo ? dataUrlToAsset(schema.branding.logo) : null
  const rootLogo = logoAsset ? { src: `assets/logo.${logoAsset.ext}`, mime: logoAsset.mime } : null
  const folderLogo = logoAsset ? { src: `../assets/logo.${logoAsset.ext}`, mime: logoAsset.mime } : null
  const brandBgAsset = dataUrlToAsset(brandingBgImage(schema))
  const brandBgOverlay = brandingBgOverlay(schema)
  const pageBg = {
    file: brandBgAsset ? `bg.${brandBgAsset.ext}` : null,
    overlay: brandBgOverlay,
  }
  // خريطة data URL → اسم ملف (assets/img-{n}) — موحّدة لكل الصفحات
  const collectedImages = collectSchemaImages(schema)
  const imgNames = new Map<string, string>()
  for (const img of collectedImages) imgNames.set(img.dataUrl, img.name)

  const files: Record<string, string | Uint8Array> = {}

  // ---------- الملفات المشتركة ----------
  if (logoAsset) files[`assets/logo.${logoAsset.ext}`] = logoAsset.buffer
  if (brandBgAsset) files[`assets/${pageBg.file}`] = brandBgAsset.buffer
  for (const img of collectedImages) files[`assets/${img.name}`] = img.buffer
  files['styles.css'] = buildStylesCss(schema.theme)
  files['script.js'] = buildScriptJs()
  files['netlify.toml'] = buildNetlifyToml()
  files['README.md'] = buildReadmeMd(schema)

  // ---------- الصفحات ----------
  for (const page of pages) {
    const slug = slugOf.get(page.id) ?? 'page'
    files[`${slug}/index.html`] = pageHtml(schema, page, '../', hrefFromFolder, folderLogo, imgNames, pageBg)
  }

  // ---------- الجذر: الصفحة الرئيسية + 404 ----------
  files['index.html'] = landing
    ? pageHtml(schema, landing, '', hrefFromRoot, rootLogo, imgNames, pageBg)
    : notFoundHtml(schema, '', './', rootLogo, pageBg)
  files['404.html'] = notFoundHtml(schema, '', './', rootLogo, pageBg)

  return { files, landingSlug }
}
