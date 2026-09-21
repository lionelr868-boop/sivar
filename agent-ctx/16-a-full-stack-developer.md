# Task 16-a — Role-based login (admin/client) in React preview + schema/mocking/agent layer

Agent: full-stack-developer (16-a)

## Scope (as instructed — generate.ts NEVER touched)
- NEW `src/lib/project/client-area.ts` — الدالة المشتركة الوحيدة لفضاء الزبون.
- `src/lib/project/templates.ts`, `src/lib/project/tools.ts` (factory.ts لم يحتج تعديلاً).
- `src/lib/server/agent.ts` (context + prompt + 3 أسطر تعقيم audience لcreate_page — انظر الانحراف 1).
- React preview: `blocks/shared.tsx`, `auth-card-block.tsx`, `pricing-block.tsx`, `data-table-block.tsx` (quick-actions-block.tsx قُرئ ولم يُعدَّل — props shape actions[{icon,label,pageId}] مطابق أصلاً).
- `prototype-renderer.tsx`, `store/app-store.ts`, `components/builder/preview-mode.tsx`, `pages-panel.tsx`, `lib/i18n/builder.ts`.
- NEW `scripts/ensure-demo-client.ts` (شُغّل بنجاح).

## Work Log
- **client-area.ts**: `clientActivityEntity` (orders→bookings→appointments→defaultEntityFor(type)) + `buildClientAreaBlocks` (§3 بالترتيب الحرفي: dashboard-header «مرحباً أمينة 👋» / stats-row محسوبة من صفوف الزبون (avatar===DEMO_CLIENT_NAME) مع fallback 12/2/96,400 دج/340 + change +40 / data-table {entity, «طلباتي», pageSize 5, clientView:true} / profile-card أمينة بلقاسم / quick-actions بأهداف حقيقية تُحذف عند غياب الهدف) + `buildClientAreaPage` ({حسابي/account/dashboard/audience:client} بid اختياري) + `ensureClientAreaPage` (نقية: صفحة client موجودة → نفس المخطط؛ وإلا إلحاق آخر الصفحات + عنصر {حسابي, user} آخر dashboardNav حرفياً — بلا إعادة ترتيب).
- ids الكتل: `${pageId}-b{n}` في مسار القوالب (حتمية SSR/CSR — نفس اصطلاح blk في templates.ts) و`uid('b_')` (نفس uidFn في tools.ts) في مسار add_page.
- **templates.ts**: buildTemplateSchema يستدعي `ensureClientAreaPage(schema, {id: `${p.id}-account`})` قبل deepClone — كل الـ14 قالباً صارت تحوي «حسابي» + عنصر شريطها آخر القائمة، وقائمة الموقع العلوي (nav.items) لم تُمس (الدخول هو المدخل). كل شيء آخر مطابق بالبايت.
- **tools.ts**: starterBlocksFor/addPageToSchema يقبلان `audience?: PageAudience`؛ dashboard+client → كتل فضاء الزبون؛ `dashboardNavIconFor` صار Pick<...,'audience'> وclient → 'user'؛ insertDashboardNavItem: صفحات client تُلحق آخر القائمة (مسار الجولة 13 لصفحات المدير كما هو حرفياً)؛ applyActions/create_page يمرر audience معقّمة ('client'|'admin' وإلا undefined).
- **agent.ts**: buildContext يذكر `audience: 'client'|null` لكل صفحة؛ سطر قاعدة واحد في الموجه (فضاء الزبون بشريطه الخاص — لا خلط — وcreate_page تقبل "audience":"client")؛ sanitizeActions/create_page يُبقي audience الصالحة (وإلا تُسقط قبل applyActions فيصبح العقد ميتاً).
- **shared.tsx**: BlockCtx + `PreviewSession` + session/onLoginAs/onLogout/onPlaceOrder.
- **auth-card-block.tsx**: variant=login + صفحة client → محدد أدوار radiogroup («نوع الدخول») — كزبون (افتراضي, User) / كمدير (ShieldCheck) بملاحظتي النص الحرفيتين كـReact state بلا data-attrs؛ submit → onLoginAs(role) ثم onNavigate(clientPage|adminDash)؛ signup → صفحة حسابي إن وُجدت؛ لا صفحة client = السلوك القديم حرفياً (أول صفحة dashboard)؛ الأشكال §12 بTailwind (13.5px/11.5px/12.5px، selected = color-mix(primary 10%) + اسم primary غامق، عمود واحد ≤480px).
- **data-table-block.tsx**: `clientView` (B) — فلترة صفوف الزبونة عبر عمود avatar (لا عمود/صفر مطابقة → كل الصفوف)؛ للقراءة فقط: canManage=false فيخفى زر الإضافة وعمود الإجراءات والتعديل/حذف؛ البحث/الترقيم/التذييل كما هي؛ clientView غير مفعّل = لا تغيير.
- **pricing-block.tsx**: planGo(plan{name,price}) — جلسة client + onPlaceOrder + orders بأعمدة + صفحة client → onPlaceOrder ثم onNavigate(حسابي)؛ وإلا السلوك الحالي (guard إضافي onNavigate ضد TypeError).
- **prototype-renderer.tsx**: PrototypeRenderer يقبل session/onLoginAs/onLogout/onPlaceOrder على ctx؛ DashboardShell يحسب جمهور الصفحة ويرشّح عناصر الشريط بنفس الجمهور (سطح المكتب + pills الجوال) وaria-label «تنقل فضاء الزبون» في client؛ بطاقة المستخدم: client → session?.name ?? 'أمينة بلقاسم' + PBadge primary «زبون»، admin → مستخدم تجريبي + «بيانات تجريبية» (الاسم من الجلسة إن وُجدت)؛ DashboardTopbar(+audience): هوية حسب الجمهور، إخفاء «الملف الشخصي»/«الإعدادات» في client، «تسجيل الخروج» = ctx.onLogout?.() ثم navigate(login).
- **app-store.ts**: `previewSession` عابرة (لا تُحفظ في المخطط، تُفرّغ عند openProject/closeBuilder/logout) + `loginPreviewAs` (client→أمينة بلقاسم/amina@sivar.dz، admin→مستخدم تجريبي/demo@sivar.dz) + `logoutPreview` + `placeClientOrder` (صف ORD-XXXXX/customer/item/1/total/date اليوم/جديد آخر orders عبر applySchemaFn+applyEntityRowOp — نفس مسار الجولة 15) + toast `تم استلام طلبك «{name}» — يظهر الآن في «طلباتي»` (inline كنمط toasts الجولة 15).
- **preview-mode.tsx**: تمرير session/onLoginAs/onLogout/onPlaceOrder (مرآة توصيل onEntityRowChange).
- **pages-panel.tsx + i18n**: شارة «زبون» (clientAudienceBadge) بجانب اسم صفحات client بنفس نمط Badge القائم.
- **scripts/ensure-demo-client.ts** (bun): لكل مشاريع demo@sivar.dz → ensureClientAreaPage + تلوين أول صفّين لعمود avatar في كيان النشاط بأمينة بلقاسم إن لا صفوف لها + حفظ schemaJson/updatedAt + سجل النتائج.

## Verification
- bun مباشر: كل الـ14 قالباً تحوي صفحة `{id}-account` باسم «حسابي» وslug account وaudience client وكتلها الخمس بالترتيب + عنصر شريط أخير {حسابي, user} + قائمة الموقع بلا «حسابي»؛ stats لsaas-suite = 2 / 1 / «41,400 دج» (8900+32500) / 340 (من صفوف أمينة في orders)؛ quick-actions أهداف موجودة فقط (تُحدف عند غيابها — saas بلا form/contact-form → إجراءان).
- applyActions: create_page audience=client → صفحة client بكتل الفضاء + عنصر user آخر القائمة؛ audience=admin → مسار الجولة 13 كما هو (layout-dashboard بعد آخر لوحة).
- السكربت (bun scripts/ensure-demo-client.ts): 6/6 مشاريع (حجزتي، sivar، منصتي، متجزجز، SARELA، boba) — أُضيفت «حسابي» + صُبغ صفان لorders؛ تحقق لاحق من قاعدة البيانات: الصفحة موجودة + عنصر الشريط + صفوان لأمينة بلقاسم في كل مشروع.
- `npx tsc --noEmit`: صفر أخطاء في src/ وscripts/ (أخطاء examples/+skills/ الموجودة أصلاً فقط).
- `bun run lint`: 0 أخطاء (تحذير الخطوط القديم وحده).
- ذيل dev.log نظيف: كل الطلبات 200 + ✓ Compiled بلا أخطاء. لم يُعاد تشغيل الخادم.

## الانحرافان عن حرفية التكليف (موثّقان)
1. **agent.ts — sanitizeActions/create_page (+3 أسطر)**: التكليف قال «context + prompt only» لكن sanitizeActions كانت تسقط أي وسيط غير مدرج قبل وصوله إلى applyActions — فيصبح عقد «create_page يقبل audience» ميتاً في مسار LLM. أُضيف تعقيم audience في create_page فقط (شرطها: string ضمن [client, admin]) — لا شيء آخر في الملف تغيّر سوى buildContext وسطر الموجه.
2. **ids كتل الفضاء في مسار القوالب**: التكليف أوصى بنمط uid في tools.ts فقط، لكن buildTemplateSchema يعمل داخل useMemo في معاينة القوالب المصغّرة (SSR+hydration) والمخطط هناك حتمي عمداً (TEMPLATES_CREATED_AT ثابت لهذا الغرض) — لذا مسار القالب يستعمل `${id}-b{n}` (نفس دالة blk في templates.ts) ومسار add_page يستعمل uid('b_') (نفس uidFn في tools.ts) — لا مخطط تسمية ثانٍ جديد، بل الاثنان الموجودان في ملكيتي.

## Notes for 16-b (export) و16-c (E2E)
- BlockCtx/export يحتاج في generate.ts: نفس عقد clientView في renderDataTable، محدد الأدوار بdata-login-roles/data-client-href/data-admin-href، الحراسة §7، session في SEED.key، planGo بdata-plan-name/price، README §13 — كل النصوص الحرفية في agent-ctx/16-spec.md وDEMO_CLIENT في mock-data.ts هو المصدر الوحيد.
- orders دائماً كيان النشاط في مشاريع القوالب (buildMockData يملأ الـ17 كياناً) — سلسلة fallback تعمل للمشاريع المخصوصة فقط.
