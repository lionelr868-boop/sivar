// ============================================================
// نموذج — Algerian mock data engine (بيانات تجريبية جزائرية)
// Task 2-a — isomorphic + deterministic (seed based)
// كل الأسماء عربية، المدن جزائرية، العملة دج، التواريخ 2024
// ============================================================
import type {
  ChartData,
  EntityColumn,
  EntityData,
  ProjectMockData,
  ProjectType,
  StatItem,
} from '@/lib/types'

// ---------- shared pools ----------
const NAMES: string[] = [
  'أحمد بن علي',
  'محمد قادري',
  'سارة بوزيد',
  'ياسين مراد',
  'أمينة حساني',
  'كريم بلقاسم',
  'نورة سعدي',
  'رشيد بوعلام',
  'ليلى مزيان',
  'عمر تواتي',
]

const EMAILS: string[] = [
  'ahmed.benali@gmail.com',
  'mohamed.ghadri@gmail.com',
  'sara.bouzid@gmail.com',
  'yacine.mourad@gmail.com',
  'amina.hassani@gmail.com',
  'karim.belkacem@gmail.com',
  'nora.saadi@gmail.com',
  'rachid.boualem@gmail.com',
  'leila.meziane@gmail.com',
  'omar.touati@gmail.com',
]

const CITIES: string[] = ['الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'البليدة']

/** Algerian month names (جانفي … ديسمبر) */
export const ARABIC_MONTHS: string[] = [
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان',
  'جويلية',
  'أوت',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

/** أيام الأسبوع — تبدأ من الاثنين */
export const ARABIC_DAYS: string[] = [
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
  'الأحد',
]

/** يُرجع شخصاً (اسم + بريد) من المجموعة الدوّارة */
function person(i: number): { name: string; email: string } {
  const idx = ((i % NAMES.length) + NAMES.length) % NAMES.length
  return { name: NAMES[idx], email: EMAILS[idx] }
}

/** تنسيق الأرقام بأسلوب 24,580 */
export function num(v: number): string {
  return v.toLocaleString('en-US')
}

// ---------- entity keys / labels ----------
export const ENTITY_KEYS = [
  'customers',
  'orders',
  'products',
  'bookings',
  'invoices',
  'services',
  'users',
  'clients',
  'tasks',
  'teamMembers',
  'courses',
  'students',
  'properties',
  'appointments',
  'menuItems',
  'transactions',
  'subscriptions',
] as const

export type EntityKey = (typeof ENTITY_KEYS)[number]

export const ENTITY_LABELS: Record<string, string> = {
  customers: 'العملاء',
  orders: 'الطلبات',
  products: 'المنتجات',
  bookings: 'الحجوزات',
  invoices: 'الفواتير',
  services: 'الخدمات',
  users: 'المستخدمون',
  clients: 'الزبناء',
  tasks: 'المهام',
  teamMembers: 'أعضاء الفريق',
  courses: 'الدورات',
  students: 'الطلاب',
  properties: 'العقارات',
  appointments: 'المواعيد',
  menuItems: 'أصناف القائمة',
  transactions: 'المعاملات',
  subscriptions: 'الاشتراكات',
}

export const CHART_KEYS = ['revenueMonthly', 'ordersWeekly', 'salesByCategory', 'usersGrowth'] as const

export const CHART_LABELS: Record<string, string> = {
  revenueMonthly: 'الإيرادات الشهرية',
  ordersWeekly: 'الطلبات الأسبوعية',
  salesByCategory: 'المبيعات حسب الفئة',
  usersGrowth: 'نمو المستخدمين',
}

/** الكيان الافتراضي حسب نوع المشروع (يُستعمل في صفحات البداية) */
export function defaultEntityFor(type: ProjectType): string {
  switch (type) {
    case 'ecommerce':
    case 'marketplace':
    case 'delivery':
      return 'orders'
    case 'restaurant':
      return 'menuItems'
    case 'booking':
      return 'bookings'
    case 'health':
      return 'appointments'
    case 'education':
      return 'courses'
    case 'realestate':
      return 'properties'
    case 'fintech':
      return 'transactions'
    case 'services':
    case 'agency':
      return 'clients'
    case 'admin':
    case 'app':
      return 'users'
    default:
      return 'customers'
  }
}

/** حزمة الإحصائيات الافتراضية حسب نوع المشروع */
export function defaultStatsPreset(type: ProjectType): string {
  switch (type) {
    case 'saas':
    case 'ai':
    case 'fintech':
      return 'saas'
    case 'ecommerce':
    case 'marketplace':
    case 'delivery':
      return 'ecommerce'
    case 'education':
      return 'education'
    case 'health':
    case 'booking':
      return 'booking'
    case 'restaurant':
      return 'restaurant'
    case 'agency':
    case 'services':
    case 'realestate':
      return 'agency'
    default:
      return 'overview'
  }
}

// ---------- seed helpers ----------
/** تدوير الصفوف — seed 0 يعني بدون تغيير */
function rot<T>(rows: T[], seed: number): T[] {
  if (!seed || rows.length === 0) return [...rows]
  const r = ((seed % rows.length) + rows.length) % rows.length
  return [...rows.slice(r), ...rows.slice(0, r)]
}

/** اهتزاز رقمي بسيط — seed 0 يعني بدون تغيير */
function jit(v: number, seed: number, pct = 0.08): number {
  if (!seed) return v
  const f = 1 + (((seed % 7) - 3) * pct) / 3
  return Math.max(0, Math.round(v * f))
}

const NUMERIC_COLUMN_TYPES = new Set<string>(['number', 'currency', 'progress'])

/** بناء كيان مع تطبيق seed (تدوير + اهتزاز الأرقام) — نسخة مستقلة عن الأعمدة */
function makeEntity(
  columns: EntityColumn[],
  baseRows: Array<Record<string, unknown>>,
  seed: number
): EntityData {
  const cols = columns.map((c) => ({ ...c }))
  const rows = rot(baseRows, seed).map((row) => {
    const out: Record<string, unknown> = {}
    for (const col of cols) {
      const v = row[col.key]
      if (NUMERIC_COLUMN_TYPES.has(col.type) && typeof v === 'number') {
        out[col.key] = jit(v, seed)
      } else {
        out[col.key] = v
      }
    }
    return out
  })
  return { columns: cols, rows }
}

// ============================================================
// Entity builders — 17 كياناً، كل واحد بـ 6 صفوف
// ============================================================

const CUSTOMER_COLS: EntityColumn[] = [
  { key: 'name', label: 'العميل', type: 'avatar' },
  { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
  { key: 'city', label: 'المدينة', type: 'text' },
  { key: 'orders', label: 'الطلبات', type: 'number' },
  { key: 'total', label: 'إجمالي المشتريات', type: 'currency' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function customersRows(): Array<Record<string, unknown>> {
  const data: Array<[number, string, number, number, string]> = [
    [0, 'الجزائر', 12, 86400, 'نشط'],
    [2, 'وهران', 8, 45200, 'نشط'],
    [1, 'قسنطينة', 5, 24800, 'جديد'],
    [4, 'سطيف', 15, 112500, 'نشط'],
    [3, 'عنابة', 3, 12600, 'غير نشط'],
    [6, 'البليدة', 9, 58700, 'نشط'],
  ]
  return data.map(([i, city, orders, total, status]) => ({
    name: person(i).name,
    email: person(i).email,
    city,
    orders,
    total,
    status,
  }))
}

const ORDER_COLS: EntityColumn[] = [
  { key: 'id', label: 'رقم الطلب', type: 'text' },
  { key: 'customer', label: 'العميل', type: 'avatar' },
  { key: 'item', label: 'المنتج', type: 'text' },
  { key: 'quantity', label: 'الكمية', type: 'number' },
  { key: 'total', label: 'المبلغ', type: 'currency' },
  { key: 'date', label: 'التاريخ', type: 'date' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function ordersRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, string, number, number, string, string]> = [
    ['ORD-2401', 0, 'سماعة بلوتوث JBL', 1, 8900, '2024-03-12', 'جديد'],
    ['ORD-2402', 2, 'ساعة ذكية Amazfit', 1, 24800, '2024-03-11', 'مكتمل'],
    ['ORD-2403', 4, 'حقيبة ظهر جلدية', 2, 12400, '2024-03-10', 'قيد المعالجة'],
    ['ORD-2404', 1, 'مكينة قهوة Delonghi', 1, 32500, '2024-03-09', 'مكتمل'],
    ['ORD-2405', 6, 'عطر رجالي Dior', 1, 19800, '2024-03-08', 'ملغى'],
    ['ORD-2406', 3, 'لوحة مفاتيح ميكانيكية', 1, 11300, '2024-03-07', 'جديد'],
  ]
  return data.map(([id, i, item, quantity, total, date, status]) => ({
    id,
    customer: person(i).name,
    item,
    quantity,
    total,
    date,
    status,
  }))
}

const PRODUCT_COLS: EntityColumn[] = [
  { key: 'name', label: 'المنتج', type: 'text' },
  { key: 'category', label: 'الفئة', type: 'text' },
  { key: 'price', label: 'السعر', type: 'currency' },
  { key: 'stock', label: 'المخزون', type: 'number' },
  { key: 'sold', label: 'المبيعات', type: 'number' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

/** منتجات افتراضية (متجر إلكتروني) — تشمل الأرقام المرجعية 24800 و15000 */
function productsDefaultRows(): Array<Record<string, unknown>> {
  const data: Array<[string, string, number, number, number, string]> = [
    ['سماعة بلوتوث JBL', 'إلكترونيات', 8900, 34, 156, 'نشط'],
    ['ساعة ذكية Amazfit', 'إلكترونيات', 24800, 12, 98, 'نشط'],
    ['حقيبة ظهر جلدية', 'حقائب وملابس', 6200, 45, 210, 'نشط'],
    ['مكينة قهوة Delonghi', 'أجهزة منزلية', 32500, 6, 41, 'نشط'],
    ['عطر رجالي Dior', 'عطور', 15000, 8, 67, 'نشط'],
    ['لوحة مفاتيح ميكانيكية', 'إلكترونيات', 11300, 0, 132, 'نفد المخزون'],
  ]
  return data.map(([name, category, price, stock, sold, status]) => ({
    name,
    category,
    price,
    stock,
    sold,
    status,
  }))
}

/** منتجات مطعم/توصيل — أطباق جزائرية */
function productsFoodRows(): Array<Record<string, unknown>> {
  const data: Array<[string, string, number, number, number, string]> = [
    ['كسكس بخضر', 'أطباق رئيسية', 1200, 48, 320, 'متاح'],
    ['طاجين زيتون', 'أطباق رئيسية', 1500, 36, 245, 'متاح'],
    ['شخشوخة', 'أطباق رئيسية', 1000, 52, 198, 'متاح'],
    ['حريرة', 'شوربات', 400, 80, 410, 'متاح'],
    ['بريك بالبيض', 'مقبلات', 300, 95, 520, 'متاح'],
    ['بقلاوة وردة', 'حلويات', 800, 0, 260, 'نفد المخزون'],
  ]
  return data.map(([name, category, price, stock, sold, status]) => ({
    name,
    category,
    price,
    stock,
    sold,
    status,
  }))
}

const BOOKING_COLS: EntityColumn[] = [
  { key: 'id', label: 'رقم الحجز', type: 'text' },
  { key: 'customer', label: 'العميلة', type: 'avatar' },
  { key: 'service', label: 'الخدمة', type: 'text' },
  { key: 'date', label: 'التاريخ', type: 'date' },
  { key: 'time', label: 'الوقت', type: 'text' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function bookingsRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, string, string, string, string]> = [
    ['BKG-1201', 4, 'قص وتصفيف', '2024-03-12', '10:30', 'مكتمل'],
    ['BKG-1202', 8, 'صبغة شعر', '2024-03-12', '11:45', 'جديد'],
    ['BKG-1203', 2, 'مانيكير وباديكير', '2024-03-13', '14:00', 'قيد المعالجة'],
    ['BKG-1204', 6, 'مكياج عروس', '2024-03-15', '09:00', 'مؤكد'],
    ['BKG-1205', 5, 'حمام مغربي', '2024-03-16', '16:30', 'ملغى'],
    ['BKG-1206', 9, 'عناية بالبشرة', '2024-03-17', '13:15', 'مكتمل'],
  ]
  return data.map(([id, i, service, date, time, status]) => ({
    id,
    customer: person(i).name,
    service,
    date,
    time,
    status,
  }))
}

const INVOICE_COLS: EntityColumn[] = [
  { key: 'id', label: 'رقم الفاتورة', type: 'text' },
  { key: 'client', label: 'الزبون', type: 'avatar' },
  { key: 'amount', label: 'المبلغ', type: 'currency' },
  { key: 'date', label: 'تاريخ الإصدار', type: 'date' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function invoicesRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, number, string, string]> = [
    ['INV-2024-001', 0, 24800, '2024-03-01', 'مدفوعة'],
    ['INV-2024-002', 2, 96400, '2024-03-03', 'مدفوعة'],
    ['INV-2024-003', 4, 15000, '2024-03-05', 'معلّقة'],
    ['INV-2024-004', 1, 132000, '2024-03-08', 'مدفوعة'],
    ['INV-2024-005', 6, 45600, '2024-03-10', 'متأخرة'],
    ['INV-2024-006', 3, 8900, '2024-03-12', 'ملغاة'],
  ]
  return data.map(([id, i, amount, date, status]) => ({
    id,
    client: person(i).name,
    amount,
    date,
    status,
  }))
}

const SERVICE_COLS: EntityColumn[] = [
  { key: 'name', label: 'الخدمة', type: 'text' },
  { key: 'category', label: 'الفئة', type: 'text' },
  { key: 'price', label: 'السعر', type: 'currency' },
  { key: 'duration', label: 'المدة', type: 'text' },
  { key: 'rating', label: 'التقييم', type: 'progress' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function servicesRows(): Array<Record<string, unknown>> {
  const data: Array<[string, string, number, string, number, string]> = [
    ['تصميم شعار احترافي', 'تصميم', 15000, '3 أيام', 96, 'نشطة'],
    ['تطوير موقع واجهات', 'برمجة', 120000, 'أسبوعان', 92, 'نشطة'],
    ['جلسة تصوير احترافية', 'إعلام', 8000, 'يوم واحد', 88, 'نشطة'],
    ['إدارة حسابات التواصل', 'تسويق', 25000, 'شهرياً', 90, 'نشطة'],
    ['استشارة تقنية', 'استشارات', 5000, 'ساعة واحدة', 95, 'نشطة'],
    ['مونتاج فيديو تسويقي', 'إعلام', 20000, '4 أيام', 87, 'موقوفة'],
  ]
  return data.map(([name, category, price, duration, rating, status]) => ({
    name,
    category,
    price,
    duration,
    rating,
    status,
  }))
}

const USER_COLS: EntityColumn[] = [
  { key: 'name', label: 'المستخدم', type: 'avatar' },
  { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
  { key: 'role', label: 'الدور', type: 'text' },
  { key: 'lastActive', label: 'آخر ظهور', type: 'date' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function usersRows(): Array<Record<string, unknown>> {
  const data: Array<[number, string, string, string]> = [
    [0, 'مدير عام', '2024-03-12', 'نشط'],
    [2, 'محررة محتوى', '2024-03-11', 'نشط'],
    [1, 'مسؤول دعم', '2024-03-10', 'نشط'],
    [4, 'محللة بيانات', '2024-03-08', 'معلّق'],
    [3, 'مختبر واجهات', '2024-03-07', 'نشط'],
    [6, 'مشرف عمليات', '2024-03-05', 'معلّق'],
  ]
  return data.map(([i, role, lastActive, status]) => ({
    name: person(i).name,
    email: person(i).email,
    role,
    lastActive,
    status,
  }))
}

const CLIENT_COLS: EntityColumn[] = [
  { key: 'name', label: 'الزبون', type: 'avatar' },
  { key: 'company', label: 'الشركة', type: 'text' },
  { key: 'city', label: 'المدينة', type: 'text' },
  { key: 'contract', label: 'قيمة العقد', type: 'currency' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function clientsRows(): Array<Record<string, unknown>> {
  const data: Array<[number, string, string, number, string]> = [
    [0, 'شركة الأمل للتجهيزات', 'الجزائر', 2500000, 'نشط'],
    [2, 'مؤسسة النور للبناء', 'وهران', 1850000, 'نشط'],
    [1, 'وكالة صوت الشباب', 'قسنطينة', 960000, 'قيد المراجعة'],
    [4, 'مطبعة الهنا', 'سطيف', 640000, 'نشط'],
    [3, 'تعاونية الوئام', 'عنابة', 420000, 'متوقف'],
    [6, 'شركة المتوسط للتوزيع', 'البليدة', 1450000, 'نشط'],
  ]
  return data.map(([i, company, city, contract, status]) => ({
    name: person(i).name,
    company,
    city,
    contract,
    status,
  }))
}

const TASK_COLS: EntityColumn[] = [
  { key: 'title', label: 'المهمة', type: 'text' },
  { key: 'assignee', label: 'المسؤولة', type: 'avatar' },
  { key: 'priority', label: 'الأولوية', type: 'badge' },
  { key: 'due', label: 'الاستحقاق', type: 'date' },
  { key: 'progress', label: 'التقدم', type: 'progress' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function tasksRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, string, string, number, string]> = [
    ['تصميم صفحة الهبوط الجديدة', 2, 'عالية', '2024-03-20', 75, 'قيد المعالجة'],
    ['مراجعة نصوص الموقع', 0, 'متوسطة', '2024-03-18', 40, 'جديد'],
    ['ربط بوابة الدفع', 3, 'عالية', '2024-03-25', 20, 'جديد'],
    ['اختبار تجربة المستخدم', 6, 'منخفضة', '2024-04-02', 10, 'قيد المعالجة'],
    ['تجهيز محتوى صفحة التسعير', 8, 'متوسطة', '2024-03-22', 90, 'مكتمل'],
    ['إعداد لوحة التحكم', 1, 'عالية', '2024-03-15', 100, 'مكتمل'],
  ]
  return data.map(([title, i, priority, due, progress, status]) => ({
    title,
    assignee: person(i).name,
    priority,
    due,
    progress,
    status,
  }))
}

const TEAM_COLS: EntityColumn[] = [
  { key: 'name', label: 'العضو', type: 'avatar' },
  { key: 'role', label: 'الدور', type: 'text' },
  { key: 'department', label: 'القسم', type: 'text' },
  { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function teamRows(): Array<Record<string, unknown>> {
  const data: Array<[number, string, string, string]> = [
    [2, 'مصممة واجهات', 'التصميم', 'نشط'],
    [0, 'مطوّر واجهات أمامية', 'التطوير', 'نشط'],
    [8, 'مسؤولة تسويق', 'التسويق', 'نشط'],
    [1, 'مهندس بيانات', 'التطوير', 'نشط'],
    [4, 'مسؤولة نجاح العملاء', 'العمليات', 'نشط'],
    [7, 'مدير مشاريع', 'الإدارة', 'نشط'],
  ]
  return data.map(([i, role, department, status]) => ({
    name: person(i).name,
    role,
    department,
    email: person(i).email,
    status,
  }))
}

const COURSE_COLS: EntityColumn[] = [
  { key: 'title', label: 'الدورة', type: 'text' },
  { key: 'instructor', label: 'المدرّب', type: 'avatar' },
  { key: 'students', label: 'الطلاب', type: 'number' },
  { key: 'price', label: 'السعر', type: 'currency' },
  { key: 'rating', label: 'التقييم', type: 'progress' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function coursesRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, number, number, number, string]> = [
    ['أساسيات تطوير الويب', 0, 1240, 9900, 94, 'نشطة'],
    ['التسويق الرقمي للمشاريع الناشئة', 2, 860, 12900, 92, 'نشطة'],
    ['تصميم UI/UX الاحترافي', 8, 645, 14900, 96, 'نشطة'],
    ['الذكاء الاصطناعي للمبتدئين', 1, 1580, 15900, 90, 'نشطة'],
    ['إدارة المشاريع الصغيرة', 5, 430, 8900, 88, 'نشطة'],
    ['المحاسبة لأصحاب المشاريع', 6, 512, 7900, 85, 'قريباً'],
  ]
  return data.map(([title, i, students, price, rating, status]) => ({
    title,
    instructor: person(i).name,
    students,
    price,
    rating,
    status,
  }))
}

const STUDENT_COLS: EntityColumn[] = [
  { key: 'name', label: 'الطالب', type: 'avatar' },
  { key: 'email', label: 'البريد الإلكتروني', type: 'email' },
  { key: 'course', label: 'الدورة', type: 'text' },
  { key: 'progress', label: 'التقدم', type: 'progress' },
  { key: 'city', label: 'المدينة', type: 'text' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function studentsRows(): Array<Record<string, unknown>> {
  const data: Array<[number, string, number, string, string]> = [
    [0, 'أساسيات تطوير الويب', 78, 'الجزائر', 'نشط'],
    [2, 'التسويق الرقمي للمشاريع الناشئة', 45, 'وهران', 'نشط'],
    [4, 'تصميم UI/UX الاحترافي', 92, 'قسنطينة', 'نشط'],
    [1, 'الذكاء الاصطناعي للمبتدئين', 12, 'سطيف', 'جديد'],
    [6, 'أساسيات تطوير الويب', 60, 'عنابة', 'نشط'],
    [3, 'إدارة المشاريع الصغيرة', 30, 'البليدة', 'متوقف'],
  ]
  return data.map(([i, course, progress, city, status]) => ({
    name: person(i).name,
    email: person(i).email,
    course,
    progress,
    city,
    status,
  }))
}

const PROPERTY_COLS: EntityColumn[] = [
  { key: 'title', label: 'العقار', type: 'text' },
  { key: 'type', label: 'النوع', type: 'text' },
  { key: 'city', label: 'المدينة', type: 'text' },
  { key: 'area', label: 'المساحة (م²)', type: 'number' },
  { key: 'price', label: 'السعر', type: 'currency' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function propertiesRows(): Array<Record<string, unknown>> {
  const data: Array<[string, string, string, number, number, string]> = [
    ['فيلا فاخرة بحيدرة', 'فيلا', 'الجزائر', 420, 95000000, 'متاح'],
    ['شقة حديثة بباب الزوار', 'شقة', 'الجزائر', 120, 24800000, 'متاح'],
    ['شقة بإطلالة بحي الشط', 'شقة', 'وهران', 95, 15600000, 'محجوز'],
    ['أرض بضواحي سطيف', 'أرض', 'سطيف', 250, 2500000, 'متاح'],
    ['دوبلكس بقسنطينة', 'دوبلكس', 'قسنطينة', 180, 31500000, 'متاح'],
    ['محل تجاري بوهران', 'محل تجاري', 'وهران', 60, 12800000, 'مؤجر'],
  ]
  return data.map(([title, type, city, area, price, status]) => ({
    title,
    type,
    city,
    area,
    price,
    status,
  }))
}

const APPOINTMENT_COLS: EntityColumn[] = [
  { key: 'id', label: 'رقم الموعد', type: 'text' },
  { key: 'patient', label: 'المريض', type: 'avatar' },
  { key: 'doctor', label: 'الطبيب', type: 'text' },
  { key: 'date', label: 'التاريخ', type: 'date' },
  { key: 'time', label: 'الوقت', type: 'text' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function appointmentsRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, string, string, string, string]> = [
    ['APT-3301', 8, 'د. كريم بلقاسم — قلب', '2024-03-12', '09:30', 'مكتمل'],
    ['APT-3302', 4, 'د. سارة بوزيد — أطفال', '2024-03-12', '10:45', 'مؤكد'],
    ['APT-3303', 2, 'د. محمد قادري — عام', '2024-03-13', '11:15', 'جديد'],
    ['APT-3304', 9, 'د. نورة سعدي — جلدية', '2024-03-14', '14:00', 'قيد المعالجة'],
    ['APT-3305', 5, 'د. رشيد بوعلام — عظام', '2024-03-15', '16:30', 'ملغى'],
    ['APT-3306', 6, 'د. سارة بوزيد — أطفال', '2024-03-16', '10:00', 'مكتمل'],
  ]
  return data.map(([id, i, doctor, date, time, status]) => ({
    id,
    patient: person(i).name,
    doctor,
    date,
    time,
    status,
  }))
}

const MENU_COLS: EntityColumn[] = [
  { key: 'name', label: 'الطبق', type: 'text' },
  { key: 'category', label: 'الفئة', type: 'text' },
  { key: 'price', label: 'السعر', type: 'currency' },
  { key: 'orders', label: 'الطلبات', type: 'number' },
  { key: 'rating', label: 'التقييم', type: 'progress' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function menuRows(): Array<Record<string, unknown>> {
  const data: Array<[string, string, number, number, number, string]> = [
    ['كسكس بخضر', 'أطباق رئيسية', 1200, 320, 97, 'متاح'],
    ['طاجين زيتون', 'أطباق رئيسية', 1500, 245, 95, 'متاح'],
    ['شخشوخة', 'أطباق رئيسية', 1000, 198, 93, 'متاح'],
    ['حريرة', 'شوربات', 400, 410, 96, 'متاح'],
    ['بريك بالبيض', 'مقبلات', 300, 520, 94, 'متاح'],
    ['بقلاوة وردة', 'حلويات', 800, 260, 92, 'نفد'],
  ]
  return data.map(([name, category, price, orders, rating, status]) => ({
    name,
    category,
    price,
    orders,
    rating,
    status,
  }))
}

const TRANSACTION_COLS: EntityColumn[] = [
  { key: 'id', label: 'رقم المعاملة', type: 'text' },
  { key: 'sender', label: 'الطرف', type: 'avatar' },
  { key: 'type', label: 'النوع', type: 'badge' },
  { key: 'amount', label: 'المبلغ', type: 'currency' },
  { key: 'date', label: 'التاريخ', type: 'date' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function transactionsRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, string, number, string, string]> = [
    ['TRX-88231', 0, 'تحويل صادر', 15000, '2024-03-10', 'مكتمل'],
    ['TRX-88232', 2, 'إيداع', 24800, '2024-03-10', 'مكتمل'],
    ['TRX-88233', 4, 'دفع فاتورة', 6400, '2024-03-11', 'قيد المعالجة'],
    ['TRX-88234', 1, 'تحويل وارد', 82000, '2024-03-11', 'مكتمل'],
    ['TRX-88235', 6, 'سحب', 20000, '2024-03-12', 'فاشل'],
    ['TRX-88236', 3, 'دفع فاتورة', 12700, '2024-03-12', 'مكتمل'],
  ]
  return data.map(([id, i, type, amount, date, status]) => ({
    id,
    sender: person(i).name,
    type,
    amount,
    date,
    status,
  }))
}

const SUBSCRIPTION_COLS: EntityColumn[] = [
  { key: 'id', label: 'رقم الاشتراك', type: 'text' },
  { key: 'customer', label: 'المشترك', type: 'avatar' },
  { key: 'plan', label: 'الخطة', type: 'text' },
  { key: 'price', label: 'السعر الشهري', type: 'currency' },
  { key: 'startDate', label: 'تاريخ البدء', type: 'date' },
  { key: 'status', label: 'الحالة', type: 'badge' },
]

function subscriptionsRows(): Array<Record<string, unknown>> {
  const data: Array<[string, number, string, number, string, string]> = [
    ['SUB-501', 0, 'الخطة الاحترافية', 4900, '2024-01-05', 'نشط'],
    ['SUB-502', 2, 'الخطة الأساسية', 2900, '2024-01-18', 'نشط'],
    ['SUB-503', 4, 'الخطة الاحترافية', 4900, '2024-02-02', 'تجريبي'],
    ['SUB-504', 1, 'خطة المؤسسات', 12900, '2024-02-10', 'نشط'],
    ['SUB-505', 6, 'الخطة الأساسية', 2900, '2024-02-22', 'ملغى'],
    ['SUB-506', 3, 'الخطة الاحترافية', 4900, '2024-03-01', 'نشط'],
  ]
  return data.map(([id, i, plan, price, startDate, status]) => ({
    id,
    customer: person(i).name,
    plan,
    price,
    startDate,
    status,
  }))
}

// ---------- builder registry ----------
function productsEntity(type: ProjectType, seed: number): EntityData {
  const rows =
    type === 'restaurant' || type === 'delivery' ? productsFoodRows() : productsDefaultRows()
  return makeEntity(PRODUCT_COLS, rows, seed)
}

const ENTITY_BUILDERS: Record<string, (seed: number) => EntityData> = {
  customers: (seed) => makeEntity(CUSTOMER_COLS, customersRows(), seed),
  orders: (seed) => makeEntity(ORDER_COLS, ordersRows(), seed),
  products: (seed) => productsEntity('other', seed),
  bookings: (seed) => makeEntity(BOOKING_COLS, bookingsRows(), seed),
  invoices: (seed) => makeEntity(INVOICE_COLS, invoicesRows(), seed),
  services: (seed) => makeEntity(SERVICE_COLS, servicesRows(), seed),
  users: (seed) => makeEntity(USER_COLS, usersRows(), seed),
  clients: (seed) => makeEntity(CLIENT_COLS, clientsRows(), seed),
  tasks: (seed) => makeEntity(TASK_COLS, tasksRows(), seed),
  teamMembers: (seed) => makeEntity(TEAM_COLS, teamRows(), seed),
  courses: (seed) => makeEntity(COURSE_COLS, coursesRows(), seed),
  students: (seed) => makeEntity(STUDENT_COLS, studentsRows(), seed),
  properties: (seed) => makeEntity(PROPERTY_COLS, propertiesRows(), seed),
  appointments: (seed) => makeEntity(APPOINTMENT_COLS, appointmentsRows(), seed),
  menuItems: (seed) => makeEntity(MENU_COLS, menuRows(), seed),
  transactions: (seed) => makeEntity(TRANSACTION_COLS, transactionsRows(), seed),
  subscriptions: (seed) => makeEntity(SUBSCRIPTION_COLS, subscriptionsRows(), seed),
}

/** يبني كياناً جاهزاً من المفاتيح المعروفة (لملء البيانات الناقصة) */
export function buildEntityData(key: string, seed = 0): EntityData | undefined {
  const builder = ENTITY_BUILDERS[key]
  return builder ? builder(seed) : undefined
}

/**
 * إعادة توليد صفوف كيان قائم مع الحفاظ على أعمدته ومحتواه
 * (تدوير الصفوف + اهتزاز الأرقام) — يُستعمل من أداة generate_mock_data.
 */
export function refreshEntityRows(entity: EntityData, seed: number): EntityData {
  return makeEntity(entity.columns, entity.rows, seed)
}

// ============================================================
// Charts — 4 رسوم بيانية
// ============================================================

export function buildCharts(seed = 0): Record<string, ChartData> {
  const revenue: Array<{ label: string; value: number }> = ARABIC_MONTHS.map((label, i) => ({
    label,
    value: jit(
      [1850000, 2120000, 1940000, 2380000, 2650000, 2400000, 2780000, 3150000, 3420000, 3280000, 3690000, 4150000][i],
      seed,
      0.05
    ),
  }))

  const ordersWeekly: Array<{ label: string; value: number }> = ARABIC_DAYS.map((label, i) => ({
    label,
    value: jit([124, 158, 142, 187, 240, 96, 88][i], seed, 0.15),
  }))

  const salesByCategory: Array<{ label: string; value: number }> = [
    { label: 'إلكترونيات', value: 42 },
    { label: 'ملابس وحقائب', value: 24 },
    { label: 'منزل وحديقة', value: 14 },
    { label: 'رياضة', value: 11 },
    { label: 'أخرى', value: 9 },
  ]

  const usersGrowth: Array<{ label: string; value: number }> = ARABIC_MONTHS.map((label, i) => ({
    label,
    value: jit([1200, 1380, 1560, 1890, 2200, 2540, 2980, 3450, 3960, 4520, 5120, 5880][i], seed, 0.05),
  }))

  return {
    revenueMonthly: { type: 'bar', title: CHART_LABELS.revenueMonthly, data: revenue },
    ordersWeekly: { type: 'line', title: CHART_LABELS.ordersWeekly, data: ordersWeekly },
    salesByCategory: { type: 'donut', title: CHART_LABELS.salesByCategory, data: salesByCategory },
    usersGrowth: { type: 'line', title: CHART_LABELS.usersGrowth, data: usersGrowth },
  }
}

// ============================================================
// Stats presets — 7 حزم إحصائيات
// ============================================================

export const STATS_PRESETS: Record<string, StatItem[]> = {
  overview: [
    { label: 'الإيرادات الشهرية', value: `${num(3420000)} دج`, change: '+12.5%', icon: 'trending-up' },
    { label: 'الطلبات هذا الشهر', value: num(1248), change: '+8.2%', icon: 'shopping-cart' },
    { label: 'العملاء النشطون', value: num(5880), change: '+4.6%', icon: 'users' },
    { label: 'متوسط التقييم', value: '4.8 / 5', change: '+0.2', icon: 'star' },
  ],
  ecommerce: [
    { label: 'إجمالي المبيعات', value: `${num(8940000)} دج`, change: '+15.3%', icon: 'trending-up' },
    { label: 'الطلبات الجديدة', value: num(324), change: '+22%', icon: 'shopping-cart' },
    { label: 'المنتجات المتوفرة', value: num(486), change: '+12', icon: 'package' },
    { label: 'منتجات نفد مخزونها', value: num(7), change: '-3', icon: 'bell' },
  ],
  booking: [
    { label: 'حجوزات اليوم', value: num(42), change: '+6', icon: 'calendar' },
    { label: 'حجوزات الشهر', value: num(1156), change: '+9.4%', icon: 'calendar-days' },
    { label: 'عملاء جدد هذا الشهر', value: num(89), change: '+12%', icon: 'users' },
    { label: 'معدل الإلغاء', value: '3.2%', change: '-0.8%', icon: 'trending-up' },
  ],
  education: [
    { label: 'الطلاب المسجلون', value: num(12480), change: '+18%', icon: 'graduation-cap' },
    { label: 'الدورات النشطة', value: num(86), change: '+9', icon: 'book-open' },
    { label: 'نسبة إكمال الدورات', value: '78%', change: '+5%', icon: 'check' },
    { label: 'الإيرادات الشهرية', value: `${num(2940000)} دج`, change: '+11%', icon: 'trending-up' },
  ],
  restaurant: [
    { label: 'طلبات اليوم', value: num(156), change: '+12%', icon: 'shopping-cart' },
    { label: 'مبيعات اليوم', value: `${num(184500)} دج`, change: '+9.8%', icon: 'trending-up' },
    { label: 'متوسط قيمة الطلب', value: `${num(1180)} دج`, change: '+3%', icon: 'credit-card' },
    { label: 'أكثر طبق مبيعاً', value: 'كسكس بخضر', change: `${num(320)} طلب`, icon: 'star' },
  ],
  agency: [
    { label: 'مشاريع نشطة', value: num(24), change: '+5', icon: 'briefcase' },
    { label: 'عملاء حاليون', value: num(38), change: '+7', icon: 'users' },
    { label: 'مشاريع مسلّمة', value: num(142), change: '+16', icon: 'check' },
    { label: 'رضا العملاء', value: '96%', change: '+2%', icon: 'star' },
  ],
  saas: [
    { label: 'المشتركون النشطون', value: num(5880), change: '+14.2%', icon: 'users' },
    { label: 'اشتراكات جديدة (30 يوم)', value: num(462), change: '+22%', icon: 'trending-up' },
    { label: 'الإيراد الشهري المتكرر', value: `${num(2940000)} دج`, change: '+10.8%', icon: 'wallet' },
    { label: 'معدل الاحتفاظ', value: '94.2%', change: '+1.4%', icon: 'shield' },
  ],
}

// ============================================================
// buildMockData — نقطة الدخول الرئيسية
// ============================================================

/**
 * يبني بيانات تجريبية كاملة (كل الكيانات + الرسوم + حزم الإحصائيات)
 * المحتوى مناسب للنوع: منتجات المطعم/التوصيل أطباق جزائرية.
 */
export function buildMockData(type: ProjectType): ProjectMockData {
  const entities: Record<string, EntityData> = {}
  for (const key of ENTITY_KEYS) {
    entities[key] = key === 'products' ? productsEntity(type, 0) : ENTITY_BUILDERS[key](0)
  }
  // نسخ عميقة لحزم الإحصائيات حتى تبقى مستقلة لكل مشروع
  const stats: Record<string, StatItem[]> = {}
  for (const [key, items] of Object.entries(STATS_PRESETS)) {
    stats[key] = items.map((it) => ({ ...it }))
  }
  return {
    currency: 'DZD',
    stats,
    entities,
    charts: buildCharts(0),
  }
}
