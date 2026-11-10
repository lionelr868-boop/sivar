// ============================================================
// SIVAR — تحليل الفكرة بالذكاء الاصطناعي (خادم فقط)
// Task 3-b — LLM مع مهلة 25 ثانية + تطهير صارم + بديل استدلالي
// يعمل التطبيق دائماً حتى لو كان الـ LLM غير متاح.
// ============================================================
import ZAI from 'z-ai-web-dev-sdk'
import type { IdeaAnalysis, PageType, ProjectType, SuggestedPage } from '@/lib/types'
import { PAGE_TYPE_LABELS } from '@/lib/types'
import { ENTITY_KEYS } from '@/lib/content/mock-data'
import { TEMPLATES, getTemplateMeta } from '@/lib/project/templates'

// ============================================================
// ثوابت
// ============================================================
const PROJECT_TYPES: string[] = [
  'saas', 'ai', 'ecommerce', 'marketplace', 'education', 'health', 'realestate',
  'booking', 'services', 'restaurant', 'agency', 'app', 'fintech', 'admin', 'delivery', 'other',
]
const PAGE_TYPES: string[] = Object.keys(PAGE_TYPE_LABELS)
const TEMPLATE_IDS: string[] = TEMPLATES.map((t) => t.id)
const AUTH_VARIANTS = ['login', 'signup', 'forgot']

const LLM_TIMEOUT_MS = 25_000

// ============================================================
// استدعاء الـ LLM (مع مهلة) — يرجع null عند أي فشل
// ============================================================
async function callLLM(systemPrompt: string, userPrompt: string, timeoutMs: number): Promise<string | null> {
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
        setTimeout(() => reject(new Error('timeout')), timeoutMs)
      }),
    ])
    const text = completion.choices[0]?.message?.content
    return typeof text === 'string' && text.trim() ? text : null
  } catch {
    return null
  }
}

/** يستخرج أول كائن JSON من نص (يتجاهل أسوار ```json) */
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
// البديل الاستدلالي (fallback) — خريطة كلمات مفتاحية
// ============================================================
const TYPE_KEYWORDS: Array<{ type: ProjectType; words: string[] }> = [
  { type: 'booking', words: ['حجز', 'موعد', 'مواعيد', 'صالون', 'حجوزات', 'حلاق'] },
  { type: 'restaurant', words: ['مطعم', 'مطاعم', 'قهوة', 'كافي', 'مقهى', 'وجبات', 'طعام', 'بيتزا'] },
  { type: 'ecommerce', words: ['متجر', 'بيع', 'منتجات', 'تسوق', 'تجارة', 'اونلاين'] },
  { type: 'marketplace', words: ['سوق', 'بائعين', 'وسطاء', 'مزاد'] },
  { type: 'education', words: ['تعليم', 'دروس', 'طالب', 'كورس', 'دورات', 'مدرسة', 'جامعة', 'تعلم', 'تكوين'] },
  { type: 'health', words: ['طبيب', 'صحة', 'عيادة', 'صيدلية', 'مستشفى', 'علاج', 'تمريض'] },
  { type: 'realestate', words: ['عقار', 'عقارات', 'سكن', 'شقق', 'إيجار', 'اراضي'] },
  { type: 'delivery', words: ['توصيل', 'دليفري', 'livraison', 'كوليس'] },
  { type: 'services', words: ['خدمة', 'خدمات', 'حرفيين', 'حرفي', 'سباك', 'كهربائي'] },
  { type: 'agency', words: ['وكالة', 'تسويق', 'إعلان', 'اعلان', 'دعاية', 'تصميم'] },
  { type: 'fintech', words: ['دفع', 'مالية', 'قرض', 'توفير', 'بنك', 'محفظة', 'تحويل مالي'] },
  { type: 'ai', words: ['ذكاء', 'اصطناعي', 'ai', 'بوت', 'شات بوت', 'توليد'] },
  { type: 'admin', words: ['إدارة', 'ادارة', 'لوحة', 'شركة', 'موارد بشرية'] },
  { type: 'saas', words: ['saas', 'اشتراك', 'برمجيات', 'منصة'] },
]

function guessType(idea: string): ProjectType {
  const text = idea.toLowerCase()
  for (const entry of TYPE_KEYWORDS) {
    if (entry.words.some((w) => text.includes(w))) return entry.type
  }
  return text.length > 40 ? 'app' : 'other'
}

const TYPE_NAMES: Record<ProjectType, string> = {
  booking: 'موعدك',
  restaurant: 'مذاق',
  ecommerce: 'سوقي',
  marketplace: 'سوقنا',
  education: 'تعلّم',
  health: 'صحّتي',
  realestate: 'عقاري',
  delivery: 'توصيلي',
  services: 'خدمتي',
  agency: 'وكالتي',
  fintech: 'محفظتي',
  ai: 'وحي',
  admin: 'إدارتي',
  saas: 'منصتي',
  app: 'مشروعي',
  other: 'مشروعي',
}

const TYPE_AUDIENCES: Record<ProjectType, string> = {
  booking: 'أصحاب الصالونات والعيادات وزبائنهم الباحثون عن مواعيد',
  restaurant: 'عشاق الطعام والطلبات السريعة في الجزائر',
  ecommerce: 'المتسوقون الجزائريون عبر الإنترنت',
  marketplace: 'البائعون الصغار والمشترون في السوق الرقمي',
  education: 'الطلاب والمتكوّنون الباحثون عن دورات عربية',
  health: 'المرضى والعيادات ومقدمو الخدمات الصحية',
  realestate: 'الباحثون عن سكن ومكاتب العقارات',
  delivery: 'المستخدمون الراغبون في توصيل سريع',
  services: 'الحرفيون والزبائن الباحثون عن خدمات موثوقة',
  agency: 'الشركات الصغيرة الباحثة عن خدمات تسويقية',
  fintech: 'المستخدمون الباحثون عن حلول دفع وادخار',
  ai: 'المسوّقون وصنّاع المحتوى العربي',
  admin: 'المديرون وفرق العمل داخل الشركات',
  saas: 'الشركات الناشئة وفرق العمل',
  app: 'المستخدمون الجزائريون عموماً',
  other: 'جمهور عربي عام',
}

/** اسم مختصر مشتق من كلمات الفكرة */
function deriveName(idea: string, type: ProjectType): string {
  const words = idea
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 2)
  if (words.length > 0) {
    return words.join(' ').slice(0, 30)
  }
  return TYPE_NAMES[type]
}

/** الصفحات الافتراضية حسب نوع المشروع (6-8 صفحات مع كيانات) */
function defaultPagesFor(type: ProjectType): SuggestedPage[] {
  const base: SuggestedPage[] = [
    { name: 'الرئيسية', type: 'landing' },
    { name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
    { name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
    { name: 'لوحة التحكم', type: 'dashboard' },
  ]
  const tables: Array<[string, string]> = []
  switch (type) {
    case 'booking':
      tables.push(['الحجوزات', 'bookings'], ['العملاء', 'customers'])
      break
    case 'restaurant':
      tables.push(['قائمة الطعام', 'menuItems'], ['الطلبات', 'orders'])
      break
    case 'ecommerce':
    case 'delivery':
      tables.push(['المنتجات', 'products'], ['الطلبات', 'orders'])
      break
    case 'marketplace':
      tables.push(['المنتجات', 'products'], ['الزبناء', 'clients'])
      break
    case 'education':
      tables.push(['الدورات', 'courses'], ['الطلاب', 'students'])
      break
    case 'health':
      tables.push(['المواعيد', 'appointments'], ['المرضى', 'customers'])
      break
    case 'realestate':
      tables.push(['العقارات', 'properties'], ['الزبناء', 'clients'])
      break
    case 'services':
    case 'agency':
      tables.push(['الخدمات', 'services'], ['الزبناء', 'clients'])
      break
    case 'fintech':
      tables.push(['المعاملات', 'transactions'], ['الفواتير', 'invoices'])
      break
    case 'admin':
      tables.push(['المستخدمون', 'users'], ['المهام', 'tasks'])
      break
    case 'saas':
      tables.push(['الاشتراكات', 'subscriptions'], ['الفواتير', 'invoices'])
      break
    case 'ai':
      tables.push(['المستخدمون', 'users'], ['المهام', 'tasks'])
      break
    default:
      tables.push(['العملاء', 'customers'], ['الطلبات', 'orders'])
      break
  }
  for (const [name, entity] of tables) {
    base.push({ name, type: 'table', entity })
  }
  if (type === 'saas' || type === 'ai' || type === 'ecommerce') {
    base.splice(4, 0, { name: 'الأسعار', type: 'pricing' })
  }
  base.push({ name: 'الإعدادات', type: 'settings' })
  base.push({ name: 'الملف الشخصي', type: 'profile' })
  return base.slice(0, 10)
}

/** البديل الاستدلالي الكامل */
function heuristicAnalyze(idea: string): IdeaAnalysis {
  const type = guessType(idea)
  return {
    name: deriveName(idea, type),
    type,
    audience: TYPE_AUDIENCES[type],
    description: `نموذج أولي لمشروعك الرقمي مبني على فكرتك: ${idea.slice(0, 120)}`,
    suggestedPages: defaultPagesFor(type),
    templateId: TEMPLATES.find((t) => t.category === type)?.id ?? 'saas-suite',
  }
}

// ============================================================
// تطهير مخرجات الـ LLM (يُستعمل أيضاً للتحليل القادم من العميل)
// ============================================================
function sanitizeSuggestedPages(raw: unknown): SuggestedPage[] {
  const pages: SuggestedPage[] = []
  if (!Array.isArray(raw)) return pages
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (typeof o.type !== 'string' || !PAGE_TYPES.includes(o.type)) continue
    const type = o.type as PageType
    const name =
      typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 40) : PAGE_TYPE_LABELS[type]
    const entity =
      typeof o.entity === 'string' && ENTITY_KEYS.includes(o.entity as (typeof ENTITY_KEYS)[number])
        ? o.entity
        : undefined
    const authVariant =
      typeof o.authVariant === 'string' && AUTH_VARIANTS.includes(o.authVariant)
        ? (o.authVariant as SuggestedPage['authVariant'])
        : undefined
    pages.push({ name, type, entity, authVariant })
  }
  return pages
}

function ensureRequiredPages(pages: SuggestedPage[], type: ProjectType): SuggestedPage[] {
  const out = [...pages]
  if (!out.some((p) => p.type === 'dashboard')) {
    out.splice(1, 0, { name: 'لوحة التحكم', type: 'dashboard' })
  }
  if (!out.some((p) => p.type === 'auth' && (p.authVariant ?? 'login') === 'login')) {
    out.splice(1, 0, { name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' })
  }
  if (!out.some((p) => p.type === 'landing')) {
    out.unshift({ name: 'الرئيسية', type: 'landing' })
  }
  return out
}

function padToMinimum(pages: SuggestedPage[], fallback: SuggestedPage[], min: number): SuggestedPage[] {
  const out = [...pages]
  const has = (p: SuggestedPage): boolean =>
    out.some((q) => q.type === p.type && (q.entity ?? '') === (p.entity ?? '') && (q.authVariant ?? '') === (p.authVariant ?? ''))
  for (const candidate of fallback) {
    if (out.length >= min) break
    if (!has(candidate)) out.push(candidate)
  }
  return out
}

function templateIdFor(type: ProjectType, candidate: unknown): string {
  if (typeof candidate === 'string' && getTemplateMeta(candidate)) return candidate
  return TEMPLATES.find((t) => t.category === type)?.id ?? 'saas-suite'
}

/** يطهّر أي كائن (LLM أو عميل) إلى IdeaAnalysis سليمة */
export function sanitizeAnalysis(raw: unknown, idea: string): IdeaAnalysis {
  const fallback = heuristicAnalyze(idea)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback
  const o = raw as Record<string, unknown>

  const type: ProjectType =
    typeof o.type === 'string' && PROJECT_TYPES.includes(o.type) ? (o.type as ProjectType) : fallback.type
  const name =
    typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 40) : fallback.name
  const audience =
    typeof o.audience === 'string' && o.audience.trim() ? o.audience.trim().slice(0, 140) : fallback.audience
  const description =
    typeof o.description === 'string' && o.description.trim()
      ? o.description.trim().slice(0, 300)
      : fallback.description

  let pages = sanitizeSuggestedPages(o.suggestedPages)
  pages = ensureRequiredPages(pages, type)
  pages = padToMinimum(pages, fallback.suggestedPages, 4)
  if (pages.length > 10) {
    // نُبقي الصفحات الأساسية أولاً ثم نكمل حتى 10
    const required = pages.filter((p) => p.type === 'landing' || p.type === 'dashboard' || (p.type === 'auth' && (p.authVariant ?? 'login') === 'login'))
    const rest = pages.filter((p) => !required.includes(p))
    pages = [...required, ...rest].slice(0, 10)
    pages = ensureRequiredPages(pages, type)
  }

  return {
    name,
    type,
    audience,
    description,
    suggestedPages: pages,
    templateId: templateIdFor(type, o.templateId),
  }
}

// ============================================================
// نقطة الدخول — analyzeIdea
// ============================================================
const ANALYZE_SYSTEM_PROMPT = [
  'أنت محلل أفكار مشاريع رقمية داخل منصة «SIVAR» الجزائرية.',
  'مهمتك: تحليل فكرة يكتبها المستخدم وإرجاع تحليل منظم بصرامة.',
  'أعد JSON فقط بدون أي نص إضافي ولا أسوار كود.',
  'الصيغة المطلوبة حرفياً:',
  '{"name":"اسم قصير عربي للمشروع","type":"one of [saas,ai,ecommerce,marketplace,education,health,realestate,booking,services,restaurant,agency,app,fintech,admin,delivery,other]","audience":"الجمهور المستهدف بالعربية","description":"جملة وصف واحدة بالعربية","suggestedPages":[{"name":"اسم عربي للصفحة","type":"one of [landing,auth,dashboard,pricing,table,form,settings,profile,faq,custom]","entity":"optional one of entity keys"}],"templateId":"one of template ids"}',
  'قواعد suggestedPages: بين 4 و10 صفحات، يجب أن تتضمن صفحة landing وصفحة auth (authVariant: "login") ولوحة dashboard.',
  'قواعد entity: فقط من هذه المفاتيح: customers, orders, products, bookings, invoices, services, users, clients, tasks, teamMembers, courses, students, properties, appointments, menuItems, transactions, subscriptions — تُستعمل مع صفحات النوع table فقط.',
  'قواعد templateId: فقط من هذه المعرّفات: ' + TEMPLATE_IDS.join(', ') + '.',
].join('\n')

export async function analyzeIdea(idea: string): Promise<IdeaAnalysis> {
  const text = await callLLM(
    ANALYZE_SYSTEM_PROMPT,
    `فكرة المشروع: ${idea}\nالسياق: الجزائر، عملة دج، أسماء عربية.`,
    LLM_TIMEOUT_MS
  )
  if (!text) return heuristicAnalyze(idea)
  const parsed = extractJsonObject(text)
  if (!parsed) return heuristicAnalyze(idea)
  // حتى لو أعاد الـ LLM حقولاً ناقصة يُكمل البديل الاستدلالي الفجوات
  return sanitizeAnalysis(parsed, idea)
}
