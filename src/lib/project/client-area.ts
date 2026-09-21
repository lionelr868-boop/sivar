// ============================================================
// SIVAR — فضاء الزبون (الجولة 16)
// دالة مشتركة واحدة تُستعمل من: templates.ts (كل قالب) +
// tools.ts (add_page بجمهور client) + سكربت تحديث المشاريع
// القديمة — فلا يحدث أي انحراف بين المسارات الثلاثة.
// ============================================================
import {
  defaultEntityFor,
  DEMO_CLIENT,
  DEMO_CLIENT_NAME,
  num,
} from '@/lib/content/mock-data'
import type {
  Block,
  EntityData,
  PageAudience,
  ProjectPage,
  ProjectSchema,
} from '@/lib/types'
import { uid as uidFn } from '@/lib/types'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/** هل القيمة سجل كائن؟ */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ============================================================
// كيان النشاط — طلبات الزبون في فضائه
// ============================================================

/**
 * كيان نشاط الزبون: orders إن وُجد (بأعمدة) وإلا bookings وإلا
 * appointments وإلا الكيان الافتراضي لنوع المشروع
 * (defaultEntityFor — نفس اصطلاح قوالب/أدوات البداية).
 */
export function clientActivityEntity(schema: ProjectSchema): string {
  const entities = schema?.mockData?.entities ?? {}
  for (const key of ['orders', 'bookings', 'appointments'] as const) {
    const entity = entities[key]
    if (entity && Array.isArray(entity.columns) && entity.columns.length > 0) {
      return key
    }
  }
  return defaultEntityFor(schema.metadata.type)
}

/** صفوف كيان مملوكة للزبونة التجريبية (قيمة عمود avatar === اسمها) */
function clientRowsOf(entity: EntityData | undefined): Array<Record<string, unknown>> {
  if (!entity || !Array.isArray(entity.rows)) return []
  const avatarCol = (entity.columns ?? []).find((c) => c.type === 'avatar')
  if (!avatarCol) return []
  return entity.rows.filter((row) => isRecord(row) && row[avatarCol.key] === DEMO_CLIENT_NAME)
}

// ============================================================
// كتل صفحة «حسابي» — بالترتيب الحرفي من المواصفة (§3)
// ============================================================

/**
 * كتل فضاء الزبون: ترويسة ترحيب + بطاقات إحصاء من صفوف الزبون +
 * جدول «طلباتي» للقراءة فقط (clientView) + بطاقة ملفه + إجراءات سريعة.
 * - ids: `${pageId}-b{n}` عند تمرير pageId (مسار القوالب — حتمي
 *   تطابق SSR/CSR)، وإلا uid('b_') كمسار add_page في tools.ts.
 */
export function buildClientAreaBlocks(
  schema: ProjectSchema,
  opts?: { pageId?: string }
): Block[] {
  const entities = schema?.mockData?.entities ?? {}
  const entityKey = clientActivityEntity(schema)
  const entity = entities[entityKey]

  // ---- بطاقات الإحصاء: من صفوف الزبون، وإلا القيم الاحتياطية ----
  const clientRows = clientRowsOf(entity)
  const statusCol =
    (entity?.columns ?? []).find((c) => c.type === 'badge') ??
    (entity?.columns ?? []).find((c) => c.key === 'status')
  const currencyCol = (entity?.columns ?? []).find((c) => c.type === 'currency')

  const totalOrders =
    clientRows.length > 0 ? num(clientRows.length) : num(12)
  const processing =
    clientRows.length > 0
      ? num(
          clientRows.filter((row) => {
            const status = String(row[statusCol?.key ?? 'status'] ?? '')
            return status.includes('جديد') || status.includes('قيد')
          }).length,
        )
      : num(2)
  const purchasesSum =
    clientRows.length > 0
      ? clientRows.reduce(
          (acc, row) => acc + (Number(row[currencyCol?.key ?? 'total'] ?? 0) || 0),
          0,
        )
      : 96400
  const totalPurchases = `${num(purchasesSum)} دج`

  const stats: Array<Record<string, unknown>> = [
    { label: 'إجمالي طلباتك', value: totalOrders, icon: 'shopping-cart' },
    { label: 'قيد المعالجة', value: processing, icon: 'clock' },
    { label: 'إجمالي مشترياتك', value: totalPurchases, icon: 'wallet' },
    { label: 'نقاط الولاء', value: '340', change: '+40', icon: 'star' },
  ]

  // ---- الإجراءات السريعة: أهداف حقيقية، ويُحذف الإجراء إن غاب هدفه ----
  const pages = schema?.pages ?? []
  const home = pages.find((p) => p.type === 'landing') ?? pages[0]
  const hasProducts = !!entities.products
  const pricingPage = pages.find((p) => p.type === 'pricing')
  const contactTarget =
    pages.find((p) => p.type === 'form') ??
    (home && home.blocks.some((b) => b.type === 'contact-form') ? home : undefined)

  const quickActions: Array<{ icon: string; label: string; pageId: string }> = []
  if (home) {
    quickActions.push({
      icon: hasProducts ? 'package' : 'briefcase',
      label: hasProducts ? 'تصفح المنتجات' : 'تصفح الخدمات',
      pageId: home.id,
    })
  }
  if (pricingPage) {
    quickActions.push({ icon: 'wallet', label: 'الأسعار والخطط', pageId: pricingPage.id })
  }
  if (contactTarget) {
    quickActions.push({ icon: 'message-circle', label: 'تواصل معنا', pageId: contactTarget.id })
  }

  // ---- بناء الكتل (نفس مسار tools.ts: mk بمعرّف b_) ----
  const mk = (index: number, type: Block['type'], props: Record<string, unknown>): Block => ({
    id: opts?.pageId ? `${opts.pageId}-b${index + 1}` : uidFn('b_'),
    type,
    props,
  })

  return [
    mk(0, 'dashboard-header', {
      title: 'مرحباً أمينة 👋',
      subtitle: 'هذا فضاؤك الشخصي — طلباتك ونشاطك في مكان واحد',
      actions: '',
    }),
    mk(1, 'stats-row', { items: stats }),
    mk(2, 'data-table', {
      entity: entityKey,
      title: 'طلباتي',
      pageSize: 5,
      clientView: true,
    }),
    mk(3, 'profile-card', {
      name: DEMO_CLIENT.name,
      role: 'زبونة وفيّة',
      email: DEMO_CLIENT.email,
      phone: '0555 21 08 46',
      bio: 'زبونة من وهران — أحب المنتجات الجديدة والعروض الموسمية، وأتابع طلباتي من هنا.',
    }),
    mk(4, 'quick-actions', {
      title: 'إجراءات سريعة',
      actions: quickActions,
    }),
  ]
}

// ============================================================
// صفحة «حسابي» + التأكد من وجودها
// ============================================================

/**
 * صفحة فضاء الزبون — العقد الثابت:
 * { name: 'حسابي', slug: 'account', type: 'dashboard', audience: 'client' }
 */
export function buildClientAreaPage(
  schema: ProjectSchema,
  opts?: { id?: string }
): ProjectPage {
  return {
    id: opts?.id || uidFn('page_'),
    name: 'حسابي',
    slug: 'account',
    type: 'dashboard',
    audience: 'client' as PageAudience,
    title: 'حسابي',
    subtitle: '',
    blocks: buildClientAreaBlocks(schema, opts?.id ? { pageId: opts.id } : undefined),
  }
}

/**
 * يضمن وجود صفحة فضاء الزبون (audience=client) وعنصرها في الشريط
 * الجانبي — دالة نقية لا تعدّل المخطط الأصلي:
 * - صفحة client موجودة أصلاً → المخطط نفسه بلا تغيير (مع معرّفها).
 * - وإلا تُضاف «حسابي» آخر الصفحات + عنصر شريطها آخر القائمة
 *   (بلا إعادة ترتيب أي عنصر قائم — العارض يرشّح حسب الجمهور).
 */
export function ensureClientAreaPage(
  schema: ProjectSchema,
  opts?: { id?: string }
): { schema: ProjectSchema; pageId: string } {
  const existing = (schema.pages ?? []).find((p) => p.audience === 'client')
  if (existing) return { schema, pageId: existing.id }

  const next = clone(schema)
  if (!Array.isArray(next.dashboardNav?.items)) next.dashboardNav = { items: [] }
  const page = buildClientAreaPage(next, opts)
  next.pages.push(page)
  // عنصر الشريط يُلحق في النهاية حرفياً — بلا لمس ترتيب عناصر المدير
  if (!next.dashboardNav.items.some((it) => it.pageId === page.id)) {
    next.dashboardNav.items.push({ label: 'حسابي', pageId: page.id, icon: 'user' })
  }
  return { schema: next, pageId: page.id }
}
