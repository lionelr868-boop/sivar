// نصوص مشتركة لكل المنصة — Arabic common strings
export const common = {
  // brand
  brand: 'نموذج',
  brandTagline: 'حوّل فكرتك إلى نموذج أولي حقيقي',

  // buttons
  save: 'حفظ',
  cancel: 'إلغاء',
  delete: 'حذف',
  edit: 'تعديل',
  open: 'فتح',
  preview: 'معاينة',
  download: 'تحميل',
  close: 'إغلاق',
  confirm: 'تأكيد',
  back: 'رجوع',
  next: 'التالي',
  retry: 'إعادة المحاولة',
  create: 'إنشاء',
  search: 'بحث...',

  // statuses
  statusDraft: 'مسودة',
  statusBuilding: 'قيد البناء',
  statusReady: 'جاهز',
  statusDownloaded: 'تم تحميله',

  // time
  justNow: 'الآن',
  minutesAgo: 'منذ {n} دقيقة',
  hoursAgo: 'منذ {n} ساعة',
  daysAgo: 'منذ {n} يوم',
  today: 'اليوم',
  yesterday: 'أمس',

  // demo
  demoNotice: 'هذه بيانات تجريبية للنموذج الأولي فقط',
  demoDataBadge: 'بيانات تجريبية',

  // misc
  loading: 'جارٍ التحميل...',
  error: 'حدث خطأ ما',
  errorHint: 'حاول مرة أخرى، وإذا استمرت المشكلة أخبرنا.',
  required: 'هذا الحقل مطلوب',
  optional: 'اختياري',
  currencyDZD: 'دج',
  pages: 'صفحات',
  version: 'الإصدار',
  of: 'من',
  all: 'الكل',
  notifications: 'الإشعارات',
  myAccount: 'حسابي',
  logout: 'تسجيل الخروج',
  saved: 'تم الحفظ',
} as const

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return common.justNow
  if (mins < 60) return common.minutesAgo.replace('{n}', String(mins))
  const hours = Math.floor(mins / 60)
  if (hours < 24) return common.hoursAgo.replace('{n}', String(hours))
  const days = Math.floor(hours / 24)
  if (days < 30) return common.daysAgo.replace('{n}', String(days))
  return d.toLocaleDateString('ar-DZ')
}

export function formatNumber(n: number): string {
  return n.toLocaleString('ar-DZ')
}
