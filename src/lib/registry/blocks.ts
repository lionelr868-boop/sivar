// ============================================================
// نموذج — Block Registry (سجل المكوّنات)
// Task 2-a — تعريف كل BlockType: التسمية، الفئة، الأيقونة،
// القيم الافتراضية (مطابقة لعقد الخصائص المثبّت في worklog)،
// وحقول التحرير الخاصة بمحرر الخصائص.
// ============================================================
import type { BlockType } from '@/lib/types'
import { ENTITY_KEYS } from '@/lib/content/mock-data'
import { CHART_KEYS } from '@/lib/content/mock-data'

// ---------- types (مطابقة للعقد المثبّت) ----------
export type FieldDefinition =
  | {
      key: string
      label: string
      type: 'text' | 'textarea' | 'number' | 'color' | 'switch' | 'select' | 'code'
      options?: { value: string; label: string }[]
    }
  | { key: string; label: string; type: 'page' }
  | { key: string; label: string; type: 'image'; accept?: string }
  | { key: string; label: string; type: 'list'; itemFields: FieldDefinition[]; itemLabel?: string }

export interface BlockDefinition {
  type: BlockType
  label: string
  category: 'marketing' | 'dashboard' | 'auth' | 'states'
  description: string
  /** lucide icon name */
  icon: string
  /** قيم افتراضية بمفاتيح مطابقة تماماً لعقد خصائص المكوّنات */
  defaults: () => Record<string, unknown>
  /** حقول التحرير (مجموعة سهلة للاستعمال في المحرر) */
  fields: FieldDefinition[]
}

// ---------- خيارات جاهزة (مستعملة في حقول select) ----------
const LAYOUT_OPTIONS = [
  { value: 'split', label: 'مُقسَّم (نص + رسم)' },
  { value: 'centered', label: 'موسّط' },
]
const HERO_BG_OPTIONS = [
  { value: 'default', label: 'عادي' },
  { value: 'muted', label: 'خفيف ملوّن' },
  { value: 'dark', label: 'داكن' },
  { value: 'gradient', label: 'تدرّج لوني' },
  { value: 'gradient-soft', label: 'تدرّج ناعم' },
  { value: 'mesh', label: 'شبكية توهج' },
]
const HERO_OVERLAY_OPTIONS = [
  { value: 'dark', label: 'تعتيم داكن (نص أبيض)' },
  { value: 'medium', label: 'تعتيم متوسط (نص أبيض)' },
  { value: 'light', label: 'غلالة فاتحة (نص داكن)' },
  { value: 'none', label: 'بدون تعتيم' },
]
const HERO_VISUAL_OPTIONS = [
  { value: 'dashboard', label: 'رسم لوحة تحكم' },
  { value: 'phone', label: 'هاتف تطبيق' },
  { value: 'video', label: 'بطاقة فيديو' },
  { value: 'form', label: 'نموذج بريد (جمع تسجيلات)' },
  { value: 'analytics', label: 'بطاقة تحليلات' },
  { value: 'orders', label: 'طلبات المتجر' },
  { value: 'chat', label: 'المحادثات' },
  { value: 'calendar', label: 'التقويم' },
  { value: 'testimonial', label: 'رأي عميل' },
  { value: 'none', label: 'بدون رسم' },
]
const HERO_TITLE_SIZE_OPTIONS = [
  { value: 'md', label: 'عادي' },
  { value: 'lg', label: 'كبير' },
  { value: 'xl', label: 'ضخم' },
]
const ALIGN_OPTIONS = [
  { value: 'start', label: 'بداية السطر' },
  { value: 'center', label: 'وسط' },
]
const COLUMNS_OPTIONS = [
  { value: '2', label: 'عمودان' },
  { value: '3', label: '3 أعمدة' },
  { value: '4', label: '4 أعمدة' },
]
const CTA_STYLE_OPTIONS = [
  { value: 'default', label: 'عادي' },
  { value: 'gradient', label: 'تدرّج' },
  { value: 'dark', label: 'داكن' },
]
const GALLERY_VARIANT_OPTIONS = [
  { value: 'products', label: 'منتجات' },
  { value: 'services', label: 'خدمات' },
  { value: 'properties', label: 'عقارات' },
  { value: 'menu', label: 'قائمة طعام' },
  { value: 'courses', label: 'دورات' },
]
const AUTH_VARIANT_OPTIONS = [
  { value: 'login', label: 'تسجيل الدخول' },
  { value: 'signup', label: 'إنشاء حساب' },
  { value: 'forgot', label: 'نسيت كلمة المرور' },
]
const CHART_TYPE_OPTIONS = [
  { value: 'bar', label: 'أعمدة' },
  { value: 'line', label: 'خطّي' },
  { value: 'donut', label: 'دائري' },
]
const CHART_KEY_OPTIONS = CHART_KEYS.map((k) => ({
  value: k,
  label: { revenueMonthly: 'الإيرادات الشهرية', ordersWeekly: 'الطلبات الأسبوعية', salesByCategory: 'المبيعات حسب الفئة', usersGrowth: 'نمو المستخدمين' }[k] ?? k,
}))
const ENTITY_OPTIONS = ENTITY_KEYS.map((k) => ({ value: k, label: k }))
const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'نص' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'password', label: 'كلمة مرور' },
  { value: 'number', label: 'رقم' },
  { value: 'select', label: 'قائمة اختيار' },
  { value: 'textarea', label: 'نص طويل' },
  { value: 'checkbox', label: 'مربع تأكيد' },
]
const SETTING_FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'نص' },
  { value: 'switch', label: 'مفتاح تشغيل' },
  { value: 'select', label: 'قائمة اختيار' },
  { value: 'password', label: 'كلمة مرور' },
]

/** خيارات أيقونات (مجموعة فرعية من icon-map) لاختيار بصري سريع */
export const ICON_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'sparkles', label: 'بريق' },
  { value: 'zap', label: 'ومضة' },
  { value: 'shield', label: 'درع حماية' },
  { value: 'globe', label: 'كرة أرضية' },
  { value: 'star', label: 'نجمة' },
  { value: 'heart', label: 'قلب' },
  { value: 'check', label: 'علامة صح' },
  { value: 'clock', label: 'ساعة' },
  { value: 'trending-up', label: 'نمو صاعد' },
  { value: 'users', label: 'مستخدمون' },
  { value: 'package', label: 'طرد' },
  { value: 'credit-card', label: 'بطاقة' },
  { value: 'wallet', label: 'محفظة' },
  { value: 'bell', label: 'جرس إشعارات' },
  { value: 'target', label: 'هدف' },
  { value: 'award', label: 'جائزة' },
  { value: 'smartphone', label: 'هاتف' },
  { value: 'briefcase', label: 'حقيبة عمل' },
  { value: 'calendar', label: 'تقويم' },
  { value: 'search', label: 'بحث' },
  { value: 'plus', label: 'إضافة' },
  { value: 'file-text', label: 'ملف' },
  { value: 'settings', label: 'إعدادات' },
  { value: 'user', label: 'مستخدم' },
]

// ============================================================
// BLOCK_REGISTRY
// ============================================================
export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  // ---------------- marketing ----------------
  hero: {
    type: 'hero',
    label: 'البطل',
    category: 'marketing',
    description: 'القسم الرئيسي في أعلى الصفحة مع العنوان والأزرار',
    icon: 'zap',
    defaults: () => ({
      title: 'حوّل فكرتك إلى واقع رقمي',
      subtitle: 'منصة عربية تساعدك على إطلاق مشروعك بسرعة، بأدوات بسيطة ونتائج احترافية تناسب السوق الجزائري.',
      primaryButton: 'ابدأ الآن مجاناً',
      primaryButtonPage: '',
      secondaryButton: 'تعرّف على المميزات',
      layout: 'split',
      background: 'default',
      bgOverlay: 'dark',
      align: 'start',
      visual: 'dashboard',
      titleSize: 'md',
      eyebrow: '',
      emailPlaceholder: '',
      emailButton: '',
    }),
    fields: [
      { key: 'eyebrow', label: 'شعار صغير (Eyebrow)', type: 'text' },
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'primaryButton', label: 'نص الزر الأساسي', type: 'text' },
      { key: 'primaryButtonPage', label: 'هدف الزر الأساسي (اختياري — تلقائي ذكي)', type: 'page' },
      { key: 'secondaryButton', label: 'نص الزر الثانوي', type: 'text' },
      { key: 'layout', label: 'التخطيط', type: 'select', options: LAYOUT_OPTIONS },
      { key: 'visual', label: 'الرسم الجانبي', type: 'select', options: HERO_VISUAL_OPTIONS },
      { key: 'titleSize', label: 'حجم العنوان', type: 'select', options: HERO_TITLE_SIZE_OPTIONS },
      { key: 'background', label: 'الخلفية', type: 'select', options: HERO_BG_OPTIONS },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
      { key: 'align', label: 'محاذاة النص', type: 'select', options: ALIGN_OPTIONS },
      { key: 'emailPlaceholder', label: 'حقل البريد — النص التوضيحي', type: 'text' },
      { key: 'emailButton', label: 'حقل البريد — نص الزر', type: 'text' },
    ],
  },

  features: {
    type: 'features',
    label: 'المميزات',
    category: 'marketing',
    description: 'شبكة بطاقات تعرض مميزات المنتج أو الخدمة',
    icon: 'layers',
    defaults: () => ({
      title: 'لماذا تختار منصتنا؟',
      subtitle: 'كل ما تحتاجه لإدارة مشروعك في مكان واحد',
      columns: 3,
      items: [
        { icon: 'zap', title: 'سرعة في الإنجاز', description: 'أنجز مهامك في وقت أقل بفضل أدوات مبنية للعمل اليومي.' },
        { icon: 'shield', title: 'أمان البيانات', description: 'بياناتك محمية بتشفير كامل ونسخ احتياطي يومي.' },
        { icon: 'globe', title: 'عربية أولاً', description: 'واجهة عربية كاملة من اليمين إلى اليسار صُممت للمستخدم الجزائري.' },
        { icon: 'trending-up', title: 'تحليلات ذكية', description: 'تقارير فورية تساعدك على اتخاذ قرارات أفضل.' },
        { icon: 'users', title: 'عمل جماعي', description: 'ادعُ فريقك واعملوا معاً في نفس المساحة.' },
        { icon: 'smartphone', title: 'يعمل على الهاتف', description: 'تجربة سلسة على كل الشاشات أينما كنت.' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'columns', label: 'عدد الأعمدة', type: 'select', options: COLUMNS_OPTIONS },
      {
        key: 'items',
        label: 'المميزات',
        type: 'list',
        itemLabel: 'ميزة',
        itemFields: [
          { key: 'icon', label: 'الأيقونة', type: 'select', options: ICON_FIELD_OPTIONS },
          { key: 'title', label: 'العنوان', type: 'text' },
          { key: 'description', label: 'الوصف', type: 'textarea' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  stats: {
    type: 'stats',
    label: 'الأرقام',
    category: 'marketing',
    description: 'صف أرقام نجاح مشروعك في شريط واحد',
    icon: 'trending-up',
    defaults: () => ({
      title: '',
      items: [
        { label: 'عميل سعيد', value: '2,400+', change: '+18%' },
        { label: 'مشروع منجز', value: '860', change: '+12%' },
        { label: 'سنوات خبرة', value: '12', change: '' },
        { label: 'معدل الرضا', value: '98%', change: '+2%' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان (اختياري)', type: 'text' },
      {
        key: 'items',
        label: 'الأرقام',
        type: 'list',
        itemLabel: 'رقم',
        itemFields: [
          { key: 'label', label: 'التسمية', type: 'text' },
          { key: 'value', label: 'القيمة', type: 'text' },
          { key: 'change', label: 'التغيّر (مثل +12%)', type: 'text' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  steps: {
    type: 'steps',
    label: 'خطوات العمل',
    category: 'marketing',
    description: 'خطوات مرقّمة توضح كيف يعمل المنتج',
    icon: 'list',
    defaults: () => ({
      title: 'كيف يعمل؟',
      subtitle: 'ثلاث خطوات فقط تفصلك عن البداية',
      steps: [
        { title: 'أنشئ حسابك', description: 'سجّل خلال دقيقة ببريدك الإلكتروني فقط، بدون تعقيد.' },
        { title: 'أضف بياناتك', description: 'خصّص صفحاتك ومحتواك بما يناسب مشروعك.' },
        { title: 'انطلق نحو النجاح', description: 'شارك رابطك مع عملائك وابدأ استقبال الطلبات.' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      {
        key: 'steps',
        label: 'الخطوات',
        type: 'list',
        itemLabel: 'خطوة',
        itemFields: [
          { key: 'title', label: 'عنوان الخطوة', type: 'text' },
          { key: 'description', label: 'الوصف', type: 'textarea' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  pricing: {
    type: 'pricing',
    label: 'التسعير',
    category: 'marketing',
    description: 'خطط الأسعار مع المميزات وزر اشتراك',
    icon: 'credit-card',
    defaults: () => ({
      title: 'خطط تناسب الجميع',
      subtitle: 'ابدأ مجاناً وارتقِ عندما ينمو مشروعك',
      currency: 'دج',
      plans: [
        {
          name: 'المجانية',
          price: 0,
          period: 'شهرياً',
          features: 'مشروع واحد\n5 صفحات\nدعم عبر البريد\nشعار المنصة',
          highlighted: false,
          buttonText: 'ابدأ مجاناً',
        },
        {
          name: 'الأساسية',
          price: 2900,
          period: 'شهرياً',
          features: '3 مشاريع\n15 صفحة\nنطاق مخصص\nدعم بأولوية\nبدون شعار المنصة',
          highlighted: true,
          buttonText: 'اشترك الآن',
        },
        {
          name: 'الاحترافية',
          price: 4900,
          period: 'شهرياً',
          features: 'مشاريع غير محدودة\nصفحات غير محدودة\nتحليلات متقدمة\nدعم 24/7\nمدير حساب مخصص',
          highlighted: false,
          buttonText: 'اشترك الآن',
        },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      {
        key: 'plans',
        label: 'الخطط',
        type: 'list',
        itemLabel: 'خطة',
        itemFields: [
          { key: 'name', label: 'اسم الخطة', type: 'text' },
          { key: 'price', label: 'السعر (دج)', type: 'number' },
          { key: 'period', label: 'الفترة', type: 'text' },
          { key: 'features', label: 'المميزات (سطر لكل ميزة)', type: 'textarea' },
          { key: 'highlighted', label: 'خطة مميّزة', type: 'switch' },
          { key: 'buttonText', label: 'نص الزر', type: 'text' },
        ],
      },
    ],
  },

  testimonials: {
    type: 'testimonials',
    label: 'آراء العملاء',
    category: 'marketing',
    description: 'شهادات عملاء مع تقييم بالنجوم',
    icon: 'message',
    defaults: () => ({
      title: 'ماذا يقول عملاؤنا؟',
      items: [
        { name: 'أحمد بن علي', role: 'مدير تقنية — شركة ناشئة', text: 'وفّرت علينا المنصة أسابيع من العمل. الواجهة بسيطة والنتائج احترافية.', rating: 5 },
        { name: 'سارة بوزيد', role: 'مؤسِّسة متجر إلكتروني', text: 'أول مرة أتعامل مع أداة عربية بهذا المستوى. تجربة ممتازة من البداية للنهاية.', rating: 5 },
        { name: 'ياسين مراد', role: 'صاحب وكالة تسويق', text: 'استعملها كل فريقي يومياً. الدعم سريع والميزات في تطور مستمر.', rating: 4 },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      {
        key: 'items',
        label: 'الآراء',
        type: 'list',
        itemLabel: 'رأي',
        itemFields: [
          { key: 'name', label: 'الاسم', type: 'text' },
          { key: 'role', label: 'الصفة', type: 'text' },
          { key: 'text', label: 'الرأي', type: 'textarea' },
          { key: 'rating', label: 'التقييم (1-5)', type: 'number' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  faq: {
    type: 'faq',
    label: 'الأسئلة الشائعة',
    category: 'marketing',
    description: 'قائمة أسئلة وأجوبة قابلة للفتح والإغلاق',
    icon: 'help-circle',
    defaults: () => ({
      title: 'الأسئلة الشائعة',
      subtitle: 'كل ما تحتاج معرفته قبل البدء',
      items: [
        { q: 'هل أحتاج خبرة تقنية للاستعمال؟', a: 'لا إطلاقاً. المنصة مصممة لغير التقنيين، كل شيء يتم بالنقر والتعديل المباشر.' },
        { q: 'هل يمكنني إلغاء اشتراكي في أي وقت؟', a: 'نعم، يمكنك الإلغاء متى شئت من صفحة الإعدادات بدون أي رسوم إضافية.' },
        { q: 'كيف يتم الدفع؟', a: 'نقبل بطاقات الذهبية والبطاقات البنكية الجزائرية، مع إمكانية الدفع عند الاستلام لبعض الخطط.' },
        { q: 'هل بياناتي آمنة؟', a: 'بياناتك مخزّنة بتشفير كامل مع نسخ احتياطي يومي، ولا نشاركها مع أي طرف ثالث.' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      {
        key: 'items',
        label: 'الأسئلة',
        type: 'list',
        itemLabel: 'سؤال',
        itemFields: [
          { key: 'q', label: 'السؤال', type: 'text' },
          { key: 'a', label: 'الجواب', type: 'textarea' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  cta: {
    type: 'cta',
    label: 'دعوة للإجراء',
    category: 'marketing',
    description: 'شريط جذاب يدفع الزائر لاتخاذ إجراء',
    icon: 'target',
    defaults: () => ({
      title: 'جاهز للانطلاق؟',
      subtitle: 'أنشئ حسابك المجاني اليوم وابدأ ببناء مشروعك خلال دقائق.',
      buttonText: 'إنشاء حساب مجاني',
      style: 'gradient',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'buttonText', label: 'نص الزر', type: 'text' },
      { key: 'style', label: 'النمط', type: 'select', options: CTA_STYLE_OPTIONS },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  'contact-form': {
    type: 'contact-form',
    label: 'نموذج التواصل',
    category: 'marketing',
    description: 'نموذج رسالة تواصل مع حالة نجاح',
    icon: 'mail',
    defaults: () => ({
      title: 'تواصل معنا',
      subtitle: 'يسعدنا سماع رأيك — نجيب عادة خلال 24 ساعة.',
      buttonText: 'إرسال الرسالة',
      successText: 'تم إرسال رسالتك بنجاح، سنعاود التواصل معك قريباً.',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'buttonText', label: 'نص زر الإرسال', type: 'text' },
      { key: 'successText', label: 'رسالة النجاح', type: 'textarea' },
    ],
  },

  gallery: {
    type: 'gallery',
    label: 'المعرض',
    category: 'marketing',
    description: 'شبكة عناصر مع صور رمزية وأسعار وشارات',
    icon: 'image',
    defaults: () => ({
      title: 'منتجاتنا المنتقاة',
      subtitle: 'جودة مضمونة وتوصيل لكل الولايات',
      variant: 'products',
      items: [
        { title: 'سماعة بلوتوث JBL', description: 'صوت نقي وبطارية تدوم 20 ساعة', price: 8900, badge: 'الأكثر مبيعاً' },
        { title: 'ساعة ذكية Amazfit', description: 'تتبع صحي كامل ومقاومة للماء', price: 24800, badge: 'جديد' },
        { title: 'حقيبة ظهر جلدية', description: 'جلد طبيعي بخياطة جزائرية', price: 6200, badge: '' },
        { title: 'مكينة قهوة Delonghi', description: 'إسبريسو منزلي بطعم المقاهي', price: 32500, badge: 'تخفيض' },
        { title: 'عطر رجالي Dior', description: 'عبوة 100 مل تدوم طويلاً', price: 15000, badge: '' },
        { title: 'لوحة مفاتيح ميكانيكية', description: 'أزرار حمراء هادئة للكتابة الطويلة', price: 11300, badge: '' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'variant', label: 'نوع المعرض', type: 'select', options: GALLERY_VARIANT_OPTIONS },
      {
        key: 'items',
        label: 'العناصر',
        type: 'list',
        itemLabel: 'عنصر',
        itemFields: [
          { key: 'image', label: 'صورة العنصر', type: 'image' },
          { key: 'title', label: 'العنوان', type: 'text' },
          { key: 'description', label: 'الوصف', type: 'textarea' },
          { key: 'price', label: 'السعر (دج)', type: 'number' },
          { key: 'badge', label: 'الشارة', type: 'text' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  banner: {
    type: 'banner',
    label: 'الشريط الإعلاني',
    category: 'marketing',
    description: 'شريط ضيق لإعلان عرض أو حدث',
    icon: 'megaphone',
    defaults: () => ({
      title: 'توصيل مجاني لكل الولايات',
      subtitle: 'للطلبات التي تتجاوز 5,000 دج — لفترة محدودة',
      buttonText: 'تسوّق الآن',
      style: 'gradient',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'buttonText', label: 'نص الزر', type: 'text' },
      { key: 'style', label: 'النمط', type: 'select', options: [{ value: 'gradient', label: 'تدرّج' }, { value: 'dark', label: 'داكن' }] },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  list: {
    type: 'list',
    label: 'قائمة عناصر',
    category: 'marketing',
    description: 'قائمة صفوف بعنوان ووصف ومعلومة جانبية',
    icon: 'list',
    defaults: () => ({
      title: 'آخر التحديثات',
      items: [
        { title: 'إطلاق لوحة التحكم الجديدة', subtitle: 'تصميم أسرع وتجربة استخدام أبسط', meta: 'هذا الأسبوع' },
        { title: 'دعم الدفع الإلكتروني', subtitle: 'بوابات دفع محلية جديدة متاحة الآن', meta: 'قبل أسبوعين' },
        { title: 'تطبيق الهاتف قريباً', subtitle: 'نسخة iOS و Android في الطريق', meta: 'قريباً' },
        { title: 'تحسين الأداء', subtitle: 'سرعة تحميل أعلى بنسبة 40%', meta: 'هذا الشهر' },
        { title: 'قوالب جديدة', subtitle: '10 قوالب جاهزة لمختلف القطاعات', meta: 'هذا الشهر' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      {
        key: 'items',
        label: 'العناصر',
        type: 'list',
        itemLabel: 'عنصر',
        itemFields: [
          { key: 'title', label: 'العنوان', type: 'text' },
          { key: 'subtitle', label: 'الوصف', type: 'textarea' },
          { key: 'meta', label: 'معلومة جانبية', type: 'text' },
        ],
      },
    ],
  },

  team: {
    type: 'team',
    label: 'الفريق',
    category: 'marketing',
    description: 'بطاقات أعضاء الفريق',
    icon: 'users',
    defaults: () => ({
      title: 'فريقنا',
      items: [
        { name: 'سارة بوزيد', role: 'مديرة التصميم' },
        { name: 'أحمد بن علي', role: 'مدير التقنية' },
        { name: 'ليلى مزيان', role: 'مسؤولة التسويق' },
        { name: 'عمر تواتي', role: 'مدير العمليات' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      {
        key: 'items',
        label: 'الأعضاء',
        type: 'list',
        itemLabel: 'عضو',
        itemFields: [
          { key: 'image', label: 'صورة العضو', type: 'image' },
          { key: 'name', label: 'الاسم', type: 'text' },
          { key: 'role', label: 'الدور', type: 'text' },
        ],
      },
      { key: 'bgImage', label: 'صورة الخلفية', type: 'image' },
      { key: 'bgOverlay', label: 'تعتيم فوق الصورة', type: 'select', options: HERO_OVERLAY_OPTIONS },
    ],
  },

  // ---------------- auth ----------------
  'auth-card': {
    type: 'auth-card',
    label: 'بطاقة الدخول',
    category: 'auth',
    description: 'نموذج تسجيل دخول أو إنشاء حساب أو استعادة كلمة المرور',
    icon: 'lock',
    defaults: () => ({
      variant: 'login',
      title: 'تسجيل الدخول',
      subtitle: 'أدخل بياناتك للوصول إلى حسابك',
      buttonText: 'دخول',
      demoHint: 'بيانات تجريبية — أدخل أي بريد',
    }),
    fields: [
      { key: 'variant', label: 'النوع', type: 'select', options: AUTH_VARIANT_OPTIONS },
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'buttonText', label: 'نص الزر', type: 'text' },
      { key: 'demoHint', label: 'تلميح تجريبي', type: 'text' },
    ],
  },

  // ---------------- dashboard ----------------
  'dashboard-header': {
    type: 'dashboard-header',
    label: 'ترويسة اللوحة',
    category: 'dashboard',
    description: 'عنوان الصفحة الداخلية مع أزرار إجراءات',
    icon: 'layout-dashboard',
    defaults: () => ({
      title: 'لوحة التحكم',
      subtitle: 'نظرة عامة على أداء مشروعك',
      actions: 'إضافة عنصر,تصدير التقرير',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      { key: 'actions', label: 'الأزرار (مفصولة بفواصل)', type: 'textarea' },
    ],
  },

  'stats-row': {
    type: 'stats-row',
    label: 'بطاقات الإحصائيات',
    category: 'dashboard',
    description: 'صف بطاقات أرقام مع أيقونات وتغيّر',
    icon: 'chart',
    defaults: () => ({
      items: [
        { label: 'الإيرادات الشهرية', value: '3,420,000 دج', change: '+12.5%', icon: 'trending-up' },
        { label: 'الطلبات', value: '1,248', change: '+8.2%', icon: 'shopping-cart' },
        { label: 'العملاء النشطون', value: '5,880', change: '+4.6%', icon: 'users' },
        { label: 'متوسط التقييم', value: '4.8 / 5', change: '+0.2', icon: 'star' },
      ],
    }),
    fields: [
      {
        key: 'items',
        label: 'البطاقات',
        type: 'list',
        itemLabel: 'بطاقة',
        itemFields: [
          { key: 'label', label: 'التسمية', type: 'text' },
          { key: 'value', label: 'القيمة', type: 'text' },
          { key: 'change', label: 'التغيّر', type: 'text' },
          { key: 'icon', label: 'الأيقونة', type: 'select', options: ICON_FIELD_OPTIONS },
        ],
      },
    ],
  },

  chart: {
    type: 'chart',
    label: 'رسم بياني',
    category: 'dashboard',
    description: 'رسم أعمدة أو خطي أو دائري من البيانات التجريبية',
    icon: 'chart',
    defaults: () => ({
      title: 'الإيرادات الشهرية',
      chartType: 'bar',
      dataKey: 'revenueMonthly',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'chartType', label: 'نوع الرسم', type: 'select', options: CHART_TYPE_OPTIONS },
      { key: 'dataKey', label: 'مصدر البيانات', type: 'select', options: CHART_KEY_OPTIONS },
    ],
  },

  'data-table': {
    type: 'data-table',
    label: 'جدول البيانات',
    category: 'dashboard',
    description: 'جدول حقيقي من البيانات التجريبية مع بحث وترقيم صفحات',
    icon: 'table',
    defaults: () => ({
      entity: 'customers',
      title: 'أحدث العملاء',
      pageSize: 5,
    }),
    fields: [
      { key: 'entity', label: 'مصدر البيانات', type: 'select', options: ENTITY_OPTIONS },
      { key: 'title', label: 'عنوان الجدول', type: 'text' },
      { key: 'pageSize', label: 'عدد الصفوف في الصفحة', type: 'number' },
    ],
  },

  'form-fields': {
    type: 'form-fields',
    label: 'نموذج حقول',
    category: 'dashboard',
    description: 'نموذج ديناميكي بحقول متعددة وحالة نجاح',
    icon: 'file-text',
    defaults: () => ({
      title: 'إضافة عنصر جديد',
      subtitle: 'املأ الحقول التالية ثم اضغط إرسال',
      fields: [
        { label: 'الاسم الكامل', type: 'text', required: true, placeholder: 'مثال: أحمد بن علي' },
        { label: 'البريد الإلكتروني', type: 'email', required: true, placeholder: 'name@gmail.com' },
        { label: 'المدينة', type: 'select', required: true, placeholder: '', options: ['الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'البليدة'] },
        { label: 'ملاحظات', type: 'textarea', required: false, placeholder: 'أي تفاصيل إضافية...' },
      ],
      submitText: 'إرسال',
      successText: 'تم إرسال بياناتك بنجاح. شكراً لك!',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'textarea' },
      {
        key: 'fields',
        label: 'الحقول',
        type: 'list',
        itemLabel: 'حقل',
        itemFields: [
          { key: 'label', label: 'تسمية الحقل', type: 'text' },
          { key: 'type', label: 'نوع الحقل', type: 'select', options: FIELD_TYPE_OPTIONS },
          { key: 'required', label: 'مطلوب', type: 'switch' },
          { key: 'placeholder', label: 'نص placeholder', type: 'text' },
        ],
      },
      { key: 'submitText', label: 'نص زر الإرسال', type: 'text' },
      { key: 'successText', label: 'رسالة النجاح', type: 'textarea' },
    ],
  },

  'settings-form': {
    type: 'settings-form',
    label: 'نموذج الإعدادات',
    category: 'dashboard',
    description: 'أقسام إعدادات مع حقول نصية ومفاتيح وقوائم',
    icon: 'settings',
    defaults: () => ({
      title: 'الإعدادات',
      sections: [
        {
          title: 'معلومات المشروع',
          fields: [
            { label: 'اسم المشروع', type: 'text', value: 'مشروعي', hint: 'سيظهر في القائمة الرئيسية' },
            { label: 'الوصف المختصر', type: 'text', value: 'منصة تجريبية جزائرية', hint: '' },
            { label: 'العملة', type: 'select', value: 'دج', hint: '', options: ['دج', '$', '€'] },
          ],
        },
        {
          title: 'الإشعارات',
          fields: [
            { label: 'إشعارات البريد', type: 'switch', value: 'true', hint: 'تلقِّ إشعاراً عند كل طلب جديد' },
            { label: 'إشعارات الهاتف', type: 'switch', value: 'false', hint: '' },
            { label: 'التقرير الأسبوعي', type: 'switch', value: 'true', hint: 'يُرسل كل صباح الاثنين' },
          ],
        },
        {
          title: 'الأمان',
          fields: [
            { label: 'كلمة المرور الحالية', type: 'password', value: '', hint: '6 أحرف على الأقل' },
            { label: 'المصادقة الثنائية', type: 'switch', value: 'false', hint: 'طبقة حماية إضافية لحسابك' },
          ],
        },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      {
        key: 'sections',
        label: 'الأقسام',
        type: 'list',
        itemLabel: 'قسم',
        itemFields: [
          { key: 'title', label: 'عنوان القسم', type: 'text' },
          {
            key: 'fields',
            label: 'حقول القسم',
            type: 'list',
            itemLabel: 'حقل',
            itemFields: [
              { key: 'label', label: 'تسمية الحقل', type: 'text' },
              { key: 'type', label: 'النوع', type: 'select', options: SETTING_FIELD_TYPE_OPTIONS },
              { key: 'value', label: 'القيمة', type: 'text' },
              { key: 'hint', label: 'التلميح', type: 'text' },
            ],
          },
        ],
      },
    ],
  },

  'profile-card': {
    type: 'profile-card',
    label: 'الملف الشخصي',
    category: 'dashboard',
    description: 'بطاقة مستخدم مع معلومات التواصل والنبذة',
    icon: 'user',
    defaults: () => ({
      name: 'أمينة حساني',
      role: 'مديرة الحساب',
      email: 'amina.hassani@gmail.com',
      phone: '+213 555 12 34 56',
      bio: 'مهتمة ببناء التجارب الرقمية العربية ومتابعة آخر مستجدات ريادة الأعمال في الجزائر.',
    }),
    fields: [
      { key: 'name', label: 'الاسم', type: 'text' },
      { key: 'role', label: 'الصفة', type: 'text' },
      { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
      { key: 'phone', label: 'الهاتف', type: 'text' },
      { key: 'bio', label: 'النبذة', type: 'textarea' },
    ],
  },

  calendar: {
    type: 'calendar',
    label: 'التقويم',
    category: 'dashboard',
    description: 'تقويم شهري مع أحداث على الأيام',
    icon: 'calendar',
    defaults: () => ({
      title: 'مواعيد ديسمبر',
      month: 'ديسمبر 2024',
      events: [
        { day: 3, label: 'اجتماع الفريق' },
        { day: 12, label: 'موعد عميل' },
        { day: 18, label: 'إطلاق ميزة جديدة' },
        { day: 25, label: 'مراجعة شهرية' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'month', label: 'الشهر (مثل: ديسمبر 2024)', type: 'text' },
      {
        key: 'events',
        label: 'الأحداث',
        type: 'list',
        itemLabel: 'حدث',
        itemFields: [
          { key: 'day', label: 'اليوم (رقم)', type: 'number' },
          { key: 'label', label: 'الوصف', type: 'text' },
        ],
      },
    ],
  },

  // ---------------- dashboard: كتل الجولة 8 ----------------
  'activity-feed': {
    type: 'activity-feed',
    label: 'سجل النشاطات',
    category: 'dashboard',
    description: 'خط زمني لآخر عمليات المستخدمين مع صور رمزية وأوقات',
    icon: 'bell',
    defaults: () => ({
      title: 'آخر النشاطات',
      items: [
        { user: 'أحمد بن علي', action: 'أضاف منتجاً جديداً', target: 'حقيبة جلدية فاخرة', time: 'قبل 5 دقائق' },
        { user: 'سارة بوزيد', action: 'أكملت طلباً', target: '#1024', time: 'قبل 18 دقيقة' },
        { user: 'محمد قادري', action: 'حدّث مخزون', target: 'فرع وهران', time: 'قبل ساعة' },
        { user: 'ياسين مراد', action: 'أرسل تقريراً', target: 'مبيعات الأسبوع', time: 'أمس' },
        { user: 'ليلى مزيان', action: 'ردّت على رسالة زبون', target: '', time: 'أمس' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      {
        key: 'items',
        label: 'النشاطات',
        type: 'list',
        itemLabel: 'نشاط',
        itemFields: [
          { key: 'user', label: 'المستخدم', type: 'text' },
          { key: 'action', label: 'الإجراء', type: 'text' },
          { key: 'target', label: 'الهدف', type: 'text' },
          { key: 'time', label: 'الوقت', type: 'text' },
        ],
      },
    ],
  },

  'tasks-list': {
    type: 'tasks-list',
    label: 'المهام',
    category: 'dashboard',
    description: 'قائمة مهام بمربعات اختيار عاملة وشريط تقدّم حي',
    icon: 'check',
    defaults: () => ({
      title: 'مهام اليوم',
      subtitle: '',
      items: [
        { label: 'مراجعة الطلب #1024', done: true, meta: 'اليوم 14:00' },
        { label: 'تحديث أسعار قائمة رمضان', done: true, meta: 'اليوم 16:30' },
        { label: 'الاتصال بالمورد في سطيف', done: false, meta: 'غداً 09:00' },
        { label: 'إعداد تقرير الأسبوع', done: false, meta: 'الخميس' },
        { label: 'موافقة طلبات الانضمام', done: false, meta: '' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'العنوان الفرعي', type: 'text' },
      {
        key: 'items',
        label: 'المهام',
        type: 'list',
        itemLabel: 'مهمة',
        itemFields: [
          { key: 'label', label: 'المهمة', type: 'text' },
          { key: 'done', label: 'منجزة', type: 'switch' },
          { key: 'meta', label: 'معلومة إضافية', type: 'text' },
        ],
      },
    ],
  },

  'quick-actions': {
    type: 'quick-actions',
    label: 'إجراءات سريعة',
    category: 'dashboard',
    description: 'أزرار تنقل سريعة إلى صفحات المشروع بأيقونات ملوّنة',
    icon: 'zap',
    defaults: () => ({
      title: 'إجراءات سريعة',
      actions: [
        { icon: 'package', label: 'إضافة منتج', pageId: '' },
        { icon: 'users', label: 'إدارة العملاء', pageId: '' },
        { icon: 'trending-up', label: 'تقرير الأداء', pageId: '' },
        { icon: 'file-text', label: 'الفواتير', pageId: '' },
      ],
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      {
        key: 'actions',
        label: 'الإجراءات',
        type: 'list',
        itemLabel: 'إجراء',
        itemFields: [
          { key: 'icon', label: 'الأيقونة', type: 'select', options: ICON_FIELD_OPTIONS },
          { key: 'label', label: 'التسمية', type: 'text' },
          { key: 'pageId', label: 'الصفحة الهدف', type: 'page' },
        ],
      },
    ],
  },

  // ---------------- states ----------------
  'empty-state': {
    type: 'empty-state',
    label: 'حالة فارغة',
    category: 'states',
    description: 'رسالة عدم وجود بيانات مع زر إجراء',
    icon: 'package',
    defaults: () => ({
      title: 'لا توجد بيانات بعد',
      subtitle: 'ستظهر العناصر هنا بمجرد إضافتها.',
      actionText: 'إضافة أول عنصر',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'الوصف', type: 'textarea' },
      { key: 'actionText', label: 'نص زر الإجراء', type: 'text' },
    ],
  },

  'loading-state': {
    type: 'loading-state',
    label: 'حالة التحميل',
    category: 'states',
    description: 'مؤشر تحميل مع هياكل جاهزة',
    icon: 'refresh',
    defaults: () => ({
      label: 'جارٍ تحميل البيانات...',
    }),
    fields: [{ key: 'label', label: 'النص', type: 'text' }],
  },

  'error-state': {
    type: 'error-state',
    label: 'حالة الخطأ',
    category: 'states',
    description: 'رسالة خطأ مع زر إعادة المحاولة',
    icon: 'alert',
    defaults: () => ({
      title: 'حدث خطأ ما',
      subtitle: 'تعذّر تحميل البيانات، حاول مرة أخرى.',
      actionText: 'إعادة المحاولة',
    }),
    fields: [
      { key: 'title', label: 'العنوان', type: 'text' },
      { key: 'subtitle', label: 'الوصف', type: 'textarea' },
      { key: 'actionText', label: 'نص زر الإجراء', type: 'text' },
    ],
  },

  // ---------------- custom ----------------
  'custom-html': {
    type: 'custom-html',
    label: 'HTML مخصص',
    category: 'marketing',
    description: 'كود HTML خاص تتحكم به بالكامل — يُعرض داخل إطار آمن',
    icon: 'code',
    defaults: () => ({
      name: 'قسم HTML مخصص',
      html: `<div style="max-width:640px;margin:0 auto;padding:40px 20px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#db2777);color:#fff;text-align:center;font-family:inherit">
  <h2 style="margin:0 0 12px;font-size:26px">قسم HTML من تصميمك</h2>
  <p style="margin:0;opacity:.9">استبدل هذا الكود بتصميمك الخاص — صفحات هبوط، بطاقات، أو لوحات تحكم.</p>
</div>`,
      height: 560,
    }),
    fields: [
      { key: 'name', label: 'اسم القسم', type: 'text' },
      { key: 'height', label: 'ارتفاع الإطار (بكسل)', type: 'number' },
      { key: 'html', label: 'كود HTML', type: 'code' },
    ],
  },
}

/** يُرجع تعريف مكوّن معروف أو undefined */
export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return BLOCK_REGISTRY[type]
}
