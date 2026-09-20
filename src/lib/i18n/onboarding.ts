// نصوص مرحلة التهيئة الأولى — onboarding strings (Arabic only)
export const onboarding = {
  // header
  greeting: 'مرحبًا بك 👋',
  lead: 'لنبدأ ببناء فكرتك.',
  stepOf: 'الخطوة {current} من {total}',

  // step 1 — name
  step1Title: 'ما اسمك؟',
  step1Subtitle: 'حتى نناديك باسمك داخل المنصة.',
  step1Label: 'الاسم',
  step1Placeholder: 'مثال: أحمد',

  // step 2 — project type
  step2Title: 'ما نوع مشروعك؟',
  step2Subtitle: 'اختر النوع الأقرب لفكرتك — يساعدنا على اقتراح القوالب المناسبة.',

  // step 3 — idea
  step3Title: 'ما فكرتك؟',
  step3Subtitle: 'صفها بجملة أو جملتين — كلما كانت أوضح كان التحليل أدق.',
  step3Label: 'وصف الفكرة (اختياري)',
  step3Placeholder:
    'مثال: أريد منصة تساعد أصحاب المطاعم على إدارة الطلبات والقائمة الإلكترونية والعملاء.',
  step3Skip: 'تخطي هذه الخطوة',

  // step 4 — style
  step4Title: 'ما النمط الذي تفضله؟',
  step4Subtitle: 'اختر الطابع العام لتصميم مشروعك — يمكنك تغييره لاحقًا.',
  styleModernDesc: 'خطوط نظيفة وألوان هادئة',
  styleMinimalDesc: 'أقل تفاصيل وتركيز على المحتوى',
  styleProfessionalDesc: 'مظهر رسمي يوحي بالثقة',
  styleLuxuryDesc: 'ألوان ذهبية ولمسات راقية',
  styleYouthfulDesc: 'ألوان جريئة وطاقة عالية',
  styleTechDesc: 'طابع تقني عصري',

  // navigation
  back: 'رجوع',
  next: 'التالي',

  // finish
  finish: 'إنشاء أول Prototype',
  finishing: 'جارٍ التجهيز...',
  successTitle: 'رائع، اكتملت الإعداد!',
  successSubtitle: 'نجهّز الآن مساحة عملك لإنشاء أول نموذج أولي لك.',
  errSubmit: 'تعذّر إكمال الإعداد، حاول مرة أخرى.',

  // validation
  errNameRequired: 'اكتب اسمك أولًا',
  errNameShort: 'الاسم قصير جدًا — حرفان على الأقل',
  errTypeRequired: 'اختر نوع المشروع',
  errStyleRequired: 'اختر نمطًا',

  // a11y
  stepIndicator: 'خطوات الإعداد',
} as const
