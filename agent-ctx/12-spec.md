# Task 12 — ألوان الخطوط + ألوان أقسام صفحة الهبوط (SIVAR)

## الهدف (طلب المستخدم حرفياً)
1. إمكانية **التعديل على ألوان الخطوط** + جعل **الذكاء الاصطناعي قادراً على تنفيذ** تعديلات ألوان الخط في المواقع المنشأة.
2. إمكانية **التعديل على الألوان لكل قسم من أقسام الـ landing page**، بما فيها **قسم الإعلانات (CTA/Banner) الذي يبدو أحياناً غير واضح**.

اقرأ `/home/z/my-project/worklog.md` أولاً (خاصة الجولات 9-11) لفهم المعمارية. **لا تعد كتابة الأنواع الأساسية** — `Block.props` هو `Record<string, unknown>` و`ProjectTheme` يحوي أصلاً `text` و`mutedText`، لذا لا تغييرات كسارة على `types.ts`.

## الحقائق المثبتة (استخلصها من الكود بنفسي — وثّقها)
- `FieldDefinition` في `src/lib/registry/blocks.ts` يدعم `type: 'color'` أصلاً، والمنتقي يُرسم في `properties-panel.tsx` (فرع `field.type === 'color'` ~السطر 245) — لكنه **إجباري** (يعرض #7c3aed عند الفراغ) ويجب دعم قيمة اختيارية قابلة للإزالة.
- `updateThemeInSchema` + `THEME_KEYS` في `src/lib/project/tools.ts` يقبلان أصلاً `text` و`mutedText` (hex أو اسم عربي عبر COLOR_NAME_TO_HEX).
- `updateBlockPropsInSchema` يدمج أي props — فمفاتيح `bgColor`/`textColor` الجديدة ستعمل بدون تغيير.
- الوكيل الذكي: `src/lib/server/agent.ts` — برومبت نصي بالأدوات (سطر ~156) + `heuristicRun` للمسار الاحتياطي (سطر ~512) + `mapArabicColors` + `detectColor` موجودة.
- العارض: `src/components/prototype/prototype-renderer.tsx` — `renderBlock()` (سطر 52) يوزّع لكل مكوّن؛ `BlockList` له 3 مسارات أغلفة (تفاعلي/عادي/تحرير).
- نطاق السمة: `src/components/prototype/theme-provider.tsx` — `ptVars()` يشتق `--pt-text/--pt-muted/--pt-bg/--pt-surface/--pt-border` وله `hexLighten/hexDarken` مُصدَّرتان.
- التصدير: `src/lib/export/generate.ts` — CSS الجذر يستخدم `--pt-text` من theme.text (سطر ~311) **بالفعل**، فألوان الخط العامة ستُصدَّر تلقائياً؛ يوجد `hexLighten/hexDarken` محليتان فيه؛ الأقسام تُبنى كسلاسل HTML لكل مكوّن، والبطاقة CTA/Banner/Hero تضع خلفياتها المتدرّجة بنفسها.
- لوحة السمة: `src/components/builder/theme-panel.tsx` — presets كاملة + تحرير primary/شعار/خلفية مشروع؛ تستدعي `updateThemeInSchema`.
- i18n: كل النصوص العربية في `src/lib/i18n/builder.ts` فقط (لا hardcoded).

## التنفيذ المطلوب

### A) ألوان الخطوط العامة (theme.text / theme.mutedText)
1. **theme-panel.tsx** — قسم جديد «ألوان الخطوط» (بعد قسم الألوان الأساسية):
   - «لون الخط الأساسي» → `theme.text`
   - «لون الخط الثانوي (النصوص الخفيفة)» → `theme.mutedText`
   - لكل واحد: منتقي لون + إدخال hex + زر «إعادة الضبط» (يعيد `#1c1726` للأساسي و`#6e6880` للثانوي). التغيير فوري على المعاينة عبر مسار التحديث الموجود.
2. **agent.ts (LLM)** — وسّع توثيق الأداة 9 `update_theme` ليشمل: `"text":"#hex — لون الخط الأساسي في كل الموقع"`, `"mutedText":"#hex — لون النصوص الثانوية"`, وأضف سطراً في البرومبت: «يمكنك تغيير ألوان الخطوط (text/mutedText) وليس فقط الألوان الأساسية». `mapArabicColors`/`THEME_KEYS` ستتكفل بالباقي.
3. **agent.ts (heuristic)** — فرع **قبل** فرع تغيير اللون العام (سطر ~585):
   - إذا طابق النص نمط «لون/اللون + خط/كتابة/نص/نصوص» أو «خط/كتابة + لون» و`detectColor` وجد لوناً:
     → `update_theme` بـ `{ text: hex, mutedText: deriveMuted(hex, theme.mode) }` حيث deriveMuted = مزج نحو الأبيض 0.35 في الفاتح / نحو الأسود 0.25 في الداكن (اكتب دالة mixHex صغيرة محلية).
   - مثال يجب أن يعمل: «غيّر لون الخط إلى الأزرق».

### B) ألوان كل قسم (bgColor / textColor اختيارية على مستوى الكتلة)
1. **registry/blocks.ts**:
   - أضف `optional?: boolean` لنوع حقل color في `FieldDefinition`.
   - لكل كتل التسويق: `hero, features, stats, steps, pricing, testimonials, faq, cta, banner, gallery, team, contact-form` أضف في نهاية `fields`:
     - `{ key: 'bgColor', label: 'لون خلفية القسم', type: 'color', optional: true }`
     - `{ key: 'textColor', label: 'لون خط القسم', type: 'color', optional: true }`
   - تأكد أن حقول color تقع في مجموعة «المظهر» (راجع `fieldGroup` في properties-panel).
2. **properties-panel.tsx** — فرع color عندما `optional`:
   - قيمة فارغة → حبيبة بحدود متقطعة «افتراضي» + إدخال hex بعنصر placeholder «افتراضي (من الهوية)».
   - قيمة موجودة → الحالة الحالية + **زر X «إزالة اللون المخصص»** يلتزم بقيمة `''`.
   - الحالة فارغة تعني: وراثة هوية المشروع.
3. **prototype-renderer.tsx** — دالة `sectionVars(bgColor, textColor, theme)` تُرجع CSSProperties:
   - `bgColor` صالح (hex 3/6): `background: bgColor` + `--pt-bg: bgColor` + `--pt-surface` مشتق (lighten 0.42 إذا سطوع الخلفية > 0.55، وإلا darken 0.42) + `--pt-border` مشتق مماثل أخف.
   - `textColor` صالح: `--pt-text: textColor` + `--pt-muted: mix(textColor, bgColor||'#ffffff', 0.38)`.
   - **نص تلقائي ذكي**: إذا `bgColor` معيّن و`textColor` فارغ → احسب السطوع النسبي (relative luminance) لـ bgColor؛ إذا > 0.5 → نص داكن `#17151f`، وإلا نص أبيض `#ffffff` (+ muted مشتق). **هذا يحل مشكلة «قسم الإعلانات غير واضح»**.
   - طَبِّق الغلاف في **مكان واحد** داخل `renderBlock()` نفسها (يستفيد منه مسارات BlockList الثلاثة): غلاف div بالـ style حول كل مكوّن يملك bgColor/textColor.
4. **hero-block.tsx / cta-block.tsx / banner-block.tsx** (في `src/components/prototype/blocks/`):
   - هذه ترسم خلفيات داكنة/متدرّجة ذاتياً تخفي خلفية الغلاف — لذا: إذا `bgColor` صالح في props:
     - الخلفية تصبح مبنية عليه (تدرّج لطيف: `linear-gradient(180deg, bgColor, hexDarken(bgColor, 0.14))`) بدل التدرّج/الداكن الافتراضي،
     - وألوان العنوان/النص تتبع `var(--pt-text)` (الذي يحدّده الغلاف مع النص التلقائي الذكي) بدل الأبيض الثابت.
   - كذلك في **تصدير generate.ts**: مولدات hero/cta/banner там يجب أن تحترم `bgColor`/`textColor` بنفس المنطق.
5. **generate.ts (التصدير)**:
   - في نقطة تجميع صفحة (حيث تُدمج HTML الكتل): لكل كتلة تملك `bgColor`/`textColor` صالحين أغلِف HTML الكتلة بـ `<div class="pt-secvars" style="--pt-text:...;--pt-muted:...;--pt-bg:...;--pt-surface:...;--pt-border:...;background:...">…</div>` (متغيرات CSS تتوارثها العناصر الداخلية تلقائياً — استعمل نفس دالة sectionVars بمنطق JS خام في generate.ts، ويوجد hexLighten/hexDarken هناك أصلاً؛ أضف luminance).
   - بطاقات hero/cta/banner: طبّق نفس استبدال الخلفية المتدرّجة كما في العارض.
   - تحقق أن `--pt-text` الجذرية تأتي من theme.text (موجود أصلاً — لا تكسره).
6. **agent.ts (heuristic لألوان الأقسام)** — فرع جديد قبل فرع تغيير اللون العام:
   - إذا «خلفية» + ذكر قسم (البطل/المزايا/الإحصائيات/الخطوات/التسعير/الشهادات/الأسئلة/دعوة/الإعلان/الشريط/المعرض/الفريق/التواصل أو hero/cta/banner...) + `detectColor` → اعثر على أول صفحة landing، اعثر على الكتلة المطابقة بالنوع، ثم `update_block` بـ `{ bgColor: hex }` (+ إذا ذُكر «نص/خط/كتابة أبيض/…» مع لون ثانٍ أو صراحةً → `textColor`).
   - إذا «لون الخط/نص/كتابة» + «قسم …» + لون → `update_block` بـ `{ textColor: hex }`.
   - أمثلة يجب أن تعمل: «اجعل خلفية قسم دعوة الإجراء سوداء» → cta.bgColor=#111827. «اجعل خلفية الشريط الإعلاني خضراء داكنة» → banner.bgColor.
   - **LLM**: وثّق في البرومبت أن `update_block` يقبل `bgColor`/`textColor` لكل قسم مع مثال.
7. **i18n/builder.ts** — مفاتيح جديدة فقط: fontColorsTitle «ألوان الخطوط»، fontColorText «لون الخط الأساسي»، fontColorMuted «لون الخط الثانوي»، resetDefault «إعادة الضبط»، sectionBgColor «لون خلفية القسم»، sectionTextColor «لون خط القسم»، colorDefaultHint «افتراضي (من الهوية)»، removeColor «إزالة اللون المخصص». (ضع تسميات الحقول في registry عبر t.builder.* مثل بقية الحقول — راجع النمط الموجود؛ إن كانت registry تستخدم نصوصاً مباشرة في حقول أخرى فاتبع النمط السائد).

## الجودة والقيود
- **لا تكتب أي كود اختبارات** ولا تُنشئ ملفات زائدة؛ استخدم `bun run lint` و`npx tsc --noEmit` (تجاهل أخطاء examples/ وskills/ الموجودة أصلاً).
- لا تكسر أي سلوك قائم (صور الأقسام، خلفية المشروع، الرسوم، التصدير ZIP، strip الصور بعد التحميل — الجولة 9).
- التوافق الخلفي: مشاريع قديمة بلا bgColor/textColor يجب أن تبدو كما هي تماماً (كل شيء اختياري).
- RTL واتجاه العربية في كل الإضافات؛ أزرار ≥ 44px للمس.
- بعد الانتهاء: `tsc --noEmit` صفر أخطاء في src، `bun run lint` صفر أخطاء (تحذير الخطوط وحده مقبول)، تحقق يدوي سريع عبر dev server أن الصفحة تُبنى بلا أخطاء في `/home/z/my-project/dev.log`.

## التسليم
- طبّق كل الملفات أعلاه في `src/`.
- **ألزم نفسك بقراءة** الملفات قبل تعديلها (خصوصاً generate.ts وprototype-renderer.tsx وagent.ts — كبيرة).
- بعد التنفيذ append سجلك إلى `/home/z/my-project/worklog.md` (القالب المعتاد: `---` ثم Task ID: 12-a … إلخ) — لا تكتب فوق المحتوى.
- أرجع تقريراً نهائياً: قائمة الملفات المعدولة، قراراتك، وأي انحراف عن المواصفة مع سببه.
