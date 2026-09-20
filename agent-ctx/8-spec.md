# Task 8 Spec — عقود الميزات الجديدة (أزرار عاملة + خلفية صور + جودة)

هذا الملف هو **العقد الملزم** لمهام الجولة 8. اقرأه بالكامل قبل الكتابة.

## الهدف العام (طلب المستخدم)
1. **كل الأزرار في المشاريع تعمل** (المعاينة الحية + التصدير) + **زر عودة للخلف** في كل صفحات المشروع غير الرئيسية.
2. **رفع صورة كخلفية لقسم البطل** في صفحة الهبوط — الصورة مؤقتة: تُحذف من قاعدة البيانات فور تحميل المشروع ZIP (تبقى داخل ZIP فقط).
3. **رفع معايير الجودة**: تدرجات/تظليل جميل في صفحات الهبوط + لوحات تحكم أغنى وأكثر واقعية.

## ملكية الملفات (لا تكتب خارج ملكيتك أبداً)
- **Main agent (8-a)**: `src/lib/types.ts`, `src/lib/project/nav-targets.ts` (جديد), `src/components/prototype/blocks/shared.tsx`, `hero-block.tsx`, `pricing-block.tsx`, `cta-block.tsx`, `banner-block.tsx`, `state-blocks.tsx`, `dashboard-header-block.tsx`, `auth-card-block.tsx`, `features-block.tsx`, `stats-block.tsx`, `testimonials-block.tsx`, `data-table-block.tsx`, `src/components/prototype/prototype-renderer.tsx`, `src/components/builder/preview-mode.tsx`, `src/app/api/projects/[id]/export/route.ts`, `src/lib/i18n/builder.ts` (مفاتيح 8-a فقط).
- **8-b**: `src/lib/export/generate.ts` فقط.
- **8-c**: `src/components/prototype/blocks/activity-feed-block.tsx` (جديد), `tasks-list-block.tsx` (جديد), `quick-actions-block.tsx` (جديد), `src/lib/registry/blocks.ts`, `src/components/builder/properties-panel.tsx`, `src/lib/project/templates.ts`, `src/lib/i18n/builder.ts` (إلحاق مفاتيح 8-c في نهاية الكائن).

## عقد التنقل الذكي (nav-targets.ts — يملكه main، يستورده الجميع)
ملف `src/lib/project/nav-targets.ts` يصدّر دوال نقية (تعمل على الخادم والعميل):
- `findHomePage(schema)` → أول صفحة type==='landing' وإلا pages[0]
- `findAuthPage(schema, prefer?)` → صفحة auth (يُفضّل signup إن وجدت، وإلا login، وإلا forgot)
- `findPricingPage(schema)`, `findDashboardPage(schema)`, `findFormPage(schema)`, `findTablePage(schema)`
- `heroPrimaryTarget(schema, explicitPageId?)` → explicit إن صالح؛ وإلا auth؛ وإلا pricing؛ وإلا dashboard؛ وإلا home. يرجع pageId (string, قد يكون homeId دائماً موجوداً).
- `heroSecondaryTarget(schema, currentPage)` → { anchor?: 'features'|'pricing'|'testimonials'|'faq', pageId?: string } — إن كانت الصفحة الحالية فيها قسم features → anchor 'features'؛ وإلا صفحة pricing → pageId؛ وإلا home.
- `pricingButtonTarget(schema)` → auth (signup مفضل)؛ وإلا form؛ وإلا home.
- `ctaButtonTarget(schema)` → auth؛ وإلا pricing؛ وإلا home.
- `bannerButtonTarget(schema)` → pricing؛ وإلا auth؛ وإلا home.
- `stateActionTarget(schema)` → dashboard إن وُجد (لصفحات اللوحات) — توقيعه `stateActionTarget(schema, fromDashboard?: boolean)`.
- `dashboardActionTarget(schema)` → أول صفحة form؛ وإلا أول table؛ وإلا dashboard نفسه.

**نفس هذه القواعد تنعكس حرفياً في التصدير (8-b) عبر href** وفي React (8-a) عبر ctx.onNavigate.

## عقد الكتل الجديدة (8-c React + 8-b Export — نفس الخصائص حرفياً)

### activity-feed (سجل النشاطات)
```ts
props: {
  title: string                       // 'آخر النشاطات'
  items: Array<{
    user: string        // 'أحمد بن علي'
    action: string      // 'أضاف منتجاً جديداً'
    target?: string     // 'حقيبة جلدية فاخرة' (اختياري)
    time: string        // 'قبل 5 دقائق'
  }>
}
```
الشكل: بطاقة بعنوان + قائمة عمودية: كل عنصر = أفاتار دائرية (حرف أول من user) + سطر «{user} {action} {target}» + وقت رمادي صغير. خط فاصل بين العناصر، نقطة زخرفية primary عند بداية كل عنصر. بحد أقصى عرض العناصر 6.

### tasks-list (المهام — مربعات اختيار تعمل)
```ts
props: {
  title: string            // 'مهام اليوم'
  subtitle?: string        // '3 من 5 منجزة'
  items: Array<{
    label: string          // 'مراجعة طلب #1024'
    done: boolean
    meta?: string          // 'اليوم 14:00' (اختياري)
  }>
}
```
الشكل: بطاقة + عنوان + شريط تقدّم (نسبة المنجَز، بلون primary) + قائمة: checkbox حقيقية قابلة للتبديل (React: useState محلي؛ Export: script.js يبدّل checked ويحدّث شريط التقدّم والعداد النصي في نفس البطاقة عبر data attrs) + label يخطّ عند done + meta رمادي. عند التبديل يُحدَّث التقدّم فورياً.

### quick-actions (إجراءات سريعة — أزرار تعمل)
```ts
props: {
  title: string            // 'إجراءات سريعة'
  actions: Array<{
    icon: string           // lucide name من ICON_FIELD_OPTIONS
    label: string          // 'إضافة منتج'
    pageId: string         // هدف التنقل (حقل نوع 'page')
  }>
}
```
الشكل: شبكة بطاقات صغيرة 2×n (md:3، lg:4 أعمدة حسب العدد) — كل بطاقة زر: بلاطة أيقونة بتدرج primary→accent شفاف + label + سهم «‹» يشير لليسار (RTL forward). الضغط ينقل إلى pageId (React: ctx.onNavigate؛ Export: href). إن كان pageId غير صالح → تجاهل (hidden) في التصدير، وفي React زر معطّل.

## عقد خلفية البطل بالصورة (hero)
خصائص hero الجديدة (يضيفها 8-c في registry، يعرضها 8-a في React، و8-b في التصدير):
```ts
bgImage?: string      // data URL — مؤقتة، تُحذف من DB بعد التحميل
bgImageName?: string  // اسم الملف للعرض في المحرر فقط
bgOverlay?: 'dark' | 'medium' | 'light' | 'none'   // افتراضي 'dark'
```
- عند وجود bgImage: section البطل يتحول لخلفية صورة cover center + طبقة تدرج فوقها حسب bgOverlay:
  - dark: `linear-gradient(180deg, rgba(13,10,25,.62), rgba(13,10,25,.78))`
  - medium: `linear-gradient(180deg, rgba(13,10,25,.38), rgba(13,10,25,.55))`
  - light: `linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.72))` (نص داكن)
  - none: بلا طبقة (المستخدم مسؤول عن التباين — اجعل النص أبيض مع ظل نص خفيف)
- النص: أبيض عند dark/medium/none، داكن (var(--pt-text)) عند light.
- خلفيات hero الجديدة (محارف): `gradient-soft` = `linear-gradient(180deg, color-mix(in srgb, var(--pt-primary) 10%, var(--pt-bg)) 0%, var(--pt-bg) 100%)` و`mesh` = radial-gradient×2 (primary 14% شفاف + accent 12% شفاف) فوق var(--pt-bg) — كلاهما نص داكن.
- في التصدير: الصورة تُكتب `assets/hero-bg.{ext}` (عبر dataUrlToAsset)، root يستخدم `assets/...` والمجلدات `../assets/...`، وتُهرَّب CSS url.
- **الحذف بعد التحميل**: export route (main) يزيل bgImage/bgImageName من hero blocks بعد توليد ZIP ويحدث project.schemaJson + الإصدار بالمخطط المنقّى. helper: `stripTransientImages(schema)` في `src/lib/server/session.ts`؟ لا — main ينفذها محلياً في route.

## زر العودة للخلف
- **التصدير (8-b)**: في كل صفحة غير الرئيسية (site/auth/dashboard shells): زر عائم ثابت `bottom:20px; inset-inline-start:20px` (44px، دائري، بلون primary، أيقونة سهم لليمين ← يشير "للخلف" في RTL) + نص "عودة" يظهر عند التوسّع (hover/لمس: pill يتمدد). onclick في script.js: `if (document.referrer && document.referrer.indexOf(location.origin)===0 && history.length>1) history.back() else location.href=HOME`. HOME يُمرَّر عبر data-home على الزر.
- **React (8-a)**: نفس الزر العائم في Shells (site non-home + auth + dashboard) → ctx.onNavigate(homeId). يختفي في mini.
- **شريط المعاينة (preview-mode.tsx)**: زر «رجوع» في الترويسة مع مكدس تاريخ داخلي.
- في لوحات التحكم أيضاً: رابط نصي «العودة إلى الموقع» أسفل الشريط الجانبي + زر في قائمة المستخدم.

## تروستة لوحة التحكم (dashboard topbar)
كلا الطرفين (React 8-a + Export 8-b) يضيفان شريطاً علوياً في DashboardShell (سطح المكتب والهاتف):
- **بحث**: input «ابحث في الصفحة...» يفلتر صفوف جداول data-table في نفس الصفحة (React: حالة مرفوعة عبر ctx.tableSearch + data-table-block يدمجها مع بحثه؛ Export: script.js `[data-topbar-search]` يفلتر كل `.pt-table` في الصفحة).
- **جرس إشعارات**: زر → قائمة منسدلة (3 إشعارات جزائرية) + نقطة حمراء غير مقروء + زر «تحديد الكل كمقروء» يعمل (يزيل النقطة/يختمها).
- **قائمة المستخدم**: أفاتار + اسم «مستخدم تجريبي» → قائمة: «الملف الشخصي» (صفحة profile)، «الإعدادات» (صفحة settings)، فاصل، «تسجيل الخروج» (صفحة auth login). كلها روابط/تنقل حقيقية إن وُجدت الصفحة، وإلا تُخفى.
- الشريط الجانبي: أسفله رابط «العودة إلى الموقع» (home) بأيقونة globe/arrow.
- mini: تُعرض نسخة مبسطة بلا بحث/قوائم.

## أزرار أخرى يجب أن تعمل (كلا الطرفين)
- hero primary → heroPrimaryTarget. hero secondary → heroSecondaryTarget (anchor سلايد/scroll سلس أو pageId).
- pricing لكل خطة → pricingButtonTarget (زر الخطة المميّزة primary والبقية outline كما هي).
- cta → ctaButtonTarget. banner → bannerButtonTarget.
- state-blocks (empty/error) actionText → stateActionTarget (dashboard عند استخدامها داخل لوحة، home وإلا).
- dashboard-header actions → dashboardActionTarget (الكل نفس الهدف؛ الأول primary بالأيقونة Plus).
- auth-card: submit لـ login **و signup** → لوحة التحكم (React: onNavigate فوراً؛ Export: form data-redirect). forgot → رسالة نجاح كما هي.
- مفتاح التشغيل settings: يعمل (Export موجود؛ React موجود — تأكد فقط).
- play button البطل: toggle حالة (Export موجود pt-play--clicked؛ React: حالة نفسية بسيطة).
- جداول البحث/الترقيم: React يعمل؛ Export: البحث يعمل — **أضف ترقيماً بسيطاً في export** (أزرار سابق/تالي تُظهر صفحة من الصفوف عبر script.js، 5 صفوف افتراضياً) — إن تعقّد، فيسار البحث كافياً مع كل الصفوف ظاهرة.

## تحسينات جمالية (تدرجات/تظليل — كلا الطرفين)
- features: بلاطة الأيقونة بتدرج `color-mix(primary 12%, transparent)` → hover يرفع البطاقة (translateY(-2px)) ويظلل الحدّ primary 35%.
- stats: القيم بتدرج نصي `background:linear-gradient(135deg,var(--pt-primary),var(--pt-accent)); -webkit-background-clip:text; color:transparent`.
- testimonials: علامة اقتباس زخرفية كبيرة بتدرج شفاف + حلقة حول الأفاتار.
- cta: توهج داخلي (radial highlight) فوق التدرج الحالي.
- hero eyebrow عند الخلفيات الفاتحة الجديدة: نفس معالجة default.
- p-button primary: `box-shadow:0 4px 14px color-mix(in srgb, var(--pt-primary) 35%, transparent)` + hover translate-y-(-1px).

## قواعد صارمة
- كل نص مستخدم يمر عبر `esc()` في التصدير (8-b) — لا استثناءات.
- بلا مكتبات خارجية جديدة. Export يبقى HTML/CSS/JS خالصاً صالحاً لـ Netlify مباشرة.
- `bun run lint` و `npx tsc --noEmit` نظيفان في ملفاتك.
- الرموز/الألوان عبر متغيرات `--pt-*` فقط.
- RTL أصيل: السهم "للخلف" يشير يميناً (→)، "للأمام" يساراً (←).
- سجّل عملك في `/home/z/my-project/worklog.md` (إلحاق فقط) بنفس قالب الأقسام السابقة + اذكر Task ID.
