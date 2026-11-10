// ============================================================
// SIVAR — المساعد الذكي (عقل الوكيل) — خادم فقط
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
import { dashboardNavIconFor, isDashboardAreaPage } from '@/lib/project/tools'

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

// (الجولة 13) أسماء الأيقونات المقبولة لعناصر الشريط الجانبي للوحة التحكم
// (تطابق خريطة أيقونات النموذج في العارض والتصدير — لا خلط بأسماء غير قابلة للعرض)
const NAV_ICON_WHITELIST: ReadonlySet<string> = new Set([
  'layout-dashboard', 'users', 'user', 'settings', 'shopping-cart', 'shopping-bag', 'package',
  'calendar', 'calendar-days', 'file-text', 'briefcase', 'clipboard-list', 'graduation-cap',
  'building', 'utensils', 'credit-card', 'wallet', 'sparkles', 'chart-bar', 'inbox', 'bell',
  'table', 'list', 'home', 'star', 'zap', 'shield', 'globe', 'heart', 'check', 'target',
])

// ============================================================
// ألوان عربية إضافية (Task 12) — صيغ مؤنثة/متصرفة/مركّبة ليست في
// الخريطة العامة (سوداء/بيضاء/خضراء داكنة...) لأنشطة مثل
// «اجعل خلفية قسم دعوة الإجراء سوداء» و«خلفية بيضاء بنص داكن».
// ============================================================
const EXTRA_COLOR_NAMES: Record<string, string> = {
  'أبيض': '#ffffff',
  'ابيض': '#ffffff',
  'سوداء': '#111827',
  'بيضاء': '#ffffff',
  'حمراء': '#dc2626',
  'خضراء': '#059669',
  'خضراء داكنة': '#065f46',
  'زرقاء': '#2563eb',
  'زرقاء داكنة': '#1e3a8a',
  'زرقاء فاتحة': '#38bdf8',
  'صفراء': '#eab308',
  'رمادية': '#4b5563',
  'بنية': '#92400e',
  'ذهبية': '#d97706',
  'بنفسجية': '#7c3aed',
  'تركوازية': '#0d9488',
  'برتقالية': '#ea580c',
  'وردية': '#db2777',
}
const ALL_COLOR_NAMES: Record<string, string> = { ...COLOR_NAME_TO_HEX, ...EXTRA_COLOR_NAMES }
const ALL_COLOR_NAMES_BY_LENGTH = Object.keys(ALL_COLOR_NAMES).sort((a, b) => b.length - a.length)

/** مزيج لونين محلي — ratio = وزن اللون الثاني (0..1) */
function mixHexLocal(a: string, b: string, ratio: number): string {
  const parse = (hex: string): [number, number, number] | null => {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
    if (!m) return null
    let h = m[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const ca = parse(a)
  const cb = parse(b)
  if (!ca || !cb) return a
  const t = Math.max(0, Math.min(1, ratio))
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const mixed = [0, 1, 2].map((i) => clamp(ca[i] + (cb[i] - ca[i]) * t))
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** لون النص الثانوي مشتقاً من لون الخط الأساسي — مزج نحو الأبيض 0.35 (فاتح) / الأسود 0.25 (داكن) */
function deriveMuted(hex: string, mode: string): string {
  return mode === 'dark' ? mixHexLocal(hex, '#000000', 0.25) : mixHexLocal(hex, '#ffffff', 0.35)
}

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
  const slice = t.slice(start, end + 1)
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(s) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  const direct = tryParse(slice)
  if (direct) return direct
  // (الجولة 14) إصلاح JSON شائع الأعطال من النموذج: فواصل زائدة في نهاية
  // القوائم + أقواس مفتوحة غير مغلقة/أقواس إغلاق غير متطابقة
  const noTrailing = slice.replace(/,\s*([}\]])/g, '$1')
  const trailingFixed = tryParse(noTrailing)
  if (trailingFixed) return trailingFixed
  const repaired = repairJsonBrackets(noTrailing)
  if (repaired !== noTrailing) {
    const repairedParsed = tryParse(repaired)
    if (repairedParsed) return repairedParsed
  }
  return null
}

/** يكمل/يصحّح أقواس JSON الناقصة مع احترام السلاسل النصية (inside strings) */
function repairJsonBrackets(candidate: string): string {
  const stack: string[] = []
  let inStr = false
  let esc = false
  let out = ''
  for (const ch of candidate) {
    if (inStr) {
      out += ch
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') {
      inStr = true
      out += ch
      continue
    }
    if (ch === '{' || ch === '[') {
      stack.push(ch)
      out += ch
      continue
    }
    if (ch === '}' || ch === ']') {
      const expected = ch === '}' ? '{' : '['
      // أغلق تلقائياً الأقواس المفتوقة قبل القوس المطلوب (قوس إغلاق غير متطابق)
      while (stack.length > 0 && stack[stack.length - 1] !== expected) {
        out += stack[stack.length - 1] === '{' ? '}' : ']'
        stack.pop()
      }
      if (stack.length > 0 && stack[stack.length - 1] === expected) {
        stack.pop()
        out += ch
      }
      // قوس إغلاق زائد بلا مقابل مفتوح — نتجاهله
      continue
    }
    out += ch
  }
  while (stack.length > 0) {
    const open = stack.pop() as string
    out += open === '{' ? '}' : ']'
  }
  return out
}

// ============================================================
// سياق المشروع المضغوط
// ============================================================

/** (الجولة 14) عناصر الأقسام الحاملة للبيانات — يراها الوكيل ليتحرّك بدقة:
 * المعرض (منتجات/خدمات...)، التسعير (الخطط)، الفريق (الأعضاء) */
function compactBlockItems(block: { type: string; props: Record<string, unknown> }): Record<string, unknown> | null {
  if (block.type === 'gallery') {
    const items = Array.isArray(block.props.items) ? block.props.items : []
    return {
      variant: typeof block.props.variant === 'string' ? block.props.variant : 'products',
      items: items.slice(0, 12).map((it) => {
        if (!it || typeof it !== 'object') return null
        const r = it as Record<string, unknown>
        return { title: r.title, price: r.price }
      }).filter(Boolean),
    }
  }
  if (block.type === 'pricing') {
    const plans = Array.isArray(block.props.plans) ? block.props.plans : []
    return {
      plans: plans.slice(0, 8).map((it) => {
        if (!it || typeof it !== 'object') return null
        const r = it as Record<string, unknown>
        return { name: r.name, price: r.price, period: r.period, highlighted: r.highlighted }
      }).filter(Boolean),
    }
  }
  if (block.type === 'team') {
    const items = Array.isArray(block.props.items) ? block.props.items : []
    return {
      members: items.slice(0, 12).map((it) => {
        if (!it || typeof it !== 'object') return null
        const r = it as Record<string, unknown>
        return { name: r.name, role: r.role }
      }).filter(Boolean),
    }
  }
  return null
}

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
      // (الجولة 16) جمهور صفحات منطقة اللوحة — client = فضاء الزبون
      audience: p.audience === 'client' ? 'client' : null,
      blocks: p.blocks.map((b) => {
        const extra = compactBlockItems(b)
        return extra ? { id: b.id, type: b.type, content: extra } : { id: b.id, type: b.type }
      }),
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
  'أنت «المساعد الذكي» داخل منصة «SIVAR» العربية (الجزائر).',
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
  '9. update_theme: {"theme":{"primary":"#hex","secondary":"#hex","accent":"#hex","text":"#hex — لون الخط الأساسي في كل الموقع","mutedText":"#hex — لون النصوص الثانوية (الخفيفة)","radius":12,"shadow":"sm|md|lg","fontFamily":"IBM Plex Sans Arabic|Tajawal|Cairo"}}',
  '10. update_navigation: {"brand":"اسم العلامة","items":[{"label":"...","pageId":"..."}]}',
  '11. update_dashboard_nav: {"items":[{"label":"...","pageId":"...","icon":"users"}]} — ⚠ يستبدل القائمة كاملة: أدرج فيها كل العناصر القائمة بعناوينها وأيقوناتها كما هي (انسخها من السياق بدقة) حتى لا يختلط العناصر أو تضيع. استعمله فقط لإعادة الترتيب أو الإزالة أو تعديل عنوان/أيقونة عنصر.',
  '12. rename_project: {"name":"الاسم الجديد"}',
  '13. generate_mock_data: {"entity":"مفتاح كيان اختياري — بدون قيمة يُحدّث كل الكيانات"}',
  '14. change_landing_variant: {"variant":"معرف نمط من أنماط صفحات الهبوط أدناه","pageId":"معرّف صفحة هبوط اختياري — الافتراضي أول صفحة هبوط"} — يعيد بناء أقسام صفحة الهبوط بالنمط المختار. الأنماط: ' + LANDING_VARIANTS_PROMPT,
  '',
  'أدوات إضافية عند إنشاء الصفحات:',
  '- في create_page من نوع landing يمكنك إضافة "landingVariant":"معرف النمط" من قائمة الأنماط أعلاه لبنائها بنمط محدد.',
  '- (مهم) الصفحات من أنواع منطقة لوحة التحكم (dashboard|table|form|settings|profile) تُدرج تلقائياً في الشريط الجانبي للوحة التحكم بعنوان مطابق لاسم الصفحة وأيقونة مناسبة لنوعها — فلا تستدعِ update_dashboard_nav لإضافة صفحة أنشأتها للتو.',
  '- عند طلب إضافة صفحة أو عنصر إلى لوحة التحكم (مثل: «أضف أعضاء الفريق للوحة التحكم») أنشئ صفحة من نوع table مع entity المناسب من availableEntityKeys — مثال: {"name":"أعضاء الفريق","type":"table","entity":"teamMembers"}.',
  '- يمكنك تغيير ألوان الخطوط عبر update_theme بالمفتاحين text (لون الخط الأساسي في كل الموقع) وmutedText (لون النصوص الثانوية) — وليس فقط الألوان الأساسية.',
  '- ألوان كل قسم على حدة: مكوّنات أقسام صفحة الهبوط (hero|features|stats|steps|pricing|testimonials|faq|cta|banner|gallery|team|contact-form) تقبل في props المفتاحين bgColor (لون خلفية القسم) وtextColor (لون خط القسم) بصيغة hex، والقسم بدون textColor يختار لون نصه تلقائياً حسب سطوع خلفيته (داكن على الفاتح وأبيض على الداكن). مثال: {"tool":"update_block","args":{"pageId":"معرف الصفحة","blockId":"معرف كتلة دعوة للإجراء","props":{"bgColor":"#111827"}}} يجعل خلفية القسم سوداء بنص أبيض تلقائي.',
  '- مكوّن البطل (hero) يدعم: background من (default|muted|gradient-soft|mesh|dark|gradient) وخصائص eyebrow (شارة فوق العنوان) و visual من (dashboard|phone|video|form|analytics|orders|chat|calendar|testimonial|none) — analytics بطاقة تقرير أداء، orders أحدث الطلبات، chat محادثة دعم، calendar تقويم، testimonial رأي عميل — و bgOverlay عند رفع المستخدم صورة خلفية (dark|medium|light|none) — لا تضع bgImage بنفسك أبداً (الصور يرفعها المستخدم فقط).',
  '- أقسام صفحة الهبوط (cta|banner|features|testimonials|stats|steps|gallery|team|faq) تدعم bgImage/bgOverlay (dark|medium|light|none) كخلفية صورة للقسم — يرفعها المستخدم فقط من لوحة الخصائص ولا تضع data URLs بنفسك أبداً؛ وbranding.bgImage خلفية ثابتة لكل صفحات المشروع (رفع المستخدم فقط) مع bgOverlay من (none|strong|medium|soft).',
  '- مكوّنات لوحة التحكم الغنية: activity-feed (سجل نشاطات: items[user,action,target,time]) و tasks-list (مهام بمربعات اختيار: items[label,done,meta]) و quick-actions (إجراءات سريعة تنقل لصفحات: actions[icon,label,pageId]) — استعملها لإثراء اللوحات.',
  '- كل الأزرار في النموذج تعمل تلقائياً: أزرار البطل/التسعير/دعوة الإجراء تنقل إلى أفضل صفحة متاحة، وأزرار ترويسة اللوحة تنقل إلى صفحة النموذج/الجدول، وزر الدخول وإنشاء الحساب ينقلان إلى لوحة التحكم.',
  '',
  'قواعد صارمة:',
  '- غيّر أقل قدر ممكن — طلب صغير = تغيير صغير.',
  '- لا تحذف أو تعيد تصميم أي شيء لم يطلبه المستخدم صراحة.',
  '- (مهم) تعديلاتك تراكمية لا إتلافية: عند update_block أرسل في props المفاتيح المعدّلة فقط، والمصفوفات (items/plans) تُدمج بالفهرس مع العناصر القائمة — أرسل العنصر كاملاً بما فيه الحقول التي لا تريد تغييرها (انسخها من content في السياق) حتى لا تُفقد الميزات والشارات. لا ترسل مصفوفة أقصر من القائمة القائمة إلا إذا كان الحذف مقصوداً.',
  '- (الجولة 14 — تزامن موازي) بيانات لوحة التحكم تعمل بالتوازي مع صفحة الموقع: عناصر معرض (gallery) بنوع منتجات/خدمات/عقارات/قائمة طعام/دورات هي نفسها صفوف جدول الكيان المقابل في لوحة التحكم، وعناصر قسم الفريق هي صفوف أعضاء الفريق. عند تعديل هذه العناصر يتحدّث الجدول تلقائياً — اذكر ذلك في explanation (مثال: «وسيظهر ذلك في جدول المنتجات بلوحة التحكم»). وعند تجديد البيانات التجريبية (generate_mock_data) تُعكس الأسماء والأسعار الجديدة على أقسام الموقع تلقائياً.',
  '- عندما يطلب المستخدم تغيير المنتجات/الخدمات/أعضاء الفريق في لوحة التحكم: عدّل عناصر القسم المقابل في صفحة الموقع بـ update_block (انسخ العناصر من content ثم عدّلها) — أو استعمل generate_mock_data لتجديدها بالكامل. لا توجد أداة منفصلة لتعديل الجداول.',
  '- كل النصوص الجديدة بالعربية الفصحى المبسطة.',
  '- الأسعار بالدينار الجزائري (دج).',
  '- الألوان بصيغة hex مثل #059669.',
  '- استعمل pageId الموجودة في السياق، لا تخترع معرّفات.',
  '- لإضافة مكوّن استعمل blockType من availableBlockTypes فقط، وخصائص props مطابقة لأنواع المكوّن (عنوان/نص/عناصر).',
  '- عند إنشاء صفحة تنتمي للوحة التحكم (table|form|dashboard|settings|profile) اذكر في explanation أنها أُدرجت تلقائياً في الشريط الجانبي للوحة التحكم.',
  '- (الجولة 16) صفحات جمهورها client هي فضاء الزبون («حسابي») بشريطه الجانبي الخاص — لا تخلط بين عناصر فضاء المدير والزبون، وcreate_page تقبل "audience":"client" لإنشاء صفحات فضاء الزبون.',
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

/**
 * (الجولة 13) تعقيم عناصر الشريط الجانبي للوحة التحكم بدقة تامة:
 * - pageId صالح وموجود، ولا تكرار لنفس الصفحة.
 * - الأيقونة: المعطاة إن كانت من الأسماء المقبولة، وإلا أيقونة العنصر القائم لنفس الصفحة،
 *   وإلا الأيقونة المشتقة من نوع الصفحة وكيانها — فلا تنقلب كل الأيقونات إلى أيقونة واحدة (خلط بين العناصر).
 */
function sanitizeDashboardNavItems(
  schema: ProjectSchema,
  raw: unknown
): Array<{ label: string; pageId: string; icon: string }> | null {
  if (!Array.isArray(raw)) return null
  const items: Array<{ label: string; pageId: string; icon: string }> = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!isRecord(item)) continue
    const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim().slice(0, 40) : ''
    const pageId =
      (typeof item.pageId === 'string' && schema.pages.find((p) => p.id === item.pageId)?.id) ??
      resolvePageRef(schema, item, ['pageName', 'page', 'name'])
    if (!label || !pageId || seen.has(pageId)) continue
    seen.add(pageId)
    const page = schema.pages.find((p) => p.id === pageId)
    const existing = schema.dashboardNav.items.find((it) => it.pageId === pageId)
    const icon =
      typeof item.icon === 'string' && NAV_ICON_WHITELIST.has(item.icon.trim())
        ? item.icon.trim()
        : existing?.icon ?? (page ? dashboardNavIconFor(page) : 'file-text')
    items.push({ label, pageId, icon })
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
        // (الجولة 16) جمهور الصفحة — client لفضاء الزبون (وإلا undefined = admin)
        if (typeof args.audience === 'string' && ['client', 'admin'].includes(args.audience)) {
          clean.audience = args.audience
        }
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
        let patch = isRecord(args.props) ? args.props : isRecord(args.patch) ? args.patch : isRecord(args.content) ? args.content : null
        if (!patch) continue
        // (الجولة 14) النموذج يدمج أحياناً الصيغتين: props.content داخل props —
        // نستخرج المحتوى الداخلي حين يكون "content" المفتاح الوحيد
        if (
          isRecord(patch.content) &&
          Object.keys(patch).length === 1 &&
          Object.keys(patch.content as Record<string, unknown>).length > 0
        ) {
          patch = { ...(patch.content as Record<string, unknown>) }
        }
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
        const items = sanitizeDashboardNavItems(schema, args.items)
        if (!items || items.length === 0) continue
        actions.push({ tool: 'update_dashboard_nav', args: { items } })
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
  if (/حساب\s*جديد|إنشاء\s*حساب|اشتراك(?!ات)/.test(text)) return { type: 'auth', name: 'إنشاء حساب', authVariant: 'signup' }
  if (/فواتير/.test(text)) return { type: 'table', name: 'الفواتير', entity: 'invoices' }
  if (/عملاء|زبائن|زبناء/.test(text)) return { type: 'table', name: 'العملاء', entity: 'customers' }
  if (/طلبات/.test(text)) return { type: 'table', name: 'الطلبات', entity: 'orders' }
  if (/منتجات/.test(text)) return { type: 'table', name: 'المنتجات', entity: 'products' }
  if (/حجوزات/.test(text)) return { type: 'table', name: 'الحجوزات', entity: 'bookings' }
  // (الجولة 13) كيانات إضافية — طلبات مثل «أضف أعضاء الفريق للوحة التحكم» تُحوّل إلى صفحات جداول دقيقة
  if (/أعضاء\s*الفريق|فريق\s*العمل|موظفين|موظفون|طاقم/.test(text)) return { type: 'table', name: 'أعضاء الفريق', entity: 'teamMembers' }
  if (/مستخدمين|مستخدمون|المستخدمين|المستخدمون/.test(text)) return { type: 'table', name: 'المستخدمون', entity: 'users' }
  if (/خدمات/.test(text)) return { type: 'table', name: 'الخدمات', entity: 'services' }
  if (/دورات|كورسات/.test(text)) return { type: 'table', name: 'الدورات', entity: 'courses' }
  if (/طلاب|تلاميذ/.test(text)) return { type: 'table', name: 'الطلاب', entity: 'students' }
  if (/عقارات/.test(text)) return { type: 'table', name: 'العقارات', entity: 'properties' }
  if (/مواعيد/.test(text)) return { type: 'table', name: 'المواعيد', entity: 'appointments' }
  if (/اشتراكات/.test(text)) return { type: 'table', name: 'الاشتراكات', entity: 'subscriptions' }
  if (/معاملات/.test(text)) return { type: 'table', name: 'المعاملات', entity: 'transactions' }
  if (/إعدادات|اعدادات/.test(text)) return { type: 'settings', name: 'الإعدادات' }
  if (/ملف\s*شخصي|بروفايل|بروفيل/.test(text)) return { type: 'profile', name: 'الملف الشخصي' }
  if (/أسئلة|اسئلة|faq/.test(text)) return { type: 'faq', name: 'الأسئلة الشائعة' }
  // صفحة مخصصة: نستخرج الاسم من نهاية الطلب
  const rest = text
    .replace(/أضف|اضف|أنشئ|انشئ|جديد|جديدة|صفحة|صفحةً|لي|لى|لـ|لل|ال|من|في|بـ|بعنوان|إلى|الى|داخل|مع|الشريط|الجانبي|لوحة|التحكم|قائمة/g, ' ')
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
    .replace(/(?:\s*(?:إلى|الى|في|داخل|للوحة|لوحة|التحكم|الشريط|الجانبي|قائمة|الموقع))+\s*$/g, '')
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
  for (const name of ALL_COLOR_NAMES_BY_LENGTH) {
    if (message.includes(name)) return ALL_COLOR_NAMES[name]
  }
  return null
}

/** كل الألوان المذكورة في النص بترتيب مواضعها — لطلبات مثل «خلفية سوداء ونص أبيض» */
function detectAllColors(message: string): Array<{ hex: string; at: number }> {
  const hits: Array<{ hex: string; at: number; end: number }> = []
  for (const name of ALL_COLOR_NAMES_BY_LENGTH) {
    let from = 0
    for (;;) {
      const at = message.indexOf(name, from)
      if (at < 0) break
      hits.push({ hex: ALL_COLOR_NAMES[name], at, end: at + name.length })
      from = at + name.length
    }
  }
  // الترتيب بالمواضع مع تخطّي الأسماء داخل اسم أطول (أزرق داخل أزرق داكن)
  hits.sort((a, b) => a.at - b.at)
  const out: Array<{ hex: string; at: number }> = []
  let lastEnd = -1
  for (const hit of hits) {
    if (hit.at < lastEnd) continue
    out.push({ hex: hit.hex, at: hit.at })
    lastEnd = Math.max(lastEnd, hit.end)
  }
  return out
}

// ============================================================
// أقسام صفحة الهبوط بالعربية → أنواع كتل (Task 12)
// ============================================================
const SECTION_KEYWORDS: Array<{ type: BlockType; words: RegExp }> = [
  { type: 'cta', words: /دعوة.{0,14}إجراء|الدعوة|\bcta\b/ },
  { type: 'banner', words: /الشريط\s*الإعلاني|الشريط\s*الإعلانية|شريط\s*إعلاني|الإعلان|الإعلانات|إعلان|\bbanner\b/ },
  { type: 'hero', words: /البطل|بطل|الهيرو|\bhero\b/ },
  { type: 'features', words: /المزايا|المميزات|مميزات|مزايا|\bfeatures\b/ },
  { type: 'stats', words: /الإحصائيات|إحصائيات|الأرقام|أرقام|\bstats\b/ },
  { type: 'steps', words: /الخطوات|خطوات|\bsteps\b/ },
  { type: 'pricing', words: /التسعير|الأسعار|أسعار|الباقات|باقات|\bpricing\b/ },
  { type: 'testimonials', words: /الشهادات|شهادات|آراء|الآراء|التقييمات|\btestimonials\b/ },
  { type: 'faq', words: /الأسئلة|أسئلة|الأسئلة\s*الشائعة|\bfaq\b/ },
  { type: 'gallery', words: /المعرض|معرض|\bgallery\b/ },
  { type: 'team', words: /الفريق|فريق|\bteam\b/ },
  { type: 'contact-form', words: /التواصل|نموذج\s*التواصل|تواصل\s*معنا|\bcontact\b/ },
]

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

  // ---------- (الجولة 13) إزالة صفحة من الشريط الجانبي للوحة التحكم ----------
  // قبل فرع حذف الصفحة — «احذف X من الشريط الجانبي» تعني إزالتها من القائمة فقط لا حذف الصفحة
  if (
    /(أزل|ازل|احذف|امسح|حذف)/.test(text) &&
    /(الشريط\s*الجانبي|شريط\s*اللوحة|قائمة\s*اللوحة|قائمة\s*لوحة\s*التحكم|sidebar)/.test(text)
  ) {
    const page = findPageByIntent(schema, text)
    if (page) {
      const remaining = schema.dashboardNav.items.filter((it) => it.pageId !== page.id)
      if (remaining.length < schema.dashboardNav.items.length) {
        return {
          explanation: `أزلت «${page.name}» من الشريط الجانبي للوحة التحكم — الصفحة نفسها ما زالت موجودة في المشروع.`,
          actions: [{ tool: 'update_dashboard_nav', args: { items: remaining } }],
          fallback: true,
        }
      }
      return {
        explanation: `«${page.name}» غير موجودة في الشريط الجانبي أصلاً — جرّب اسم صفحة كما يظهر في قائمة الصفحات.`,
        actions: [],
        fallback: true,
      }
    }
  }

  // ---------- (الجولة 13) إضافة صفحة قائمة إلى الشريط الجانبي ----------
  // «أضف صفحة X إلى الشريط الجانبي» والصفحة موجودة أصلاً = إدراج في القائمة لا إنشاء مكرر
  if (
    /(أضف|اضف|أدرج|ادرج|أريد|اريد)/.test(text) &&
    /(الشريط\s*الجانبي|شريط\s*اللوحة|قائمة\s*اللوحة|قائمة\s*لوحة\s*التحكم|sidebar)/.test(text)
  ) {
    const page = findPageByIntent(schema, text)
    if (page) {
      if (schema.dashboardNav.items.some((it) => it.pageId === page.id)) {
        return {
          explanation: `«${page.name}» موجودة في الشريط الجانبي للوحة التحكم أصلاً — لا حاجة لأي تعديل.`,
          actions: [],
          fallback: true,
        }
      }
      const items = [
        ...schema.dashboardNav.items,
        { label: page.name, pageId: page.id, icon: dashboardNavIconFor(page) },
      ]
      return {
        explanation: `أدرجت «${page.name}» في الشريط الجانبي للوحة التحكم في نهاية القائمة.`,
        actions: [{ tool: 'update_dashboard_nav', args: { items } }],
        fallback: true,
      }
    }
  }

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
      const sidebarNote = isDashboardAreaPage({ type: intent.type })
        ? ' وأدرجتها في الشريط الجانبي للوحة التحكم'
        : ''
      return {
        explanation: `أضفت صفحة «${label}» مع محتوى جاهز قابل للتعديل${sidebarNote}.`,
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

  // ---------- (الجولة 13) إضافة صفحة كيان بلا كلمة «صفحة» ----------
  // مثل: «أضف أعضاء الفريق للوحة التحكم» — كيان معروف = صفحة جدول تُدرج تلقائياً في الشريط الجانبي
  if (
    /(أضف|اضف|أنشئ|انشئ|أريد|اريد|إضافة|اضافة)/.test(text) &&
    !/مكوّن|مكون|قسم|جدول|رسم|إحصائ|احصائ|سجل|نشاط|مهام|إجراء|اجراء/.test(text)
  ) {
    const intent = pageIntentFromText(text)
    if (intent && intent.entity) {
      return {
        explanation: `أضفت صفحة «${intent.name}» إلى لوحة التحكم وأدرجتها في الشريط الجانبي مع بيانات تجريبية جاهزة.`,
        actions: [
          {
            tool: 'create_page',
            args: { name: intent.name, type: 'table', entity: intent.entity },
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

  // ---------- ألوان كل قسم (Task 12): خلفية/خط قسم بعينه ----------
  // (قبل فرع تغيير اللون العام — قسم مذكور + لون = تحديد أدق)
  const sectionKeyword = SECTION_KEYWORDS.find(({ words }) => words.test(text))
  if (sectionKeyword && !/أضف|اضف|أنشئ|انشئ/.test(text)) {
    const colors = detectAllColors(text)
    if (colors.length > 0) {
      const sectionType = sectionKeyword.type
      const label = BLOCK_REGISTRY[sectionType]?.label ?? sectionType
      const landing = schema.pages.find((p) => p.type === 'landing')
      const fontWord = /خط|كتابة|نص|نصوص/.test(text)
      // نيّة الخلفية: «خلفية» صراحةً أو «لون» بلا ذكر خط/نص
      const bgIntent = /خلفية/.test(text) || (/لون|اللون|ألوان|الوان/.test(text) && !fontWord)

      if (bgIntent) {
        if (!landing) {
          return {
            explanation: 'لا توجد صفحة هبوط في المشروع لتطبيق لون القسم — أضف أولاً صفحة هبوط.',
            actions: [],
            fallback: true,
          }
        }
        const block = landing.blocks.find((b) => b.type === sectionType)
        if (!block) {
          return {
            explanation: `لم أجد قسم «${label}» في صفحة «${landing.name}» — أضفه أولاً ثم اطلب تغيير لونه.`,
            actions: [],
            fallback: true,
          }
        }
        const props: Record<string, unknown> = { bgColor: colors[0].hex }
        const alsoText = fontWord && colors.length > 1
        if (alsoText) props.textColor = colors[1].hex
        return {
          explanation: `غيّرت خلفية قسم «${label}» في صفحة «${landing.name}» إلى اللون المطلوب${
            alsoText ? ' مع لون خط مطابق.' : ' — سيُختار لون النص تلقائياً حسب سطوعها (داكن على الفاتح وأبيض على الداكن).'
          }`,
          actions: [{ tool: 'update_block', args: { pageId: landing.id, blockId: block.id, props } }],
          fallback: true,
        }
      }

      if (fontWord) {
        if (!landing) {
          return {
            explanation: 'لا توجد صفحة هبوط في المشروع لتطبيق لون خط القسم — أضف أولاً صفحة هبوط.',
            actions: [],
            fallback: true,
          }
        }
        const block = landing.blocks.find((b) => b.type === sectionType)
        if (!block) {
          return {
            explanation: `لم أجد قسم «${label}» في صفحة «${landing.name}» — أضفه أولاً ثم اطلب تغيير لون خطه.`,
            actions: [],
            fallback: true,
          }
        }
        return {
          explanation: `غيّرت لون خط قسم «${label}» في صفحة «${landing.name}» — يمكنك معاينة النتيجة فوراً.`,
          actions: [{ tool: 'update_block', args: { pageId: landing.id, blockId: block.id, props: { textColor: colors[0].hex } } }],
          fallback: true,
        }
      }
    }
  }

  // ---------- لون الخط العام (Task 12): theme.text + mutedText مشتق ----------
  if (/لون|اللون/.test(text) && /خط|كتابة|نص|نصوص/.test(text)) {
    const hex = detectColor(text)
    if (hex) {
      const muted = deriveMuted(hex, schema.theme.mode)
      return {
        explanation:
          'غيّرت لون الخط الأساسي في كل الموقع واشتقت لون النصوص الثانوية منه تلقائياً — يمكنك معاينة النتيجة فوراً.',
        actions: [{ tool: 'update_theme', args: { patch: { text: hex, mutedText: muted } } }],
        fallback: true,
      }
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

  // (الجولة 14) محاولة LLM أولى — وإن جاء الرد غير قابل للتحليل (نثرًا أو
  // JSON تالفًا) نعيد المحاولة مرة واحدة بتذكير صارم بصيغة JSON فقط
  const parseAttempt = (raw: string | null): { parsed: Record<string, unknown> | null } => {
    if (!raw) return { parsed: null }
    return { parsed: extractJsonObject(raw) }
  }

  let text = await callLLM(AGENT_SYSTEM_PROMPT, userPrompt)
  let { parsed } = parseAttempt(text)
  let actions = parsed ? sanitizeActions(schema, parsed.actions) : []
  let explanation =
    parsed && typeof parsed.explanation === 'string' && parsed.explanation.trim()
      ? parsed.explanation.trim().slice(0, 400)
      : ''

  if (actions.length === 0) {
    const retryPrompt = `${userPrompt}\n\n[تعليمات إلزامية: أعد JSON صالحًا فقط بالصيغة {"explanation":"...","actions":[{"tool":"...","args":{...}}]} دون أي نص خارج القوسين. استعمل pageId وblockId الحقيقية من السياق حرفيًا.]`
    const retryText = await callLLM(AGENT_SYSTEM_PROMPT, retryPrompt)
    const retry = parseAttempt(retryText)
    if (retry.parsed) {
      const retryActions = sanitizeActions(schema, retry.parsed.actions)
      if (retryActions.length > 0) {
        text = retryText
        parsed = retry.parsed
        actions = retryActions
        explanation =
          typeof retry.parsed.explanation === 'string' && retry.parsed.explanation.trim()
            ? retry.parsed.explanation.trim().slice(0, 400)
            : ''
      }
    }
  }
  void text
  void parsed

  if (text && parsed) {
    if (actions.length > 0) {
      return { explanation: explanation || 'نفّذت تعديلاتك على المشروع.', actions, fallback: false }
    }
    if (explanation) {
      // الـ LLM فهم الطلب لكنه لم يجد إجراءات (أو رفض) — نعيد شرحه
      return { explanation, actions: [], fallback: false }
    }
  }

  // فشل الـ LLM أو خرج تالفاً → البديل الاستدلالي
  return heuristicRun(schema, trimmed)
}
