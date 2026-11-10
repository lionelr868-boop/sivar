// ============================================================
// SIVAR — Project Templates (14 قالباً كاملاً)
// Task 2-a — كل قالب يُنتج ProjectSchema كاملاً بمحتوى عربي
// خاص بالقطاع، هوية لونية مميزة، وصفحات جاهزة للمعاينة.
// العقد المثبّت: TEMPLATES / getTemplateMeta / buildTemplateSchema
// ============================================================
import {
  buildMockData,
  CHART_LABELS,
  ENTITY_LABELS,
} from '@/lib/content/mock-data'
import { ensureClientAreaPage } from '@/lib/project/client-area'
import type {
  AuthVariant,
  Block,
  BlockType,
  PageType,
  ProjectPage,
  ProjectSchema,
  ProjectTheme,
  ProjectType,
  ProjectStyle,
} from '@/lib/types'

// ---------- pinned contract ----------
export interface TemplateMeta {
  id: string
  category: ProjectType
  name: string
  tagline: string
  description: string
  icon: string
  pageCount: number
}

// ---------- internal spec types ----------
interface HeroSpec {
  title: string
  subtitle: string
  primaryButton: string
  secondaryButton: string
  layout: 'split' | 'centered'
  background: 'default' | 'muted' | 'dark' | 'gradient'
  align: 'start' | 'center'
}
interface BannerSpec {
  title: string
  subtitle: string
  buttonText: string
  style: 'gradient' | 'dark'
}
interface FeaturesSpec {
  title: string
  subtitle: string
  columns: number
  items: { icon: string; title: string; description: string }[]
}
interface StatsSpec {
  title: string
  items: { label: string; value: string; change?: string }[]
}
interface StepsSpec {
  title: string
  subtitle: string
  steps: { title: string; description: string }[]
}
interface GallerySpec {
  title: string
  subtitle: string
  variant: 'products' | 'services' | 'properties' | 'menu' | 'courses'
  items: { title: string; description: string; price: number; badge: string }[]
}
interface TestimonialsSpec {
  title: string
  items: { name: string; role: string; text: string; rating: number }[]
}
interface FaqSpec {
  title: string
  subtitle: string
  items: { q: string; a: string }[]
}
interface CtaSpec {
  title: string
  subtitle: string
  buttonText: string
  style: 'default' | 'gradient' | 'dark'
}
interface PricingSpec {
  title: string
  subtitle: string
  plans: {
    name: string
    price: number
    period: string
    features: string
    highlighted: boolean
    buttonText: string
  }[]
}
interface ProfileSpec {
  name: string
  role: string
  email: string
  phone: string
  bio: string
}
interface PageSpec {
  key: string
  name: string
  type: PageType
  entity?: string
  authVariant?: AuthVariant
}

interface TemplatePack {
  id: string
  category: ProjectType
  style: ProjectStyle
  icon: string
  name: string
  tagline: string
  description: string
  audience: string
  theme: ProjectTheme
  hero: HeroSpec
  banner: BannerSpec | null
  features: FeaturesSpec
  stats: StatsSpec
  steps: StepsSpec
  gallery: GallerySpec | null
  testimonials: TestimonialsSpec
  faq: FaqSpec
  cta: CtaSpec
  pricing: PricingSpec | null
  dashboard: { title: string; subtitle: string; statsPreset: string; entity: string }
  profile: ProfileSpec
  activity: { title: string; subtitle: string; meta: string }[]
  nav: {
    items: { label: string; key: string }[]
    cta: { label: string; key: string } | null
  }
  footerNote: string
  pages: PageSpec[]
}

// ---------- theme helper ----------
interface PaletteInput {
  primary: string
  secondary: string
  accent: string
  bg: string
  surface: string
  text: string
  muted: string
  border: string
  radius: number
  shadow: ProjectTheme['shadow']
  font: ProjectTheme['fontFamily']
  primaryForeground?: string
}

function lightTheme(p: PaletteInput): ProjectTheme {
  return {
    primary: p.primary,
    primaryForeground: p.primaryForeground ?? '#ffffff',
    secondary: p.secondary,
    accent: p.accent,
    background: p.bg,
    surface: p.surface,
    text: p.text,
    mutedText: p.muted,
    border: p.border,
    radius: p.radius,
    shadow: p.shadow,
    fontFamily: p.font,
    mode: 'light',
  }
}

const IBM = 'IBM Plex Sans Arabic' as const
const TAJAWAL = 'Tajawal' as const
const CAIRO = 'Cairo' as const

// تاريخ إنشاء ثابت (يحفظ تطابق SSR/CSR للمعاينات المصغّرة)
const TEMPLATE_CREATED_AT = '2024-01-15T09:00:00.000Z'

// أيقونات صفحات الجداول في قائمة لوحة التحكم
const ENTITY_PAGE_ICON: Record<string, string> = {
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

// ============================================================
// الـ 14 قالباً
// ============================================================
const PACKS: TemplatePack[] = [
  // ---------------- 1. saas-suite — تشغِيل ----------------
  {
    id: 'saas-suite',
    category: 'saas',
    style: 'modern',
    icon: 'layers',
    name: 'تشغِيل',
    tagline: 'منصة SaaS لإدارة الاشتراكات والفواتير',
    description:
      'تشغِيل منصة جزائرية تساعد الشركات الناشئة على إدارة اشتراكات عملائها، تحصيل المدفوعات تلقائياً، ومتابعة نمو إيراداتها الشهرية.',
    audience: 'المؤسسات الناشئة والشركات الصغيرة في الجزائر',
    theme: lightTheme({
      primary: '#7c3aed',
      secondary: '#f2eefd',
      accent: '#a78bfa',
      bg: '#faf9fc',
      surface: '#ffffff',
      text: '#201a2e',
      muted: '#6f687f',
      border: '#e9e5f2',
      radius: 12,
      shadow: 'md',
      font: IBM,
    }),
    hero: {
      title: 'أدر اشتراكاتك وفواتيرك في مكان واحد',
      subtitle:
        'تشغِيل يجمع الاشتراكات والمدفوعات والتحليلات في لوحة واحدة — وداعاً لجداول Excel المرهقة وعمليات التحصيل اليدوية.',
      primaryButton: 'ابدأ تجربة مجانية',
      secondaryButton: 'شاهد لوحة التحكم',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'كل ما تحتاجه لإدارة إيراداتك',
      subtitle: 'أدوات مصممة خصيصاً للسوق الجزائري',
      columns: 3,
      items: [
        { icon: 'wallet', title: 'إدارة الاشتراكات', description: 'خطط، تجديدات، وترقيات — كل شيء مؤتمت وواضح.' },
        { icon: 'file-text', title: 'فوترة تلقائية', description: 'فواتير تُنشأ وتُرسل بمفردها في موعدها.' },
        { icon: 'chart', title: 'تحليلات فورية', description: 'تابع MRR والتسرب والنمو لحظة بلحظة.' },
        { icon: 'credit-card', title: 'بوابات دفع محلية', description: 'الذهبية وCIB والدفع عند الاستلام.' },
        { icon: 'bell', title: 'تنبيهات ذكية', description: 'إشعار قبل انتهاء كل اشتراك أو فشل كل دفع.' },
        { icon: 'shield', title: 'أمان البيانات', description: 'تشفير كامل ونسخ احتياطي يومي لبياناتك.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'شركة تستخدم تشغِيل', value: '500+', change: '+18%' },
        { label: 'فاتورة شهرياً', value: '24,580', change: '+11%' },
        { label: 'معدل رضا العملاء', value: '98%', change: '+2%' },
        { label: 'الدعم الفني', value: '24/7', change: '' },
      ],
    },
    steps: {
      title: 'كيف تبدأ؟',
      subtitle: 'ثلاث خطوات تفصلك عن إدارة أذكى لإيراداتك',
      steps: [
        { title: 'أنشئ حسابك المجاني', description: 'سجّل خلال دقيقة ببريدك الإلكتروني فقط، بدون بطاقة بنكية.' },
        { title: 'أضف عملاءك وخططك', description: 'استورد عملاءك من CSV وحدّد خططك وأسعارك.' },
        { title: 'فعّل الفوترة التلقائية', description: 'ارتَح ودع تشغِيل تتولى التحصيل والتذكير.' },
      ],
    },
    gallery: null,
    testimonials: {
      title: 'ماذا يقول عملاؤنا؟',
      items: [
        { name: 'أحمد بن علي', role: 'مدير تقنية — شركة ناشئة', text: 'قلّصنا وقت إعداد الفواتير من 3 أيام إلى ساعتين فقط. التكامل مع بطاقات الذهبية كان نقطة التحول.', rating: 5 },
        { name: 'سارة بوزيد', role: 'مؤسِّسة منصة تعليمية', text: 'أول مرة أرى إيراداتي الشهرية واضحة أمامي بهذا الشكل. التقارير الجاهزة تغني عن المحاسب في البدايات.', rating: 5 },
        { name: 'كريم بلقاسم', role: 'مدير مالي — شركة توزيع', text: 'معدل التسرب انخفض للنصف بعد تفعيل التنبيهات التلقائية. اجتماعاتنا الشهرية صارت أقصر وأوضح.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'كل ما تحتاج معرفته قبل البدء',
      items: [
        { q: 'هل أحتاج بطاقة بنكية للتجربة؟', a: 'لا، التجربة مجانية لمدة 14 يوماً بدون أي بطاقة بنكية.' },
        { q: 'هل يدعم تشغِيل الدفع الجزائري؟', a: 'نعم: بطاقة الذهبية، بطاقات CIB، بالإضافة إلى الدفع عند الاستلام لبعض الخطط.' },
        { q: 'هل يمكنني ترحيل بياناتي الحالية؟', a: 'استورد عملاءك واشتراكاتك من ملف CSV بنقرة واحدة، وفريقنا يساعدك مجاناً.' },
        { q: 'ماذا يحدث بعد انتهاء التجربة؟', a: 'تبقى بياناتك محفوظة بالكامل ويمكنك الترقية متى شئت أو تصدير كل شيء.' },
      ],
    },
    cta: {
      title: 'جاهز لتبسيط إدارة اشتراكاتك؟',
      subtitle: 'انضم إلى أكثر من 500 شركة جزائرية تستخدم تشغِيل يومياً.',
      buttonText: 'ابدأ مجاناً الآن',
      style: 'gradient',
    },
    pricing: {
      title: 'خطط تناسب كل مرحلة',
      subtitle: 'ابدأ مجاناً وارتقِ مع نمو مشروعك',
      plans: [
        { name: 'المجانية', price: 0, period: 'شهرياً', features: 'مشروع واحد\n50 اشتراكاً\nفواتير يدوية\nدعم عبر البريد', highlighted: false, buttonText: 'ابدأ مجاناً' },
        { name: 'الأساسية', price: 2900, period: 'شهرياً', features: '3 مشاريع\nاشتراكات غير محدودة\nفوترة تلقائية\nتنبيهات البريد', highlighted: false, buttonText: 'اشترك الآن' },
        { name: 'الاحترافية', price: 4900, period: 'شهرياً', features: 'كل مميزات الأساسية\nبوابات دفع محلية\nتقارير متقدمة\nدعم 24/7', highlighted: true, buttonText: 'اشترك الآن' },
        { name: 'المؤسسات', price: 12900, period: 'شهرياً', features: 'مدير حساب مخصص\nاتفاقية مستوى خدمة\nتكامل API\nتدريب الفريق', highlighted: false, buttonText: 'تواصل معنا' },
      ],
    },
    dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة شاملة على أداء اشتراكاتك', statsPreset: 'saas', entity: 'subscriptions' },
    profile: {
      name: 'أمينة حساني',
      role: 'مديرة الحساب',
      email: 'amina.hassani@gmail.com',
      phone: '+213 555 12 34 56',
      bio: 'أتابع نجاح عملاء المنصة وأساعد الشركات الجزائرية على النمو باشتراكات منظمة.',
    },
    activity: [
      { title: 'تم تجديد اشتراك الخطة الاحترافية', subtitle: 'شركة الأمل للتجهيزات — الجزائر', meta: 'هذا الأسبوع' },
      { title: 'فاتورة INV-2024-002 تم دفعها', subtitle: 'قيمة 96,400 دج عبر الذهبية', meta: 'أمس' },
      { title: 'عميل جديد انضم للخطة الأساسية', subtitle: 'وكالة صوت الشباب — قسنطينة', meta: 'قبل يومين' },
      { title: 'تقرير الإيرادات الشهري جاهز', subtitle: 'نمو 12.5% عن الشهر الفائت', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الأسعار', key: 'pricing' },
        { label: 'لوحة التحكم', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'ابدأ مجاناً', key: 'signup' },
    },
    footerNote: 'تشغِيل — منصة جزائرية لإدارة الاشتراكات والفواتير.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'dashboard', name: 'لوحة التحكم', type: 'dashboard' },
      { key: 'customers', name: 'العملاء', type: 'table', entity: 'customers' },
      { key: 'subscriptions', name: 'الاشتراكات', type: 'table', entity: 'subscriptions' },
      { key: 'invoices', name: 'الفواتير', type: 'table', entity: 'invoices' },
      { key: 'pricing', name: 'الأسعار', type: 'pricing' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 2. ai-studio — وحي ----------------
  {
    id: 'ai-studio',
    category: 'ai',
    style: 'tech',
    icon: 'sparkles',
    name: 'وحي',
    tagline: 'استوديو ذكاء اصطناعي لتوليد المحتوى والصور',
    description:
      'وحي استوديو جزائري للذكاء الاصطناعي يولّد النصوص والصور والأفكار الإبداعية بالعربية والفرنسية، مع محرر ذكي وقوالب جاهزة للحملات التسويقية.',
    audience: 'المسوّقون وصنّاع المحتوى والوكالات في الجزائر',
    theme: lightTheme({
      primary: '#a21caf',
      secondary: '#faf0fb',
      accent: '#d946ef',
      bg: '#fcf9fc',
      surface: '#ffffff',
      text: '#241a24',
      muted: '#736373',
      border: '#efe2ef',
      radius: 16,
      shadow: 'lg',
      font: TAJAWAL,
    }),
    hero: {
      title: 'أنشئ محتوى إبداعياً في دقائق، لا أيام',
      subtitle:
        'وحي يولّد النصوص والصور والأفكار بالذكاء الاصطناعي — بالعربية والفرنسية — مع محرر ذكي يتعلم أسلوب علامتك ويتقنه.',
      primaryButton: 'جرّب وحي مجاناً',
      secondaryButton: 'استعرض الأمثلة',
      layout: 'split',
      background: 'gradient',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'طاقة إبداعية بلا حدود',
      subtitle: 'أدوات ذكاء اصطناعي تفهم السوق الجزائري',
      columns: 3,
      items: [
        { icon: 'sparkles', title: 'توليد نصوص عربية', description: 'منشورات وإعلانات ورسائل تُكتب بأسلوبك تماماً.' },
        { icon: 'image', title: 'صور احترافية', description: 'صور إبداعية بجودة عالية لأي منتج أو حملة.' },
        { icon: 'zap', title: 'تحرير بالذكاء', description: 'أعد صياغة واختصر وحسّن أي نص بضغطة واحدة.' },
        { icon: 'layers', title: 'قوالب جاهزة', description: 'قوالب حملات صممها خبراء تسويق جزائريون.' },
        { icon: 'globe', title: 'عربي وفرنسي', description: 'محتوى أصلي باللغتين دون ترجمة حرفية.' },
        { icon: 'server', title: 'واجهة API للمطورين', description: 'ادمج وحي في منتجاتك بواجهة بسيطة.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'صورة ونص مولّد', value: '1,200,000+', change: '+32%' },
        { label: 'مستخدم مبدع', value: '8,600', change: '+19%' },
        { label: 'متوسط زمن التوليد', value: '8 ثوانٍ', change: '-40%' },
        { label: 'رضا المستخدمين', value: '96%', change: '+3%' },
      ],
    },
    steps: {
      title: 'من الفكرة إلى الإبداع',
      subtitle: 'ثلاث خطوات فقط',
      steps: [
        { title: 'اكتب وصف فكرتك', description: 'جملة واحدة تكفي — وحي يفهم الباقي.' },
        { title: 'اختر النمط المناسب', description: 'رسمياً، شبابياً، فاخراً... أنت تقرر.' },
        { title: 'حمّل نتيجتك وشاركها', description: 'بجودة عالية وبأبعاد كل المنصات.' },
      ],
    },
    gallery: null,
    testimonials: {
      title: 'مبدعون يثقون بوحي',
      items: [
        { name: 'ليلى مزيان', role: 'صانعة محتوى — وهران', text: 'الصور العربية المولّدة كانت نقطة قوة حقيقية — لم أحتج مصمماً لكل منشور بعد اليوم.', rating: 5 },
        { name: 'رشيد بوعلام', role: 'مدير وكالة إعلانات', text: 'قلّصنا تكاليف الإنتاج بنسبة 60% في أول شهر من اعتماد وحي.', rating: 5 },
        { name: 'نورة سعدي', role: 'مسؤولة تسويق — سطيف', text: 'القوالب الجاهزة توفر عليّ ساعتين يومياً على الأقل.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'كل ما يهمك عن التوليد الإبداعي',
      items: [
        { q: 'هل المحتوى المولّد ملكي؟', a: 'نعم، كل ما تولّده عبر حسابك ملكك كاملاً وتستعمله تجارياً بحرية.' },
        { q: 'كم نقطة أحتاج شهرياً؟', a: 'المستخدم المتوسط يستهلك 1,200 نقطة شهرياً — راقب نقاطك من لوحة التحكم.' },
        { q: 'هل يفهم الدارجة الجزائرية؟', a: 'نماذجنا مدرّبة على العربية الفصحى والدارجة المغاربية معاً.' },
        { q: 'هل يمكن إلغاء الاشتراك؟', a: 'في أي وقت ومن صفحة الإعدادات مباشرة، دون رسوم إضافية.' },
      ],
    },
    cta: {
      title: 'أطلق إبداعك اليوم',
      subtitle: 'انضم لآلاف المبدعين الجزائريين الذين ينتجون أسرع مع وحي.',
      buttonText: 'ابدأ بـ 500 نقطة مجاناً',
      style: 'gradient',
    },
    pricing: {
      title: 'خطط بقياس طموحك',
      subtitle: 'النقاط تُستعمل في توليد النصوص والصور معاً',
      plans: [
        { name: 'تجريبية', price: 0, period: 'مرة واحدة', features: '500 نقطة ترحيبية\nتوليد أساسي\nشعار وحي على المخرجات', highlighted: false, buttonText: 'ابدأ مجاناً' },
        { name: 'إبداعية', price: 3900, period: 'شهرياً', features: '5,000 نقطة شهرياً\nصور عالية الدقة\nبدون شعار\nدعم بالبريد', highlighted: false, buttonText: 'اشترك الآن' },
        { name: 'استوديو', price: 7900, period: 'شهرياً', features: '15,000 نقطة شهرياً\nتوليد دفعة واحدة\nمحرر متقدم\nدعم بأولوية', highlighted: true, buttonText: 'اشترك الآن' },
        { name: 'أعمال', price: 19900, period: 'شهرياً', features: 'نقاط غير محدودة\nواجهة API\nمدير حساب\nتدريب الفريق', highlighted: false, buttonText: 'تواصل معنا' },
      ],
    },
    dashboard: { title: 'مساحة العمل', subtitle: 'تابع نقاطك ومشاريعك المولّدة', statsPreset: 'saas', entity: 'clients' },
    profile: {
      name: 'ياسين مراد',
      role: 'مدير إبداعي',
      email: 'yacine.mourad@gmail.com',
      phone: '+213 661 45 78 90',
      bio: 'أقود فريقاً إبداعياً صغيراً وننتج مع وحي محتوى لعشرات العلامات الجزائرية شهرياً.',
    },
    activity: [
      { title: 'توليد 12 صورة لحملة رمضان', subtitle: 'بأسلوب فاخر — 480 نقطة', meta: 'اليوم' },
      { title: 'إعادة صياغة 30 إعلاناً قصيراً', subtitle: 'بالدارجة الجزائرية — 210 نقاط', meta: 'أمس' },
      { title: 'إنشاء مشروع "هوية مقهى"', subtitle: 'يشمل نصوص وصور القائمة', meta: 'هذا الأسبوع' },
      { title: 'تجديد نقاط الخطة', subtitle: 'تمت إضافة 15,000 نقطة', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الأسعار', key: 'pricing' },
        { label: 'لوحة التحكم', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'جرّب مجاناً', key: 'signup' },
    },
    footerNote: 'وحي — استوديو الإبداع بالذكاء الاصطناعي.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'مساحة العمل', type: 'dashboard' },
      { key: 'clients', name: 'الزبناء', type: 'table', entity: 'clients' },
      { key: 'tasks', name: 'المهام', type: 'table', entity: 'tasks' },
      { key: 'pricing', name: 'الأسعار', type: 'pricing' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 3. ecommerce-store — لِمّة ----------------
  {
    id: 'ecommerce-store',
    category: 'ecommerce',
    style: 'modern',
    icon: 'shopping-cart',
    name: 'لِمّة',
    tagline: 'متجر إلكتروني جزائري للمنتجات المنتقاة',
    description:
      'لِمّة متجر إلكتروني يجمع منتجات مختارة بعناية من تجار جزائريين، مع توصيل سريع لكل الولايات ودفع عند الاستلام.',
    audience: 'المتسوقون الجزائريون وعشاق المنتجات المحلية',
    theme: lightTheme({
      primary: '#e11d48',
      secondary: '#fff1f4',
      accent: '#fb7185',
      bg: '#fdfbfc',
      surface: '#ffffff',
      text: '#2b1620',
      muted: '#7c6370',
      border: '#f3e3e8',
      radius: 10,
      shadow: 'sm',
      font: CAIRO,
    }),
    hero: {
      title: 'منتجات جزائرية منتقاة، حتى باب دارك',
      subtitle:
        'من الحرف اليدوية إلى أحدث الإلكترونيات — توصيل لكل ولايات الوطن خلال 48 ساعة مع إمكانية الدفع عند الاستلام.',
      primaryButton: 'تسوّق الآن',
      secondaryButton: 'تعرّف على المتجر',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: {
      title: 'توصيل مجاني لكل الولايات',
      subtitle: 'لكل الطلبات فوق 5,000 دج — لفترة محدودة',
      buttonText: 'تسوّق الآن',
      style: 'gradient',
    },
    features: {
      title: 'لماذا يتسوق الجزائريون من لِمّة؟',
      subtitle: 'خدمة تليق بثقتك',
      columns: 3,
      items: [
        { icon: 'truck', title: 'توصيل خلال 48 ساعة', description: 'شبكة توصيل تغطي 58 ولاية.' },
        { icon: 'credit-card', title: 'الدفع عند الاستلام', description: 'افحص طلبك قبل أن تدفع.' },
        { icon: 'shield', title: 'منتجات أصلية', description: 'نتعامل مع موزعين معتمدين فقط.' },
        { icon: 'star', title: 'جودة مضمونة', description: 'تقييمات حقيقية من مشترين حقيقيين.' },
        { icon: 'package', title: 'إرجاع سهل', description: 'خلال 7 أيام بحالته الأصلية.' },
        { icon: 'phone', title: 'دعم محلي', description: 'فريق يجيبك بالعربية من 8ص إلى 8م.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'منتج متوفر', value: '2,400+', change: '+8%' },
        { label: 'طلب تم تسليمه', value: '18,500', change: '+15%' },
        { label: 'تقييم المتجر', value: '4.9 / 5', change: '+0.1' },
        { label: 'ولاية نصل إليها', value: '58', change: '' },
      ],
    },
    steps: {
      title: 'اطلب في 3 خطوات',
      subtitle: 'تجربة تسوق بسيطة ومريحة',
      steps: [
        { title: 'اختر منتجاتك', description: 'تصفح الأقسام وأضف ما يعجبك للسلة.' },
        { title: 'أكّد الطلب', description: 'ادفع عند الاستلام أو بالبطاقة الذهبية.' },
        { title: 'استلم عند باب دارك', description: 'خلال 48 ساعة كحد أقصى.' },
      ],
    },
    gallery: {
      title: 'منتجات مختارة لك',
      subtitle: 'الأكثر طلباً هذا الأسبوع',
      variant: 'products',
      items: [
        { title: 'سماعة بلوتوث JBL', description: 'صوت نقي وبطارية تدوم 20 ساعة', price: 8900, badge: 'الأكثر مبيعاً' },
        { title: 'ساعة ذكية Amazfit', description: 'تتبع صحي كامل ومقاومة للماء', price: 24800, badge: 'جديد' },
        { title: 'حقيبة ظهر جلدية', description: 'جلد طبيعي بخياطة جزائرية', price: 6200, badge: '' },
        { title: 'مكينة قهوة Delonghi', description: 'إسبريسو منزلي بطعم المقاهي', price: 32500, badge: 'تخفيض' },
        { title: 'عطر رجالي Dior', description: 'عبوة 100 مل تدوم طويلاً', price: 15000, badge: '' },
        { title: 'لوحة مفاتيح ميكانيكية', description: 'أزرار هادئة للكتابة الطويلة', price: 11300, badge: '' },
      ],
    },
    testimonials: {
      title: 'ماذا يقول متسوقونا؟',
      items: [
        { name: 'نورة سعدي', role: 'زبونة — الجزائر', text: 'طلبت هدية ووصلت في اليوم التالي — تغليف أنيق جداً وكأنها من متجر عالمي.', rating: 5 },
        { name: 'عمر تواتي', role: 'زبون — وهران', text: 'الدفع عند الاستلام أراحني كثيراً. جودة المنتج فاقت توقعاتي بصراحة.', rating: 5 },
        { name: 'أمينة حساني', role: 'زبونة — سطيف', text: 'خدمة العملاء ردّت عليّ في دقائق وأبدلوا لي المقاس بدون أي مشاكل.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'قبل إتمام طلبك',
      items: [
        { q: 'كم تستغرق مدة التوصيل؟', a: '48 ساعة للولايات الشمالية و72 ساعة للجنوب الكبير.' },
        { q: 'هل الدفع عند الاستلام متاح؟', a: 'نعم، في كل الولايات بدون أي رسوم إضافية.' },
        { q: 'هل يمكنني إرجاع المنتج؟', a: 'خلال 7 أيام من الاستلام بحالته الأصلية ومع تغليفه.' },
        { q: 'هل المنتجات أصلية؟', a: 'نتعامل مع موزعين معتمدين فقط ونرفض أي منتج مشكوك فيه.' },
      ],
    },
    cta: {
      title: 'اكتشف عالم لِمّة',
      subtitle: 'آلاف المنتجات المنتقاة بانتظارك — توصيل سريع ودفع مريح.',
      buttonText: 'ابدأ التسوق',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة التاجر', subtitle: 'تابع مبيعاتك وطلباتك ومخزونك', statsPreset: 'ecommerce', entity: 'orders' },
    profile: {
      name: 'أمينة حساني',
      role: 'مديرة المتجر',
      email: 'store@limma.dz',
      phone: '+213 770 00 11 22',
      bio: 'أنتقي كل منتج يُعرض في لِمّة بنفسي — هدفنا متجر يستحق ثقة كل عائلة جزائرية.',
    },
    activity: [
      { title: 'طلب جديد ORD-2406', subtitle: 'لوحة مفاتيح ميكانيكية — 11,300 دج', meta: 'قبل قليل' },
      { title: 'نفد مخزون لوحة المفاتيح', subtitle: 'إعادة الطلب مطلوبة من المورد', meta: 'اليوم' },
      { title: 'تقييم جديد 5 نجوم', subtitle: 'من الزبونة نورة سعدي على سماعة JBL', meta: 'أمس' },
      { title: 'تقرير مبيعات الأسبوع', subtitle: 'نمو 15% عن الأسبوع الفائت', meta: 'هذا الأسبوع' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'المنتجات', key: 'products' },
        { label: 'لوحة التاجر', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'إنشاء حساب', key: 'signup' },
    },
    footerNote: 'لِمّة — تسوق جزائري بذوق عالمي.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة التاجر', type: 'dashboard' },
      { key: 'products', name: 'المنتجات', type: 'table', entity: 'products' },
      { key: 'orders', name: 'الطلبات', type: 'table', entity: 'orders' },
      { key: 'customers', name: 'العملاء', type: 'table', entity: 'customers' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 4. marketplace-hub — مِهنة ----------------
  {
    id: 'marketplace-hub',
    category: 'marketplace',
    style: 'youthful',
    icon: 'store',
    name: 'مِهنة',
    tagline: 'سوق إلكتروني يربط الحرفيين بالزبناء',
    description:
      'مِهنة منصة جزائرية تجمع الحرفيين والمهنيين الموثوقين — من السباكة إلى تصوير الأعراس — مع تقييمات حقيقية ودفع آمن.',
    audience: 'الحرفيون والمهنيون والزبناء في كل المدن الجزائرية',
    theme: lightTheme({
      primary: '#ea580c',
      secondary: '#fff3ea',
      accent: '#fb923c',
      bg: '#fdfaf7',
      surface: '#ffffff',
      text: '#2b1a10',
      muted: '#7d6a5b',
      border: '#f2e6db',
      radius: 12,
      shadow: 'md',
      font: TAJAWAL,
    }),
    hero: {
      title: 'أفضل الحرفيين قربك، بثقة كاملة',
      subtitle:
        'اعثر على سبّاك، كهربائي، مصور أو مصمم ديكور في مدينتك — مع تقييمات حقيقية من جيرانك ودفع آمن عبر المنصة.',
      primaryButton: 'ابحث عن مهني',
      secondaryButton: 'سجّل كحرفي',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: {
      title: 'انضم كحرفي واحصل على أول 3 طلبات بدون عمولة',
      subtitle: 'عرض إطلاق لمدة شهرين',
      buttonText: 'سجّل الآن',
      style: 'gradient',
    },
    features: {
      title: 'ثقتك أولاً',
      subtitle: 'كل مهني يمر بعملية توثيق كاملة',
      columns: 3,
      items: [
        { icon: 'shield', title: 'حرفيون موثوقون', description: 'وثائق هوية ومقابلة قبل التسجيل.' },
        { icon: 'star', title: 'تقييمات حقيقية', description: 'من زبناء أنجزوا طلباتهم فعلاً.' },
        { icon: 'credit-card', title: 'دفع آمن', description: 'مبلغك محفوظ حتى تؤكد الإنجاز.' },
        { icon: 'map-pin', title: 'خدمات قربك', description: 'فلترة حسب الولاية والبلدية.' },
        { icon: 'clock', title: 'حجز فوري', description: 'حدّد الموعد المناسب لك في ثوانٍ.' },
        { icon: 'award', title: 'جودة مضمونة', description: 'ضمان إعادة العمل أو استرجاع المبلغ.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'حرفي مسجّل', value: '3,200+', change: '+22%' },
        { label: 'خدمة منجزة', value: '26,000', change: '+18%' },
        { label: 'متوسط التقييم', value: '4.8 / 5', change: '+0.2' },
        { label: 'مدينة مغطاة', value: '48', change: '' },
      ],
    },
    steps: {
      title: 'احجز خدمتك في 3 خطوات',
      subtitle: 'بدون وسطاء ولا مكالمات متكررة',
      steps: [
        { title: 'ابحث واختر', description: 'قارن التقييمات والأسعار واختر المهني.' },
        { title: 'احجز وادفع بأمان', description: 'مبلغك محفوظ لدى المنصة حتى الإنجاز.' },
        { title: 'قيّم الخدمة', description: 'رأيك يحمي الزبون القادم.' },
      ],
    },
    gallery: {
      title: 'خدمات مطلوبة هذا الأسبوع',
      subtitle: 'من حرفيين موثوقين في مدينتك',
      variant: 'services',
      items: [
        { title: 'تصوير أعراس', description: 'تغطية كاملة مع ألبم مطبوع', price: 25000, badge: 'الأكثر طلباً' },
        { title: 'تركيب كهرباء منزلي', description: 'توصيل وتوزيع حسب المعايير', price: 4500, badge: '' },
        { title: 'إصلاح تسريب مياه', description: 'تشخيص وإصلاح في نفس اليوم', price: 3800, badge: '' },
        { title: 'تصميم ديكور داخلي', description: 'مخطط 3D مع قائمة مواد', price: 45000, badge: 'جديد' },
        { title: 'دروس خصوصية منزلية', description: 'ابتدائي ومتوسط — كل المواد', price: 1200, badge: '' },
        { title: 'صيانة مكيفات هواء', description: 'تنظيف وشحن غاز مع ضمان', price: 2800, badge: '' },
      ],
    },
    testimonials: {
      title: 'زبناء وحرفيون سعداء',
      items: [
        { name: 'محمد قادري', role: 'زبون — الجزائر', text: 'وجدت سبّاكاً موثوقاً في 10 دقائق وجاء في نفس اليوم. تقييماته كانت صادقة فعلاً.', rating: 5 },
        { name: 'رشيد بوعلام', role: 'حرفي كهرباء — وهران', text: 'الطلبات توصلني مباشرة على هاتفي — انتهى زمن الانتظار أمام محل الحرفة.', rating: 5 },
        { name: 'ليلى مزيان', role: 'زبونة — قسنطينة', text: 'المصور الذي حجزته لعرسي كان أكثر من رائع، والدفع الآمن أراح عائلتي.', rating: 5 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن التسجيل والدفع والضمانات',
      items: [
        { q: 'كيف تتحققون من الحرفيين؟', a: 'وثائق هوية سارية، مقابلة هاتفية، ومراقبة أول 3 طلبات عن قرب.' },
        { q: 'ما نسبة العمولة؟', a: '12% فقط من الطلبات المنجزة — التسجيل والظهور مجاني تماماً.' },
        { q: 'ماذا لو لم يعجبني العمل؟', a: 'ضمان إعادة العمل أو استرجاع كامل المبلغ خلال 72 ساعة.' },
        { q: 'كيف أستلم أرباحي كحرفي؟', a: 'تحويل على حسابك البريدي أو البنكي (CCP) خلال 48 ساعة من تأكيد الإنجاز.' },
      ],
    },
    cta: {
      title: 'ابدأ رحلتك مع مِهنة',
      subtitle: 'سواء كنت زبوناً يبحث عن خدمة أو حرفياً يبحث عن عمل — مكانك معنا.',
      buttonText: 'انضم الآن مجاناً',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة الزبون', subtitle: 'خدماتك وحجوزاتك في مكان واحد', statsPreset: 'ecommerce', entity: 'services' },
    profile: {
      name: 'رشيد بوعلام',
      role: 'حرفي كهرباء — وهران',
      email: 'rachid.boualem@gmail.com',
      phone: '+213 555 88 99 00',
      bio: '10 سنوات خبرة في الكهرباء المنزلية — أخدم حي الشط والأحياء المجاورة بمواعيد دقيقة.',
    },
    activity: [
      { title: 'طلب جديد: صيانة مكيف', subtitle: 'حي الشط — وهران', meta: 'قبل ساعة' },
      { title: 'تقييم جديد 5 نجوم', subtitle: 'من الزبون محمد قادري', meta: 'اليوم' },
      { title: 'أرباح الأسبوع محوّلة', subtitle: '24,800 دج إلى حسابك البريدي', meta: 'أمس' },
      { title: 'وثائقك تم توثيقها', subtitle: 'أصبحت من الحرفيين الموثوقين', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الخدمات', key: 'services' },
        { label: 'لوحة الزبون', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'سجّل كحرفي', key: 'signup' },
    },
    footerNote: 'مِهنة — حيث يلتقي الحرفي بالزبون.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة الزبون', type: 'dashboard' },
      { key: 'services', name: 'الخدمات', type: 'table', entity: 'services' },
      { key: 'orders', name: 'الطلبات', type: 'table', entity: 'orders' },
      { key: 'clients', name: 'الزبناء', type: 'table', entity: 'clients' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 5. edu-platform — دروب ----------------
  {
    id: 'edu-platform',
    category: 'education',
    style: 'modern',
    icon: 'graduation-cap',
    name: 'دروب',
    tagline: 'منصة تعلم إلكتروني بالعربية للمهارات العملية',
    description:
      'دروب منصة تعليمية جزائرية تقدم دورات عملية بالعربية في البرمجة والتسويق والتصميم، مع شهادات معتمدة ومدرّبين جزائريين خبراء.',
    audience: 'الطلاب والمهنيون الشباب في الجزائر والوطن العربي',
    theme: lightTheme({
      primary: '#16a34a',
      secondary: '#effaf3',
      accent: '#4ade80',
      bg: '#fafcf9',
      surface: '#ffffff',
      text: '#14251a',
      muted: '#5f7267',
      border: '#e2eee6',
      radius: 12,
      shadow: 'sm',
      font: IBM,
    }),
    hero: {
      title: 'تعلّم مهارة جديدة، غيّر مسارك',
      subtitle:
        'دورات عملية بالعربية يقدمها خبراء جزائريون — تعلّم في وقتك وعلى ذوقك، واحصل على شهادة تعزز سيرتك الذاتية.',
      primaryButton: 'ابدأ التعلم مجاناً',
      secondaryButton: 'استعرض الدورات',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'تعلّم يناسب جدولك',
      subtitle: 'محتوى عملي بلا حشو',
      columns: 3,
      items: [
        { icon: 'graduation-cap', title: 'مدرّبون خبراء', description: 'كل مدرّب يمارس ما يعلّمه يومياً.' },
        { icon: 'clock', title: 'تعلّم في وقتك', description: 'دروس قصيرة تشاهدها متى شئت.' },
        { icon: 'award', title: 'شهادات معتمدة', description: 'شهادة قابلة للتحقق برقم تسجيل.' },
        { icon: 'file-text', title: 'مشاريع عملية', description: 'تخرج بمشاريع حقيقية في ملفك.' },
        { icon: 'users', title: 'مجتمع متعلمين', description: '42 ألف متعلم يتبادلون الخبرات.' },
        { icon: 'globe', title: 'تعلم من أي مكان', description: 'من الهاتف أو الحاسوب، أونلاين.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'طالب متعلم', value: '42,000+', change: '+25%' },
        { label: 'دورة متاحة', value: '180', change: '+14' },
        { label: 'دقائق مشاهدة شهرياً', value: '1.2 مليون', change: '+19%' },
        { label: 'نسبة الرضا', value: '97%', change: '+2%' },
      ],
    },
    steps: {
      title: 'مسار التعلم',
      subtitle: 'من التسجيل إلى الشهادة',
      steps: [
        { title: 'اختر دورتك', description: 'تصفح المسارات واختر ما يناسب هدفك.' },
        { title: 'تعلّم بمشاريع', description: 'كل درس ينتهي بتمرين عملي حقيقي.' },
        { title: 'احصل على شهادتك', description: 'بعد اجتياز المشروع النهائي.' },
      ],
    },
    gallery: {
      title: 'دورات رائجة هذا الشهر',
      subtitle: 'الأكثر تسجيلاً من المتعلمين',
      variant: 'courses',
      items: [
        { title: 'أساسيات تطوير الويب', description: 'HTML وCSS وJavaScript من الصفر', price: 9900, badge: 'الأكثر شعبية' },
        { title: 'التسويق الرقمي للمشاريع', description: 'من الحساب الأول إلى أول حملة ناجحة', price: 12900, badge: '' },
        { title: 'تصميم UI/UX الاحترافي', description: 'Figma من البداية إلى الاحتراف', price: 14900, badge: 'جديد' },
        { title: 'الذكاء الاصطناعي للمبتدئين', description: 'استعمل أدوات AI في عملك اليومي', price: 15900, badge: '' },
        { title: 'إدارة المشاريع الصغيرة', description: 'نظّم فريقك وميزانيتك بذكاء', price: 8900, badge: '' },
        { title: 'المحاسبة لأصحاب المشاريع', description: 'دفاتر وضرائب بدون خوف', price: 7900, badge: 'تخفيض' },
      ],
    },
    testimonials: {
      title: 'قصص نجاح متعلمينا',
      items: [
        { name: 'عمر تواتي', role: 'طالب — البليدة', text: 'انتقلت من صفر في البرمجة إلى أول عميل عمل حر خلال 6 أشهر فقط.', rating: 5 },
        { name: 'سارة بوزيد', role: 'مصممة — الجزائر', text: 'دورة UI/UX كانت عملية أكثر مما توقعت — مشروع التخرج صار أول عمل في ملفي.', rating: 5 },
        { name: 'كريم بلقاسم', role: 'موظف — قسنطينة', text: 'دورة التسويق الرقمي فتحت لي باب دخل إضافي أضاعف راتبي.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن الدورات والشهادات والدفع',
      items: [
        { q: 'هل الشهادات معتمدة؟', a: 'شهادات دروب معتمدة وقابلة للتحقق برقم تسجيل فريد يظهر في سيرتك الذاتية.' },
        { q: 'هل الدروس مباشرة أم مسجلة؟', a: 'مسجلة تشاهدها في وقتك، مع جلسات مباشرة أسبوعية للأسئلة.' },
        { q: 'هل يوجد دفع بالتقسيط؟', a: 'نعم، كل دورة فوق 10,000 دج يمكن دفعها على 3 أقساط بدون فوائد.' },
        { q: 'هل المحتوى يبقى معي؟', a: 'وصول مدى الحياة لكل دورة تشتريها، بما فيها التحديثات المستقبلية.' },
      ],
    },
    cta: {
      title: 'مستقبلك يبدأ بدورة واحدة',
      subtitle: 'انضم لأكثر من 42 ألف متعلم جزائري وعربي.',
      buttonText: 'تصفح الدورات',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'مساحة الطالب', subtitle: 'تابع دوراتك وتقدمك وشهاداتك', statsPreset: 'education', entity: 'courses' },
    profile: {
      name: 'عمر تواتي',
      role: 'طالب — مسار تطوير الويب',
      email: 'omar.touati@gmail.com',
      phone: '+213 550 12 34 56',
      bio: 'أتعلم البرمجة بعد الدوام — هدفي أول مشروع عمل حر قبل نهاية السنة.',
    },
    activity: [
      { title: 'أكملت درس JavaScript رقم 12', description: 'مسار أساسيات تطوير الويب', meta: 'اليوم' },
      { title: 'اجتزت المشروع النهائي لدورة CSS', description: 'بتقييم 9.2 / 10', meta: 'هذا الأسبوع' },
      { title: 'انضممت لمجموعة دراسة', description: 'مجموعة تطوير الويب — 38 عضواً', meta: 'قبل أسبوع' },
      { title: 'شهادة HTML جديدة', description: 'أضفها إلى ملفك الشخصي', meta: 'هذا الشهر' },
    ].map((a) => ({ title: a.title, subtitle: a.description, meta: a.meta })),
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الدورات', key: 'courses' },
        { label: 'مساحة الطالب', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'ابدأ مجاناً', key: 'signup' },
    },
    footerNote: 'دروب — منصة التعلم بالعربية.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'مساحة الطالب', type: 'dashboard' },
      { key: 'courses', name: 'الدورات', type: 'table', entity: 'courses' },
      { key: 'students', name: 'الطلاب', type: 'table', entity: 'students' },
      { key: 'invoices', name: 'الفواتير', type: 'table', entity: 'invoices' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 6. health-clinic — صحّتي ----------------
  {
    id: 'health-clinic',
    category: 'health',
    style: 'minimal',
    icon: 'stethoscope',
    name: 'صحّتي',
    tagline: 'عيادة متعددة الخدمات مع حجز مواعيد أونلاين',
    description:
      'صحّتي منصة عيادات طبية في الجزائر تتيح حجز المواعيد أونلاين، متابعة الملف الطبي، واستشارات عن بعد مع أطباء معتمدين.',
    audience: 'المرضى والعائلات الجزائرية الباحثة عن رعاية طبية موثوقة',
    theme: lightTheme({
      primary: '#0d9488',
      secondary: '#eefaf8',
      accent: '#2dd4bf',
      bg: '#f9fcfc',
      surface: '#ffffff',
      text: '#12262a',
      muted: '#5e7276',
      border: '#dcecec',
      radius: 14,
      shadow: 'sm',
      font: IBM,
    }),
    hero: {
      title: 'صحتك بين يدي أمينة',
      subtitle:
        'احجز موعدك مع أفضل الأطباء في الجزائر خلال دقيقة — بدون انتظار ولا طوابير، مع ملف طبي رقمي يرافقك في كل زيارة.',
      primaryButton: 'احجز موعدك الآن',
      secondaryButton: 'تعرّف على العيادة',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'رعاية شاملة لعائلتك',
      subtitle: 'من الاستشارة العامة إلى التخصصات الدقيقة',
      columns: 3,
      items: [
        { icon: 'calendar', title: 'حجز فوري', description: 'موعدك مؤكد خلال دقيقة من هاتفك.' },
        { icon: 'stethoscope', title: 'أطباء معتمدون', description: 'نخبة من أطباء الجزائر في كل التخصصات.' },
        { icon: 'file-text', title: 'ملف طبي رقمي', description: 'تاريخك الطبي كله في مكان آمن.' },
        { icon: 'bell', title: 'تذكير بالمواعيد', description: 'رسالة قبل موعدك حتى لا تنساه.' },
        { icon: 'smartphone', title: 'استشارة عن بعد', description: 'تحدث مع طبيبك من بيتك عند الحاجة.' },
        { icon: 'heart', title: 'رعاية عائلية', description: 'ملف لكل فرد من عائلتك تحت حساب واحد.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'طبيب معتمد', value: '120+', change: '+12' },
        { label: 'موعد محجوز شهرياً', value: '8,400', change: '+9%' },
        { label: 'استشارة عن بعد', value: '3,200', change: '+31%' },
        { label: 'رضا المرضى', value: '4.9 / 5', change: '+0.1' },
      ],
    },
    steps: {
      title: 'احجز في 3 خطوات',
      subtitle: 'بدون مكالمات ولا انتظار',
      steps: [
        { title: 'اختر التخصص والطبيب', description: 'تصفح التخصصات ومواعيد كل طبيب.' },
        { title: 'حدّد الوقت المناسب', description: 'الأوقات المتاحة تظهر مباشرة أمامك.' },
        { title: 'استلم تذكيراً', description: 'رسالة نصية قبل موعدك بساعتين.' },
      ],
    },
    gallery: {
      title: 'خدماتنا الطبية',
      subtitle: 'أسعار واضحة بدون مفاجآت',
      variant: 'services',
      items: [
        { title: 'استشارة عامة', description: 'فحص شامل وتوجيه للحالة', price: 2500, badge: '' },
        { title: 'فحص شامل', description: 'تحاليل شاملة مع تقرير مفصل', price: 8500, badge: 'جديد' },
        { title: 'استشارة قلبية', description: 'مع تخطيط القلب عند الحاجة', price: 3500, badge: '' },
        { title: 'متابعة الحمل', description: 'برنامج متابعة كامل حتى الولادة', price: 12000, badge: 'الأكثر طلباً' },
        { title: 'تحاليل مخبرية', description: 'نتائج في نفس اليوم لمعظم التحاليل', price: 5000, badge: '' },
        { title: 'استشارة جلدية', description: 'تشخيص وعلاج أمراض الجلد', price: 3000, badge: '' },
      ],
    },
    testimonials: {
      title: 'مرضى يثقون بصحّتي',
      items: [
        { name: 'ليلى مزيان', role: 'مريضة — الجزائر', text: 'أول مرة أحجز موعداً طبياً بدون سهر في الطابور منذ الفجر.', rating: 5 },
        { name: 'أحمد بن علي', role: 'أب لثلاثة أطفال — البليدة', text: 'الملف الرقمي يوفر عليّ تكرار التحاليل — كل نتائج أبنائي في هاتفي.', rating: 5 },
        { name: 'نورة سعدي', role: 'مريضة — وهران', text: 'الاستشارة عن بعد أنقذت وقتي في أسبوع ضاغط، والوصفة وصلت للصيدلية مباشرة.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن الحجز والأسعار والتأمين',
      items: [
        { q: 'هل الحجز مؤكد فوراً؟', a: 'نعم، يصلك تأكيد فوري برسالة نصية مع رقم الموعد.' },
        { q: 'هل تقبلون الضمان الاجتماعي؟', a: 'نعم، البطاقة الذهبية مقبولة في معظم التخصصات — اسأل عند الحجز.' },
        { q: 'كيف ألغي موعداً؟', a: 'من التطبيق أو الموقع حتى 4 ساعات قبل الموعد بدون أي رسوم.' },
        { q: 'هل الاستشارة عن بعد متاحة؟', a: 'نعم لمعظم التخصصات غير الطارئة، وبنفس أسعار العيادة تقريباً.' },
      ],
    },
    cta: {
      title: 'صحتك لا تنتظر',
      subtitle: 'احجز موعدك خلال دقيقة واحدة — من هاتفك مباشرة.',
      buttonText: 'احجز الآن',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة الطبيب', subtitle: 'مواعيدك ومرضاك في مكان واحد', statsPreset: 'booking', entity: 'appointments' },
    profile: {
      name: 'د. سارة بوزيد',
      role: 'طبيبة أطفال',
      email: 'dr.sara@sehhti.dz',
      phone: '+213 661 23 45 67',
      bio: 'استشارية طب الأطفال — 12 سنة خبرة في مستشفيات الجزائر العاصمة، وأخصائية في متابعة نمو الأطفال.',
    },
    activity: [
      { title: 'موعد جديد APT-3303', subtitle: 'مريض جديد — استشارة عامة', meta: 'قبل قليل' },
      { title: 'اكتمل فحص شامل', subtitle: 'تقرير النتائج جاهز للمريض', meta: 'اليوم' },
      { title: '4 مواعيد لغد', subtitle: 'أول موعد 09:30 صباحاً', meta: 'غداً' },
      { title: 'ملف طبي محدّث', subtitle: 'إضافة تحاليل جديدة لمريض متابع', meta: 'أمس' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'المواعيد', key: 'appointments' },
        { label: 'لوحة الطبيب', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'احجز موعدك', key: 'signup' },
    },
    footerNote: 'صحّتي — عيادات الجزائر بين يديك.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة الطبيب', type: 'dashboard' },
      { key: 'appointments', name: 'المواعيد', type: 'table', entity: 'appointments' },
      { key: 'doctors', name: 'الأطباء', type: 'table', entity: 'teamMembers' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 7. real-estate — دارنا ----------------
  {
    id: 'real-estate',
    category: 'realestate',
    style: 'luxury',
    icon: 'building',
    name: 'دارنا',
    tagline: 'منصة عقارية جزائرية لبيع وكراء العقارات',
    description:
      'دارنا منصة عقارية تعرض فيلات وشققا وأراضي في أرقى أحياء الجزائر، مع صور عالية الدقة وزيارات مبرمجة ووسطاء معتمدين.',
    audience: 'العائلات والمستثمرون الباحثون عن عقارات في الجزائر',
    theme: lightTheme({
      primary: '#92400e',
      secondary: '#faf3e8',
      accent: '#d97706',
      bg: '#fcfaf6',
      surface: '#ffffff',
      text: '#2a2016',
      muted: '#776a58',
      border: '#eee5d8',
      radius: 8,
      shadow: 'md',
      font: TAJAWAL,
    }),
    hero: {
      title: 'اعثر على منزل أحلامك في الجزائر',
      subtitle:
        'تصفح مئات العقارات المنتقاة في حيدرة، باب الزوار، حي الشط وأرقى الأحياء — مع زيارة مبرمجة خلال 48 ساعة ومرافقة قانونية كاملة.',
      primaryButton: 'تصفح العقارات',
      secondaryButton: 'كيف نعمل',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'تجربة عقارية راقية',
      subtitle: 'من أول تصفح حتى توقيع العقد',
      columns: 3,
      items: [
        { icon: 'building', title: 'عقارات منتقاة', description: 'كل عقار يخضع لمعايير اختيار صارمة.' },
        { icon: 'image', title: 'صور عالية الدقة', description: 'جولات مصورة تُغنيك عن زيارات كثيرة.' },
        { icon: 'calendar', title: 'زيارات مبرمجة', description: 'حدّد زيارتك خلال 48 ساعة من الطلب.' },
        { icon: 'shield', title: 'وسطاء معتمدون', description: 'وسطاء محترفون بترخيص وسمعة موثقة.' },
        { icon: 'map-pin', title: 'أرقى الأحياء', description: 'حيدرة، باب الزوار، حي الشط وأكثر.' },
        { icon: 'check', title: 'صحة قانونية', description: 'فريق قانوني يراجع وثائق كل عقار.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'عقار متاح', value: '1,450', change: '+8%' },
        { label: 'زيارة مبرمجة شهرياً', value: '920', change: '+12%' },
        { label: 'عملية نجحت', value: '3,800', change: '+15%' },
        { label: 'حي مغطى', value: '60+', change: '' },
      ],
    },
    steps: {
      title: 'طريقك إلى دارك',
      subtitle: 'مرافقة كاملة حتى التوقيع',
      steps: [
        { title: 'حدّد ميزانيتك وذوقك', description: 'حدد المعايير ونقترح عليك الأنسب.' },
        { title: 'زر العقارات', description: 'زيارات مبرمجة مع وسيط معتمد.' },
        { title: 'أكمل بثقة', description: 'مرافقة قانونية حتى توقيع العقد.' },
      ],
    },
    gallery: {
      title: 'عقارات مميزة',
      subtitle: 'مختارات هذا الأسبوع',
      variant: 'properties',
      items: [
        { title: 'فيلا فاخرة بحيدرة', description: '420 م² — حديقة ومسبح', price: 95000000, badge: 'حيدرة' },
        { title: 'شقة حديثة بباب الزوار', description: '120 م² — طابق 4 مع مصعد', price: 24800000, badge: '' },
        { title: 'شقة بإطلالة بحي الشط', description: '95 م² — إطلالة بحرية', price: 15600000, badge: 'وهران' },
        { title: 'دوبلكس بقسنطينة', description: '180 م² — شرفة واسعة', price: 31500000, badge: '' },
        { title: 'أرض بضواحي سطيف', description: '250 م² — قابلة للبناء', price: 2500000, badge: 'فرصة' },
        { title: 'محل تجاري بوهران', description: '60 م² — على الشارع الرئيسي', price: 12800000, badge: '' },
      ],
    },
    testimonials: {
      title: 'عملاء وجدوا دارهم معنا',
      items: [
        { name: 'أحمد بن علي', role: 'مشترٍ — الجزائر', text: 'الوسيط رافقني من الزيارة الأولى حتى توقيع العقد — احترافية نادرة في السوق العقاري.', rating: 5 },
        { name: 'أمينة حساني', role: 'مستثمرة — عنابة', text: 'قدموا لي 6 عروض مطابقة لمعاييري خلال أسبوع واحد فقط.', rating: 5 },
        { name: 'عمر تواتي', role: 'بائع — قسنطينة', text: 'بيعت شقتي بسعر أعلى مما توقعت خلال شهر، والوثائق كانت جاهزة منذ البداية.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن البيع والكراء والزيارات',
      items: [
        { q: 'هل الزيارات مجانية؟', a: 'نعم، مجانية بالكامل ومع مرافق معتمد من فريقنا.' },
        { q: 'كيف أتحقق من صحة الوثائق؟', a: 'فريق قانوني يراجع وثائق كل عقار قبل عرضه على المنصة.' },
        { q: 'هل تقدمون خدمة الكراء؟', a: 'كراء سنوي بعقود موثقة، مع تسيير كامل للملك إن رغبت.' },
        { q: 'هل يمكن التفاوض في السعر؟', a: 'نوصل عرضك للبائع خلال ساعات ونرافقك في التفاوض.' },
      ],
    },
    cta: {
      title: 'دارك الجديدة على بعد خطوة',
      subtitle: 'سجّل اهتمامك وسنقترح عليك العقارات الأنسب فور نزولها.',
      buttonText: 'ابدأ البحث',
      style: 'dark',
    },
    pricing: null,
    dashboard: { title: 'لوحة الوسيط', subtitle: 'عقاراتك وزبائنك وزياراتك', statsPreset: 'agency', entity: 'properties' },
    profile: {
      name: 'رشيد بوعلام',
      role: 'وسيط عقاري معتمد',
      email: 'rachid@darna.dz',
      phone: '+213 770 55 66 77',
      bio: '15 سنة في الوساطة العقارية بالجزائر العاصمة — أركز على الفيلات والشقق الراقية في حيدرة ومحيطها.',
    },
    activity: [
      { title: 'زيارة مبرمجة لفيلا حيدرة', subtitle: 'غداً 10:00 مع زبون جاد', meta: 'غداً' },
      { title: 'عقار جديد أُضيف: دوبلكس قسنطينة', subtitle: 'بإشرافك المباشر', meta: 'اليوم' },
      { title: 'تلقّيت عرضاً بـ 24 مليون دج', subtitle: 'على شقة باب الزوار — بانتظار رد البائع', meta: 'أمس' },
      { title: 'اكتملت عملية بيع', subtitle: 'محل تجاري بوهران — عمولة محصّلة', meta: 'هذا الأسبوع' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'العقارات', key: 'properties' },
        { label: 'لوحة الوسيط', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'سجّل اهتمامك', key: 'signup' },
    },
    footerNote: 'دارنا — عنوان الثقة العقارية في الجزائر.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة الوسيط', type: 'dashboard' },
      { key: 'properties', name: 'العقارات', type: 'table', entity: 'properties' },
      { key: 'clients', name: 'الزبناء', type: 'table', entity: 'clients' },
      { key: 'visits', name: 'الزيارات', type: 'table', entity: 'appointments' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 8. booking-pro — حجزتي ----------------
  {
    id: 'booking-pro',
    category: 'booking',
    style: 'youthful',
    icon: 'calendar',
    name: 'حجزتي',
    tagline: 'منصة حجز مواعيد صالونات التجميل',
    description:
      'حجزتي تتيح للمراكز النسائية وصالونات التجميل في الجزائر إدارة مواعيدها أونلاين، مع تذكير تلقائي للعميلات وتقليل المواعيد الملغاة.',
    audience: 'صالونات التجميل والمراكز النسائية وعميلاتهن في الجزائر',
    theme: lightTheme({
      primary: '#db2777',
      secondary: '#fdf0f6',
      accent: '#f472b6',
      bg: '#fdfbfc',
      surface: '#ffffff',
      text: '#2b1522',
      muted: '#7c6370',
      border: '#f4e2ec',
      radius: 16,
      shadow: 'md',
      font: CAIRO,
    }),
    hero: {
      title: 'حجزك مضمون، وقتك محترم',
      subtitle:
        'احجز موعدك في أرقى صالونات التجميل بالجزائر — بدون مكالمات ولا انتظار، مع تذكير تلقائي قبل موعدك وعروض ولاء دائمة.',
      primaryButton: 'احجزي الآن',
      secondaryButton: 'تصفحي الصالونات',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'تجربة تجميل سلسة',
      subtitle: 'من الحجز حتى الإطلالة النهائية',
      columns: 3,
      items: [
        { icon: 'calendar', title: 'حجز في 30 ثانية', description: 'اختاري الخدمة والوقت وانتهى الأمر.' },
        { icon: 'bell', title: 'تذكير تلقائي', description: 'قبل موعدك بساعة حتى لا يفوتك.' },
        { icon: 'star', title: 'صالونات مقيّمة', description: 'تقييمات حقيقية من عميلات سابقات.' },
        { icon: 'credit-card', title: 'دفع مسبق آمن', description: 'رقم حجز بسيط يُخصم من الخدمة.' },
        { icon: 'clock', title: 'إدارة الوقت', description: 'مواعيد دقيقة بلا انتظار في الصالون.' },
        { icon: 'heart', title: 'عروض الولاء', description: 'نقاط مع كل حجز تتحول لتخفيضات.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'صالون شريك', value: '450+', change: '+16%' },
        { label: 'موعد محجوز', value: '62,000', change: '+21%' },
        { label: 'متوسط التقييم', value: '4.9 / 5', change: '+0.1' },
        { label: 'مواعيد ملغاة أقل', value: '-40%', change: '' },
      ],
    },
    steps: {
      title: 'كيف تحجزين؟',
      subtitle: 'ثلاث خطوات نحو إطلالتك',
      steps: [
        { title: 'اختاري الصالون والخدمة', description: 'تصفحي التقييمات والأسعار بهدوء.' },
        { title: 'حدّدي الوقت المناسب', description: 'الأوقات المتاحة تظهر مباشرة.' },
        { title: 'استلمي تذكيراً واستمتعي', description: 'يصلك تذكير قبل موعدك بساعة.' },
      ],
    },
    gallery: {
      title: 'خدمات صالوناتنا',
      subtitle: 'الأسعار واضحة قبل الحجز',
      variant: 'services',
      items: [
        { title: 'قص وتصفيف', description: 'على يد خبيرات تصفيف معتمدات', price: 1500, badge: 'الأكثر طلباً' },
        { title: 'صبغة شعر كاملة', description: 'أصباغ عالمية مع عناية بعد الصبغة', price: 6500, badge: '' },
        { title: 'مانيكير وباديكير', description: 'طلبات كريستال وميني رسومات', price: 2800, badge: 'جديد' },
        { title: 'مكياج عروس', description: 'إطلالة كاملة مع تجربة مسبقة', price: 15000, badge: '' },
        { title: 'حمام مغربي', description: 'تقليدي مع تقشير وماسك طين', price: 3500, badge: '' },
        { title: 'عناية بالبشرة', description: 'تنظيف عميق وترطيب بالليزر البارد', price: 4200, badge: 'تخفيض' },
      ],
    },
    testimonials: {
      title: 'عميلات سعيدات',
      items: [
        { name: 'سارة بوزيد', role: 'عميلة — الجزائر', text: 'أخيراً صالون بدون انتظار — أحجز وأصل في وقتي بالضبط.', rating: 5 },
        { name: 'أمينة حساني', role: 'صاحبة صالون — وهران', text: 'المواعيد الملغاة انخفضت للنصف بعد تفعيل التذكير التلقائي.', rating: 5 },
        { name: 'ليلى مزيان', role: 'عميلة — قسنطينة', text: 'عروض الولاء جعلتني عميلة دائمة — النقاط تُدفع فعلاً.', rating: 5 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن الحجز والدفع والتغيير',
      items: [
        { q: 'هل الحجز يتطلب دفعاً مسبقاً؟', a: 'رقم حجز بـ 500 دج فقط، ويُخصم من قيمة الخدمة عند الحضور.' },
        { q: 'هل يمكن تغيير الموعد؟', a: 'نعم مجاناً حتى 6 ساعات قبل الموعد من نفس التطبيق.' },
        { q: 'كيف أصبح صالوناً شريكاً؟', a: 'سجّلي بيانات صالونك وسيتصل بك فريقنا خلال 48 ساعة.' },
        { q: 'ماذا لو تأخرت عن موعدي؟', a: 'يُحفظ مكانك لمدة 15 دقيقة، ثم يُمنح للعميلة التالية.' },
      ],
    },
    cta: {
      title: 'جمالك يستحق موعداً مؤكداً',
      subtitle: 'انضمي لآلاف العميلات السعيدات في كل مدن الجزائر.',
      buttonText: 'احجزي موعدك',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة الصالون', subtitle: 'مواعيد اليوم والأسبوع في لمحة', statsPreset: 'booking', entity: 'bookings' },
    profile: {
      name: 'أمينة حساني',
      role: 'مديرة صالون — وهران',
      email: 'salon@hejati.dz',
      phone: '+213 555 44 33 22',
      bio: 'أدير صالوناً نسائياً في حي الشط — 6 خبيرات وأكثر من 40 عميلة يومياً عبر حجزتي.',
    },
    activity: [
      { title: 'حجز جديد BKG-1202', subtitle: 'صبغة شعر — 11:45', meta: 'قبل قليل' },
      { title: 'تأكيد حضور', subtitle: 'BKG-1206 عناية بالبشرة', meta: 'اليوم' },
      { title: 'إلغاء متأخر', subtitle: 'BKG-1205 حمام مغربي — الفترة متاحة مجدداً', meta: 'أمس' },
      { title: 'تقرير الأسبوع', subtitle: '62 حجزاً — نمو 9%', meta: 'هذا الأسبوع' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الخدمات', key: 'services' },
        { label: 'لوحة الصالون', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'احجزي الآن', key: 'signup' },
    },
    footerNote: 'حجزتي — موعدك أونلاين في ثوانٍ.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة الصالون', type: 'dashboard' },
      { key: 'bookings', name: 'الحجوزات', type: 'table', entity: 'bookings' },
      { key: 'customers', name: 'العميلات', type: 'table', entity: 'customers' },
      { key: 'services', name: 'الخدمات', type: 'table', entity: 'services' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 9. services-hub — وصل ----------------
  {
    id: 'services-hub',
    category: 'services',
    style: 'professional',
    icon: 'briefcase',
    name: 'وصل',
    tagline: 'منصة خدمات احترافية للشركات',
    description:
      'وصل تجمع خدمات احترافية للشركات الجزائرية — من المحاسبة إلى التسويق إلى تطوير البرمجيات — بعقود شهرية واضحة وفريق متابع.',
    audience: 'الشركات الصغيرة والمتوسطة في الجزائر',
    theme: lightTheme({
      primary: '#1e293b',
      secondary: '#f1f5f9',
      accent: '#64748b',
      bg: '#f8fafc',
      surface: '#ffffff',
      text: '#16202e',
      muted: '#64748b',
      border: '#e2e8f0',
      radius: 10,
      shadow: 'sm',
      font: IBM,
    }),
    hero: {
      title: 'خدمات احترافية تنمو مع شركتك',
      subtitle:
        'من المحاسبة القانونية إلى الحملات التسويقية — فريق وصل يمدّ شركتك بكل ما تحتاجه بعقود شهرية واضحة وبدون مفاجآت.',
      primaryButton: 'اطلب استشارة مجانية',
      secondaryButton: 'استعرض الخدمات',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'شريك نمو لشركتك',
      subtitle: 'كل الخدمات تحت سقف واحد',
      columns: 3,
      items: [
        { icon: 'briefcase', title: 'خدمات متكاملة', description: 'محاسبة، تسويق، قانون، وتقنية.' },
        { icon: 'file-text', title: 'عقود واضحة', description: 'أسعار شهرية ثابتة بلا بنود خفية.' },
        { icon: 'users', title: 'فريق متابع', description: 'مدير حساب يعرف شركتك بالاسم.' },
        { icon: 'trending-up', title: 'تقارير شهرية', description: 'ماذا أنجزنا وماذا سيأتي — بوضوح.' },
        { icon: 'shield', title: 'سرية تامة', description: 'اتفاقية سرية موقعة مع كل عميل.' },
        { icon: 'clock', title: 'استجابة سريعة', description: 'رد خلال 4 ساعات عمل كحد أقصى.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'شركة نخدمها', value: '340', change: '+9%' },
        { label: 'مشروع منجز', value: '2,100', change: '+14%' },
        { label: 'ساعة خدمة شهرياً', value: '8,600', change: '+7%' },
        { label: 'تجديد العقود', value: '92%', change: '+3%' },
      ],
    },
    steps: {
      title: 'كيف نعمل؟',
      subtitle: 'منهجية واضحة منذ اليوم الأول',
      steps: [
        { title: 'جلسة تشخيص مجانية', description: 'نستمع لاحتياجاتك ونحدد الفجوات.' },
        { title: 'خطة بعقد شهري', description: 'خدمات محددة بسعر ثابت وواضح.' },
        { title: 'تنفيذ وتقارير', description: 'تنفيذ من فريقنا وتقارير شهرية.' },
      ],
    },
    gallery: {
      title: 'خدماتنا الأكثر طلباً',
      subtitle: 'بأسعار شهرية واضحة',
      variant: 'services',
      items: [
        { title: 'محاسبة وضرائب', description: 'دفاتر، تصريحات، ومرافقة ضريبية', price: 25000, badge: 'شهرياً' },
        { title: 'تسويق رقمي متكامل', description: 'محتوى، إعلانات، وتقارير أداء', price: 60000, badge: 'الأكثر طلباً' },
        { title: 'تطوير موقع شركة', description: 'موقع احترافي مع لوحة تحكم', price: 120000, badge: '' },
        { title: 'هوية بصرية', description: 'شعار ودليل استخدام كامل', price: 45000, badge: 'جديد' },
        { title: 'دعم قانوني', description: 'عقود ومراسلات رسمية', price: 30000, badge: 'شهرياً' },
        { title: 'إدماج أنظمة', description: 'ربط أنظمتك الحالية بأدواتنا', price: 80000, badge: '' },
      ],
    },
    testimonials: {
      title: 'شركات تثق بوصل',
      items: [
        { name: 'محمد قادري', role: 'مدير مالي — شركة توزيع', text: 'تقاريرهم الشهرية أنقذتنا من غرامات ضريبية كانت ستكلفنا أضعاف الاشتراك.', rating: 5 },
        { name: 'سارة بوزيد', role: 'مؤسِّسة — براند عطور', text: 'فريق واحد لكل الخدمات وفّر علينا التنسيق مع خمسة مزودين منفصلين.', rating: 5 },
        { name: 'كريم بلقاسم', role: 'مدير عام — مصنع صغير', text: 'عقدهم الشهري واضح — نفس المبلغ كل شهر، بلا مفاجآت ولا بنود مخفية.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن العقود والأسعار والعمل',
      items: [
        { q: 'كيف تُحدد الأسعار؟', a: 'بعد جلسة التشخيص المجانية نرسل لك عرضاً مفصلاً بأسعار ثابتة شهرية.' },
        { q: 'هل يمكن إيقاف الخدمة؟', a: 'بإشعار 30 يوماً فقط، وتستلم كل ملفاتك كاملة عند المغادرة.' },
        { q: 'من ينفذ العمل؟', a: 'فريق داخلي معتمد بالكامل — لا وسطاء ولا منصات وسيطة.' },
        { q: 'هل تتعاملون مع الشركات الناشئة؟', a: 'نعم، لدينا باقة "انطلاق" مخصصة بميزانيات مخفضة.' },
      ],
    },
    cta: {
      title: 'نمو شركتك يبدأ بمحادثة',
      subtitle: 'احجز جلسة تشخيص مجانية — 30 دقيقة تكفي لنبدأ.',
      buttonText: 'اطلب استشارة',
      style: 'default',
    },
    pricing: {
      title: 'باقات شهرية بلا مفاجآت',
      subtitle: 'اختر باقتك أو اجمع خدماتك كما تشاء',
      plans: [
        { name: 'انطلاق', price: 35000, period: 'شهرياً', features: 'محاسبة أساسية\nمراسلات رسمية\nدعم عبر البريد\nتقرير ربع سنوي', highlighted: false, buttonText: 'ابدأ الآن' },
        { name: 'نمو', price: 85000, period: 'شهرياً', features: 'كل مميزات انطلاق\nتسويق رقمي شهري\nتقارير شهرية\nمدير حساب مخصص', highlighted: true, buttonText: 'اشترك الآن' },
        { name: 'مؤسسات', price: 160000, period: 'شهرياً', features: 'كل مميزات نمو\nدعم قانوني كامل\nتطوير برمجيات\nفريق مخصص\nاتفاقية مستوى خدمة', highlighted: false, buttonText: 'تواصل معنا' },
      ],
    },
    dashboard: { title: 'لوحة المتابعة', subtitle: 'مشاريعك وخدماتك ومهام فريقك', statsPreset: 'agency', entity: 'clients' },
    profile: {
      name: 'عمر تواتي',
      role: 'مدير حساب',
      email: 'omar@wasl.dz',
      phone: '+213 661 77 88 99',
      bio: 'أدير محفظة من 15 شركة عميلة — وسيّي بين احتياجاتهم وفريق التنفيذ لضمان تسليم دائم في الموعد.',
    },
    activity: [
      { title: 'تقرير مارس جاهز للتسليم', subtitle: 'شركة الأمل — المحاسبة والتسويق', meta: 'اليوم' },
      { title: 'مهمة جديدة: إعلانات رمضان', subtitle: 'أُسندت لفريق التسويق', meta: 'أمس' },
      { title: 'تجديد عقد سنة كاملة', subtitle: 'مطبعة الهنا — باقة نمو', meta: 'هذا الأسبوع' },
      { title: 'إضافة خدمة إدماج أنظمة', subtitle: 'بطلب من زبون مؤسساتي', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الخدمات', key: 'services' },
        { label: 'الباقات', key: 'pricing' },
        { label: 'لوحة المتابعة', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'ابدأ الآن', key: 'signup' },
    },
    footerNote: 'وصل — شريك الخدمات الاحترافية لشركتك.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'dashboard', name: 'لوحة المتابعة', type: 'dashboard' },
      { key: 'services', name: 'الخدمات', type: 'table', entity: 'services' },
      { key: 'clients', name: 'الزبناء', type: 'table', entity: 'clients' },
      { key: 'tasks', name: 'المهام', type: 'table', entity: 'tasks' },
      { key: 'pricing', name: 'الباقات', type: 'pricing' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 10. restaurant-menu — مطعمنا ----------------
  {
    id: 'restaurant-menu',
    category: 'restaurant',
    style: 'modern',
    icon: 'utensils',
    name: 'مطعمنا',
    tagline: 'مطعم جزائري أصيل مع طلب أونلاين',
    description:
      'مطعمنا يقدم أشهى الأطباق الجزائرية التقليدية — من الكسكس إلى الشخشوخة — مع طلب أونلاين وتوصيل سريع داخل المدن الكبرى.',
    audience: 'العائلات الجزائرية وعشاق المطبخ التقليدي',
    theme: lightTheme({
      primary: '#d97706',
      secondary: '#fdf6ea',
      accent: '#f59e0b',
      bg: '#fdfbf6',
      surface: '#ffffff',
      text: '#2b1f10',
      muted: '#7d6d55',
      border: '#f0e8d8',
      radius: 12,
      shadow: 'md',
      font: TAJAWAL,
    }),
    hero: {
      title: 'نكهة البيت الجزائري في كل طبق',
      subtitle:
        'كسكس بخضر، طاجين زيتون، شخشوخة — أطباق جدّتنا تُحضّر يومياً بمكونات طازجة من السوق، وتوصلك ساخنة حتى باب دارك.',
      primaryButton: 'اطلب الآن',
      secondaryButton: 'تصفح القائمة',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: {
      title: 'توصيل مجاني داخل الجزائر العاصمة',
      subtitle: 'لكل الطلبات فوق 2,500 دج — يومياً من 11 صباحاً',
      buttonText: 'اطلب الآن',
      style: 'gradient',
    },
    features: {
      title: 'لماذا مطعمنا؟',
      subtitle: 'لأن الطعم الأصيل لا يقبل التنازلات',
      columns: 3,
      items: [
        { icon: 'chef-hat', title: 'أطباق تقليدية أصيلة', description: 'وصفات عائلية توارثناها ثلاثة أجيال.' },
        { icon: 'clock', title: 'توصيل خلال 45 دقيقة', description: 'ساخن دائماً، في كل أحياء العاصمة.' },
        { icon: 'star', title: 'مكونات طازجة يومياً', description: 'من سوق الواقعين كل صباح.' },
        { icon: 'package', title: 'تغليف يحفظ الحرارة', description: 'وصول الطبق كأنه خرج من المطبخ الآن.' },
        { icon: 'truck', title: 'توصيل لكل الأحياء', description: 'العاصمة والمدن الكبرى في تغطية مستمرة.' },
        { icon: 'phone', title: 'حجز الطاولات', description: 'قاعة عائلية هادئة بحجز مسبق.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'طبق في القائمة', value: '45', change: '+5' },
        { label: 'طلب يومياً', value: '350', change: '+12%' },
        { label: 'تقييم الزبائن', value: '4.9 / 5', change: '+0.1' },
        { label: 'سنة خبرة', value: '15', change: '' },
      ],
    },
    steps: {
      title: 'اطلب في 3 خطوات',
      subtitle: 'من التصفح حتى باب دارك',
      steps: [
        { title: 'تصفح القائمة', description: 'اختر أطباقك المفضلة بحرية.' },
        { title: 'أكّد طلبك', description: 'أونلاين أو هاتفياً — كما يريحك.' },
        { title: 'استلم ساخناً', description: 'خلال 45 دقيقة كحد أقصى.' },
      ],
    },
    gallery: {
      title: 'من قائمتنا',
      subtitle: 'أطباق يطلبها زبائنا كل يوم',
      variant: 'menu',
      items: [
        { title: 'كسكس بخضر', description: 'بلحم الدجاج والخضر الموسمية', price: 1200, badge: 'الأكثر طلباً' },
        { title: 'طاجين زيتون', description: 'زيتون بلدي مع لحم الغنم', price: 1500, badge: '' },
        { title: 'شخشوخة', description: 'بمرقة حمراء ولحم مقدد', price: 1000, badge: '' },
        { title: 'حريرة', description: 'شوربة العدس التقليدية', price: 400, badge: '' },
        { title: 'بريك بالبيض', description: 'مقرمش من الخارج طري من الداخل', price: 300, badge: '' },
        { title: 'بقلاوة وردة', description: 'حلويات تقليدية باللوز والعسل', price: 800, badge: 'حلويات' },
      ],
    },
    testimonials: {
      title: 'زبائن تعود كل أسبوع',
      items: [
        { name: 'أحمد بن علي', role: 'زبون — الجزائر', text: 'طعم الكسكس مثل بيت جدّتي بصدق — أطلب لعائلتي كل جمعة.', rating: 5 },
        { name: 'نورة سعدي', role: 'أم لثلاثة أطفال — البليدة', text: 'الحريرة وصلت ساخنة والتغليف ممتاز — الأطفال أحبوا البريك.', rating: 5 },
        { name: 'ياسين مراد', role: 'موظف — الجزائر', text: 'أطلب كل يوم خميس — دقة في الوقت وذوق ثابت دائماً.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن الطلب والتوصيل والحفلات',
      items: [
        { q: 'هل الكسكس متوفر يومياً؟', a: 'نعم يومياً، وبعض الأطباق الخاصة تحتاج طلباً مسبقاً قبل 24 ساعة.' },
        { q: 'هل يوجد مكان للعائلات؟', a: 'قاعة عائلية هادئة بحجز مسبق — تتسع لـ 80 شخصاً.' },
        { q: 'هل تقبلون تجهيز الحفلات؟', a: 'نجهّز حفلات من 20 إلى 200 شخص بقائمة تختارها بنفسك.' },
        { q: 'هل التوصيل لكل الأحياء؟', a: 'كل أحياء الجزائر العاصمة، ونتوسع قريباً في وهران وقسنطينة.' },
      ],
    },
    cta: {
      title: 'جوعان؟ الجواب عندنا',
      subtitle: 'اطلب الآن ووصلك ساخن خلال 45 دقيقة.',
      buttonText: 'اطلب الآن',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة المطعم', subtitle: 'طلبات اليوم ومبيعات الأصناف', statsPreset: 'restaurant', entity: 'menuItems' },
    profile: {
      name: 'كريم بلقاسم',
      role: 'مدير المطعم',
      email: 'karim@matamna.dz',
      phone: '+213 661 10 20 30',
      bio: 'أدير مطعماً عائلياً من 2009 — أُشرف بنفسي على جودة كل طبق يخرج من المطبخ.',
    },
    activity: [
      { title: 'طلب جديد — طاجين زيتون ×2', subtitle: 'حريرة ×3 وبريك بالبيض ×5', meta: 'قبل قليل' },
      { title: 'نفدت البقلاوة', subtitle: 'دفعة جديدة غداً صباحاً', meta: 'اليوم' },
      { title: 'تقييم 5 نجوم جديد', subtitle: 'على الكسكس من الزبون أحمد', meta: 'أمس' },
      { title: 'حجز قاعة عائلية', subtitle: 'الأحد القادم — 30 شخصاً', meta: 'هذا الأسبوع' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'القائمة', key: 'menu' },
        { label: 'لوحة المطعم', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'اطلب الآن', key: 'signup' },
    },
    footerNote: 'مطعمنا — المطبخ الجزائري الأصيل.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة المطعم', type: 'dashboard' },
      { key: 'menu', name: 'قائمة الطعام', type: 'table', entity: 'menuItems' },
      { key: 'orders', name: 'الطلبات', type: 'table', entity: 'orders' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 11. agency-pro — همّة ----------------
  {
    id: 'agency-pro',
    category: 'agency',
    style: 'professional',
    icon: 'target',
    name: 'همّة',
    tagline: 'وكالة رقمية: هوية، مواقع، وحملات تسويق',
    description:
      'همّة وكالة رقمية جزائرية تبني الهويات البصرية والمواقع وحملات التسويق الرقمي للعلامات الطامحة في الجزائر والمنطقة.',
    audience: 'العلامات التجارية والشركات الطامحة في الجزائر',
    theme: lightTheme({
      primary: '#0e7490',
      secondary: '#ecf8fb',
      accent: '#22d3ee',
      bg: '#f9fbfc',
      surface: '#ffffff',
      text: '#132229',
      muted: '#5c7280',
      border: '#dcecf0',
      radius: 12,
      shadow: 'md',
      font: IBM,
    }),
    hero: {
      title: 'علامتك تستحق أن تُرى',
      subtitle:
        'من الشعار إلى الحملة الرقمية — فريق همّة يبني علامتك بخطوات مدروسة، تصميم يليق بطموحك، ونتائج قابلة للقياس.',
      primaryButton: 'احجز جلسة تعارف',
      secondaryButton: 'استعرض أعمالنا',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'شراكة إبداعية',
      subtitle: 'نعمل كأن فريقك الداخلي — بأفكار وكالة',
      columns: 3,
      items: [
        { icon: 'target', title: 'استراتيجية مدروسة', description: 'بحث قبل تصميم، وتصميم قبل إطلاق.' },
        { icon: 'image', title: 'هوية بصرية', description: 'شعارات وهويات تبقى في الذاكرة.' },
        { icon: 'smartphone', title: 'مواقع ومتاجر', description: 'مواقع سريعة تبيع وليس تعرض فقط.' },
        { icon: 'megaphone', title: 'حملات مدفوعة', description: 'إعلانات بأهداف واضحة وميزانية ذكية.' },
        { icon: 'chart', title: 'نتائج مقاسة', description: 'تقارير بمؤشرات تفهمها بدون شرح.' },
        { icon: 'award', title: 'جوائز وتقدير', description: '8 جوائز تصميم جزائرية وإقليمية.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'مشروع منجز', value: '320', change: '+11%' },
        { label: 'عميل سعيد', value: '150', change: '+8%' },
        { label: 'جائزة تصميم', value: '8', change: '' },
        { label: 'متوسط نمو عملائنا', value: '3x', change: '+20%' },
      ],
    },
    steps: {
      title: 'من الفكرة إلى الأثر',
      subtitle: 'منهجية تحترم ميزانيتك ووقتك',
      steps: [
        { title: 'نستمع لقصتك', description: 'جلسة تعارف مجانية نفهم فيها هدفك.' },
        { title: 'نبني الخطة والهوية', description: 'مقترحات واضحة بجدول زمني ملتزم.' },
        { title: 'نطلق ونقيس', description: 'إطلاق ثم تحسين مستمر بالأرقام.' },
      ],
    },
    gallery: {
      title: 'خدمات الوكالة',
      subtitle: 'مشاريع نفتخر بها وخدمات نتقنها',
      variant: 'services',
      items: [
        { title: 'هوية بصرية كاملة', description: 'شعار، ألوان، خطوط، ودليل استخدام', price: 90000, badge: '' },
        { title: 'موقع شركة', description: 'تصميم حصري مع لوحة تحكم', price: 120000, badge: 'الأكثر طلباً' },
        { title: 'متجر إلكتروني', description: 'متجر كامل مع بوابات دفع محلية', price: 180000, badge: 'جديد' },
        { title: 'إدارة حسابات شهرية', description: 'محتوى وتصميم وتفاعل يومي', price: 45000, badge: 'شهرياً' },
        { title: 'حملة إطلاق', description: 'إطلاق منتجك بأقصى أثر ممكن', price: 70000, badge: '' },
        { title: 'فيديو تسويقي', description: 'سكريبت وتصوير ومونتاج كامل', price: 35000, badge: '' },
      ],
    },
    testimonials: {
      title: 'عملاء صنعنا معهم قصص نجاح',
      items: [
        { name: 'سارة بوزيد', role: 'مؤسِّسة براند عطور', text: 'أعادوا تصميم هويتنا بالكامل فارتفعت المبيعات 60% خلال ثلاثة أشهر.', rating: 5 },
        { name: 'محمد قادري', role: 'مدير شركة تجهيزات', text: 'موقعنا الجديد صار مصدر 40% من طلباتنا — أفضل استثمار سنوي صرفناه.', rating: 5 },
        { name: 'ليلى مزيان', role: 'مديرة متجر أزياء', text: 'حملاتهم مدروسة بالأرقام وليست صرفاً إعلانياً عشوائياً كغيرهم.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن المشاريع والميزانيات والتعاون',
      items: [
        { q: 'كم يستغرق مشروع الهوية؟', a: 'من 3 إلى 4 أسابيع حسب حجم العلامة وعدد المقترحات المطلوبة.' },
        { q: 'هل تعملون بميزانيات صغيرة؟', a: 'لدينا باقة "علامة جديدة" مصممة للعلامات في سنتها الأولى.' },
        { q: 'كيف أقيس نجاح الحملة؟', a: 'تقرير شهري بمؤشرات واضحة: وصول، تفاعل، تكلفة العميل، ومبيعات.' },
        { q: 'هل تقدمون عقوداً شهرية؟', a: 'إدارة شهرية مستمرة أو مشروع واحد — نتناسب مع نموذج عملك.' },
      ],
    },
    cta: {
      title: 'علامتك التالية، قصتنا القادمة',
      subtitle: 'احجز جلسة تعارف مجانية — 30 دقيقة قد تغير مسار علامتك.',
      buttonText: 'احجز جلسة',
      style: 'gradient',
    },
    pricing: {
      title: 'باقات على قياس طموحك',
      subtitle: 'أسعار واضحة ونتائج مضمونة بالعقد',
      plans: [
        { name: 'انطلاق', price: 60000, period: 'مرة واحدة', features: 'شعار أساسي\nبطاقات وقرطاسية\nدليل استخدام مبسط\nمراجعتان', highlighted: false, buttonText: 'اطلب الآن' },
        { name: 'نمو', price: 150000, period: 'مرة واحدة', features: 'هوية كاملة\nدليل هوية شامل\nموقع تعريفي\n3 مقترحات للشعار\nمراجعات غير محدودة', highlighted: true, buttonText: 'اطلب الآن' },
        { name: 'علامة', price: 320000, period: 'مشروع متكامل', features: 'كل مميزات نمو\nمتجر إلكتروني\nحملة إطلاق كاملة\nإدارة 3 أشهر\nفريق مخصص', highlighted: false, buttonText: 'تواصل معنا' },
      ],
    },
    dashboard: { title: 'لوحة الوكالة', subtitle: 'مشاريعك وزبائنك ومهام فريقك', statsPreset: 'agency', entity: 'clients' },
    profile: {
      name: 'سارة بوزيد',
      role: 'مديرة إبداعية',
      email: 'sara@hemma.dz',
      phone: '+213 555 66 77 88',
      bio: 'أقود الفريق الإبداعي في همّة — 9 سنوات في بناء الهويات التي تبقى في ذاكرة السوق الجزائري.',
    },
    activity: [
      { title: 'تم تسليم هوية براند عطور', subtitle: 'العميلة سارة بوزيد — المرحلة الأخيرة', meta: 'اليوم' },
      { title: 'حملة إطلاق متجر أزياء', subtitle: 'الميزانية معتمدة — الانطلاق الأحد', meta: 'هذا الأسبوع' },
      { title: 'عميل جديد وقّع عقد نمو', subtitle: 'شركة تجهيزات — قسنطينة', meta: 'أمس' },
      { title: 'ترشّح فريقنا لجائزة تصميم', subtitle: 'الترشيح قيد المراجعة', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الباقات', key: 'pricing' },
        { label: 'لوحة الوكالة', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'ابدأ مشروعك', key: 'signup' },
    },
    footerNote: 'همّة — وكالة رقمية بطموح جزائري.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة الوكالة', type: 'dashboard' },
      { key: 'clients', name: 'الزبناء', type: 'table', entity: 'clients' },
      { key: 'tasks', name: 'المهام', type: 'table', entity: 'tasks' },
      { key: 'pricing', name: 'الباقات', type: 'pricing' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 12. web-app-starter — انطلاقة ----------------
  {
    id: 'web-app-starter',
    category: 'app',
    style: 'minimal',
    icon: 'smartphone',
    name: 'انطلاقة',
    tagline: 'قالب بداية شامل لأي تطبيق ويب',
    description:
      'انطلاقة قالب بداية احترافي لتطبيقات الويب — صفحة هبوط، مصادقة، لوحة تحكم، جداول ونماذج جاهزة للتخصيص حسب فكرتك خلال ساعات.',
    audience: 'المؤسسون المبتدئون والمطورون الذين يريدون نقطة انطلاق سريعة',
    theme: lightTheme({
      primary: '#3f3f46',
      primaryForeground: '#ffffff',
      secondary: '#f4f4f5',
      accent: '#a1a1aa',
      bg: '#fafafa',
      surface: '#ffffff',
      text: '#1c1c20',
      muted: '#71717a',
      border: '#e4e4e7',
      radius: 12,
      shadow: 'md',
      font: IBM,
    }),
    hero: {
      title: 'فكرتك تستحق انطلاقة سريعة',
      subtitle:
        'كل الأساسيات جاهزة مسبقاً: صفحة هبوط، تسجيل دخول، لوحة تحكم، جداول ونماذج — خصّصها وفق فكرتك وانشر خلال ساعات لا أسابيع.',
      primaryButton: 'ابدأ مجاناً',
      secondaryButton: 'استعرض المكوّنات',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'أساسيات جاهزة للإطلاق',
      subtitle: 'ركّز على فكرتك — نحن جهّزنا الباقي',
      columns: 3,
      items: [
        { icon: 'layers', title: 'مكوّنات جاهزة', description: '25+ مكوّناً قابلاً للتركيب والتعديل.' },
        { icon: 'users', title: 'إدارة مستخدمين', description: 'دخول، تسجيل، أدوار وصلاحيات.' },
        { icon: 'chart', title: 'لوحات وتحليلات', description: 'رسوم بيانية جاهزة لبياناتك.' },
        { icon: 'settings', title: 'إعدادات مرنة', description: 'نماذج إعدادات تُعدّل بالنقر.' },
        { icon: 'smartphone', title: 'متجاوب كلياً', description: 'من الهاتف الصغير إلى الشاشة العريضة.' },
        { icon: 'zap', title: 'أداء سريع', description: 'تحميل فوري وتجربة انسيابية.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'مكوّن جاهز', value: '25+', change: '' },
        { label: 'صفحة جاهزة', value: '9', change: '' },
        { label: 'وقت إطلاق أقل', value: '-80%', change: '' },
        { label: 'سطر كود مطلوب', value: '0', change: '' },
      ],
    },
    steps: {
      title: 'انطلق في 3 خطوات',
      subtitle: 'من النسخ إلى النشر',
      steps: [
        { title: 'انسخ وخصّص', description: 'غيّر الألوان والخطوط بنقرات قليلة.' },
        { title: 'أضف صفحاتك', description: 'صفحات ومكوّنات بلا حدود.' },
        { title: 'انشر وشارك', description: 'رابطك جاهز للعالم خلال ساعات.' },
      ],
    },
    gallery: null,
    testimonials: {
      title: 'مؤسسون انطلقوا أسرع',
      items: [
        { name: 'أحمد بن علي', role: 'مطور مستقل — الجزائر', text: 'أوفر يومي عمل كامل في كل مشروع جديد أبدأه من انطلاقة.', rating: 5 },
        { name: 'نورة سعدي', role: 'مؤسِّسة — سطيف', text: 'أطلقت نسختي الأولى في نفس اليوم — لأول مرة لا أتعثر في التقنيات.', rating: 5 },
        { name: 'محمد قادري', role: 'طالب هندسة إعلامية', text: 'استعملته لمشروع التخرج — اللجنة أعجبتها الاحترافية.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن التخصيص والنشر',
      items: [
        { q: 'هل أحتاج خبرة برمجية؟', a: 'للتخصيص البصري لا إطلاقاً؛ وللتغييرات العميقة معرفة أساسية تكفي.' },
        { q: 'هل يمكن إضافة صفحات غير محدودة؟', a: 'نعم، أضف صفحات ومكوّنات بلا أي حدود من المحرر.' },
        { q: 'هل التصميم متجاوب؟', a: 'كل مكوّن مبني بمنهجية الجوال أولاً ويعمل على كل المقاسات.' },
        { q: 'هل القالب مجاني؟', a: 'نسخة البداية مجانية بالكامل مع مكوناتها الأساسية.' },
      ],
    },
    cta: {
      title: 'ابدأ بناء فكرتك اليوم',
      subtitle: 'كل ما تحتاجه للانطلاق في مكان واحد — مجاناً.',
      buttonText: 'ابدأ مجاناً',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة عامة على تطبيقك ومستخدميه', statsPreset: 'overview', entity: 'users' },
    profile: {
      name: 'محمد قادري',
      role: 'مطوّر مستقل',
      email: 'mohamed.ghadri@gmail.com',
      phone: '+213 550 98 76 54',
      bio: 'أبني نماذج أولية لعملائي بانطلاقة — أركّز على منطق الأعمال وأترك الأساسيات للقالب.',
    },
    activity: [
      { title: 'أضفت 3 صفحات جديدة', subtitle: 'صفحة الأسئلة والدخول والتسجيل', meta: 'اليوم' },
      { title: 'غيّرت الهوية اللونية', subtitle: 'من البنفسجي إلى الأخضر', meta: 'أمس' },
      { title: 'أضفت جدول المهام', subtitle: 'مع البحث والترقيم', meta: 'هذا الأسبوع' },
      { title: 'نشرت النسخة الأولى', subtitle: 'على رابط تجريبي للمختبِرين', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'الأسئلة الشائعة', key: 'faq' },
        { label: 'لوحة التحكم', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'إنشاء حساب', key: 'signup' },
    },
    footerNote: 'انطلاقة — قالبك نحو الإطلاق السريع.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة التحكم', type: 'dashboard' },
      { key: 'users', name: 'المستخدمون', type: 'table', entity: 'users' },
      { key: 'tasks', name: 'المهام', type: 'table', entity: 'tasks' },
      { key: 'faq', name: 'الأسئلة الشائعة', type: 'faq' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 13. fintech-wallet — محفظتي ----------------
  {
    id: 'fintech-wallet',
    category: 'fintech',
    style: 'professional',
    icon: 'wallet',
    name: 'محفظتي',
    tagline: 'محفظة رقمية للدفع والتحويل داخل الجزائر',
    description:
      'محفظتي تتيح الدفع والتحويل وتسديد الفواتير من هاتفك — بسرعة وأمان وتكامل مع الحسابات البريدية والبنكية الجزائرية.',
    audience: 'المستخدمون الجزائريون الباحثون عن دفع رقمي سهل وآمن',
    theme: lightTheme({
      primary: '#1e3a8a',
      primaryForeground: '#ffffff',
      secondary: '#eef2fb',
      accent: '#60a5fa',
      bg: '#f9fafc',
      surface: '#ffffff',
      text: '#131a2c',
      muted: '#64748b',
      border: '#e3e8f2',
      radius: 12,
      shadow: 'md',
      font: IBM,
    }),
    hero: {
      title: 'كل أموالك، في جيبك',
      subtitle:
        'أرسل، استلم، وادفع من هاتفك خلال ثوانٍ — مع رسوم شفافة، أمان بمستوى البنوك، وتكامل كامل مع البريد موب وحساباتك البنكية.',
      primaryButton: 'حمّل التطبيق',
      secondaryButton: 'كيف يعمل؟',
      layout: 'split',
      background: 'dark',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'بنكك في جيبك',
      subtitle: 'خدمات مالية صُممت للواقع الجزائري',
      columns: 3,
      items: [
        { icon: 'zap', title: 'تحويل فوري', description: 'بين محافظ محفظتي خلال ثوانٍ.' },
        { icon: 'shield', title: 'أمان مصرفي', description: 'تشفير بمعايير البنوك العالمية.' },
        { icon: 'credit-card', title: 'تسديد الفواتير', description: 'كهرباء، غاز، ماء، أنترنت — الكل.' },
        { icon: 'globe', title: 'دفع أونلاين', description: 'ادفع في المتاجر الجزائرية بلمسة.' },
        { icon: 'trending-up', title: 'تتبع المصاريف', description: 'تصنيف تلقائي لكل مصاريفك.' },
        { icon: 'users', title: 'تحويل بين الأصدقاء', description: 'بالبطاقة أو رمز الهاتف.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'مستخدم نشط', value: '120,000', change: '+28%' },
        { label: 'معاملة يومياً', value: '45,000', change: '+17%' },
        { label: 'قيمة معالجة شهرياً', value: '2.4 مليار دج', change: '+22%' },
        { label: 'رسوم التحويل العائلي', value: '0%', change: '' },
      ],
    },
    steps: {
      title: 'ابدأ في 3 خطوات',
      subtitle: 'دقيقة واحدة تكفي',
      steps: [
        { title: 'حمّل وأنشئ محفظتك', description: 'برقم هاتفك ووثيقة هوية واحدة.' },
        { title: 'اربط حسابك', description: 'حساب بريدي (CCP) أو بنكي خلال دقائق.' },
        { title: 'أرسل وادفع', description: 'بلمسة واحدة، في أي وقت ومن أي مكان.' },
      ],
    },
    gallery: null,
    testimonials: {
      title: 'مستخدمون يعتمدونها يومياً',
      items: [
        { name: 'أحمد بن علي', role: 'تاجر صغير — الجزائر', text: 'أستقبل مدفوعات متجري مباشرة على محفظتي — انتهى مشكل البقية والفتات.', rating: 5 },
        { name: 'سارة بوزيد', role: 'طالبة — وهران', text: 'تحويل مصاريفي من والديّ يصل فوراً — أربع سنوات من الانتظار انتهت.', rating: 5 },
        { name: 'عمر تواتي', role: 'موظف — قسنطينة', text: 'سددت فاتورة الكهرباء في 30 ثانية من مكتبني دون طوابير البريد.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن الأمان والرسوم والترخيص',
      items: [
        { q: 'هل المحفظة مرخصة؟', a: 'نعم، تعمل بموجب ترخيص تجربة خدمات الدفع الصادر عن بنك الجزائر.' },
        { q: 'ما هي الرسوم؟', a: 'التحويلات العائلية مجانية؛ التحويلات التجارية برسوم 1% فقط.' },
        { q: 'كيف أحمي حسابي؟', a: 'رمز PIN، بصمة الإصبع، وتأكيد كل عملية برسالة على هاتفك.' },
        { q: 'هل أستطيع السحب نقداً؟', a: 'من أي مكتب بريد شريك أو صرّاف مرتبط بالخدمة، دون رسوم.' },
      ],
    },
    cta: {
      title: 'مستقبلك المالي يبدأ اليوم',
      subtitle: 'انضم لأكثر من 120 ألف مستخدم جزائري يديرون أموالهم بذكاء.',
      buttonText: 'حمّل التطبيق',
      style: 'gradient',
    },
    pricing: null,
    dashboard: { title: 'لوحة المحفظة', subtitle: 'معاملاتك ورصيدك واشتراكاتك', statsPreset: 'saas', entity: 'transactions' },
    profile: {
      name: 'ياسين مراد',
      role: 'مستخدم تجريبي — حساب موثّق',
      email: 'yacine.mourad@gmail.com',
      phone: '+213 661 11 22 33',
      bio: 'أستعمل محفظتي لكل شيء: مصاريف البيت، فواتير الأنترنت، وتحصيل مدفوعات عملي الحر.',
    },
    activity: [
      { title: 'تحويل وارد 82,000 دج', subtitle: 'من أحمد بن علي — TRX-88234', meta: 'قبل قليل' },
      { title: 'فاتورة كهرباء مسددة', subtitle: '12,700 دج — سونلغاز', meta: 'اليوم' },
      { title: 'اشتراك نت مدفوع', subtitle: '3,500 دج — مزود محلي', meta: 'أمس' },
      { title: 'رصيدك الشهري جاهز', subtitle: 'تقرير المصاريف مع تصنيف كامل', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'المعاملات', key: 'transactions' },
        { label: 'لوحة المحفظة', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'أنشئ محفظتك', key: 'signup' },
    },
    footerNote: 'محفظتي — أموالك أينما كنت.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'forgot', name: 'نسيت كلمة المرور', type: 'auth', authVariant: 'forgot' },
      { key: 'dashboard', name: 'لوحة المحفظة', type: 'dashboard' },
      { key: 'transactions', name: 'المعاملات', type: 'table', entity: 'transactions' },
      { key: 'subscriptions', name: 'الاشتراكات', type: 'table', entity: 'subscriptions' },
      { key: 'invoices', name: 'الفواتير', type: 'table', entity: 'invoices' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },

  // ---------------- 14. admin-console — تحكّم ----------------
  {
    id: 'admin-console',
    category: 'admin',
    style: 'professional',
    icon: 'layout-dashboard',
    name: 'تحكّم',
    tagline: 'لوحة إدارة شاملة لفريقك ومشاريعك',
    description:
      'تحكّم منصة إدارية جزائرية لإدارة المستخدمين والفرق والمهام والصلاحيات — كل ما يحتاجه فريقك التشغيلي في لوحة واحدة واضحة.',
    audience: 'الفرق التشغيلية والمديرون في الشركات الجزائرية',
    theme: lightTheme({
      primary: '#991b1b',
      secondary: '#fdf0f0',
      accent: '#f87171',
      bg: '#fdfbfb',
      surface: '#ffffff',
      text: '#291414',
      muted: '#7a6161',
      border: '#f0e2e2',
      radius: 10,
      shadow: 'sm',
      font: IBM,
    }),
    hero: {
      title: 'كل فريقك، لوحة واحدة',
      subtitle:
        'أدر المستخدمين والصلاحيات والمهام والتقارير من مكان واحد — مع سجل كامل للعمليات وصلاحيات دقيقة لكل دور في شركتك.',
      primaryButton: 'ابدأ التجربة',
      secondaryButton: 'استعرض الميزات',
      layout: 'split',
      background: 'default',
      align: 'start',
    },
    banner: null,
    features: {
      title: 'إدارة بلا فوضى',
      subtitle: 'وضوح كامل في من يفعل ماذا ومتى',
      columns: 3,
      items: [
        { icon: 'users', title: 'إدارة الأدوار', description: 'أدوار مخصصة لكل قسم ووظيفة.' },
        { icon: 'shield', title: 'صلاحيات دقيقة', description: 'تحكم في كل إجراء على حدة.' },
        { icon: 'clipboard-list', title: 'تتبع المهام', description: 'من الإسناد حتى الإنجاز.' },
        { icon: 'file-text', title: 'سجل العمليات', description: 'من فعل ماذا ومتى — بالتفصيل.' },
        { icon: 'chart', title: 'تقارير فورية', description: 'أداء الفريق في لوحات حية.' },
        { icon: 'bell', title: 'تنبيهات الفريق', description: 'إشعارات فورية لكل مستجد.' },
      ],
    },
    stats: {
      title: '',
      items: [
        { label: 'مستخدم مُدار', value: '12,000', change: '+10%' },
        { label: 'فريق نشط', value: '850', change: '+6%' },
        { label: 'مهمة منجزة', value: '96,000', change: '+13%' },
        { label: 'وقت إداري موفَّر', value: '35%', change: '+4%' },
      ],
    },
    steps: {
      title: 'جهّز لوحتك',
      subtitle: 'من التسجيل إلى الإدارة الكاملة',
      steps: [
        { title: 'أضف أعضاء فريقك', description: 'دعوات بالبريد خلال ثوانٍ.' },
        { title: 'حدّد صلاحيات كل دور', description: 'قوالب جاهزة أو مخصصة بالكامل.' },
        { title: 'تابع العمل من التقارير', description: 'لوحات حية وسجل عمليات كامل.' },
      ],
    },
    gallery: null,
    testimonials: {
      title: 'فرق تعمل بوضوح أكبر',
      items: [
        { name: 'محمد قادري', role: 'مدير عمليات — الجزائر', text: 'الصلاحيات الدقيقة أنهت مشاكل الوصول عندنا — كل واحد يرى ما يخصه فقط.', rating: 5 },
        { name: 'أمينة حساني', role: 'مسؤولة موارد بشرية — وهران', text: 'سجل العمليات يحل أي خلاف في ثوانٍ — من عدّل هذا الملف ومتى، واضح تماماً.', rating: 5 },
        { name: 'كريم بلقاسم', role: 'مدير فرع — سطيف', text: 'تقارير المهام الحية غنّتني عن اجتماعات المتابعة اليومية.', rating: 4 },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      subtitle: 'عن الصلاحيات والاندماج',
      items: [
        { q: 'هل يدعم تعدد الشركات؟', a: 'نعم — مساحات عمل منفصلة تماماً لكل شركة أو فرع.' },
        { q: 'هل يوجد سجل للتغييرات؟', a: 'كل عملية موثقة بالمستخدم والوقت والقيمة قبل وبعد.' },
        { q: 'هل يمكن ربط أنظمتنا الحالية؟', a: 'واجهة REST كاملة مع ويبهوكس للأحداث المهمة.' },
        { q: 'كيف ندير الصلاحيات؟', a: 'أدوار جاهزة (مدير، محرر، مشاهدة) أو أدوار مخصصة لكل قسم.' },
      ],
    },
    cta: {
      title: 'نظّم فريقك اليوم',
      subtitle: 'جرّب تحكّم مجاناً 14 يوماً — بدون بطاقة بنكية.',
      buttonText: 'ابدأ التجربة',
      style: 'dark',
    },
    pricing: null,
    dashboard: { title: 'لوحة الإدارة', subtitle: 'نظرة عامة على الفريق والعمليات', statsPreset: 'overview', entity: 'users' },
    profile: {
      name: 'أمينة حساني',
      role: 'مسؤولة موارد بشرية',
      email: 'amina.hassani@gmail.com',
      phone: '+213 555 12 34 56',
      bio: 'أدير 48 موظفاً عبر تحكّم — من التعيينات والصلاحيات حتى التقارير الشهرية للإدارة.',
    },
    activity: [
      { title: 'عضو جديد انضم للفريق', subtitle: 'ليلى مزيان — قسم التسويق', meta: 'اليوم' },
      { title: 'تحديث صلاحيات قسم المالية', subtitle: 'إضافة صلاحية التقارير المتقدمة', meta: 'أمس' },
      { title: '12 مهمة أُنجزت هذا الأسبوع', subtitle: 'بمعدل إنجاز 87%', meta: 'هذا الأسبوع' },
      { title: 'تقرير العمليات جاهز', subtitle: '1,240 عملية موثقة هذا الشهر', meta: 'هذا الشهر' },
    ],
    nav: {
      items: [
        { label: 'الرئيسية', key: 'home' },
        { label: 'المستخدمون', key: 'users' },
        { label: 'لوحة الإدارة', key: 'dashboard' },
        { label: 'تسجيل الدخول', key: 'login' },
      ],
      cta: { label: 'ابدأ التجربة', key: 'signup' },
    },
    footerNote: 'تحكّم — منصة الإدارة الشاملة لفريقك.',
    pages: [
      { key: 'home', name: 'الرئيسية', type: 'landing' },
      { key: 'login', name: 'تسجيل الدخول', type: 'auth', authVariant: 'login' },
      { key: 'signup', name: 'إنشاء حساب', type: 'auth', authVariant: 'signup' },
      { key: 'dashboard', name: 'لوحة الإدارة', type: 'dashboard' },
      { key: 'users', name: 'المستخدمون', type: 'table', entity: 'users' },
      { key: 'team', name: 'الفريق', type: 'table', entity: 'teamMembers' },
      { key: 'tasks', name: 'المهام', type: 'table', entity: 'tasks' },
      { key: 'settings', name: 'الإعدادات', type: 'settings' },
      { key: 'profile', name: 'الملف الشخصي', type: 'profile' },
    ],
  },
]

// ============================================================
// Assembly — بناء ProjectSchema من القالب
// ============================================================
function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function blk(pageId: string, index: number, type: BlockType, props: Record<string, unknown>): Block {
  return { id: `${pageId}-b${index + 1}`, type, props }
}

function authProps(variant: AuthVariant, brand: string): Record<string, unknown> {
  if (variant === 'signup') {
    return {
      variant: 'signup',
      title: 'إنشاء حساب',
      subtitle: `انضم إلى ${brand} وابدأ رحلتك اليوم`,
      buttonText: 'إنشاء الحساب',
      demoHint: 'بيانات تجريبية — أدخل أي بريد',
    }
  }
  if (variant === 'forgot') {
    return {
      variant: 'forgot',
      title: 'استعادة كلمة المرور',
      subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة',
      buttonText: 'إرسال الرابط',
      demoHint: 'بيانات تجريبية — أدخل أي بريد',
    }
  }
  return {
    variant: 'login',
    title: 'تسجيل الدخول',
    subtitle: `أدخل بياناتك للوصول إلى ${brand}`,
    buttonText: 'دخول',
    demoHint: 'بيانات تجريبية — أدخل أي بريد',
  }
}

function settingsSections(brand: string, tagline: string): Array<Record<string, unknown>> {
  return [
    {
      title: 'معلومات المشروع',
      fields: [
        { label: 'اسم المشروع', type: 'text', value: brand, hint: 'سيظهر في القائمة الرئيسية' },
        { label: 'الوصف المختصر', type: 'text', value: tagline, hint: '' },
        { label: 'العملة', type: 'select', value: 'دج', hint: '', options: ['دج', '$', '€'] },
      ],
    },
    {
      title: 'الإشعارات',
      fields: [
        { label: 'إشعارات البريد', type: 'switch', value: 'true', hint: 'تلقِّ إشعاراً عند كل حدث مهم' },
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
  ]
}

function buildLandingBlocks(pageId: string, p: TemplatePack): Block[] {
  const blocks: Block[] = []
  blocks.push(
    blk(pageId, blocks.length, 'hero', {
      title: p.hero.title,
      subtitle: p.hero.subtitle,
      primaryButton: p.hero.primaryButton,
      primaryButtonPage: '',
      secondaryButton: p.hero.secondaryButton,
      layout: p.hero.layout,
      background: p.hero.background,
      align: p.hero.align,
    })
  )
  if (p.banner) {
    blocks.push(
      blk(pageId, blocks.length, 'banner', {
        title: p.banner.title,
        subtitle: p.banner.subtitle,
        buttonText: p.banner.buttonText,
        style: p.banner.style,
      })
    )
  }
  blocks.push(
    blk(pageId, blocks.length, 'features', {
      title: p.features.title,
      subtitle: p.features.subtitle,
      columns: p.features.columns,
      items: p.features.items,
    })
  )
  blocks.push(
    blk(pageId, blocks.length, 'stats', {
      title: p.stats.title,
      items: p.stats.items,
    })
  )
  blocks.push(
    blk(pageId, blocks.length, 'steps', {
      title: p.steps.title,
      subtitle: p.steps.subtitle,
      steps: p.steps.steps,
    })
  )
  if (p.gallery) {
    blocks.push(
      blk(pageId, blocks.length, 'gallery', {
        title: p.gallery.title,
        subtitle: p.gallery.subtitle,
        variant: p.gallery.variant,
        items: p.gallery.items,
      })
    )
  }
  blocks.push(
    blk(pageId, blocks.length, 'testimonials', {
      title: p.testimonials.title,
      items: p.testimonials.items,
    })
  )
  blocks.push(
    blk(pageId, blocks.length, 'faq', {
      title: p.faq.title,
      subtitle: p.faq.subtitle,
      items: p.faq.items,
    })
  )
  blocks.push(
    blk(pageId, blocks.length, 'cta', {
      title: p.cta.title,
      subtitle: p.cta.subtitle,
      buttonText: p.cta.buttonText,
      style: p.cta.style,
    })
  )
  return blocks
}

function buildPricingBlocks(pageId: string, p: TemplatePack): Block[] {
  const blocks: Block[] = []
  if (p.pricing) {
    blocks.push(
      blk(pageId, blocks.length, 'pricing', {
        title: p.pricing.title,
        subtitle: p.pricing.subtitle,
        currency: 'دج',
        plans: p.pricing.plans,
      })
    )
  }
  blocks.push(
    blk(pageId, blocks.length, 'faq', {
      title: 'أسئلة حول الاشتراك والدفع',
      subtitle: '',
      items: p.faq.items,
    })
  )
  blocks.push(
    blk(pageId, blocks.length, 'cta', {
      title: p.cta.title,
      subtitle: p.cta.subtitle,
      buttonText: p.cta.buttonText,
      style: p.cta.style,
    })
  )
  return blocks
}

function buildFaqPageBlocks(pageId: string, p: TemplatePack): Block[] {
  return [
    blk(pageId, 0, 'faq', { title: p.faq.title, subtitle: p.faq.subtitle, items: p.faq.items }),
    blk(pageId, 1, 'contact-form', {
      title: 'لم تجد جوابك؟',
      subtitle: 'أرسل لنا سؤالك وسنجيبك خلال 24 ساعة.',
      buttonText: 'إرسال السؤال',
      successText: 'تم إرسال سؤالك بنجاح، سنجيبك على بريدك قريباً.',
    }),
  ]
}

// أسماء جزائرية لدوران مستخدمي سجل النشاطات (Task 8-c)
const ACTIVITY_USERS = ['أحمد بن علي', 'سارة بوزيد', 'محمد قادري', 'ياسين مراد', 'ليلى مزيان', 'أمينة حساني'] as const

// مفرد الكيانات لملصقات «إضافة …» في الإجراءات السريعة (Task 8-c)
const ENTITY_SINGULAR: Record<string, string> = {
  customers: 'عميل',
  orders: 'طلب',
  products: 'منتج',
  bookings: 'حجز',
  invoices: 'فاتورة',
  services: 'خدمة',
  users: 'مستخدم',
  clients: 'زبون',
  tasks: 'مهمة',
  teamMembers: 'عضو',
  courses: 'دورة',
  students: 'طالب',
  properties: 'عقار',
  appointments: 'موعد',
  menuItems: 'صنف',
  transactions: 'معاملة',
  subscriptions: 'اشتراك',
}

function buildDashboardBlocks(
  pageId: string,
  p: TemplatePack,
  statsForPreset: Array<Record<string, unknown>>
): Block[] {
  const entityLabel = ENTITY_LABELS[p.dashboard.entity] ?? 'العناصر'
  const entitySingular = ENTITY_SINGULAR[p.dashboard.entity] ?? 'عنصر'
  const secondChartKey = ['ecommerce', 'marketplace', 'restaurant', 'delivery'].includes(p.category)
    ? 'salesByCategory'
    : 'ordersWeekly'
  const secondChartType = secondChartKey === 'salesByCategory' ? 'donut' : 'line'

  // ---- إجراءات سريعة: أهداف حقيقية من صفحات القالب (id = `${p.id}-${key}`) ----
  const idOf = (key: string): string => `${p.id}-${key}`
  const firstTableSpec = p.pages.find((s) => s.type === 'table')
  const dashboardSpec = p.pages.find((s) => s.type === 'dashboard')
  const settingsSpec = p.pages.find((s) => s.type === 'settings')
  const profileSpec = p.pages.find((s) => s.type === 'profile')

  const quickActions: Array<{ icon: string; label: string; pageId: string }> = []
  if (firstTableSpec) {
    const addTargetSingular = ENTITY_SINGULAR[firstTableSpec.entity ?? ''] ?? entitySingular
    quickActions.push({ icon: 'plus', label: `إضافة ${addTargetSingular}`, pageId: idOf(firstTableSpec.key) })
  }
  if (dashboardSpec) {
    quickActions.push({ icon: 'trending-up', label: 'تقرير الأداء', pageId: idOf(dashboardSpec.key) })
  }
  if (settingsSpec) {
    quickActions.push({ icon: 'settings', label: 'الإعدادات', pageId: idOf(settingsSpec.key) })
  }
  if (profileSpec) {
    quickActions.push({ icon: 'user', label: 'الملف الشخصي', pageId: idOf(profileSpec.key) })
  }

  // ---- سجل النشاطات من بيانات القالب (تدوير أسماء المستخدمين) ----
  const activityItems = p.activity.slice(0, 5).map((it, i) => ({
    user: ACTIVITY_USERS[i % ACTIVITY_USERS.length],
    action: it.title,
    target: it.subtitle,
    time: it.meta,
  }))

  // ---- مهام اليوم: 2 منجزة + 3 معلّقة (تكييف الأولى بالكيان) ----
  const taskItems = [
    { label: `مراجعة أحدث ${entityLabel}`, done: true, meta: 'اليوم 14:00' },
    { label: 'تحديث بيانات الفرع', done: true, meta: 'اليوم 16:30' },
    { label: 'الرد على رسائل الزبائن', done: false, meta: 'غداً 09:00' },
    { label: 'إعداد تقرير الأسبوع', done: false, meta: 'الخميس' },
    { label: 'موافقة طلبات جديدة', done: false, meta: '' },
  ]

  return [
    blk(pageId, 0, 'dashboard-header', {
      title: p.dashboard.title,
      subtitle: p.dashboard.subtitle,
      actions: 'إضافة عنصر,تصدير التقرير',
    }),
    blk(pageId, 1, 'stats-row', { items: statsForPreset }),
    blk(pageId, 2, 'chart', {
      title: CHART_LABELS.revenueMonthly,
      chartType: 'bar',
      dataKey: 'revenueMonthly',
    }),
    blk(pageId, 3, 'chart', {
      title: CHART_LABELS[secondChartKey],
      chartType: secondChartType,
      dataKey: secondChartKey,
    }),
    blk(pageId, 4, 'quick-actions', {
      title: 'إجراءات سريعة',
      actions: quickActions,
    }),
    blk(pageId, 5, 'data-table', {
      entity: p.dashboard.entity,
      title: `أحدث ${entityLabel}`,
      pageSize: 5,
    }),
    blk(pageId, 6, 'tasks-list', {
      title: 'مهام اليوم',
      subtitle: '',
      items: taskItems,
    }),
    blk(pageId, 7, 'activity-feed', {
      title: 'آخر النشاطات',
      items: activityItems,
    }),
  ]
}

function buildPageBlocks(
  spec: PageSpec,
  p: TemplatePack,
  statsForPreset: Array<Record<string, unknown>>
): Block[] {
  const pageId = `${p.id}-${spec.key}`
  switch (spec.type) {
    case 'landing':
      return buildLandingBlocks(pageId, p)
    case 'auth':
      return [blk(pageId, 0, 'auth-card', authProps(spec.authVariant ?? 'login', p.name))]
    case 'dashboard':
      return buildDashboardBlocks(pageId, p, statsForPreset)
    case 'table': {
      const entity = spec.entity ?? 'customers'
      const label = ENTITY_LABELS[entity] ?? 'العناصر'
      return [
        blk(pageId, 0, 'dashboard-header', {
          title: spec.name,
          subtitle: `إدارة ${label} ومتابعتها لحظة بلحظة`,
          actions: `إضافة ${label.slice(0, -1)},تصدير`,
        }),
        blk(pageId, 1, 'data-table', { entity, title: '', pageSize: 5 }),
      ]
    }
    case 'pricing':
      return buildPricingBlocks(pageId, p)
    case 'faq':
      return buildFaqPageBlocks(pageId, p)
    case 'settings':
      return [
        blk(pageId, 0, 'settings-form', {
          title: 'الإعدادات',
          sections: settingsSections(p.name, p.tagline),
        }),
      ]
    case 'profile':
      return [
        blk(pageId, 0, 'profile-card', {
          name: p.profile.name,
          role: p.profile.role,
          email: p.profile.email,
          phone: p.profile.phone,
          bio: p.profile.bio,
        }),
        blk(pageId, 1, 'list', { title: 'آخر النشاطات', items: p.activity }),
      ]
    case 'form':
      return [
        blk(pageId, 0, 'dashboard-header', { title: spec.name, subtitle: 'املأ النموذج التالي', actions: '' }),
        blk(pageId, 1, 'form-fields', {
          title: spec.name,
          subtitle: '',
          fields: [
            { label: 'الاسم الكامل', type: 'text', required: true, placeholder: 'مثال: أحمد بن علي' },
            { label: 'البريد الإلكتروني', type: 'email', required: true, placeholder: 'name@gmail.com' },
            { label: 'ملاحظات', type: 'textarea', required: false, placeholder: 'أي تفاصيل إضافية...' },
          ],
          submitText: 'إرسال',
          successText: 'تم إرسال بياناتك بنجاح. شكراً لك!',
        }),
      ]
    default:
      return [blk(pageId, 0, 'empty-state', { title: 'صفحة فارغة', subtitle: 'أضف مكوّناتك هنا.', actionText: '' })]
  }
}

function findPack(templateId: string): TemplatePack {
  return PACKS.find((p) => p.id === templateId) ?? PACKS[0]
}

// ============================================================
// Pinned exports
// ============================================================
export const TEMPLATES: TemplateMeta[] = PACKS.map((p) => ({
  id: p.id,
  category: p.category,
  name: p.name,
  tagline: p.tagline,
  description: p.description,
  icon: p.icon,
  pageCount: p.pages.length,
}))

export function getTemplateMeta(id: string): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

/** يبني ProjectSchema كاملاً من قالب معروف (نسخة مستقلة قابلة للتعديل) */
export function buildTemplateSchema(templateId: string): ProjectSchema {
  const p = findPack(templateId)
  const mockData = buildMockData(p.category)
  const statsForPreset = (mockData.stats[p.dashboard.statsPreset] ?? mockData.stats.overview ?? []).map(
    (s) => ({ ...s } as unknown as Record<string, unknown>)
  )

  const pages: ProjectPage[] = p.pages.map((spec) => ({
    id: `${p.id}-${spec.key}`,
    name: spec.name,
    slug: spec.key,
    type: spec.type,
    authVariant: spec.authVariant,
    entity: spec.entity,
    title: spec.name,
    subtitle: '',
    blocks: buildPageBlocks(spec, p, statsForPreset),
  }))

  const pageIdByKey = new Map<string, string>()
  for (const pg of pages) pageIdByKey.set(pg.slug, pg.id)

  const navigation = {
    brand: p.name,
    items: p.nav.items
      .filter((it) => pageIdByKey.has(it.key))
      .map((it) => ({ label: it.label, pageId: pageIdByKey.get(it.key) as string })),
    cta: p.nav.cta && pageIdByKey.has(p.nav.cta.key)
      ? { label: p.nav.cta.label, pageId: pageIdByKey.get(p.nav.cta.key) as string }
      : undefined,
    footerNote: p.footerNote,
  }

  const dashboardNavItems: Array<{ label: string; pageId: string; icon: string }> = []
  for (const spec of p.pages) {
    const pageId = pageIdByKey.get(spec.key)
    if (!pageId) continue
    if (spec.type === 'dashboard') {
      dashboardNavItems.push({ label: spec.name, pageId, icon: 'layout-dashboard' })
    } else if (spec.type === 'table') {
      dashboardNavItems.push({
        label: spec.name,
        pageId,
        icon: ENTITY_PAGE_ICON[spec.entity ?? ''] ?? 'file-text',
      })
    } else if (spec.type === 'settings') {
      dashboardNavItems.push({ label: spec.name, pageId, icon: 'settings' })
    } else if (spec.type === 'profile') {
      dashboardNavItems.push({ label: spec.name, pageId, icon: 'user' })
    }
  }

  const schema: ProjectSchema = {
    version: 1,
    metadata: {
      name: p.name,
      description: p.description,
      type: p.category,
      style: p.style,
      audience: p.audience,
      icon: p.icon,
      createdAt: TEMPLATE_CREATED_AT,
    },
    theme: { ...p.theme },
    navigation,
    dashboardNav: { items: dashboardNavItems },
    pages,
    mockData,
    settings: { dir: 'rtl', lang: 'ar', currency: 'DZD', projectName: p.name },
  }

  // (الجولة 16) صفحة «حسابي» — فضاء الزبون لكل قالب (id ثابت من القالب
  // حفاظاً على حتمية SSR/CSR) + عنصر شريطها آخر القائمة. الوصول إليها
  // من صفحة الدخول (اختيار «كزبون») — لا تُضاف إلى قائمة الموقع العلوي.
  const ensured = ensureClientAreaPage(schema, { id: `${p.id}-account` })

  return deepClone(ensured.schema)
}
