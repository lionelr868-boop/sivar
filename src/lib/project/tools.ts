// ============================================================
// SIVAR — Pure Agent Tools / Schema Reducers
// Task 2-a — دوال نقية (isomorphic) تُستعمل من الخادم والعميل:
// تطبيق إجراءات المساعد الذكي + عمليات المحرّر الدقيقة.
// ============================================================
import {
  BLOCK_REGISTRY,
  getBlockDefinition,
} from '@/lib/registry/blocks'
import {
  buildEntityData,
  defaultEntityFor,
  defaultStatsPreset,
  ENTITY_LABELS,
  refreshEntityRows,
} from '@/lib/content/mock-data'
import type {
  AgentAction,
  AgentToolName,
  AuthVariant,
  Block,
  BlockType,
  DashboardNavItem,
  PageAudience,
  PageType,
  ProjectNavigation,
  ProjectPage,
  ProjectSchema,
  ProjectTheme,
} from '@/lib/types'
import {
  COLOR_NAME_TO_HEX,
  PAGE_TYPE_LABELS,
  slugify as slugifyFn,
  uid as uidFn,
} from '@/lib/types'
import { buildLandingBlocks, changeLandingVariant as changeLandingVariantInSchema, getLandingVariant, LANDING_VARIANTS } from '@/lib/project/landing-kit'
import { mergeBlockProps } from '@/lib/project/entity-sync'
import { buildClientAreaBlocks } from '@/lib/project/client-area'

// ============================================================
// helpers
// ============================================================
function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

const PAGE_TYPES: string[] = Object.keys(PAGE_TYPE_LABELS)
const BLOCK_TYPES: string[] = Object.keys(BLOCK_REGISTRY)

function isPageType(v: unknown): v is PageType {
  return typeof v === 'string' && PAGE_TYPES.includes(v)
}
function isBlockType(v: unknown): v is BlockType {
  return typeof v === 'string' && BLOCK_TYPES.includes(v)
}

function strArg(args: Record<string, unknown>, key: string, fallback = ''): string {
  const v = args[key]
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}
function numArg(args: Record<string, unknown>, key: string): number | undefined {
  const v = args[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return undefined
}
function boolArg(args: Record<string, unknown>, key: string): boolean | undefined {
  const v = args[key]
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return undefined
}

/** إيجاد صفحة بالمُعرّف أو بالاسم */
function findPageRef(schema: ProjectSchema, ref: unknown): ProjectPage | undefined {
  if (typeof ref !== 'string' || !ref.trim()) return undefined
  const r = ref.trim()
  return schema.pages.find((p) => p.id === r) ?? schema.pages.find((p) => p.name === r || p.slug === r)
}

/** إيجاد مكوّن داخل صفحة (بالمُعرّف) */
function findBlock(page: ProjectPage, blockId: unknown): Block | undefined {
  if (typeof blockId !== 'string' || !blockId.trim()) return undefined
  return page.blocks.find((b) => b.id === blockId)
}

/** تنظيف مراجع التنقل بعد حذف صفحة */
function cleanNavReferences(schema: ProjectSchema, pageId: string): void {
  schema.navigation.items = schema.navigation.items.filter((it) => it.pageId !== pageId)
  if (schema.navigation.cta?.pageId === pageId) schema.navigation.cta = undefined
  schema.dashboardNav.items = schema.dashboardNav.items.filter((it) => it.pageId !== pageId)
}

// ============================================================
// شريط لوحة التحكم الجانبي — إدراج دقيق بلا تكرار ولا خلط
// (الجولة 13): كل صفحة تُعرض داخل قشرة لوحة التحكم يجب أن
// تظهر في الشريط الجانبي لحظة إنشائها — من الوكيل أو المحرر.
// ============================================================

/** أنواع الصفحات التي تُعرض داخل قشرة لوحة التحكم — لها مكان في الشريط الجانبي */
const DASHBOARD_AREA_TYPES: ReadonlySet<string> = new Set(['dashboard', 'table', 'form', 'settings', 'profile'])

/** هل تنتمي الصفحة لمنطقة لوحة التحكم (تُعرض داخل قشرتها الجانبية)؟ */
export function isDashboardAreaPage(page: Pick<ProjectPage, 'type'>): boolean {
  return DASHBOARD_AREA_TYPES.has(page.type)
}

/** أيقونات الكيانات في شريط اللوحة (مطابقة لاصطلاح القوالب الجاهزة) */
const ENTITY_NAV_ICON: Record<string, string> = {
  customers: 'users',
  orders: 'shopping-cart',
  products: 'package',
  bookings: 'calendar',
  invoices: 'file-text',
  services: 'briefcase',
  users: 'users',
  clients: 'users',
  tasks: 'clipboard-list',
  teamMembers: 'users',
  courses: 'graduation-cap',
  students: 'graduation-cap',
  properties: 'building',
  appointments: 'calendar-days',
  menuItems: 'utensils',
  transactions: 'credit-card',
  subscriptions: 'wallet',
}

/** الأيقونة الدقيقة لعنصر شريط لوحة التحكم حسب نوع الصفحة وكيانها — صفحات الزبون (الجولة 16) أيقونة user دائماً */
export function dashboardNavIconFor(page: Pick<ProjectPage, 'type' | 'entity' | 'audience'>): string {
  if (page.audience === 'client') return 'user'
  switch (page.type) {
    case 'dashboard':
      return 'layout-dashboard'
    case 'table':
      return ENTITY_NAV_ICON[page.entity ?? ''] ?? 'file-text'
    case 'form':
      return 'clipboard-list'
    case 'settings':
      return 'settings'
    case 'profile':
      return 'user'
    default:
      return 'file-text'
  }
}

/**
 * يُدرج عنصراً لصفحة في شريط لوحة التحكم (تعديل مباشر على المخطط المستنسخ) — بدقة:
 * - لا تكرار: صفحة لها عنصر بالفعل لا تُضاف مرتين.
 * - لا خلط: العنوان = اسم الصفحة، والأيقونة مطابقة لنوع الصفحة وكيانها.
 * - ترتيب مستقر: صفحات «لوحة تحكم» جديدة تُدرج بعد آخر عنصر لوحة (يبقى الرئيسي أولاً)،
 *   وبقية أنواع اللوحة تُلحق في نهاية القائمة دون المساس بالعناصر القائمة.
 */
function insertDashboardNavItem(schema: ProjectSchema, page: ProjectPage): void {
  if (!isDashboardAreaPage(page)) return
  if (schema.dashboardNav.items.some((it) => it.pageId === page.id)) return
  const item: DashboardNavItem = { label: page.name, pageId: page.id, icon: dashboardNavIconFor(page) }
  const items = schema.dashboardNav.items
  // (الجولة 16) صفحات فضاء الزبون تُلحق آخر القائمة (شريطها الخاص) —
  // مسار الجولة 13 لصفحات لوحة المدير كما هو حرفياً
  if (page.type === 'dashboard' && (page.audience ?? 'admin') === 'admin') {
    let at = 0
    for (let i = items.length - 1; i >= 0; i--) {
      const target = schema.pages.find((p) => p.id === items[i].pageId)
      if (target?.type === 'dashboard') {
        at = i + 1
        break
      }
    }
    items.splice(at, 0, item)
  } else {
    items.push(item)
  }
}

/** يضمن ظهور صفحة قائمة في الشريط الجانبي للوحة التحكم (إن كانت من أنواع منطقة اللوحة) — دالة نقية */
export function ensurePageInDashboardNav(schema: ProjectSchema, pageId: string): ProjectSchema {
  const page = schema.pages.find((p) => p.id === pageId)
  if (!page || !isDashboardAreaPage(page)) return schema
  if (schema.dashboardNav.items.some((it) => it.pageId === pageId)) return schema
  const next = clone(schema)
  const target = next.pages.find((p) => p.id === pageId) as ProjectPage
  insertDashboardNavItem(next, target)
  return next
}

/**
 * مزامنة عنصر صفحة في الشريط الجانبي بعد تعديلها (إعادة تسمية/تغيير كيان) —
 * يُبقي العنصر في موضعه ويحدّث عنوانه وأيقونته فقط، بلا خلط مع بقية العناصر.
 */
function syncPageInDashboardNav(schema: ProjectSchema, page: ProjectPage): void {
  const item = schema.dashboardNav.items.find((it) => it.pageId === page.id)
  if (!item) return
  if (item.label !== page.name) item.label = page.name
  const icon = dashboardNavIconFor(page)
  if (item.icon !== icon) item.icon = icon
}

/**
 * (الجولة 13) مزامنة قوائم التنقل بعد تعديل صفحة من المحرر (إعادة تسمية) —
 * يحدّث عنوان عنصر الشريط الجانبي وأيقونته وعنوان عنصر قائمة الموقع لنفس الصفحة فقط،
 * دون المساس بترتيب العناصر أو بقية القوائم — لا خلط بين العناصر.
 */
export function syncPageNavigation(schema: ProjectSchema, pageId: string): ProjectSchema {
  const page = schema.pages.find((p) => p.id === pageId)
  if (!page) return schema
  const next = clone(schema)
  const target = next.pages.find((p) => p.id === pageId) as ProjectPage
  syncPageInDashboardNav(next, target)
  for (const navItem of next.navigation.items) {
    if (navItem.pageId === target.id && navItem.label !== target.name) navItem.label = target.name
  }
  return next
}

/** كتل البداية لكل نوع صفحة (تُستعمل في create_page + factory) */
export function starterBlocksFor(
  schema: ProjectSchema,
  type: PageType,
  opts?: { entity?: string; authVariant?: AuthVariant; landingVariant?: string; audience?: PageAudience }
): Block[] {
  const d = (t: BlockType): Record<string, unknown> => clone(BLOCK_REGISTRY[t].defaults())
  const mk = (t: BlockType, props: Record<string, unknown>): Block => ({ id: uidFn('b_'), type: t, props })

  switch (type) {
    case 'landing':
      return buildLandingBlocks(schema, opts?.landingVariant)
    case 'auth': {
      const variant: AuthVariant = opts?.authVariant ?? 'login'
      const props = d('auth-card')
      props.variant = variant
      if (variant === 'signup') {
        props.title = 'إنشاء حساب'
        props.subtitle = `انضم إلى ${schema.navigation.brand} وابدأ رحلتك اليوم`
        props.buttonText = 'إنشاء الحساب'
      } else if (variant === 'forgot') {
        props.title = 'استعادة كلمة المرور'
        props.subtitle = 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة'
        props.buttonText = 'إرسال الرابط'
      }
      return [mk('auth-card', props)]
    }
    case 'dashboard': {
      // (الجولة 16) لوحة بجمهور client = فضاء الزبون «حسابي» بكتله الجاهزة
      if (opts?.audience === 'client') {
        return buildClientAreaBlocks(schema)
      }
      const entity = opts?.entity ?? defaultEntityFor(schema.metadata.type)
      const preset = defaultStatsPreset(schema.metadata.type)
      const stats = (schema.mockData.stats[preset] ?? schema.mockData.stats.overview ?? []).map((s) => ({
        ...s,
      }))
      return [
        mk('dashboard-header', {
          title: 'لوحة التحكم',
          subtitle: 'نظرة عامة على أداء مشروعك',
          actions: 'إضافة عنصر,تصدير التقرير',
        }),
        mk('stats-row', { items: stats.length ? stats : d('stats-row').items }),
        mk('chart', { title: 'الإيرادات الشهرية', chartType: 'bar', dataKey: 'revenueMonthly' }),
        mk('data-table', { entity, title: ENTITY_LABELS[entity] ?? 'العناصر', pageSize: 5 }),
      ]
    }
    case 'pricing':
      return [mk('pricing', d('pricing'))]
    case 'table': {
      const entity = opts?.entity ?? defaultEntityFor(schema.metadata.type)
      const label = ENTITY_LABELS[entity] ?? 'العناصر'
      return [
        mk('dashboard-header', {
          title: label,
          subtitle: `إدارة ${label} ومتابعتها لحظة بلحظة`,
          actions: `إضافة,تصدير`,
        }),
        mk('data-table', { entity, title: '', pageSize: 5 }),
      ]
    }
    case 'form':
      return [
        mk('dashboard-header', { title: 'نموذج جديد', subtitle: 'املأ النموذج التالي', actions: '' }),
        mk('form-fields', d('form-fields')),
      ]
    case 'settings':
      return [mk('settings-form', d('settings-form'))]
    case 'profile':
      return [mk('profile-card', d('profile-card'))]
    case 'faq':
      return [mk('faq', d('faq'))]
    default:
      return [mk('empty-state', d('empty-state'))]
  }
}

// ============================================================
// granular helpers (pinned contract)
// ============================================================

export function addPageToSchema(
  schema: ProjectSchema,
  opts: { name: string; type: PageType; entity?: string; authVariant?: AuthVariant; landingVariant?: string; audience?: PageAudience }
): { schema: ProjectSchema; pageId: string } {
  const next = clone(schema)
  const type: PageType = isPageType(opts.type) ? opts.type : 'custom'
  const name = opts.name?.trim() || PAGE_TYPE_LABELS[type]
  const page: ProjectPage = {
    id: uidFn('page_'),
    name,
    slug: slugifyFn(name),
    type,
    authVariant: opts.authVariant,
    // (الجولة 16) جمهور صفحات منطقة اللوحة — undefined = admin (توافق قديم)
    audience: opts.audience,
    entity: opts.entity,
    title: name,
    subtitle: '',
    blocks: starterBlocksFor(next, type, {
      entity: opts.entity,
      authVariant: opts.authVariant,
      landingVariant: opts.landingVariant,
      audience: opts.audience,
    }),
  }
  next.pages.push(page)
  // (الجولة 13) صفحات منطقة اللوحة تُدرج فوراً في الشريط الجانبي — بعنوان مطابق وأيقونة دقيقة
  insertDashboardNavItem(next, page)
  return { schema: next, pageId: page.id }
}

/** صفحة HTML مخصصة — كود من المستخدم داخل إطار آمن، مع هيكل الموقع أو لوحة التحكم حوله */
export function addHtmlPageToSchema(
  schema: ProjectSchema,
  opts: { name: string; html: string; placement?: 'site' | 'dashboard'; height?: number }
): { schema: ProjectSchema; pageId: string } {
  const placement = opts.placement === 'dashboard' ? 'dashboard' : 'site'
  const type: PageType = placement === 'dashboard' ? 'dashboard' : 'landing'
  const name = opts.name?.trim() || (placement === 'dashboard' ? 'لوحة HTML' : 'صفحة HTML')
  const html = typeof opts.html === 'string' && opts.html.trim() ? opts.html : String(BLOCK_REGISTRY['custom-html'].defaults().html)
  const height = typeof opts.height === 'number' && Number.isFinite(opts.height) && opts.height > 0 ? Math.min(4000, Math.round(opts.height)) : 560
  const page: ProjectPage = {
    id: uidFn('page_'),
    name,
    slug: slugifyFn(name),
    type,
    title: name,
    subtitle: '',
    blocks: [
      {
        id: uidFn('b_'),
        type: 'custom-html',
        props: { name, html, height },
      },
    ],
  }
  const next = clone(schema)
  next.pages.push(page)
  // (الجولة 13) صفحة HTML داخل اللوحة تظهر أيضاً في الشريط الجانبي
  insertDashboardNavItem(next, page)
  return { schema: next, pageId: page.id }
}

export function deletePageFromSchema(schema: ProjectSchema, pageId: string): ProjectSchema {
  const next = clone(schema)
  const idx = next.pages.findIndex((p) => p.id === pageId)
  if (idx === -1) return schema
  next.pages.splice(idx, 1)
  cleanNavReferences(next, pageId)
  return next.pages.length === 0 ? schema : next
}

/** تعقيم خصائص يرسلها الوكيل/المحرر لمكوّن جديد: قيم JSON بسيطة فقط (بلا دوال ولا ملفات data URL ضخمة) */
function sanitizeInitialProps(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const out: Record<string, unknown> = {}
  const walk = (value: unknown): unknown => {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return typeof value === 'string' && value.length > 3000 ? value.slice(0, 3000) : value
    }
    if (Array.isArray(value)) return value.slice(0, 24).map(walk)
    if (value && typeof value === 'object') {
      const rec: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value).slice(0, 30)) rec[k] = walk(v)
      return rec
    }
    return undefined
  }
  for (const [key, value] of Object.entries(raw as Record<string, unknown>).slice(0, 30)) {
    const clean = walk(value)
    if (clean !== undefined) out[key] = clean
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function addBlockToPage(
  schema: ProjectSchema,
  pageId: string,
  blockType: BlockType,
  position?: number,
  initialProps?: Record<string, unknown>
): { schema: ProjectSchema; blockId: string } {
  if (!isBlockType(blockType)) {
    throw new Error('نوع المكوّن غير معروف')
  }
  const next = clone(schema)
  const page = next.pages.find((p) => p.id === pageId)
  if (!page) {
    throw new Error('الصفحة غير موجودة')
  }
  const def = getBlockDefinition(blockType)
  // (الجولة 14) خصائص الوكيل/المحرر تُدمج فوق الافتراضيات — لا تُستبدل
  // كي تكتمل النواقص من القالب ولا ينتج مكوّن مبتور
  const defaults = def ? clone(def.defaults()) : {}
  const props = initialProps ? mergeBlockProps(defaults, initialProps) : defaults
  const block: Block = { id: uidFn('b_'), type: blockType, props }
  const pos = typeof position === 'number' ? Math.max(0, Math.min(position, page.blocks.length)) : page.blocks.length
  page.blocks.splice(pos, 0, block)
  return { schema: next, blockId: block.id }
}

export function updateBlockPropsInSchema(
  schema: ProjectSchema,
  pageId: string,
  blockId: string,
  patch: Record<string, unknown>
): ProjectSchema {
  const next = clone(schema)
  const page = next.pages.find((p) => p.id === pageId)
  const block = page ? findBlock(page, blockId) : undefined
  if (!page || !block) return schema
  // (الجولة 14) دمج جراحي غير إتلافي: المصفوفات تُدمج بالفهرس فلا تضيع
  // تعديلات المستخدم السابقة (صور/شارات/ميزات) عند كل تحديث
  block.props = mergeBlockProps(block.props ?? {}, patch)
  return next
}

export function deleteBlockFromSchema(schema: ProjectSchema, pageId: string, blockId: string): ProjectSchema {
  const next = clone(schema)
  const page = next.pages.find((p) => p.id === pageId)
  if (!page) return schema
  const idx = page.blocks.findIndex((b) => b.id === blockId)
  if (idx === -1) return schema
  page.blocks.splice(idx, 1)
  return next
}

export function moveBlockInSchema(
  schema: ProjectSchema,
  pageId: string,
  blockId: string,
  position: number
): ProjectSchema {
  const next = clone(schema)
  const page = next.pages.find((p) => p.id === pageId)
  if (!page) return schema
  const idx = page.blocks.findIndex((b) => b.id === blockId)
  if (idx === -1 || page.blocks.length < 2) return schema
  const pos = Math.max(0, Math.min(Math.round(position), page.blocks.length - 1))
  const [moved] = page.blocks.splice(idx, 1)
  page.blocks.splice(pos, 0, moved)
  return next
}

/** تحويل أسماء الألوان العربية إلى HEX + التحقق */
function normalizeThemeValue(key: string, value: unknown): { value?: unknown; error?: string } {
  switch (key) {
    case 'radius':
      if (typeof value === 'number' && Number.isFinite(value)) return { value: Math.max(0, Math.min(40, value)) }
      if (typeof value === 'string' && Number.isFinite(Number(value))) return { value: Math.max(0, Math.min(40, Number(value))) }
      return { error: 'قيمة نصف القطر غير صالحة' }
    case 'shadow': {
      const v = String(value)
      if (['none', 'sm', 'md', 'lg'].includes(v)) return { value: v }
      return { error: 'قيمة الظل غير صالحة (none/sm/md/lg)' }
    }
    case 'fontFamily': {
      const v = String(value)
      if (['IBM Plex Sans Arabic', 'Tajawal', 'Cairo'].includes(v)) return { value: v }
      return { error: 'الخط غير مدعوم (IBM Plex Sans Arabic / Tajawal / Cairo)' }
    }
    case 'mode': {
      const v = String(value)
      if (v === 'light' || v === 'dark') return { value: v }
      return { error: 'نمط العرض غير صالح' }
    }
    default: {
      // حقول الألوان
      const v = String(value).trim()
      if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return { value: v.toLowerCase() }
      const mapped = COLOR_NAME_TO_HEX[v]
      if (mapped) return { value: mapped }
      return { error: `لون غير صالح: «${v}»` }
    }
  }
}

const THEME_KEYS = [
  'primary',
  'primaryForeground',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'mutedText',
  'border',
  'radius',
  'shadow',
  'fontFamily',
  'mode',
]

export function updateThemeInSchema(schema: ProjectSchema, patch: Partial<ProjectTheme>): ProjectSchema {
  const next = clone(schema)
  for (const [key, raw] of Object.entries(patch ?? {})) {
    if (!THEME_KEYS.includes(key)) continue
    const { value, error } = normalizeThemeValue(key, raw)
    if (error || value === undefined) continue
    ;(next.theme as unknown as Record<string, unknown>)[key] = value
  }
  return next
}

export function updateNavigationInSchema(schema: ProjectSchema, patch: Partial<ProjectNavigation>): ProjectSchema {
  const next = clone(schema)
  if (typeof patch.brand === 'string' && patch.brand.trim()) next.navigation.brand = patch.brand.trim()
  if (typeof patch.footerNote === 'string') next.navigation.footerNote = patch.footerNote
  if (Array.isArray(patch.items)) {
    next.navigation.items = patch.items
      .filter((it) => it && typeof it.label === 'string' && typeof it.pageId === 'string')
      .map((it) => ({ label: it.label.trim(), pageId: it.pageId }))
  }
  if (patch.cta === null) {
    next.navigation.cta = undefined
  } else if (patch.cta && typeof patch.cta.label === 'string' && typeof patch.cta.pageId === 'string') {
    next.navigation.cta = { label: patch.cta.label.trim(), pageId: patch.cta.pageId }
  }
  return next
}

export function updateDashboardNavInSchema(schema: ProjectSchema, items: DashboardNavItem[]): ProjectSchema {
  const next = clone(schema)
  if (!Array.isArray(items)) return schema
  const seen = new Set<string>()
  next.dashboardNav = {
    items: items
      .filter((it) => it && typeof it.label === 'string' && typeof it.pageId === 'string')
      // (الجولة 13) لا تكرار لنفس الصفحة — أول ظهور يفوز فلا يحدث خلط بين العناصر
      .filter((it) => {
        if (seen.has(it.pageId)) return false
        seen.add(it.pageId)
        return true
      })
      .map((it) => {
        // (الجولة 13) أيقونة دقيقة: صالحة كما أعطيت، وإلا أيقونة العنصر القائم لنفس الصفحة، وإلا أيقونة نوع الصفحة
        const page = next.pages.find((p) => p.id === it.pageId)
        const existing = schema.dashboardNav.items.find((nav) => nav.pageId === it.pageId)
        const icon =
          typeof it.icon === 'string' && it.icon.trim()
            ? it.icon.trim()
            : existing?.icon ?? (page ? dashboardNavIconFor(page) : 'file-text')
        return { label: it.label.trim(), pageId: it.pageId, icon }
      }),
  }
  return next
}

export function renameProjectInSchema(schema: ProjectSchema, name: string): ProjectSchema {
  const next = clone(schema)
  const clean = name.trim()
  if (!clean) return schema
  next.metadata.name = clean
  next.settings.projectName = clean
  next.navigation.brand = clean
  return next
}

// ============================================================
// applyActions — محرك إجراءات المساعد الذكي
// ============================================================

interface ActionResult {
  schema: ProjectSchema
  applied: string[]
  errors: string[]
}

function blockLabel(type: BlockType): string {
  return BLOCK_REGISTRY[type]?.label ?? type
}

function refreshEntityIn(schema: ProjectSchema, entityKey: string, seed: number): boolean {
  const existing = schema.mockData.entities[entityKey]
  if (existing) {
    schema.mockData.entities[entityKey] = refreshEntityRows(existing, seed)
    return true
  }
  const fresh = buildEntityData(entityKey, seed)
  if (fresh) {
    schema.mockData.entities[entityKey] = fresh
    return true
  }
  return false
}

export function applyActions(schema: ProjectSchema, actions: AgentAction[]): ActionResult {
  let current = clone(schema)
  const applied: string[] = []
  const errors: string[] = []

  const pushError = (tool: string, msg: string) => errors.push(`${msg}`)

  for (const action of actions ?? []) {
    const args = (action?.args ?? {}) as Record<string, unknown>
    try {
      switch (action.tool as AgentToolName) {
        // ---------- pages ----------
        case 'create_page': {
          const type = isPageType(args.type) ? args.type : null
          if (!type) {
            pushError(action.tool, 'نوع الصفحة غير صالح')
            break
          }
          const name = strArg(args, 'name', PAGE_TYPE_LABELS[type])
          const entity = strArg(args, 'entity') || undefined
          const authVariantRaw = strArg(args, 'authVariant')
          const authVariant: AuthVariant | undefined =
            authVariantRaw === 'login' || authVariantRaw === 'signup' || authVariantRaw === 'forgot'
              ? authVariantRaw
              : undefined
          const landingVariantRaw = strArg(args, 'landingVariant')
          const landingVariant = LANDING_VARIANTS.some((v) => v.id === landingVariantRaw) ? landingVariantRaw : undefined
          // (الجولة 16) جمهور الصفحة — client لصفحات فضاء الزبون (وإلا undefined = admin)
          const audienceRaw = strArg(args, 'audience')
          const audience: PageAudience | undefined =
            audienceRaw === 'client' || audienceRaw === 'admin' ? audienceRaw : undefined
          const { schema: next, pageId } = addPageToSchema(current, {
            name,
            type,
            entity,
            authVariant,
            landingVariant,
            audience,
          })
          current = next
          // (الجولة 13) صفحات منطقة اللوحة تُدرج تلقائياً في الشريط الجانبي — نذكر ذلك صراحة
          const created = current.pages.find((p) => p.id === pageId)
          applied.push(
            landingVariant && type === 'landing'
              ? `تمت إضافة صفحة هبوط «${name}» بنمط «${getLandingVariant(landingVariant).name}»`
              : created && isDashboardAreaPage(created)
                ? `تمت إضافة صفحة «${name}» وإدراجها في الشريط الجانبي للوحة التحكم`
                : `تمت إضافة صفحة «${name}»`
          )
          void pageId
          break
        }

        case 'delete_page': {
          if (current.pages.length <= 1) {
            pushError(action.tool, 'لا يمكن حذف الصفحة الوحيدة في المشروع')
            break
          }
          const page = findPageRef(current, args.pageId ?? args.name ?? args.page)
          if (!page) {
            pushError(action.tool, 'الصفحة غير موجودة')
            break
          }
          current = deletePageFromSchema(current, page.id)
          applied.push(`تم حذف صفحة «${page.name}»`)
          break
        }

        case 'update_page': {
          const page = findPageRef(current, args.pageId ?? args.page ?? args.name)
          if (!page) {
            pushError(action.tool, 'الصفحة غير موجودة')
            break
          }
          const entity = strArg(args, 'entity')
          if (entity && !current.mockData.entities[entity]) {
            pushError(action.tool, `الكيان «${entity}» غير معروف في البيانات التجريبية`)
            break
          }
          const next = clone(current)
          const target = next.pages.find((p) => p.id === page.id) as ProjectPage
          const name = strArg(args, 'name')
          if (name) {
            target.name = name
            target.slug = slugifyFn(name)
            target.title = name
          }
          const title = strArg(args, 'title')
          if (title) target.title = title
          if (typeof args.subtitle === 'string') target.subtitle = args.subtitle
          if (entity) target.entity = entity
          // (الجولة 13) مزامنة دقيقة: عنوان الشريط الجانبي وقائمة الموقع يتبعان اسم الصفحة،
          // وأيقونة الشريط تتبع نوع الصفحة/كيانها — بلا خلط بين العناصر القائمة
          syncPageInDashboardNav(next, target)
          for (const navItem of next.navigation.items) {
            if (navItem.pageId === target.id && navItem.label !== target.name) navItem.label = target.name
          }
          current = next
          applied.push(`تم تحديث صفحة «${target.name}»`)
          break
        }

        // ---------- blocks ----------
        case 'add_block': {
          const page = findPageRef(current, args.pageId ?? args.page)
          const blockType = args.blockType ?? args.type
          if (!isBlockType(blockType)) {
            pushError(action.tool, 'نوع المكوّن غير معروف')
            break
          }
          if (!page) {
            pushError(action.tool, 'الصفحة غير موجودة')
            break
          }
          const position = numArg(args, 'position')
          // (الجولة 14) خصائص الوكيل اختيارية وتُدمج فوق الافتراضيات
          const initialProps = sanitizeInitialProps(args.props)
          const { schema: next, blockId } = addBlockToPage(current, page.id, blockType, position, initialProps)
          current = next
          applied.push(`تمت إضافة مكوّن «${blockLabel(blockType)}» إلى صفحة «${page.name}»`)
          void blockId
          break
        }

        case 'update_block':
        case 'update_content': {
          const page = findPageRef(current, args.pageId ?? args.page)
          if (!page) {
            pushError(action.tool, 'الصفحة غير موجودة')
            break
          }
          const block = findBlock(page, args.blockId ?? args.id)
          if (!block) {
            pushError(action.tool, 'المكوّن غير موجود')
            break
          }
          const patch = (args.patch ?? args.props) as Record<string, unknown> | undefined
          if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
            pushError(action.tool, 'خصائص التحديث غير صالحة')
            break
          }
          current = updateBlockPropsInSchema(current, page.id, block.id, patch)
          const prefix = action.tool === 'update_content' ? 'محتوى' : 'مكوّن'
          applied.push(`تم تحديث ${prefix} «${blockLabel(block.type)}»`)
          break
        }

        case 'delete_block': {
          const page = findPageRef(current, args.pageId ?? args.page)
          if (!page) {
            pushError(action.tool, 'الصفحة غير موجودة')
            break
          }
          const block = findBlock(page, args.blockId ?? args.id)
          if (!block) {
            pushError(action.tool, 'المكوّن غير موجود')
            break
          }
          current = deleteBlockFromSchema(current, page.id, block.id)
          applied.push(`تم حذف مكوّن «${blockLabel(block.type)}»`)
          break
        }

        case 'move_block': {
          const page = findPageRef(current, args.pageId ?? args.page)
          if (!page) {
            pushError(action.tool, 'الصفحة غير موجودة')
            break
          }
          const block = findBlock(page, args.blockId ?? args.id)
          if (!block) {
            pushError(action.tool, 'المكوّن غير موجود')
            break
          }
          const idx = page.blocks.findIndex((b) => b.id === block.id)
          let position = numArg(args, 'position')
          const direction = strArg(args, 'direction')
          if (position === undefined && (direction === 'up' || direction === 'down')) {
            position = direction === 'up' ? idx - 1 : idx + 1
          }
          if (position === undefined || position < 0 || position >= page.blocks.length) {
            pushError(action.tool, 'الموضع الجديد غير صالح')
            break
          }
          current = moveBlockInSchema(current, page.id, block.id, position)
          applied.push(`تم نقل مكوّن «${blockLabel(block.type)}»`)
          break
        }

        // ---------- landing variant ----------
        case 'change_landing_variant': {
          const variantRaw = strArg(args, 'variant') || strArg(args, 'landingVariant') || strArg(args, 'variantId')
          const variantMeta = LANDING_VARIANTS.find((v) => v.id === variantRaw)
          if (!variantMeta) {
            pushError(action.tool, 'نمط صفحة الهبوط غير معروف')
            break
          }
          const ref = args.pageId ?? args.page ?? args.name
          const page = ref ? findPageRef(current, ref) : current.pages.find((p) => p.type === 'landing')
          if (!page || page.type !== 'landing') {
            pushError(action.tool, 'لم أجد صفحة هبوط لتغيير نمطها')
            break
          }
          current = changeLandingVariantInSchema(current, page.id, variantMeta.id)
          applied.push(`تم تحويل صفحة «${page.name}» إلى نمط «${variantMeta.name}»`)
          break
        }

        // ---------- theme / navigation ----------
        case 'update_theme': {
          const patch = (args.patch ?? args) as Record<string, unknown>
          const themePatch: Record<string, unknown> = {}
          let hadValid = false
          for (const key of THEME_KEYS) {
            if (patch[key] !== undefined) {
              const { value, error } = normalizeThemeValue(key, patch[key])
              if (error) {
                pushError(action.tool, error)
              } else if (value !== undefined) {
                themePatch[key] = value
                hadValid = true
              }
            }
          }
          if (!hadValid) {
            if (!errors.length) pushError(action.tool, 'لا توجد قيم صالحة لتحديث الهوية')
            break
          }
          current = updateThemeInSchema(current, themePatch as Partial<ProjectTheme>)
          applied.push('تم تحديث هوية الألوان')
          break
        }

        case 'update_navigation': {
          const pageIds = new Set(current.pages.map((p) => p.id))
          const items = args.items as Array<{ label?: string; pageId?: string }> | undefined
          if (Array.isArray(items)) {
            const bad = items.find((it) => !it || typeof it.pageId !== 'string' || !pageIds.has(it.pageId))
            if (bad) {
              pushError(action.tool, 'عنصر تنقل يشير إلى صفحة غير موجودة')
              break
            }
          }
          const cta = args.cta as { label?: string; pageId?: string } | undefined
          if (cta && (typeof cta.pageId !== 'string' || !pageIds.has(cta.pageId))) {
            pushError(action.tool, 'زر التنقل يشير إلى صفحة غير موجودة')
            break
          }
          current = updateNavigationInSchema(current, {
            brand: typeof args.brand === 'string' ? args.brand : undefined,
            footerNote: typeof args.footerNote === 'string' ? args.footerNote : undefined,
            items: Array.isArray(items) ? (items as ProjectNavigation['items']) : undefined,
            cta: (cta as ProjectNavigation['cta']) ?? undefined,
          })
          applied.push('تم تحديث قائمة التنقل')
          break
        }

        case 'update_dashboard_nav': {
          const pageIds = new Set(current.pages.map((p) => p.id))
          const items = args.items as Array<{ label?: string; pageId?: string; icon?: string }> | undefined
          if (!Array.isArray(items)) {
            pushError(action.tool, 'قائمة عناصر لوحة التحكم غير صالحة')
            break
          }
          const bad = items.find((it) => !it || typeof it.pageId !== 'string' || !pageIds.has(it.pageId))
          if (bad) {
            pushError(action.tool, 'عنصر لوحة التحكم يشير إلى صفحة غير موجودة')
            break
          }
          current = updateDashboardNavInSchema(current, items as DashboardNavItem[])
          applied.push('تم تحديث قائمة لوحة التحكم')
          break
        }

        // ---------- project ----------
        case 'rename_project': {
          const name = strArg(args, 'name')
          if (!name) {
            pushError(action.tool, 'اسم المشروع غير صالح')
            break
          }
          current = renameProjectInSchema(current, name)
          applied.push(`تمت إعادة تسمية المشروع إلى «${name}»`)
          break
        }

        case 'generate_mock_data': {
          const entity = strArg(args, 'entity')
          const seed = Math.max(1, Math.floor(Math.random() * 97))
          if (entity) {
            if (!ENTITY_LABELS[entity]) {
              pushError(action.tool, `الكيان «${entity}» غير معروف`)
              break
            }
            if (!refreshEntityIn(current, entity, seed)) {
              pushError(action.tool, 'تعذّر تحديث بيانات هذا الكيان')
              break
            }
            applied.push(`تم تحديث بيانات «${ENTITY_LABELS[entity]}»`)
          } else {
            let count = 0
            for (const key of Object.keys(current.mockData.entities)) {
              if (refreshEntityIn(current, key, seed + count)) count++
            }
            applied.push(`تم تحديث البيانات التجريبية (${count} كياناً)`)
          }
          break
        }

        default:
          pushError(String(action?.tool ?? '?'), 'إجراء غير معروف')
          break
      }
    } catch (e) {
      pushError(action?.tool ?? '?', (e as Error).message || 'حدث خطأ أثناء تنفيذ الإجراء')
    }
  }

  return { schema: current, applied, errors }
}

// تصدير الأنواع المستعملة داخلياً لفائدة بقية الوحدات
export type { PageType, BlockType, AuthVariant, ProjectPage, ProjectSchema }

// ============================================================
// Task 8/9 — الصور المؤقتة (كل صور المخطط)
// ============================================================

/**
 * يزيل كل خصائص الصور المؤقتة من المخطط كاملاً (Task 9-b):
 * - كل كتلة (أي نوع): bgImage / bgImageName من الخصائص.
 * - عناصر القوائم داخل الخصائص: image / imageName (مشياً عاماً على أي مصفوفة).
 * - branding: bgImage / bgImageName / bgOverlay (الشعار logo/logoName يبقى).
 * الصور لا تبقى في قاعدة البيانات: تُحذف بعد تحميل المشروع ZIP،
 * وتُنقّى من نسخ الإصدارات التاريخية (المشروع الحي يحتفظ بها
 * حتى التحميل كنسخة عمل للمعاينة والتصدير).
 * نقية ومتوافقة رجعياً: مخطط بلا صور يُعاد كما هو (نفس المرجع).
 */
export function stripTransientImages(schema: ProjectSchema): ProjectSchema {
  let changed = false

  // ---- الكتل: خصائص الصورة على مستوى الكتلة + داخل عناصر القوائم ----
  const pages = (schema.pages ?? []).map((page) => ({
    ...page,
    blocks: (page.blocks ?? []).map((block) => {
      if (!block) return block
      const props = block.props ?? {}
      let nextProps: Record<string, unknown> | null = null
      if (props.bgImage !== undefined || props.bgImageName !== undefined) {
        const { bgImage: _bi, bgImageName: _bn, ...rest } = props
        nextProps = rest
        changed = true
      }
      // عناصر القوائم داخل أي خاصية مصفوفة (عناصر المعرض/الفريق وغيرها)
      for (const [key, value] of Object.entries(nextProps ?? props)) {
        if (!Array.isArray(value)) continue
        let listChanged = false
        const nextList = value.map((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return item
          const rec = item as Record<string, unknown>
          if (rec.image === undefined && rec.imageName === undefined) return item
          listChanged = true
          const { image: _im, imageName: _inm, ...restItem } = rec
          return restItem
        })
        if (!listChanged) continue
        changed = true
        if (!nextProps) nextProps = { ...props }
        nextProps[key] = nextList
      }
      return nextProps ? { ...block, props: nextProps } : block
    }),
  }))

  // ---- branding: خلفية المشروع (الشعار يبقى كما هو) ----
  let cleanedBranding: ProjectSchema['branding'] | null = null
  const branding = schema.branding
  if (branding) {
    const b = branding as unknown as Record<string, unknown>
    if (b.bgImage !== undefined || b.bgImageName !== undefined || b.bgOverlay !== undefined) {
      const { bgImage: _bgi, bgImageName: _bgn, bgOverlay: _bgo, ...rest } = b
      cleanedBranding = rest as unknown as ProjectSchema['branding']
      changed = true
    }
  }

  if (!changed) return schema
  const next: ProjectSchema = { ...schema, pages }
  if (cleanedBranding) next.branding = cleanedBranding
  return next
}
