// ============================================================
// نموذج — المساعد الذكي (عقل الوكيل) — خادم فقط
// Task 3-b — LLM مع مهلة 30 ثانية + تعقيم صارم للإجراءات
// + بديل استدلالي بالقواعد عند فشل الـ LLM.
// ============================================================
import ZAI from 'z-ai-web-dev-sdk'
import type {
  AgentAction,
  AgentToolName,
  AuthVariant,
  BlockType,
  PageType,
  ProjectPage,
  ProjectSchema,
} from '@/lib/types'
import { COLOR_NAME_TO_HEX } from '@/lib/types'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { ENTITY_KEYS, defaultEntityFor } from '@/lib/content/mock-data'
import { LANDING_VARIANTS } from '@/lib/project/landing-kit'

// ============================================================
// أنواع
// ============================================================
export interface AgentHistoryMessage {
  role: string
  text: string
}

export interface AgentRunResult {
  explanation: string
  actions: AgentAction[]
  fallback: boolean
}

// ============================================================
// ثوابت
// ============================================================
const LLM_TIMEOUT_MS = 30_000
const MAX_ACTIONS = 12

const TOOL_NAMES: string[] = [
  'create_page', 'delete_page', 'update_page', 'add_block', 'update_block', 'update_content',
  'delete_block', 'move_block', 'update_theme', 'update_navigation', 'update_dashboard_nav',
  'rename_project', 'generate_mock_data', 'change_landing_variant',
]
const PAGE_TYPES = [
  'landing', 'auth', 'dashboard', 'pricing', 'table', 'form', 'settings', 'profile', 'faq', 'custom',
]
const BLOCK_TYPES: string[] = Object.keys(BLOCK_REGISTRY)
const LANDING_VARIANT_IDS: string[] = LANDING_VARIANTS.map((v) => v.id as string)
const LANDING_VARIANTS_PROMPT = LANDING_VARIANTS.map((v) => `${v.id} — ${v.name} (${v.tagline})`).join('؛ ')
const THEME_COLOR_KEYS = [
  'primary', 'primaryForeground', 'secondary', 'accent', 'background', 'surface', 'text',
  'mutedText', 'border',
]
const COLOR_NAMES_BY_LENGTH = Object.keys(COLOR_NAME_TO_HEX).sort((a, b) => b.length - a.length)

// ============================================================
// استدعاء الـ LLM (مع مهلة)
// ============================================================
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const zai = await ZAI.create()
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), LLM_TIMEOUT_MS)
      }),
    ])
    const text = completion.choices[0]?.message?.content
    return typeof text === 'string' && text.trim() ? text : null
  } catch {
    return null
  }
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  let t = text.trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const parsed = JSON.parse(t.slice(start, end + 1)) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

// ============================================================
// سياق المشروع المضغوط
// ============================================================
function buildContext(schema: ProjectSchema): string {
  const context = {
    metadata: {
      name: schema.metadata.name,
      type: schema.metadata.type,
      style: schema.metadata.style,
      audience: schema.metadata.audience,
    },
    theme: {
      primary: schema.theme.primary,
      secondary: schema.theme.secondary,
      accent: schema.theme.accent,
      radius: schema.theme.radius,
      shadow: schema.theme.shadow,
      fontFamily: schema.theme.fontFamily,
    },
    pages: schema.pages.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      entity: p.entity ?? null,
      authVariant: p.authVariant ?? null,
      blocks: p.blocks.map((b) => ({ id: b.id, type: b.type })),
    })),
    navigation: {
      brand: schema.navigation.brand,
      items: schema.navigation.items.map((it) => ({ label: it.label, pageId: it.pageId })),
      cta: schema.navigation.cta ? { label: schema.navigation.cta.label, pageId: schema.navigation.cta.pageId } : null,
    },
    dashboardNav: schema.dashboardNav.items.map((it) => ({
      label: it.label, pageId: it.pageId, icon: it.icon,
    })),
    availableEntityKeys: ENTITY_KEYS,
    availableChartKeys: Object.keys(schema.mockData.charts),
    availableBlockTypes: BLOCK_TYPES,
  }
  return JSON.stringify(context)
}

// ============================================================
// موجه النظام
// ============================================================
const AGENT_SYSTEM_PROMPT = [
  'أنت «المساعد الذكي» داخل منصة «نموذج» العربية (الجزائر).',
  'دورك: تنفيذ تعديلات دقيقة على مشروع المستخدم (نموذج أولي لموقع/تطبيق) عبر أدوات (tools).',
  'يتوفر لديك سياق المشروع الحالي (صفحاته، مكوّناته، هويته، قوائمه) في رسالة المستخدم.',
  '',
  'الأدوات المتاحة مع شكل الوسائط (args) بالضبط:',
  '1. create_page: {"name":"اسم الصفحة بالعربية","type":"landing|auth|dashboard|pricing|table|form|settings|profile|faq|custom","entity":"اختياري: مفتاح كيان من availableEntityKeys","authVariant":"اختياري للصفحات auth: login|signup|forgot"}',
  '2. delete_page: {"pageId":"معرّف الصفحة"} أو {"pageName":"اسم الصفحة"}',
  '3. update_page: {"pageId":"معرّف الصفحة","name":"اسم جديد اختياري","title":"عنوان اختياري","subtitle":"وصف اختياري"}',
  '4. add_block: {"pageId":"معرّف الصفحة","blockType":"نوع من availableBlockTypes","props":{...خصائص جزئية...},"position":رقم_اختياري}',
  '5. update_block: {"pageId":"...","blockId":"...","props":{...الخصائص المعدلة فقط...}}',
  '6. update_content: {"pageId":"...","blockId":"...","content":{...نصوص معدلة مثل title/subtitle...}}',
  '7. delete_block: {"pageId":"...","blockId":"..."}',
  '8. move_block: {"pageId":"...","blockId":"...","position":رقم}',
  '9. update_theme: {"theme":{"primary":"#hex","secondary":"#hex","accent":"#hex","radius":12,"shadow":"sm|md|lg","fontFamily":"IBM Plex Sans Arabic|Tajawal|Cairo"}}',
  '10. update_navigation: {"brand":"اسم العلامة","items":[{"label":"...","pageId":"..."}]}',
  '11. update_dashboard_nav: {"items":[{"label":"...","pageId":"...","icon":"sparkles"}]}',
  '12. rename_project: {"name":"الاسم الجديد"}',
  '13. generate_mock_data: {"entity":"مفتاح كيان اختياري — بدون قيمة يُحدّث كل الكيانات"}',
  '14. change_landing_variant: {"variant":"معرف نمط من أنماط صفحات الهبوط أدناه","pageId":"معرّف صفحة هبوط اختياري — الافتراضي أول صفحة هبوط"} — يعيد بناء أقسام صفحة الهبوط بالنمط المختار. الأنماط: ' + LANDING_VARIANTS_PROMPT,
  '',
  'أدوات إضافية عند إنشاء صفحات الهبوط:',
  '- في create_page من نوع landing يمكنك إضافة "landingVariant":"معرف النمط" من قائمة الأنماط أعلاه لبنائها بنمط محدد.',
  '- مكوّن البطل (hero) يدعم: background من (default|muted|gradient-soft|mesh|dark|gradient) وخصائص eyebrow (شارة فوق العنوان) و visual من (dashboard|phone|video|form|analytics|orders|chat|calendar|testimonial|none) — analytics بطاقة تقرير أداء، orders أحدث الطلبات، chat محادثة دعم، calendar تقويم، testimonial رأي عميل — و bgOverlay عند رفع المستخدم صورة خلفية (dark|medium|light|none) — لا تضع bgImage بنفسك أبداً (الصور يرفعها المستخدم فقط).',
  '- أقسام صفحة الهبوط (cta|banner|features|testimonials|stats|steps|gallery|team|faq) تدعم bgImage/bgOverlay (dark|medium|light|none) كخلفية صورة للقسم — يرفعها المستخدم فقط من لوحة الخصائص ولا تضع data URLs بنفسك أبداً؛ وbranding.bgImage خلفية ثابتة لكل صفحات المشروع (رفع المستخدم فقط) مع bgOverlay من (none|strong|medium|soft).',
  '- مكوّنات لوحة التحكم الغنية: activity-feed (سجل نشاطات: items[user,action,target,time]) و tasks-list (مهام بمربعات اختيار: items[label,done,meta]) و quick-actions (إجراءات سريعة تنقل لصفحات: actions[icon,label,pageId]) — استعملها لإثراء اللوحات.',
  '- كل الأزرار في النموذج تعمل تلقائياً: أزرار البطل/التسعير/دعوة الإجراء تنقل إلى أفضل صفحة متاحة، وأزرار ترويسة اللوحة تنقل إلى صفحة النموذج/الجدول، وزر الدخول وإنشاء الحساب ينقلان إلى لوحة التحكم.',
  '',
  'قواعد صارمة:',
  '- غيّر أقل قدر ممكن — طلب صغير = تغيير صغير.',
  '- لا تحذف أو تعيد تصميم أي شيء لم يطلبه المستخدم صراحة.',
  '- كل النصوص الجديدة بالعربية الفصحى المبسطة.',
  '- الأسعار بالدينار الجزائري (دج).',
  '- الألوان بصيغة hex مثل #059669.',
  '- استعمل pageId الموجودة في السياق، لا تخترع معرّفات.',
  '- لإضافة مكوّن استعمل blockType من availableBlockTypes فقط، وخصائص props مطابقة لأنواع المكوّن (عنوان/نص/عناصر).',
  '',
  'أعد JSON فقط دون أي نص خارجه، بالصيغة:',
  '{"explanation":"شرح عربي موجز لما فعلته","actions":[{"tool":"اسم الأداة","args":{...}}]}',
].join('\n')

// ============================================================
// تعقيم إجراءات الـ LLM
// ============================================================
function resolvePageRef(
  schema: ProjectSchema,
  args: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const v = args[key]
    if (typeof v !== 'string' || !v.trim()) continue
    const ref = v.trim()
    const page = schema.pages.find((p) => p.id === ref) ??
      schema.pages.find((p) => p.name === ref || p.slug === ref) ??
      schema.pages.find((p) => p.name.includes(ref) || ref.includes(p.name))
    if (page) return page.id
  }
  return null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function mapArabicColors(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...patch }
  for (const key of THEME_COLOR_KEYS) {
    const v = out[key]
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
        out[key] = trimmed.toLowerCase()
      } else if (COLOR_NAME_TO_HEX[trimmed]) {
        out[key] = COLOR_NAME_TO_HEX[trimmed]
      } else {
        delete out[key]
      }
    }
  }
  return out
}

function sanitizeNavItems(
  schema: ProjectSchema,
  raw: unknown
): Array<{ label: string; pageId: string }> | null {
  if (!Array.isArray(raw)) return null
  const items: Array<{ label: string; pageId: string }> = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 40) : ''
    const pageId =
      (typeof item.pageId === 'string' && schema.pages.find((p) => p.id === item.pageId)?.id) ??
      resolvePageRef(schema, item, ['pageName', 'page', 'name'])
    if (label && pageId) items.push({ label, pageId })
  }
  return items
}

function sanitizeActions(schema: ProjectSchema, rawActions: unknown): AgentAction[] {
  if (!Array.isArray(rawActions)) return []
  const actions: AgentAction[] = []
  for (const item of rawActions.slice(0, MAX_ACTIONS)) {
    if (!isRecord(item)) continue
    const tool = typeof item.tool === 'string' ? item.tool : ''
    if (!TOOL_NAMES.includes(tool)) continue
    const args: Record<string, unknown> = isRecord(item.args) ? { ...item.args } : {}

    switch (tool as AgentToolName) {
      case 'create_page': {
        const type = typeof args.type === 'string' && PAGE_TYPES.includes(args.type) ? args.type : null
        if (!type) continue
        const name = typeof args.name === 'string' && args.name.trim() ? args.name.trim().slice(0, 40) : ''
        const entity =
          typeof args.entity === 'string' && ENTITY_KEYS.includes(args.entity as (typeof ENTITY_KEYS)[number])
            ? args.entity
            : undefined
        const authVariant =
          typeof args.authVariant === 'string' && ['login', 'signup', 'forgot'].includes(args.authVariant)
            ? (args.authVariant as AuthVariant)
            : undefined
        const clean: Record<string, unknown> = { name, type, entity, authVariant }
        if (
          type === 'landing' &&
          typeof args.landingVariant === 'string' &&
          LANDING_VARIANT_IDS.includes(args.landingVariant)
        ) {
          clean.landingVariant = args.landingVariant
        }
        actions.push({ tool: 'create_page', args: clean })
        break
      }
      case 'delete_page': {
        const pageId = resolvePageRef(schema, args, ['pageId', 'pageName', 'page', 'name'])
        if (!pageId) continue
        actions.push({ tool: 'delete_page', args: { pageId } })
        break
      }
      case 'update_page': {
        const pageId = resolvePageRef(schema, args, ['pageId', 'page', 'pageName'])
        if (!pageId) continue
        const clean: Record<string, unknown> = { pageId }
        if (typeof args.name === 'string' && args.name.trim()) clean.name = args.name.trim().slice(0, 40)
        if (typeof args.title === 'string' && args.title.trim()) clean.title = args.title.trim().slice(0, 80)
        if (typeof args.subtitle === 'string') clean.subtitle = args.subtitle.slice(0, 160)
        if (typeof args.entity === 'string' && ENTITY_KEYS.includes(args.entity as (typeof ENTITY_KEYS)[number])) {
          clean.entity = args.entity
        }
        actions.push({ tool: 'update_page', args: clean })
        break
      }
      case 'add_block': {
        const pageId = resolvePageRef(schema, args, ['pageId', 'page', 'pageName'])
        const blockType = typeof args.blockType === 'string' ? args.blockType : (typeof args.type === 'string' ? args.type : '')
        if (!pageId || !BLOCK_TYPES.includes(blockType)) continue
        const clean: Record<string, unknown> = { pageId, blockType }
        if (isRecord(args.props)) clean.props = args.props
        if (typeof args.position === 'number' && Number.isFinite(args.position)) clean.position = Math.round(args.position)
        actions.push({ tool: 'add_block', args: clean })
        break
      }
      case 'update_block':
      case 'update_content': {
        const pageId = resolvePageRef(schema, args, ['pageId', 'page', 'pageName'])
        const blockId = typeof args.blockId === 'string' && args.blockId.trim() ? args.blockId.trim() : ''
        if (!pageId || !blockId) continue
        const patch = isRecord(args.props) ? args.props : isRecord(args.patch) ? args.patch : isRecord(args.content) ? args.content : null
        if (!patch) continue
        actions.push({ tool: tool as AgentToolName, args: { pageId, blockId, props: patch } })
        break
      }
      case 'delete_block': {
        const pageId = resolvePageRef(schema, args, ['pageId', 'page', 'pageName'])
        const blockId = typeof args.blockId === 'string' && args.blockId.trim() ? args.blockId.trim() : ''
        if (!pageId || !blockId) continue
        actions.push({ tool: 'delete_block', args: { pageId, blockId } })
        break
      }
      case 'move_block': {
        const pageId = resolvePageRef(schema, args, ['pageId', 'page', 'pageName'])
        const blockId = typeof args.blockId === 'string' && args.blockId.trim() ? args.blockId.trim() : ''
        if (!pageId || !blockId) continue
        const clean: Record<string, unknown> = { pageId, blockId }
        if (typeof args.position === 'number' && Number.isFinite(args.position)) clean.position = Math.round(args.position)
        else if (typeof args.direction === 'string' && ['up', 'down'].includes(args.direction)) clean.direction = args.direction
        else continue
        actions.push({ tool: 'move_block', args: clean })
        break
      }
      case 'update_theme': {
        const patch = isRecord(args.theme)
          ? args.theme
          : isRecord(args.patch)
            ? args.patch
            : args
        const mapped = mapArabicColors(patch)
        if (typeof mapped.radius !== 'undefined') {
          const r = Number(mapped.radius)
          if (Number.isFinite(r)) mapped.radius = Math.max(0, Math.min(40, Math.round(r)))
          else delete mapped.radius
        }
        if (typeof mapped.shadow === 'string' && !['none', 'sm', 'md', 'lg'].includes(mapped.shadow)) delete mapped.shadow
        if (typeof mapped.fontFamily === 'string' && !['IBM Plex Sans Arabic', 'Tajawal', 'Cairo'].includes(mapped.fontFamily)) delete mapped.fontFamily
        if (typeof mapped.mode === 'string' && !['light', 'dark'].includes(mapped.mode)) delete mapped.mode
        // نتجاهل الإجراء إن لم تبقَ أي قيمة صالحة
        if (Object.keys(mapped).length === 0) continue
        // applyActions يقرأ patch ?? args — نضع القيم تحت مفتاح patch
        actions.push({ tool: 'update_theme', args: { patch: mapped } })
        break
      }
      case 'update_navigation': {
        const clean: Record<string, unknown> = {}
        if (typeof args.brand === 'string' && args.brand.trim()) clean.brand = args.brand.trim().slice(0, 40)
        const items = sanitizeNavItems(schema, args.items)
        if (Array.isArray(items)) clean.items = items
        if (isRecord(args.cta)) {
          const cta = args.cta
          const label = typeof cta.label === 'string' && cta.label.trim() ? cta.label.trim().slice(0, 40) : ''
          const pageId =
            (typeof cta.pageId === 'string' && schema.pages.find((p) => p.id === cta.pageId)?.id) ??
            resolvePageRef(schema, cta, ['pageName', 'page', 'name'])
          if (label && pageId) clean.cta = { label, pageId }
        }
        if (Object.keys(clean).length === 0) continue
        actions.push({ tool: 'update_navigation', args: clean })
        break
      }
      case 'update_dashboard_nav': {
        const items = sanitizeNavItems(schema, args.items)
        if (!items || items.length === 0) continue
        actions.push({
          tool: 'update_dashboard_nav',
          args: {
            items: items.map((it) => ({ label: it.label, pageId: it.pageId, icon: 'file-text' })),
          },
        })
        break
      }
      case 'rename_project': {
        const name = typeof args.name === 'string' && args.name.trim() ? args.name.trim().slice(0, 40) : ''
        if (!name) continue
        actions.push({ tool: 'rename_project', args: { name } })
        break
      }
      case 'generate_mock_data': {
        const entity =
          typeof args.entity === 'string' && ENTITY_KEYS.includes(args.entity as (typeof ENTITY_KEYS)[number])
            ? args.entity
            : ''
        actions.push({ tool: 'generate_mock_data', args: entity ? { entity } : {} })
        break
      }
      case 'change_landing_variant': {
        const variant =
          typeof args.variant === 'string' && LANDING_VARIANT_IDS.includes(args.variant)
            ? args.variant
            : typeof args.landingVariant === 'string' && LANDING_VARIANT_IDS.includes(args.landingVariant)
              ? args.landingVariant
              : ''
        if (!variant) continue
        const pageId = resolvePageRef(schema, args, ['pageId', 'page', 'pageName', 'name'])
        const clean: Record<string, unknown> = { variant }
        if (pageId) clean.pageId = pageId
        actions.push({ tool: 'change_landing_variant', args: clean })
        break
      }
      default:
        break
    }
  }
  return actions.slice(0, MAX_ACTIONS)
}

// ============================================================
// البديل الاستدلالي — قواعد نصية
// ============================================================
interface PageIntent {
  type: PageType
  name: string
  entity?: string
  authVariant?: AuthVariant
}

function pageIntentFromText(text: string): PageIntent | null {
  if (/تسعير|أسعار|الأسعار|باقات/.test(text)) return { type: 'pricing', name: 'الأسعار' }
  if (/تسجيل\s*الدخول|دخول/.test(text)) return { type: 'auth', name: 'تسجيل الدخول', authVariant: 'login' }
  if (/حساب\s*جديد|إنشاء\s*حساب|اشتراك/.test(text)) return { type: 'auth', name: 'إنشاء حساب', authVariant: 'signup' }
  if (/فواتير/.test(text)) return { type: 'table', name: 'الفواتير', entity: 'invoices' }
  if (/عملاء|زبائن|زبناء/.test(text)) return { type: 'table', name: 'العملاء', entity: 'customers' }
  if (/طلبات/.test(text)) return { type: 'table', name: 'الطلبات', entity: 'orders' }
  if (/منتجات/.test(text)) return { type: 'table', name: 'المنتجات', entity: 'products' }
  if (/حجوزات/.test(text)) return { type: 'table', name: 'الحجوزات', entity: 'bookings' }
  if (/إعدادات|اعدادات/.test(text)) return { type: 'settings', name: 'الإعدادات' }
  if (/ملف\s*شخصي|بروفايل|بروفيل/.test(text)) return { type: 'profile', name: 'الملف الشخصي' }
  if (/أسئلة|اسئلة|faq/.test(text)) return { type: 'faq', name: 'الأسئلة الشائعة' }
  // صفحة مخصصة: نستخرج الاسم من نهاية الطلب
  const rest = text
    .replace(/أضف|اضف|أنشئ|انشئ|جديد|جديدة|صفحة|صفحةً|لي|لى|لـ|لل|ال|من|في|بـ|بعنوان/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (rest.length >= 2) {
    return { type: 'custom', name: rest.slice(0, 40) }
  }
  return { type: 'custom', name: 'صفحة جديدة' }
}

function extractAfterPageKeyword(message: string): string {
  const idx = message.indexOf('صفحة')
  if (idx === -1) return ''
  return message
    .slice(idx + 'صفحة'.length)
    .replace(/^(?:\s|ل|ال|لل|لـ)+/, '')
    .replace(/^(?:تسعير|أسعار|الأسعار|باقات|دخول|تسجيل الدخول|حساب جديد|إنشاء حساب|فواتير|عملاء|زبائن|طلبات|منتجات|حجوزات|إعدادات|ملف شخصي|أسئلة|شخصية)\s*/, '')
    .trim()
}

function findPageByIntent(schema: ProjectSchema, text: string): ProjectPage | null {
  const term = extractAfterPageKeyword(text)
  if (term && term.length >= 2) {
    const byName = schema.pages.find(
      (p) => p.name.includes(term) || term.includes(p.name) || p.slug.includes(term)
    )
    if (byName) return byName
  }
  const intent = pageIntentFromText(text)
  if (intent) {
    const byType = schema.pages.find((p) => p.type === intent.type && (p.entity ?? '') === (intent.entity ?? ''))
    if (byType) return byType
  }
  return null
}

function detectColor(message: string): string | null {
  for (const name of COLOR_NAMES_BY_LENGTH) {
    if (message.includes(name)) return COLOR_NAME_TO_HEX[name]
  }
  return null
}

/** استخراج نمط صفحة الهبوط من نص المستخدم — بالاسم أو المعرف أو الكلمات المفتاحية */
function detectLandingVariant(message: string): string {
  // مطابقة مباشرة بالمعرف أو الاسم العربي
  for (const v of LANDING_VARIANTS) {
    if (message.includes(v.id)) return v.id
    if (message.includes(v.name)) return v.id
  }
  // كلمات مفتاحية
  if (/تدرّج|تدرج|غلاف|ملوّن|ملون/.test(message)) return 'gradient-cover'
  if (/داكن|فاخر|ليلي|أسود|اسود/.test(message)) return 'dark-premium'
  if (/تطبيق|هاتف|جوال|موبايل/.test(message)) return 'app-showcase'
  if (/فيديو/.test(message)) return 'video-lead'
  if (/بريد|تسجيلات|انتظار|مهتمين/.test(message)) return 'email-capture'
  if (/متجر|منتجات|تسوّق|تسوق/.test(message)) return 'store-promo'
  if (/بسيط|minimal|نظيف|أبيض/.test(message)) return 'minimal-startup'
  if (/أرقام|ارقام|إحصائ|احصائ|نتائج/.test(message)) return 'stats-lead'
  if (/وكالة/.test(message)) return 'agency-bold'
  if (/فعالية|حدث|مؤتمر|ورشة/.test(message)) return 'event-announce'
  if (/موسّط|موسط|وسط|ضخم|عنوان\s*كبير/.test(message)) return 'centered-bold'
  return 'classic-split'
}

function firstDashboardPage(schema: ProjectSchema): ProjectPage | null {
  return schema.pages.find((p) => p.type === 'dashboard') ?? schema.pages[0] ?? null
}

function firstLandingPage(schema: ProjectSchema): ProjectPage | null {
  return schema.pages.find((p) => p.type === 'landing') ?? schema.pages[0] ?? null
}

function heuristicRun(schema: ProjectSchema, message: string): AgentRunResult {
  const text = message.trim()

  // ---------- حذف صفحة ----------
  if (/احذف|امسح|حذف/.test(text) && /صفحة/.test(text)) {
    const page = findPageByIntent(schema, text)
    if (page) {
      return {
        explanation: `حذفت صفحة «${page.name}» بناءً على طلبك، ونظّفت قوائم التنقل المرتبطة بها.`,
        actions: [{ tool: 'delete_page', args: { pageId: page.id } }],
        fallback: true,
      }
    }
    return {
      explanation: 'لم أجد الصفحة المطلوب حذفها — تأكد من كتابة اسمها كما يظهر في قائمة الصفحات.',
      actions: [],
      fallback: true,
    }
  }

  // ---------- إضافة صفحة ----------
  if (/أضف|اضف|أنشئ|انشئ|أريد|اريد/.test(text) && /صفحة/.test(text)) {
    const intent = pageIntentFromText(text)
    if (intent) {
      const label = intent.type === 'pricing' ? 'التسعير' : intent.name
      return {
        explanation: `أضفت صفحة «${label}» مع محتوى جاهز قابل للتعديل.`,
        actions: [
          {
            tool: 'create_page',
            args: { name: intent.name, type: intent.type, entity: intent.entity, authVariant: intent.authVariant },
          },
        ],
        fallback: true,
      }
    }
  }

  // ---------- إضافة صفحة هبوط بنمط محدد ----------
  if (/أضف|اضف|أنشئ|انشئ|أريد|اريد/.test(text) && /صفحة\s*هبوط|هبوط\s*بنمط/.test(text)) {
    const variant = detectLandingVariant(text)
    const variantName = LANDING_VARIANTS.find((v) => v.id === variant)?.name ?? variant
    return {
      explanation: `أنشأت صفحة هبوط جديدة بنمط «${variantName}» — يمكنك تغيير النمط لاحقاً من لوحة الصفحات.`,
      actions: [
        {
          tool: 'create_page',
          args: { name: 'صفحة هبوط جديدة', type: 'landing', landingVariant: variant },
        },
      ],
      fallback: true,
    }
  }

  // ---------- تغيير نمط صفحة الهبوط ----------
  if (
    /(بدّل|بدل|غيّر|غير|حَوّل|حوّل|اجعل|صمّم|صمم)/.test(text) &&
    /(الصفحة\s*الرئيسية|صفحة\s*الهبوط|الهبوط|الواجهة|النمط)/.test(text) &&
    !/(لون|اللون|ألوان|الوان|ثيم)/.test(text)
  ) {
    const landing = schema.pages.find((p) => p.type === 'landing')
    if (landing) {
      const variant = detectLandingVariant(text)
      const variantName = LANDING_VARIANTS.find((v) => v.id === variant)?.name ?? variant
      return {
        explanation: `أعدت بناء صفحة «${landing.name}» بنمط «${variantName}» — محتوى النصوص قابل للتعديل من لوحة الخصائص.`,
        actions: [{ tool: 'change_landing_variant', args: { variant } }],
        fallback: true,
      }
    }
    return {
      explanation: 'لا توجد صفحة هبوط في المشروع لتغيير نمطها — أضف أولاً صفحة هبوط جديدة.',
      actions: [],
      fallback: true,
    }
  }

  // ---------- تغيير اللون ----------
  if (/غيّر|غير|تغيير|بدّل|بدل|اجعل/.test(text) && /لون|اللون|ألوان|الوان|هوية|ثيم/.test(text)) {
    const hex = detectColor(text) ?? COLOR_NAME_TO_HEX['أزرق']
    return {
      explanation: `غيّرت اللون الأساسي للهوية البصرية${detectColor(text) ? '' : ' (أزرق افتراضياً)'} — يمكنك معاينة النتيجة فوراً.`,
      actions: [{ tool: 'update_theme', args: { patch: { primary: hex } } }],
      fallback: true,
    }
  }

  // ---------- إضافة مكوّنات ----------
  if (/أضف|اضف|أنشئ|انشئ|اريد|أريد/.test(text)) {
    const target = firstDashboardPage(schema)
    if (target && /جدول|جداول/.test(text)) {
      const entity = defaultEntityFor(schema.metadata.type)
      return {
        explanation: `أضفت مكوّن «جدول البيانات» إلى صفحة «${target.name}» ببيانات تجريبية جزائرية.`,
        actions: [{ tool: 'add_block', args: { pageId: target.id, blockType: 'data-table', props: { entity, pageSize: 5 } } }],
        fallback: true,
      }
    }
    if (target && /faq|أسئلة|اسئلة|الأسئلة|سؤال|أسوال/.test(text)) {
      return {
        explanation: `أضفت قسم «الأسئلة الشائعة» إلى صفحة «${target.name}».`,
        actions: [{ tool: 'add_block', args: { pageId: target.id, blockType: 'faq' } }],
        fallback: true,
      }
    }
    if (target && /إحصائية|احصائية|إحصائيات|احصائيات/.test(text)) {
      return {
        explanation: `أضفت صف بطاقات الإحصائيات إلى صفحة «${target.name}».`,
        actions: [{ tool: 'add_block', args: { pageId: target.id, blockType: 'stats-row' } }],
        fallback: true,
      }
    }
    if (target && /رسم|بياني|إيرادات|ايرادات/.test(text)) {
      return {
        explanation: `أضفت رسماً بيانياً للإيرادات الشهرية إلى صفحة «${target.name}».`,
        actions: [
          {
            tool: 'add_block',
            args: { pageId: target.id, blockType: 'chart', props: { title: 'الإيرادات الشهرية', chartType: 'bar', dataKey: 'revenueMonthly' } },
          },
        ],
        fallback: true,
      }
    }
    if (target && /نشاطات|النشاطات|سجل|سجل النشاط/.test(text)) {
      return {
        explanation: `أضفت مكوّن «سجل النشاطات» إلى صفحة «${target.name}» بأحداث تجريبية جزائرية.`,
        actions: [{ tool: 'add_block', args: { pageId: target.id, blockType: 'activity-feed' } }],
        fallback: true,
      }
    }
    if (target && /مهام|المهام|قائمة مهام|checklist/.test(text)) {
      return {
        explanation: `أضفت مكوّن «المهام» إلى صفحة «${target.name}» مع شريط تقدّم تفاعلي.`,
        actions: [{ tool: 'add_block', args: { pageId: target.id, blockType: 'tasks-list' } }],
        fallback: true,
      }
    }
    if (target && /إجراءات سريعة|إجراء سريع|اختصارات/.test(text)) {
      return {
        explanation: `أضفت مكوّن «إجراءات سريعة» إلى صفحة «${target.name}» — يمكن ربط كل إجراء بصفحة من لوحة الخصائص.`,
        actions: [{ tool: 'add_block', args: { pageId: target.id, blockType: 'quick-actions' } }],
        fallback: true,
      }
    }
    const landing = firstLandingPage(schema)
    if (landing && /قسم|هيرو|hero|ترحيب/.test(text)) {
      return {
        explanation: `أضفت قسم «البطل» إلى صفحة «${landing.name}».`,
        actions: [{ tool: 'add_block', args: { pageId: landing.id, blockType: 'hero' } }],
        fallback: true,
      }
    }
  }

  // ---------- تصميم احترافي ----------
  if (/احترافي|احترافية|أجمل|اجمل|أفضل|افضل/.test(text) && /تصميم|شكل|مظهر|اللون|الهوية/.test(text)) {
    return {
      explanation: 'رفعت مستوى التصميم: حواف أنعم (radius 12) وظلال أوضح لتبدو الواجهة أكثر احترافية.',
      actions: [{ tool: 'update_theme', args: { patch: { radius: 12, shadow: 'md' } } }],
      fallback: true,
    }
  }

  // ---------- لم يفهم ----------
  return {
    explanation:
      'لم أفهم الطلب تماماً — جرّب صياغة مثل: «أضف صفحة للتسعير» أو «غيّر اللون الأساسي إلى الأخضر»',
    actions: [],
    fallback: true,
  }
}

// ============================================================
// نقطة الدخول — runAgent
// ============================================================
export async function runAgent(
  schema: ProjectSchema,
  message: string,
  history: AgentHistoryMessage[]
): Promise<AgentRunResult> {
  const trimmed = message.trim()
  if (!trimmed) {
    return {
      explanation: 'اكتب طلبك وسأنفّذه فوراً — مثل: «أضف صفحة للتسعير».',
      actions: [],
      fallback: true,
    }
  }

  const historyText = (history ?? [])
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${String(m.text ?? '').slice(0, 200)}`)
    .join('\n')

  const userPrompt = [
    `طلب المستخدم: ${trimmed}`,
    historyText ? `\nسياق المحادثة السابقة:\n${historyText}` : '',
    `\nسياق المشروع الحالي (JSON):\n${buildContext(schema)}`,
  ]
    .filter(Boolean)
    .join('\n')

  const text = await callLLM(AGENT_SYSTEM_PROMPT, userPrompt)
  if (text) {
    const parsed = extractJsonObject(text)
    if (parsed) {
      const actions = sanitizeActions(schema, parsed.actions)
      const explanation =
        typeof parsed.explanation === 'string' && parsed.explanation.trim()
          ? parsed.explanation.trim().slice(0, 400)
          : ''
      if (actions.length > 0) {
        return { explanation: explanation || 'نفّذت تعديلاتك على المشروع.', actions, fallback: false }
      }
      if (explanation) {
        // الـ LLM فهم الطلب لكنه لم يجد إجراءات (أو رفض) — نعيد شرحه
        return { explanation, actions: [], fallback: false }
      }
    }
  }

  // فشل الـ LLM أو خرج تالفاً → البديل الاستدلالي
  return heuristicRun(schema, trimmed)
}
