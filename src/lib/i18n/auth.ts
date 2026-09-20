// نصوص صفحات الدخول والتسجيل — auth strings (Arabic only)
export const auth = {
  // header
  welcomeTitle: 'مرحبًا بك في SIVAR',
  welcomeSubtitle: 'سجّل دخولك أو أنشئ حسابًا جديدًا لتبدأ رحلتك',

  // tabs
  tabLogin: 'تسجيل الدخول',
  tabSignup: 'إنشاء حساب',

  // fields
  nameLabel: 'الاسم الكامل',
  namePlaceholder: 'مثال: أحمد بن علي',
  emailLabel: 'البريد الإلكتروني',
  emailPlaceholder: 'name@example.com',
  passwordLabel: 'كلمة المرور',
  passwordPlaceholder: '••••••••',

  // actions
  loginSubmit: 'دخول',
  signupSubmit: 'إنشاء حساب',
  forgotLink: 'نسيت كلمة المرور؟',
  backToHome: 'العودة إلى الرئيسية',

  // forgot password
  forgotTitle: 'استعادة كلمة المرور',
  forgotSubtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة.',
  forgotSubmit: 'إرسال رابط الاستعادة',
  forgotSuccess: 'إذا كان البريد مسجلًا ستصلك رسالة',
  forgotBack: 'العودة لتسجيل الدخول',

  // demo
  demoButton: 'تجربة سريعة بدون تسجيل',
  demoHint: 'المصادقة تجريبية في هذه النسخة — أي بريد وكلمة مرور يعملان.',

  // validation
  errEmailRequired: 'البريد الإلكتروني مطلوب',
  errEmailInvalid: 'أدخل بريدًا إلكترونيًا صحيحًا',
  errPasswordRequired: 'كلمة المرور مطلوبة',
  errPasswordShort: 'كلمة المرور 6 أحرف على الأقل',
  errNameRequired: 'الاسم مطلوب',
  errNameShort: 'الاسم قصير جدًا — حرفان على الأقل',

  // misc
  orDivider: 'أو',

  // a11y
  showPassword: 'إظهار كلمة المرور',
  hidePassword: 'إخفاء كلمة المرور',
  passwordToggle: 'تبديل ظهور كلمة المرور',
} as const
