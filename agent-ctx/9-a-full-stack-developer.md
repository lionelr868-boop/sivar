# Task 9-a — React/Renderer Side (الرسوم الواقعية + خلفيات الصور + رسوم مُرتقاة)

**Agent:** full-stack-developer (React side)
**Ownership:** `src/components/prototype/**`, `src/components/builder/theme-panel.tsx`, `src/lib/registry/blocks.ts`, `src/lib/types.ts`, `src/lib/i18n/builder.ts` (append فقط), `src/lib/project/landing-kit.ts` + ملفات جديدة: `src/components/prototype/blocks/hero-visuals.tsx`, `src/lib/client-image.ts`.

## ما أُنجز (ملخص سريع)

1. **الرسم الجانبي للبطل أصبح واقعياً** — ملف جديد `hero-visuals.tsx` فيه 7 بطاقات تبدو كلقطات منتج حقيقي (تُستعمل في التخطيط المقسّم):
   - `DashboardMockVisual` («رسم توضيحي حي لواجهة لوحة التحكم»): تروستة (3 نقاط نافذة + `app.example.dz` + جرس بنقطة حمراء) + شريط جانبي w-28 (علامة «لوحتي» + 4 صفوف تنقل، «لوحة التحكم» نشط بشريط primary-start) + 3 بطاقات KPI (3.4م دج/1,248/5,880 + شارات خضراء) + **منحنى خطي حقيقي** (viewBox 260x90، 7 نقاط 32→82، Catmull-Rom، تدرّج مساحة 26%→2%، شبكة متقطعة، نقاط بيضاء، تسميات جانفي/مارس/ماي، RTL: أول فئة يميناً) + قائمة 3 طلبات (PAvatar + PBadge + مبالغ) + **شارة إشعار عائمة** (-top-3 -start-3): «طلب جديد من وهران — 12,500 دج — قبل دقيقتين».
   - `PhoneMockVisual` («رسم توضيحي لهاتف التطبيق»): إطار 9/19 rounded-34px + شريط حالة `9:41` + رموز إشارة/واي فاي/بطارية SVG + نوتش + رأس «صباح الخير، سارة» + بطاقة رصيد بتدرّج primary→accent («248,500 دج» + رقاقة بيضاء) + 4 إجراءات سريعة + بطاقة أعمدة «آخر 7 أيام» (آخر عمود accent) + معاملتان + شريط تبويب سفلي + home indicator.
   - `AnalyticsVisual` («بطاقة تقرير الأداء»): منحنى 520x180 بعشر نقاط صاعدة مع انخفاض + توهج drop-shadow + رقائق KPI.
   - `OrdersVisual` («بطاقة أحدث الطلبات»): 5 صفوف بمدن جزائرية + شارات (مكتمل/جديد/قيد المعالجة/ملغى) + تذييل «5 طلبات جديدة هذا الأسبوع».
   - `ChatVisual` («بطاقة المحادثات»): فقاعة واردة + صادرة primary + مؤشر كتابة متحرك (pt-typing) + شريط إدخال وهمي بزر إرسال دائري.
   - `CalendarVisual` («بطاقة التقويم»): ديسمبر 2024 (يبدأ الأحد) + اليوم 12 primary + نقاط أحداث 3/18/25 + تذييل «3 مواعيد هذا الأسبوع».
   - `TestimonialVisual` («بطاقة رأي عميل»): اقتباس عملاق 15% + 5 نجوم + نص الشهادة + صف الشخص + «عميل موثّق».
2. **`visual` للبطل: 10 قيم** — أُضيف analytics/orders/chat/calendar/testimonial إلى النوع + VISUAL_KINDS + خيارات السجل بترتيب العقد. الموسّط: هاتف/فيديو يُكوَّم كما كان، الجديدة لا تُعرض (كما dashboard).
3. **الرسوم البيانية مُرتقاة**: LineChart (تدرّج خط رأسي primary→55% أبيض، عرض 3، توهج، رسم pt-draw 1.1s + ظهور مساحة pt-fade-in، تحويم: خط تسديد + نقطة r=6 + تلميح مقيَّد بالحواف بأرقام ar-DZ)، BarChart (نمو pt-anim-bar متدرّج 60ms، العمود الأعلى accent، تحويم بتلميح + خفوت البقية 0.55)، DonutChart (تحويم موحّد: سماكة 23 + شفافية 0.55 + مزامنة مع صفوف المفتاح)، ChartFrame (بلاطة أيقونة رسم صاعد في الترويسة). `smoothPath` مُصدَّر من line-chart يستعمله hero-visuals.
4. **خلفيات صور الأقسام**: مساعد واحد `sectionImageStyle(p)` في shared.tsx (bgImage + bgOverlay بنفس قيم أغطية البطل حرفياً + دالة isImageNoOverlay للظل النصي) + SectionHeading يقبل dark/textShadow + SectionShell يقبل style. طُبّق على **cta, banner, features, testimonials, stats, steps, gallery, team, faq** — بلا صورة: نفس السلوك القديم بالبايت (توافق خلفي). المعرض: حقل `image` لكل عنصر (img cover مكان الرمزية)؛ الفريق: `image` → صورة دائرية مكان أفاتار الحروف.
5. **خلفية المشروع كلّه**: `ProjectBranding.bgImage/bgImageName/bgOverlay (none|strong|medium|soft)` في types.ts. PrototypeThemeScope يقبل bgImage/bgOverlay: مع صورة يصبح النطاق relative+isolate بخلفية شفافة وطبقة `z-index:-1` inset-0 (صورة cover + غسلة var(--pt-bg) بشفافية strong .9 / medium .74 / soft .55 / none 0) تغطي كامل ارتفاع المحتوى. PrototypeRenderer يمرر branding.bgImage/bgOverlay (افتراضي medium) + جذور القشور الثلاث (Site/Auth/Dashboard + فراغ «لا صفحات») تصبح bg-transparent عند وجود الصورة — البطاقات/التروستات/الشريط الجانبي تحتفظ بألوانها فتطفو فوق الصورة. AuthShell keeps توهجاتها فوق الصورة.
6. **لوحة الهوية**: قسم جديد «خلفية المشروع» بعد الشعار (رفع/معاينة h-28/استبدال/إزالة + Select «قوة ظهور الخلفية» بترتيب strong/medium/soft/none وتسميات العقد) يستعمل `processImageFile` من **`src/lib/client-image.ts` الجديد** (≤5MB، تصغير 1600px، JPEG 0.82 — نسخة مشتركة من معالج properties-panel؛ لم أمس properties-panel).
7. **theme-provider PT CSS** += `pt-typing` (مؤشر الكتابة) + `pt-draw`/`.pt-anim-line` + `pt-fade-in`/`.pt-anim-area` + `pt-bar`/`.pt-anim-bar` (transform-box: fill-box) + حارس `@media (prefers-reduced-motion: reduce)` للثلاثة.
8. **السجل**: HERO_VISUAL_OPTIONS = 10؛ حقول bgImage/bgOverlay في آخر ترتيب حقول الكتل التسع؛ حقل image أول itemFields للمعرض/الفريق. defaults لم تتغير لأي خاصية قائمة.
9. **landing-kit**: store-promo→orders، agency-bold→analytics (+split/start/lg لعرضه)، event-announce→calendar (+split/start/lg)، minimal-startup→testimonial (+split/start/md)، stats-lead→analytics. البقية كما هي.
10. **i18n** (إلحاق فقط): projectBgSection/UploadBtn/Hint/Replace/Remove/Overlay/OverlayStrong/OverlayMedium/OverlaySoft/OverlayNone/Uploaded/TooLarge/Invalid.
11. **PBadge**: دمج className عبر cn (twMerge) ليَعمل تجاوز `text-[9px]` في رسوم البطل — توافقي خلفي كامل.

## التحقق
- `npx tsc --noEmit`: **صفر أخطاء في ملفاتي** (الخطأ الوحيد الظاهر الآن في `src/lib/export/generate.ts` line ~3269 `heroBg does not exist in type RenderCtx` — **ملف 9-b قيد التحرير المتوازي، ليس لي**).
- `bun run lint`: 0 أخطاء (تحذير الخطوط القديم وحده).
- سكربت bun مؤقت (حُذف): 60/60 — قيم visual للأنماط العشرة + demoSchemas + السجل 29/29 + خيارات الرسم 10 + حقول الكتل التسع + itemFields + مفاتيح i18n + أنواع العلامة.
- سكربت SSR مؤقت (حُذف): 44/45 والفشل الوحيد كان خيط بحث خاطئ في السكربت نفسه (strokeDasharray مقابل stroke-dasharray — تحققت يدوياً أن `stroke-dasharray:1` يُخرج فعلاً) → **كل الفحوص تمر**: محتوى كل الرسوم الجديدة يُخرَج SSR + أصناف الحركات + keyframes + طبقة خلفية المشروع (مع/بدون).
- curl `/` → 200، dev.log نظيف (Compiles بلا أخطاء).
- لا ملفات اختبار في المستودع، لا اعتماديات جديدة، لا `next build`.

## عقود مطابقة 100% (للمراجعة السريعة)
- أنواع visual الكاملة: `dashboard | phone | video | form | analytics | orders | chat | calendar | testimonial | none`.
- كتل خلفية الصورة: `cta, banner, features, testimonials, stats, steps, gallery, team, faq` (+`image` في عناصر gallery/team).
- مفاتيح العلامة: `bgImage?, bgImageName?, bgOverlay?: 'none'|'strong'|'medium'|'soft'` (افتراضي medium عند غيابها مع صورة).
- قيم أغطية الأقسام: dark/medium/light/none بنفس تدرّجات البطل؛ none → نص أبيض + textShadow `0 2px 12px rgba(0,0,0,.45)`.

## ملاحظات للوكلاء الآخرين
- **9-b (تصدير)**: انعكاس HTML للرسوم السبعة في `hero-visuals.tsx` (المحتوى الحرفي بالمواصفة فوق) + نفس sectionImageStyle للكتل التسع + صور عناصر المعرض/الفريق + طبقة خلفية المشروع في القشور + stripTransientImages يجب أن يشمل الآن أيضاً `bgImage/bgImageName` لكل الكتل التسع (ليس البطل فقط) + `branding.bgImage/bgImageName` بعد التحميل (تبقى في ZIP كـ assets). i18n مفتاح `projectBgHint` يذكر ذلك للمستخدم.
- **9-c (تكامل)**: لا حاجة لتغييل شيء في prototype-renderer (حالات الكتل موجودة كلها) — فقط تحقق بصري في المتصفح لـ: رسوم البطل الجديدة (بدّل visual من لوحة الخصائص)، رفع خلفية قسم (مثلاً CTA)، رفع خلفية المشروع من لوحة الهوية + تبديل قوة الظهور، تحويم الرسوم البيانية (خط/أعمدة/دونات).
- المعرض/الفريق: حقول صور العناصر تُعرض تلقائياً في properties-panel (ImageField عام عبر SimpleField) — لم يحتج الملف لأي تعديل.
