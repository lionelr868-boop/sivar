# الجولة 16 — دخول بالأدوار في النماذج التصورية (مدير / زبون) + فضاء الزبون

طلب المستخدم الحرفي:
> «هناك شيء أريد منك تطويره وهو لوحة تحكم الزبون، حيث أريد اضافة ميزة في تسجيل الدخول وهي الدخول كمدير للوحة تحكم المدير أو الدخول كزبون للوحة تحكم الزبون في النماذج التصورية، واريد منك رفع جودة المشروع لدورة أخرى مع معالجة أي أخطاء»

## الفكرة
كل نموذج تصوري (في معاينة المنصة وفي الموقع الثابت المُصدَّر) يصبح فيه **دوران**:
- **مدير (admin)**: يدخل من صفحة الدخول باختيار «كمدير» → لوحة تحكم المدير الكاملة (الشريط الجانبي الحالي بكل صفحاته + CRUD الجولة 15).
- **زبون (client)**: يختار «كزبون» → **فضاء الزبون** (صفحة «حسابي» جديدة بجمهور client): ترويسة ترحيب، بطاقات إحصاء لطلباته، جدول «طلباتي» للقراءة فقط، بطاقة ملفه، إجراءات سريعة.
- **طلب حقيقي من التسعير**: زبون مسجّل يضغط زر خطة في صفحة التسعير → يُنشأ طلب فعلي (صف جديد في كيان orders عبر طبقة البيانات) → يظهر في «طلباتي» وفي جدول طلبات المدير.

## العقود المثبّتة (لا تحيد عنها أبداً)

### 1) الأنواع — src/lib/types.ts (منفّذة مسبقاً في 16-0)
```ts
export type PageAudience = 'admin' | 'client'
// ProjectPage يضاف:
audience?: PageAudience   // undefined = admin (توافق كامل مع كل المشاريع القديمة)
```
- صفحات منطقة اللوحة (dashboard/table/form/settings/profile) قد تحمل audience. صفحات landing/auth/pricing/faq/custom بلا audience أبداً.

### 2) هوية الزبون التجريبي — src/lib/content/mock-data.ts (منفّذة في 16-0)
```ts
export const DEMO_CLIENT = { name: 'أمينة بلقاسم', email: 'amina@sivar.dz', city: 'وهران' }
```

### 3) صفحة فضاء الزبون
- Contract ثابت: `{ name: 'حسابي', slug: 'account', type: 'dashboard', audience: 'client' }` — تُبنى برمجياً لكل قالب (id = `${pack.id}-account`) وفي add_page عند audience='client'.
- كتلها بالترتيب (كلها أنواع موجودة — لا تُضف نوع كتلة جديد):
  1. `dashboard-header`: title `مرحباً أمينة 👋` / subtitle `هذا فضاؤك الشخصي — طلباتك ونشاطك في مكان واحد` / actions `''`
  2. `stats-row`: 4 بطاقات تُحسب وقت البناء من صفوف الزبون في كيان النشاط: «إجمالي طلباتك» (العدد)، «قيد المعالجة» (عدد status فيها «جديد» أو «قيد») ، «إجمالي مشترياتك» (مجموع عمود currency منسقاً `X دج` — استعمل نفس تنسيق الأرقام)، «نقاط الولاء» قيمة `340` وchange `+40`.Fallback إن لا صفوف: [12 / 2 / 96,400 دج / 340].
  3. `data-table`: entity = كيان النشاط (orders إن وُجد وإلا bookings وإلا appointments وإلا defaultEntityFor(type))، title `طلباتي`، pageSize 5، و**prop جديد `clientView: true`**.
  4. `profile-card`: name `أمينة بلقاسم` / role `زبونة وفيّة` / email `amina@sivar.dz` / phone `0555 21 08 46` / bio `زبونة من وهران — أحب المنتجات الجديدة والعروض الموسمية، وأتابع طلباتي من هنا.`
  5. `quick-actions`: title `إجراءات سريعة`، items (استعمل شكل props المسجل في BLOCK_REGISTRY — actions: [{icon, label, pageId}]): تصفح المنتجات/«تصفح الخدمات» حسب النوع → الصفحة الرئيسية (icon `package` أو `briefcase`)، «الأسعار والخطط» → صفحة pricing إن وُجدت (icon `wallet`)، «تواصل معنا» → أول صفحة form أو كتلة contact-form في الرئيسية (icon `message-circle`). إن غاب الهدف يُحذف الإجراء.

### 4) جدول data-table بوضع الزبون (`clientView: true`)
- **الفلترة**: إن كان للكيان عمود من نوع `avatar` (customer) → أظهر فقط الصفوف التي قيمته === `DEMO_CLIENT.name`؛ إن لم يوجد عمود avatar أو صفر صفوف مطابقة → أظهر كل الصفوف (لا يظهر فارغاً أبداً). نفس القاعدة في SSR والـJS (التصدير) وReact.
- **للقراءة فقط**: لا زر «إضافة {مفرد}»، لا عمود «إجراءات»، لا تعديل/حذف (الزبون لا يدير المخزون). البحث والترقيم والتذييل يبقون. التذييل نفسه + «بيانات تجريبية».

### 5) بطاقة الدخول (auth-card, variant=login) — محدد الأدوار
- يظهر **فقط إن وُجدت صفحة audience='client'** في المخطط (خلاف ذلك السلوك القديم حرفياً: data-redirect إلى لوحة المدير).
- عنصر segmented أعلى النموذج (داخل البطاقة تحت الترويسة):
```html
<div class="blk-auth__roles" role="radiogroup" aria-label="نوع الدخول">
  <button type="button" class="blk-role is-on" data-role="client" role="radio" aria-checked="true">
    (أيقونة user) <span class="blk-role__name">كزبون</span><span class="blk-role__hint">فضاء حسابي وطلباتي</span>
  </button>
  <button type="button" class="blk-role" data-role="admin" role="radio" aria-checked="false">
    (أيقونة shield) <span class="blk-role__name">كمدير</span><span class="blk-role__hint">لوحة تحكم الموقع الكاملة</span>
  </button>
</div>
<p class="blk-auth__role-note" id="…-note" data-note-client="أدخل بأي بريد وكلمة مرور — سنتجول مباشرة في فضاء الزبون (وضع تجريبي)." data-note-admin="أدخل بأي بريد وكلمة مرور — سنتجول في لوحة تحكم المدير (وضع تجريبي).">أدخل بأي بريد وكلمة مرور — سنتجول مباشرة في فضاء الزبون (وضع تجريبي).</p>
```
- الافتراضي: **client مختار**. التبديل يحدّث aria-checked وis-on ونص الملاحظة.
- النموذج يحمل: `data-login-roles="1"` + `data-client-href="{href صفحة حسابي}"` + `data-admin-href="{href أول صفحة dashboard بجمهور admin (findAdminDashboardPage)}"`.
- الإرسال: يقرأ الدور المختار → **يضبط الجلسة** → ينقل إلى href الدور. (في التصدير عبر script.js؛ في React عبر ctx).
- **variant=signup**: ينقل إلى صفحة حسابي (client) إن وُجدت، وإلا لوحة المدير كما هو اليوم — لأن التسجيل العام يصنع حساب زبون. (بلا محدد أدوار في signup).
- variant=forgot: بلا تغيير.

### 6) الجلسة
- **التصدير**: تُخزن داخل نفس مفتاح localStorage للموقع (SEED.key): `store.session = { role: 'client'|'admin', name, email }` — client: أمينة بلقاسم / amina@sivar.dz، admin: مستخدم تجريبي / demo@sivar.dz.
- **المعاينة (React)**: حالة عابرة في app-store (لا تُحفظ في المخطط): `previewSession: { role, name, email } | null`. تُضبط عند إرسال بطاقة الدخول، وتُفرّغ عند تسجيل الخروج.
- **BlockCtx** يضاف (shared.tsx): `session?: { role: 'admin' | 'client'; name: string; email: string } | null` و`onLoginAs?: (role: 'admin' | 'client') => void` و`onLogout?: () => void` و`onPlaceOrder?: (plan: { name: string; price: number }) => void`.
- **انعكاس الهوية**: بعد الدخول — اسم المستخدم في بطاقة الشريط الجانبي وفي تروستة اللوحة (زر المستخدم وقائمة الحساب) يعرض اسم الجلسة (أمينة بلقاسم أو مستخدم تجريبي) والأفاتار بحرف الاسم. **صفحات client تعرض SSR افتراضياً أمينة بلقاسم + شارة «زبون»** (tone primary) بدل «مستخدم تجريبي»/«بيانات تجريبية» — وJS/React يستبدلانها بالجلسة إن وُجدت.
- **قائمة الحساب في صفحات client**: لا روابط «الملف الشخصي»/«الإعدادات» (صفحات مدير) — يبقى «تسجيل الخروج» فقط مع فاصل.
- **تسجيل الخروج**: يفرّغ الجلسة ثم ينقل إلى صفحة الدخول. (التصدير: الرابط يأخذ data-logout وscript.js يintercept؛ React: زر القائمة يستدعي ctx.onLogout ثم onNavigate(login).)

### 7) الحراسة (التصدير فقط — المعاينة تبقى حرة للتحرير)
- `htmlDocument` يضيف على `<body>` لكل صفحة منطقة لوحة عندما يكون نظام الأدوار مفعلاً (توجد صفحة client): `data-audience="admin|client"` و`data-login-href="{href نسبي لصفحة الدخول}"` و`data-client-href` و`data-admin-href`.
- script.js عند الإقلاع: إن وُجد data-audience وdata-login-href والجلسة role ≠ audience → `location.href = login-href`. (لا حراسة على landing/auth/pricing/faq/custom ولا حين لا يوجد نظام أدوار — المشاريع القديمة سلوكها القديم تماماً).

### 8) الشريط الجانبي — فصل دقيق بلا خلط
- عنصر الشريط (dashboardNav.items) يُعرض في الشريط الجانبي **لصفحات نفس الجمهور فقط**: صفحة admin → عناصر صفحات admin فقط؛ صفحة client → عناصر صفحات client فقط (lookup: page.audience === 'client' ? client : admin). هذا في React (DashboardShell) والتصدير (dashboardShell) معاً.
- صفحة client: aria-label التنقل «تنقل فضاء الزبون»، وبطاقة المستخدم أمينة بلقاسم + شارة «زبون».
- ترتيب/تكرار عناصر المدير لا يتغير إطلاقاً (مسار الجولة 13 محفوظ).

### 9) إنشاء طلب حقيقي من التسعير (الزبون فقط)
- **التصدير**: renderPricing يضيف على زر كل خطة `data-plan-name="{name}"` و`data-plan-price="{price}"`. script.js: عند click على `.blk-plan .pt-btn[data-plan-name]` والجلسة role=client وكيان orders له أعمدة → preventDefault → push صف: `{ id: 'ORD-' + (Date.now() % 100000), customer: session.name, item: planName, quantity: 1, total: planPrice, date: اليوم YYYY-MM-DD, status: 'جديد' }` عبر saveRows → toast `تم استلام طلبك ✓ — يظهر الآن في «طلباتي»` → انتقال إلى data-client-href لصفحة الحالية (body attr). إن لم تكن الجلسة client → السلوك الحالي (الانتقال لصفحة الدخول).
- **المعاينة**: pricing-block: إن ctx.session?.role === 'client' وctx.onPlaceOrder وكيان orders موجود → الإرسال ينشئ الصف عبر onPlaceOrder (المتجر يضيفه بupsertEntityRow عند نهاية الصفوف + toast + onNavigate إلى صفحة حسابي). خلاف ذلك السلوك الحالي.
- toast المعاينة: `تم استلام طلبك «{اسم الخطة}» — يظهر الآن في «طلباتي»` 

### 10) الوكيل الذكي
- action `add_page` يقبل audience ('client'|'admin') ويُمرر في addPageToSchema. sanitize: غير صالح → undefined.
- سياق الوكيل (buildContext): يذكر جمهور الصفحة، وسطر في التعليمات: «صفحات جمهورها client هي فضاء الزبون (تُعرض بشريطه الجانبي الخاص) — لا تخلط بين عناصر فضاء المدير والزبون». 
- دالة مساعدة للوكيل/القوالب مشتركة: ابنِ كتل صفحة الزبون بدالة واحدة مُصدَّرة (يفضَّل في client-area.ts جديدة داخل src/lib/project/) يستعملها templates.ts وtools.ts وسكربت تحديث المشاريع القديمة.

### 11) المشاريع القديمة / التجريبية
- سكربت `scripts/ensure-demo-client.ts` (bun): لكل مشاريع حساب demo@sivar.dz: يضيف صفحة «حسابي» (بنفس الدالة المشتركة) إن لم توجد، ويجعل صفّين من كيان النشاط (orders→bookings→appointments) للعميل التجريبي (عمود avatar === DEMO_CLIENT.name) إن لم يكن فيها صفوف له، ثم يحفظ schemaJson. سجل النتائج.
- لن تُضاف «حسابي» إلى شريط التنقل العلوي للموقع (navbar) — الوصول إليها عبر الدخول (واقعية المواقع).

### 12) محدد الأدوار — الشكل (CSS/Tailwind)
- التصدير (buildStylesCss): `.blk-auth__roles` شبكة عمودين (gap 8px) داخل البطاقة؛ `.blk-role` بطاقة بحدود --pt-border وخلفية شفافة، radius calc(var(--pt-radius) - 2px)، padding 10px 12px، نصوص 13px؛ `.is-on` حد وأرضية color-mix(primary 10%) واسم الدور primary غامق؛ `.blk-role__name` font-weight 700 size 13.5px؛ `.blk-role__hint` size 11.5px muted. `.blk-auth__role-note` size 12.5px muted margin-top 10px. الأيقونات بحجم 16px currentColor. جوال: عمود واحد (media ≤480px). التركيز focus-visible بنفس نمط الموقع.
- React: نفس الشكل بTailwind inline (مطابقة بصرية وثيقة).

### 13) README المُصدَّر
قسم جديد بعد قسم إدارة المحتوى: «الدخول بالأدوار (وضع تجريبي)» — شرح الدخول كمدير/كزبون، أن الجلسة محلية في المتصفح، الحراسة على صفحات اللوحات، وأن زبوناً مسجلاً يطلب خطة من صفحة التسعير فيُنشأ طلب حقيقي محلي يظهر في فضاء الزبون ولوحة المدير.

## خارج النطاق (لا تفعله)
- لا تعدّ ملف الآخرين: 16-a لا يلمس generate.ts، و16-b لا يلمس إلا generate.ts.
- لا تغيّر سلوك المشاريع بلا صفحة client (كل المسارات القديمة كما هي).
- لا حسابات حقيقية/كلمات مرور — كل شيء «وضع تجريبي».
- لا صفحات client إضافية في القوالب (صفحة واحدة «حسابي»).

## بوابات الجودة لكل جزء
- `npx tsc --noEmit` صفر أخطاء في src/، و`bun run lint` صفر أخطاء.
- لا أخطاء في ذيل dev.log.
- التحقق الطرف-إلى-طرف يقوم به الوكيل الرئيسي (16-c).
