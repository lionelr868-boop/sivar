// ============================================================
// نموذج — Landing Page Kit (مكتبة أنماط صفحات الهبوط)
// 12 نمطاً جاهزاً: لكل نمط شخصية بصرية ونسخ عربية مصقولة.
// العقد المثبّت: LANDING_VARIANTS / getLandingVariant /
//                buildLandingBlocks / changeLandingVariant
// ============================================================
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import type { Block, LandingVariantId, ProjectPage, ProjectSchema } from '@/lib/types'
import { uid as uidFn } from '@/lib/types'

// ---------- pinned contract ----------

export interface LandingVariantMeta {
  id: LandingVariantId
  name: string
  tagline: string
  /** أنواع المشاريع التي يناسبها النمط (للعرض فقط) */
  bestFor: string[]
  /** كلمة مفتاحية للوصف البصري المصغّر */
  thumb: 'split' | 'centered' | 'gradient' | 'dark' | 'phone' | 'form' | 'video' | 'store' | 'agency' | 'event' | 'minimal' | 'stats'
}

export const LANDING_VARIANTS: LandingVariantMeta[] = [
  { id: 'classic-split', name: 'التقليدي المقسّم', tagline: 'نص + رسم لوحة تحكم — الأسلوب الموثوق لمنتجات SaaS', bestFor: ['SaaS', 'خدمات', 'منصة إدارية'], thumb: 'split' },
  { id: 'centered-bold', name: 'الموسّط الجريء', tagline: 'عنوان ضخم في المنتصف مع تسعير واضح', bestFor: ['SaaS', 'FinTech', 'الذكاء الاصطناعي'], thumb: 'centered' },
  { id: 'gradient-cover', name: 'الغلاف المتدرّج', tagline: 'غلاف لوني كامل يجذب العين فوراً', bestFor: ['الذكاء الاصطناعي', 'تطبيق ويب', 'شبابي'], thumb: 'gradient' },
  { id: 'dark-premium', name: 'الداكن الفاخر', tagline: 'خلفية داكنة بطابع راقٍ للمشاريع المميزة', bestFor: ['FinTech', 'العقارات', 'وكالة'], thumb: 'dark' },
  { id: 'app-showcase', name: 'عرض التطبيق', tagline: 'هاتف في قلب المشهد يعرض تطبيقك', bestFor: ['تطبيق ويب', 'توصيل', 'حجوزات'], thumb: 'phone' },
  { id: 'email-capture', name: 'جمع التسجيلات', tagline: 'نموذج بريد لجمع المهتمين قبل الإطلاق', bestFor: ['SaaS', 'الذكاء الاصطناعي', 'تعليمية'], thumb: 'form' },
  { id: 'video-lead', name: 'بطل الفيديو', tagline: 'بطاقة فيديو تعرض قصة منتجك', bestFor: ['تعليمية', 'مطعم', 'وكالة'], thumb: 'video' },
  { id: 'store-promo', name: 'عرض المتجر', tagline: 'معرض منتجات مباشرة تحت البطل', bestFor: ['متجر إلكتروني', 'Marketplace', 'مطعم'], thumb: 'store' },
  { id: 'agency-bold', name: 'الوكالة الجريئة', tagline: 'بيان قوي + معرض خدمات وفريق العمل', bestFor: ['وكالة', 'خدمات', 'مطعم'], thumb: 'agency' },
  { id: 'event-announce', name: 'إعلان فعالية', tagline: 'تاريخ بارز وخطوات واضحة لحدثك', bestFor: ['تعليمية', 'Marketplace', 'أخرى'], thumb: 'event' },
  { id: 'minimal-startup', name: 'البداية البسيطة', tagline: 'سطر واحد وزر واحد — بساطة مقنعة', bestFor: ['SaaS', 'تطبيق ويب', 'Minimal'], thumb: 'minimal' },
  { id: 'stats-lead', name: 'الأرقام أولاً', tagline: 'أرقام النجاح تسبق كل شيء لبناء الثقة', bestFor: ['FinTech', 'Marketplace', 'الصحة'], thumb: 'stats' },
]

export function getLandingVariant(id: string | undefined | null): LandingVariantMeta {
  return LANDING_VARIANTS.find((v) => v.id === id) ?? LANDING_VARIANTS[0]
}

// ---------- internal helpers ----------

function d(t: keyof typeof BLOCK_REGISTRY): Record<string, unknown> {
  return JSON.parse(JSON.stringify(BLOCK_REGISTRY[t].defaults())) as Record<string, unknown>
}

function mk(t: keyof typeof BLOCK_REGISTRY, props: Record<string, unknown>): Block {
  return { id: uidFn('b_'), type: t as Block['type'], props }
}

/** صفحة التسجيل/الدخول إن وُجدت — لربط زر البطل */
function signupPageId(schema: ProjectSchema): string {
  const signup = schema.pages.find((p) => p.type === 'auth' && p.authVariant === 'signup')
  const login = schema.pages.find((p) => p.type === 'auth')
  return (signup ?? login)?.id ?? ''
}

// ============================================================
// بطل كل نمط + الأقسام الداعمة — نسخ عربية مصقولة
// ============================================================

interface VariantSpec {
  hero: (brand: string) => Record<string, unknown>
  /** أقسام ما بعد البطل — كل دالة ترجع قائمة كتل */
  rest: (brand: string) => Block[]
}

const STATS_TRUST = (brand: string) => [
  { label: `مشترك في ${brand}`, value: '2,400+', change: '+18%' },
  { label: 'مدينة جزائرية', value: '48', change: '' },
  { label: 'معدل رضا العملاء', value: '98%', change: '+2%' },
  { label: 'الدعم الفني', value: '24/7', change: '' },
]

const SPECS: Record<LandingVariantId, VariantSpec> = {
  // ---------------- 1. التقليدي المقسّم ----------------
  'classic-split': {
    hero: (brand) => ({
      eyebrow: '',
      title: `أدر مشروعك بذكاء مع ${brand}`,
      subtitle: 'كل أدواتك في لوحة واحدة — تابع مبيعاتك وعملاءك ونموّك لحظة بلحظة، وودّع الجداول المبعثرة.',
      primaryButton: 'ابدأ تجربة مجانية',
      primaryButtonPage: '',
      secondaryButton: 'شاهد لوحة التحكم',
      layout: 'split',
      visual: 'dashboard',
      titleSize: 'md',
      background: 'default',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('features', { ...d('features'), title: `كل ما يحتاجه مشروعك في ${brand}`, subtitle: 'أدوات بُنيت للسوق الجزائري وساعدت مئات رواد الأعمال' }),
      mk('stats', { title: `${brand} بالأرقام`, items: STATS_TRUST(brand) }),
      mk('testimonials', { ...d('testimonials'), title: 'رواد أعمال جزائريون يثقون بنا' }),
      mk('cta', { ...d('cta'), title: 'جاهز لترتيب مشروعك؟', subtitle: `انضم إلى آلاف المستخدمين الذين أطلقوا مشاريعهم مع ${brand}.` }),
    ],
  },

  // ---------------- 2. الموسّط الجريء ----------------
  'centered-bold': {
    hero: (brand) => ({
      eyebrow: `منصة ${brand} — إصدار جديد`,
      title: 'احترافية بلا تعقيد',
      subtitle: 'خطط واضحة، أدوات قوية، وفريق يقف معك من الفكرة حتى الإطلاق. جرّبها بنفسك اليوم.',
      primaryButton: 'ابدأ مجاناً',
      primaryButtonPage: '',
      secondaryButton: 'شاهد الأسعار',
      layout: 'centered',
      visual: 'none',
      titleSize: 'xl',
      background: 'default',
      align: 'center',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('features', { ...d('features'), title: 'مصمّمة لتبني بثقة', subtitle: 'كل ميزة وضعناها مكانها بعناية لتخدم هدفاً واحداً: نجاحك' }),
      mk('pricing', { ...d('pricing'), title: 'أسعار شفافة بلا مفاجآت', subtitle: 'ابدأ مجاناً وارتقِ متى نما مشروعك — بالدينار الجزائري' }),
      mk('faq', { ...d('faq'), subtitle: `أسئلة يطرحها كل جديد على ${brand}` }),
      mk('cta', { ...d('cta'), style: 'gradient' }),
    ],
  },

  // ---------------- 3. الغلاف المتدرّج ----------------
  'gradient-cover': {
    hero: (brand) => ({
      eyebrow: '',
      title: `${brand} — المستقبل يبدأ من هنا`,
      subtitle: 'منصة عربية بمعايير عالمية. انطلق خلال دقائق واسمح لفكرتك أن تتحدث النتائج عنها.',
      primaryButton: 'انطلق الآن',
      primaryButtonPage: '',
      secondaryButton: 'كيف تعمل؟',
      layout: 'centered',
      visual: 'none',
      titleSize: 'xl',
      background: 'gradient',
      align: 'center',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('stats', { title: '', items: STATS_TRUST(brand) }),
      mk('features', { ...d('features'), title: 'قوة هندسية ببساطة عربية', subtitle: 'كل ما تحتاجه لبناء تجربة رقمية تليق بجمهورك' }),
      mk('steps', { ...d('steps'), title: 'من الصفر إلى الإطلاق', subtitle: `ثلاث خطوات تفصلك عن أول عميل في ${brand}` }),
      mk('cta', { ...d('cta'), style: 'dark' }),
    ],
  },

  // ---------------- 4. الداكن الفاخر ----------------
  'dark-premium': {
    hero: (brand) => ({
      eyebrow: 'تجربة راقية لعملاء راقين',
      title: `${brand} — حيث تُصنع الثقة`,
      subtitle: 'خدمة مخصّصة للمشاريع التي لا تقبل بأقل من الامتياز. فريق مخصص، تقارير معمّقة، واهتمام بكل تفصيلة.',
      primaryButton: 'اطلب عرضاً خاصاً',
      primaryButtonPage: '',
      secondaryButton: 'خدماتنا',
      layout: 'split',
      visual: 'dashboard',
      titleSize: 'lg',
      background: 'dark',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('stats', { title: 'إنجازات تتحدث عن نفسها', items: [
        { label: 'مشروع فاخر أُنجز', value: '120+', change: '+9%' },
        { label: 'عميل دائم', value: '85%', change: '+4%' },
        { label: 'مدينة نخدمها', value: '12', change: '' },
        { label: 'سنوات في السوق', value: '8', change: '' },
      ] }),
      mk('testimonials', { ...d('testimonials'), title: 'شهادات من قمة السوق' }),
      mk('pricing', { ...d('pricing'), title: 'باقات بمعايير المؤسسات', subtitle: 'شفافية كاملة — بلا رسوم خفية' }),
      mk('cta', { ...d('cta'), title: 'لنبنِ شيئاً استثنائياً معاً', subtitle: `تواصل مع فريق ${brand} اليوم واحصل على استشارة مجانية.`, style: 'dark' }),
    ],
  },

  // ---------------- 5. عرض التطبيق ----------------
  'app-showcase': {
    hero: (brand) => ({
      eyebrow: 'متوفر على الهاتف والحاسوب',
      title: `${brand} في جيبك أينما كنت`,
      subtitle: 'اطلب، تابع، واستلم — كل شيء من تطبيق واحد يعمل بسلاسة على شبكة الإنترنت وبيانات الهاتف في الجزائر.',
      primaryButton: 'حمّل التطبيق',
      primaryButtonPage: '',
      secondaryButton: 'شاهد كيف يعمل',
      layout: 'split',
      visual: 'phone',
      titleSize: 'md',
      background: 'muted',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('features', { ...d('features'), title: 'تطبيق صُمّم لحياتك اليومية', subtitle: 'سريع، خفيف على البطارية، ويعمل حتى مع ضعف التغطية' }),
      mk('steps', { ...d('steps'), title: 'ثلاث نقرات ويصلك طلبك', subtitle: 'من فتح التطبيق إلى استلام الطلب' }),
      mk('faq', { ...d('faq'), subtitle: `كل ما يسأل عنه مستخدمو ${brand} الجدد` }),
      mk('cta', { ...d('cta'), title: 'جاهز تجرب التطبيق؟', subtitle: 'انضم لعشرات آلاف المستخدمين في الجزائر.' }),
    ],
  },

  // ---------------- 6. جمع التسجيلات ----------------
  'email-capture': {
    hero: (brand) => ({
      eyebrow: 'الإطلاق قريباً — انضم لقائمة الانتظار',
      title: `${brand} قادم لتغيير قواعد اللعبة`,
      subtitle: 'سنطلق قريباً في الجزائر. سجّل بريدك ليصلك موعد الإطلاق مبكراً مع عرض حصري لأول 100 مشترك.',
      primaryButton: 'أعلمني عند الإطلاق',
      primaryButtonPage: '',
      secondaryButton: '',
      layout: 'centered',
      visual: 'form',
      titleSize: 'lg',
      background: 'default',
      align: 'center',
      emailPlaceholder: 'بريدك الإلكتروني',
      emailButton: 'سجّلني',
    }),
    rest: (brand) => [
      mk('stats', { title: 'الإقبال حتى الآن', items: [
        { label: 'مسجّل في القائمة', value: '1,850', change: '+24%' },
        { label: 'يوم حتى الإطلاق', value: '30', change: '' },
        { label: 'عرض حصري لأول', value: '100', change: '' },
        { label: 'مدن الانطلاق', value: '3', change: '' },
      ] }),
      mk('features', { ...d('features'), title: 'ما الذي يميّزنا؟', subtitle: 'لمحة عمّا ينتظر المشتركين الأوائل' }),
      mk('faq', { ...d('faq'), subtitle: 'أسئلة المهتمين بالإطلاق المبكر' }),
    ],
  },

  // ---------------- 7. بطل الفيديو ----------------
  'video-lead': {
    hero: (brand) => ({
      eyebrow: 'شاهد قصتنا في 90 ثانية',
      title: `${brand} — قصة تبدأ بفكرة`,
      subtitle: 'شاهد كيف نحوّل الأفكار إلى واقع، ثم جرّب بنفسك. تجربة عربية متكاملة صُنعت بحب في الجزائر.',
      primaryButton: 'ابدأ الآن',
      primaryButtonPage: '',
      secondaryButton: 'المزيد عنا',
      layout: 'centered',
      visual: 'video',
      titleSize: 'lg',
      background: 'default',
      align: 'center',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('features', { ...d('features'), title: 'لماذا نحن؟', subtitle: 'ثلاثة أسباب تجعل التجربة مختلفة' }),
      mk('testimonials', { ...d('testimonials'), title: 'قصص نجاح حقيقية' }),
      mk('cta', { ...d('cta'), style: 'gradient' }),
    ],
  },

  // ---------------- 8. عرض المتجر ----------------
  'store-promo': {
    hero: (brand) => ({
      eyebrow: 'توصيل مجاني للطلبات فوق 3,500 دج',
      title: `${brand} — كل ما تحتاجه يصلك لباب البيت`,
      subtitle: 'تشكيلة مختارة بعناية من أفضل المنتجات، بأسعار بالدينار الجزائري تناسب كل الميزانيات، مع توصيل لكل الولايات.',
      primaryButton: 'تسوّق الآن',
      primaryButtonPage: '',
      secondaryButton: 'الأكثر مبيعاً',
      layout: 'split',
      visual: 'orders',
      titleSize: 'md',
      background: 'muted',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('gallery', { ...d('gallery'), title: 'وصل حديثاً', subtitle: 'تشكيلة هذا الأسبوع — كميات محدودة' }),
      mk('features', { ...d('features'), title: 'تسوّق براحتك', subtitle: 'تجربة شراء واضحة من الاختيار حتى التوصيل' }),
      mk('testimonials', { ...d('testimonials'), title: 'ماذا يقول زبائننا؟' }),
      mk('cta', { ...d('cta'), title: 'أول طلبك؟ خصم 10%', subtitle: 'استعمل كود FIRST10 عند الدفع — بالذهبية أو عند الاستلام.', style: 'gradient' }),
    ],
  },

  // ---------------- 9. الوكالة الجريئة ----------------
  'agency-bold': {
    hero: (brand) => ({
      eyebrow: 'وكالة جزائرية بمعايير عالمية',
      title: 'نبني علامات تُذكر',
      subtitle: `${brand} — من الهوية البصرية إلى الحملات الرقمية، نصنع لعملائنا حضوراً لا يمكن تجاهله في السوق الجزائري.`,
      primaryButton: 'ابدأ مشروعك معنا',
      primaryButtonPage: '',
      secondaryButton: 'أعمالنا',
      layout: 'split',
      visual: 'analytics',
      titleSize: 'lg',
      background: 'dark',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('gallery', { ...d('gallery'), variant: 'services', title: 'خدماتنا', subtitle: 'كل ما تحتاجه علامتك التجارية تحت سقف واحد' }),
      mk('team', { ...d('team'), title: 'العقول خلف الوكالة', subtitle: 'فريق شاب موهوب من الجزائر العاصمة ووهران' }),
      mk('testimonials', { ...d('testimonials'), title: 'عملاء يثقون بنا' }),
      mk('contact-form', { ...d('contact-form') }),
      mk('cta', { ...d('cta'), title: 'عندك مشروع في بالك؟', subtitle: 'أرسل لنا فكرتك اليوم واستلم رداً خلال 24 ساعة.', style: 'gradient' }),
    ],
  },

  // ---------------- 10. إعلان فعالية ----------------
  'event-announce': {
    hero: (brand) => ({
      eyebrow: 'السبت 15 مارس 2025 — مركز المؤتمرات، الجزائر العاصمة',
      title: `${brand}: يوم واحد يغيّر مسارك`,
      subtitle: 'فعالية تجمع أبرز الخبراء ورواد الأعمال في الجزائر. محاضرات، ورشات عملية، وفرص تواصل لا تُفوّت.',
      primaryButton: 'احجز مقعدك',
      primaryButtonPage: '',
      secondaryButton: 'برنامج اليوم',
      layout: 'split',
      visual: 'calendar',
      titleSize: 'lg',
      background: 'gradient',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('steps', { ...d('steps'), title: 'كيف تشارك؟', subtitle: 'من التسجيل إلى شهادة الحضور', steps: [
        { title: 'سجّل حضورك', description: 'احجز مقعدك قبل نفاد المقاعد — الأماكن محدودة.' },
        { title: 'اختر ورشاتك', description: 'ثلاث مسارات موازية: تقنية، أعمال، وتسويق.' },
        { title: 'عِش يوم الفعالية', description: 'تعلّم، تواصل، وابنِ علاقات تدوم بعد الفعالية.' },
      ] }),
      mk('stats', { title: `${brand} بالأرقام`, items: [
        { label: 'متحدث خبير', value: '12', change: '' },
        { label: 'ورشة عملية', value: '9', change: '' },
        { label: 'حضور متوقع', value: '500+', change: '+30%' },
        { label: 'شريك راعٍ', value: '8', change: '' },
      ] }),
      mk('faq', { ...d('faq'), subtitle: 'أسئلة الحضور المتكررة' }),
      mk('cta', { ...d('cta'), title: 'المقاعد تنفد سريعاً', subtitle: 'سجّل اليوم واستفد من سعر التسجيل المبكر — 2,500 دج بدل 4,000 دج.' }),
    ],
  },

  // ---------------- 11. البداية البسيطة ----------------
  'minimal-startup': {
    hero: (brand) => ({
      eyebrow: '',
      title: `${brand}`,
      subtitle: 'طريقة أبسط لإدارة ما يهمك. بلا تعقيد، بلا حشو — فقط ما تحتاجه بالضبط.',
      primaryButton: 'ابدأ مجاناً',
      primaryButtonPage: '',
      secondaryButton: '',
      layout: 'split',
      visual: 'testimonial',
      titleSize: 'md',
      background: 'default',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('features', { ...d('features'), title: 'أقل، لكن أفضل', subtitle: 'ثلاث ميزات فقط — لكنها الميزات التي ستستعملها فعلاً كل يوم', items: (d('features').items as Array<Record<string, unknown>>).slice(0, 3) }),
      mk('cta', { ...d('cta'), title: 'جرّبها اليوم', subtitle: 'لا تحتاج بطاقة بنكية — دقيقة واحدة تكفي للبداية.', style: 'default' }),
    ],
  },

  // ---------------- 12. الأرقام أولاً ----------------
  'stats-lead': {
    hero: (brand) => ({
      eyebrow: 'النتائج قبل الوعود',
      title: `${brand} — أرقامنا تتحدث عنا`,
      subtitle: 'لا نبيع الأحلام. نبيع عملاً منظماً تظهر نتائجه في لوحة التحكم من الأسبوع الأول.',
      primaryButton: 'شاهد النتائج بنفسك',
      primaryButtonPage: '',
      secondaryButton: 'إنجازاتنا',
      layout: 'split',
      visual: 'analytics',
      titleSize: 'md',
      background: 'default',
      align: 'start',
      emailPlaceholder: '',
      emailButton: '',
    }),
    rest: (brand) => [
      mk('stats', { title: 'آخر 12 شهراً', items: [
        { label: 'نمو الإيرادات', value: '×3.2', change: '+220%' },
        { label: 'عميل نشط شهرياً', value: '5,600', change: '+34%' },
        { label: 'دقيقة متوسط الرد', value: '4', change: '-12%' },
        { label: 'نسبة تجديد الاشتراك', value: '91%', change: '+6%' },
      ] }),
      mk('features', { ...d('features'), title: 'كيف نحقق هذه الأرقام؟', subtitle: 'منهجية واضحة تعتمد على البيانات لا التخمين' }),
      mk('testimonials', { ...d('testimonials'), title: 'أرقام عملائنا بعد التحول' }),
      mk('cta', { ...d('cta'), style: 'gradient' }),
    ],
  },
}

// ============================================================
// pinned builders
// ============================================================

/** بناء كتل صفحة هبوط كاملة حسب النمط */
export function buildLandingBlocks(schema: ProjectSchema, variantId: string | undefined | null): Block[] {
  const variant = getLandingVariant(variantId)
  const brand = schema.navigation.brand || schema.metadata.name || 'منصتك'
  const spec = SPECS[variant.id]
  const heroProps = { ...spec.hero(brand), primaryButtonPage: signupPageId(schema) }
  return [mk('hero', heroProps), ...spec.rest(brand)]
}

/** تغيير نمط صفحة هبوط قائمة — يعيد بناء كتلها مع الحفاظ على بقية المشروع */
export function changeLandingVariant(schema: ProjectSchema, pageId: string, variantId: string): ProjectSchema {
  const page = schema.pages.find((p) => p.id === pageId)
  if (!page) return schema
  const variant = getLandingVariant(variantId)
  const next: ProjectSchema = JSON.parse(JSON.stringify(schema)) as ProjectSchema
  const target = next.pages.find((p) => p.id === pageId) as ProjectPage
  target.blocks = buildLandingBlocks(next, variant.id)
  return next
}

/** نسخة عرض توضيحي (schema مصغّر) لمعاينة نمط في المكتبة */
export function buildVariantDemoSchema(variantId: string, theme?: ProjectSchema['theme']): ProjectSchema {
  const base = buildLandingBlocks(
    {
      navigation: { brand: 'منصتك', items: [], footerNote: 'صُنع بحب في الجزائر' },
      pages: [],
    } as unknown as ProjectSchema,
    variantId,
  )
  return {
    version: 1,
    metadata: {
      name: 'معاينة النمط',
      description: 'معاينة صفحة هبوط',
      type: 'other',
      style: 'modern',
      audience: '',
      icon: 'layers',
      createdAt: new Date().toISOString(),
    },
    theme: theme ?? {
      primary: '#7c3aed',
      primaryForeground: '#ffffff',
      secondary: '#f2eefd',
      accent: '#ede9fe',
      background: '#fafafa',
      surface: '#ffffff',
      text: '#1c1726',
      mutedText: '#6e6880',
      border: '#eae7f0',
      radius: 12,
      shadow: 'md',
      fontFamily: 'IBM Plex Sans Arabic',
      mode: 'light',
    },
    navigation: { brand: 'منصتك', items: [], footerNote: 'صُنع بحب في الجزائر' },
    dashboardNav: { items: [] },
    pages: [{ id: 'demo_page', name: 'الرئيسية', slug: '', type: 'landing', blocks: base }],
    mockData: { currency: 'DZD', stats: {}, entities: {}, charts: {} },
    settings: { dir: 'rtl', lang: 'ar', currency: 'DZD', projectName: 'معاينة النمط' },
  }
}
