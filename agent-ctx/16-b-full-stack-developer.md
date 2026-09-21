# Task 16-b — التصدير الثابت: دخول بالأدوار + فضاء الزبون + الحراسة + طلب حقيقي من التسعير

الملف الوحيد المعدَّل: `src/lib/export/generate.ts` (+307/−38). كل شيء داخل مولّد الموقع
الثابت (HTML/CSS/JS خالص — Netlify-ready، عربي RTL). لم تُلمس أي ملفات أخرى.

## ما نُفّذ (داخل generate.ts فقط)

### 1) imports + ثوابت مشتركة
- استيراد `DEMO_CLIENT` (mock-data) و`findClientPage`/`findAdminDashboardPage` (nav-targets — من 16-0).
- `DASHBOARD_PAGE_TYPES` (dashboard/table/form/settings/profile) — يستعمله `guardBodyAttrs` و`shellFor` (مصدر واحد بدل المصفوفة المكررة).
- `sessionAvatarHtml(name, size)`: أفاتار بسمة `data-user-avatar="1"` ليعوّضه script.js باسم الجلسة.

### 2) renderAuthCard — محدد الأدوار (§5)
- يُفعَّل فقط حين `findClientPage(schema)` غير null (خلاف ذلك: السلوك القديم حرفياً — تحقق ببناء legacy).
- الماركب حرفياً من المواصفة: `div.blk-auth__roles[role=radiogroup][aria-label=نوع الدخول]` بزرّين `data-role=client|admin` (client مختار افتراضياً ب`is-on` + `aria-checked=true`)، داخل `span.blk-role__name` أيقونة `user`/`shield` (16px من ICON_SVG الموجودة) مغلّفة `span.blk-role__icon`، ثم `span.blk-role__hint` بالنصين الحرفيين.
- `p.blk-auth__role-note` تحمل `data-note-client`/`data-note-admin` (سطرا المواصفة الحرفيان) لنص الملاحظة القابل للتبديل من JS، والنص الافتراضي = ملاحظة الزبون.
- النموذج: `data-login-roles="1"` + `data-client-href` + `data-admin-href` (page-relative عبر ctx.hrefOf) — **بلا** data-redirect في هذا الوضع.
- signup: الهدف صار صفحة الزبون إن وُجدت (data-redirect كما قبل) + `data-signup-client="1"`؛ forgot بلا تغيير.

### 3) renderPricing — بذات الطلب (§9)
- زر كل خطة `<a>` حمل `data-plan-name="{esc(name)}"` و`data-plan-price="{price}"` (رقم خام) — href كما هو (يُضاف دوماً: خامل بلا نظام أدوار).

### 4) renderDataTable — clientView (§4)
- فلترة SSR: إن كان للكيان عمود avatar → صفوف قيمته === `DEMO_CLIENT.name` فقط؛ لا عمود/صفر مطابقات → كل الصفوف.
- للقراءة فقط: بلا زر «إضافة {مفرد}»، بلا عمود «إجراءات»، بلا أزرار تعديل/حذف وبلا وسومها؛ البحث/الترقيم/التذييل/العدّاد باقون حرفياً.
- `data-client-view="1"` على بطاقة الجدول؛ رسالة الفراغ في وضع الزبون «لا يوجد {مفرد} بعد.» (colspan بلا عمود الإجراءات).

### 5) dashboardShell + dashboardTopbarHtml — انقسام الجمهور (§8، §6)
- `audience = page.audience === 'client' ? 'client' : 'admin'`؛ فلترة `dashboardNav.items` لأهداف صفحات نفس الجمهور — للشريط الجانبي **وشريط الجوال** معاً (ترتيب المدير محفوظ).
- صفحات client: aria-label «تنقل فضاء الزبون»، بطاقة الشريط: `avatarHtml(DEMO_CLIENT.name, 34)` + الاسم «أمينة بلقاسم» + شارة «زبون» (primary) بدل «مستخدم تجريبي/بيانات تجريبية».
- dashboardTopbarHtml(ctx, audience): صفحات الزبون تعرض أمينة بلقاسم (زر المستخدم 28px + رأس القائمة + amina@sivar.dz بdir=ltr) وقائمة الحساب بلا «الملف الشخصي/الإعدادات» — فاصل + «تسجيل الخروج» فقط ب`data-logout="1"`؛ صفحات المدير كما كانت + `data-logout="1`.
- خطوط تعويض الهوية على الجمهورين: `data-user-name` (زر التروستة + رأس القائمة + بطاقة الشريط)، `data-user-email`، `data-user-avatar` (الأفاتاران 28/34).
- بحث الملف الشخصي/الإعدادات في القائمة صار بين صفحات المدير فقط (لا يلتقط صفحة زبون من نوع profile).

### 6) htmlDocument — سمات الحراسة (§7) + guardBodyAttrs
- صفحات منطقة اللوحة (و حين يوجد نظام الأدوار): `data-audience` + `data-login-href` (أول auth variant=login — لا صفحة دخول → بلا سمات جمهور إطلاقاً) + `data-client-href` + `data-admin-href` — كلها hrefs نسبية عبر ctx.hrefOf.
- صفحة التسعير (أو رئيسية بقسم pricing): `data-client-href` **وحده** — هدف إنشاء الطلب من زر الخطة (خلاف ذلك تعطّل §9؛ انظر الانحرافات).
- الدمج بعد صنف خلفية المشروع القائم: `class="pt-hasbg pt-hasbg--soft" data-audience=…` (تم التحقق بمخطط بخلفية).

### 7) buildScriptJs — داخل نفس IIFE وبنفس أسلوب var/escJs/مفوَّضة (§6، §7، §9)
- `readSession/writeSession/clearSession`: الجلسة داخل **نفس** مخزن localStorage (`store.session`) بقراءة→تغيير→كتابة (لا تُفقد الكيانات/الإعدادات).
- `initPage()` تحل محل كتلة التهيئة الأخيرة: حراسة الإقلاع أولاً (`data-audience`+`data-login-href`: لا جلسة أو role ≠ audience → `window.location.href = loginHref; return` داخل الدالة — بلا وميض) ثم انعكاس الهوية ثم applyStoredSettings/renderTbody*/applyStoredToLanding كما كانت.
- `applySessionIdentity(session)`: كل [data-user-name] ← session.name، [data-user-email] ← session.email، `.pt-avatar[data-user-avatar]` ← `avatarJs(session.name, الحجم من style.width)` عبر outerHTML (مطابقة مولّد SSR).
- معالج submit القائم امتُد: `data-login-roles` → قراءة الدور من `.blk-role.is-on` → writeSession(client: أمينة بلقاسم/amina@sivar.dz أو admin: مستخدم تجريبي/demo@sivar.dz) → انتقال لhref الدور؛ `data-signup-client` → writeSession('client',…) ثم يتبع data-redirect؛ data-redirect القديم كما هو.
- معالج click مفوَّض جديد: (أ) تبديل `.blk-role[data-role]` (is-on + aria-checked + نص الملاحظة من data-note-*)، (ب) `[data-logout]` → preventDefault + clearSession + انتقال لhref الرابط، (ج) `a.pt-btn[data-plan-name]` → إن وُجد data-client-href بالجسم وجلسة client وorders بأعمدة: preventDefault → صف `{id:'ORD-'+(Date.now()%100000), customer:session.name, item:planName, quantity:1, total:Number(planPrice)||0, date:YYYY-MM-DD, status:'جديد'}` عبر currentRows+push+saveRows('orders') → toast «تم استلام طلبك ✓ — يظهر الآن في «طلباتي»» → مهلة 800ms ثم الانتقال لفضاء الزبون (التنبيه يظهر قبل التحويل).
- `clientRowsJs` + `rowHtmlJs(…, readOnly)`: renderTbody يطبق نفس فلترة SSR للزبون ويعيد بناء الصفوف بلا عمود إجراءات (colspan متكيف) — الطلب الجديد (customer=أمينة بلقاسم) يظهر في «طلباتي» وفي جدول المدير (بلا فلترة) لأن كليهما من نفس الصفوف المخزنة.
- سلوك الجولة 15-b كله سليم (نوافذ/إعدادات/تزامن المعرض/بحث/ترقيم/مهام/إشعارات/reveal/رجوع/أعلى) — إضافات جراحية فقط.

### 8) buildStylesCss (§12)
- `.blk-auth__roles` (grid عمودين gap 8px margin 2px 0 4px)، `.blk-role` (عمودي gap 3px، padding 10px 12px، حد --pt-border، radius calc(-2px)، خلفية شفافة، transition)، `.blk-role__icon{display:flex}`، `.blk-role__name` (13.5px/700/flex gap 6px)، `.blk-role__hint` (11.5px muted)، `.is-on` (حد + خلفية `color-mix(in srgb,var(--pt-primary) 10%,transparent)` + الاسم primary — نمط color-mix المستقر في الملف)، `:focus-visible` كنمط الموقع، `.blk-auth__role-note` (12.5px muted lh 1.6 margin-top 10px)، media ≤480px عمود واحد.

### 9) buildReadmeMd (§13)
- قسم «## الدخول بالأدوار (وضع تجريبي)» بعد قسم إدارة المحتوى: 5 أسطر عربية (الدخول كزبون/كمدير، الجلسة محلية، الحراسة على صفحات اللوحات، طلب الخطة من التسعير يظهر في «طلباتي» وجدول المدير، الخروج من قائمة الحساب).

## التحقق (بدون E2E متصفح — الوكيل الرئيسي 16-c يتولاه)
- `npx tsc --noEmit`: صفر أخطاء في src/ (الموجودة فقط أمثلة/skills القديمة). `bun run lint`: 0 أخطاء (تحذير الخطوط القديم وحده).
- سكربت رمي تحت /tmp (ليس في src/) يبني مخططاً وهمياً كاملاً (landing + auth login + dashboard مدير + صفحة «حسابي» بجمهور client بكل الكتل الخمس مع clientView + كيان orders بخمسة صفوف اثنان منها لأمينة بلقاسم + صفحة تسعير بخطتين) → كتابة /tmp/r16-check/out-client؛ ومخطط legacy بلا صفحة زبون → out-legacy. ثم:
  - `node --check script.js`: PASS.
  - greps (out-client): data-login-roles=1 (login فقط)، data-role="client"/"admin" (login)، data-audience="client" (account فقط) / "admin" (dash فقط)، data-client-view="1" (account فقط)، data-plan-name/price (pricing ×2)، data-logout (dash+account)، تنقل فضاء الزبون (account ×2: الشريط + شريط الجوال)، أمينة بلقاسم (login/dash/account/pricing — SEED وهوية SSR)، زبون/amina@sivar.dz (account)، data-user-name ×3 + data-user-email + data-user-avatar ×2 لكل صفحة لوحة، data-signup-client=0 (لا صفحة signup بالمخطط).
  - الجداول: tbody الزبون صفان فقط كلاهما «أمينة بلقاسم» (لا أحمد/سارة/ياسين)، بلا إضافة/إجراءات/تعديل/حذف، مع التذييل والبحث والترقيم والعدّاد «عرض 2 من 2 صف»؛ جدول المدير 5 صفوف مع كل أدوات الإدارة.
  - قوائم th: الزبون بلا «إجراءات» والمدير بها. رأس قائمة الزبون: أمينة بلقاسم + amina@sivar.dz (dir=ltr)، بلا الملف الشخصي/الإعدادات.
  - التوافق الخلفي (out-legacy): نموذج الدخول `data-redirect="../dash/"` بلا أي أثر لمحدد الأدوار، ولا data-audience/roles على أي body (login/dash/pricing/index كلها `<body>` أو class الخلفية فقط)، وscript.js/styles.css متطابقة بايت-بايت بين البناءين؛ data-plan-name/price تبقى (خاملة — سلوك JS بلا data-client-href).
  - دمج class الخلفية + سمات الحراسة: `class="pt-hasbg pt-hasbg--soft" data-audience="admin" data-login-href=… data-client-href=… data-admin-href=…` (مخطط بbranding.bgImage).
  - محاكاة headless (node vm + DOM مصغّرة) لscript.js — 10/10 سيناريوهات PASS: دخول client/admin (كتابة الجلسة الصحيحة والانتقال لفضاء الدور)، signup-client، حراسة عدم التطابق (إعادة توجيه للدخول) والتطابق (تمر)، انعكاس الهوية (الأسماء/البريد/استبدال الأفاتار 34px بحرفي «أب»)، الخروج (تفريغ الجلسة مع بقاء الكيانات + preventDefault + الانتقال)، تبديل الدور (is-on/aria/nص الملاحظة)، تدفق الطلب (preventDefault + صف ORD-… customer=أمينة بلقاسم item=الخطة total=5900 status=جديد + بقاء الجلسة + انتقال بعد 800ms)، ضغط المدير للخطة (بلا طلب — التنقل الافتراضي)، إعادة بناء جدول الزبون من المخزن (صفوف أمينة فقط بلا عمود إجراءات).
- ذيل dev.log نظيف (لا أخطاء). نظّفت كل /tmp/r16-check.

## انحرافات عن المواصفة (موثقة بأسبابها)
1. **data-client-href على صفحة التسعير**: تعليمات §7 تقول صفحات غير اللوحات بلا سمات جمهور، لكن §9 (تدفق الطلب) يشترط أن يكون على body الصفحة الحالية data-client-href وإلا لا يعمل «طلب حقيقي من التسعير» أصلاً — ففصلته: صفحات منطقة اللوحة تحمل الحراسة كاملة (audience+login+client+admin)، وصفحة التسعير (أو رئيسية بقسم تسعير) تحمل data-client-href وحده (بلا data-audience → لا حراسة عليها).
2. **مهلة 800ms قبل الانتقال لفضاء الزبون بعد الطلب**: المواصفة «toast ثم انتقال»؛ التنفيذ الحرفي المتزامن يجعل التنبيه غير مرئي إطلاقاً — المهلة القصيرة تُظهره ثم ينقل (نفس روح المواصفة + تجربة أفضل).
3. **أيقونة الدور داخل span الاسم** (بدل شقيق له): CSS المواصفة نفسها (`blk-role__name` flex بgap 6px + غلاف `blk-role__icon`) يقتضي تواجدها في سطر الاسم — نفس المظهر المقصود.
4. **رسالة فراغ جدول الزبون** «لا يوجد {مفرد} بعد.» بلا عبارة «اضغط إضافة» (الزر غير موجود أصلاً في وضع القراءة فقط) — حالة نادرة (كيان صفر صفوف).
5. بقاء زر «إعادة الضبط» في تذييل جدول الزبون (التذييل نفسه حرفياً حسب المواصفة «التذييل نفسه + بيانات تجريبية» — data-reset-entity لم يُطلب حذفه، ويعيد الأصل محلياً كأي جدول).

## ملاحظات للوكيل الرئيسي (16-c)
- schemas الواصلة ستتضمن صفحة «حسابي» (audience=client) من 16-a — التصدير جاهز لها؛ لن يعمل محدد الأدوار إلا بوجودها (findClientPage).
- زر الخطة يطلب فعلياً فقط لجلسة client على صفحة تحمل data-client-href (pricing) وكيان orders بأعمدة في البذرة.
- الحراسة لا تعمل حين لا صفحة login variant=login (سمات الجمهور تسقط كلها — توافق قديم).
