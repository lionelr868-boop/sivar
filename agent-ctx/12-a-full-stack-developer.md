# Task 12-a — ألوان الخطوط + ألوان أقسام صفحة الهبوط (SIVAR)

**Agent:** full-stack-developer
**Date:** الجولة 12
**Spec:** `agent-ctx/12-spec.md` (اتُّبع بالكامل — الانحرافات موثّقة أدناه)

## الملفات المعدّلة (11 — كلها موجودة أصلاً، صفر ملفات جديدة)

1. `src/lib/i18n/builder.ts` — 8 مفاتيح عربية جديدة فقط (ملحقة في النهاية): fontColorsTitle/fontColorText/fontColorMuted/resetDefault/sectionBgColor/sectionTextColor/colorDefaultHint/removeColor.
2. `src/lib/registry/blocks.ts` — `optional?: boolean` على عضو FieldDefinition الأول + حقولا `bgColor`/`textColor` (color, optional) في نهاية fields لكل الكتل التسويقية الـ12: hero, features, stats, steps, pricing, testimonials, faq, cta, contact-form, gallery, banner, team (تسميات مباشرة «لون خلفية القسم»/«لون خط القسم» اتباعاً للنمط السائد في الملف كله — كل الحقول الأخرى نصوص مباشرة).
3. `src/components/builder/properties-panel.tsx` — APPEARANCE_KEYS += bgColor/textColor (تظهر في مجموعة «المظهر») + مكوّن OptionalColorField: فارغ → حبيكة بحدود متقطعة colorDefaultHint + إدخال hex بعنصر placeholder colorDefaultHint؛ قيمة → منتقي + إدخال + زر X (removeColor) يلتزم `''` (وراثة الهوية).
4. `src/components/builder/theme-panel.tsx` — قسم جديد «ألوان الخطوط» (بعد «الألوان»): FontColorRow لـ theme.text (إعادة ضبط #1c1726) وtheme.mutedText (إعادة ضبط #6e6880) — منتقي + إدخال hex + زر إعادة الضبط (RotateCcw) عبر updateThemeInSchema الموجود.
5. `src/components/prototype/blocks/shared.tsx` — مساعدات مشتركة (النمط السائد للملف): sectionHexColor (تحقق #rgb/#rrggbb)، hexLuminance (سطوع WCAG 0..1)، sectionBgGradient (linear-gradient(180deg, hex, hexDarken(hex, 0.14))).
6. `src/components/prototype/prototype-renderer.tsx` — `sectionVars(bgColor, textColor)` (مُصدَّرة) + ptMix محلي: bgColor → background + --pt-bg + --pt-surface (lighten/darken 0.42 حسب سطوع > 0.55) + --pt-border (0.18)؛ textColor → --pt-text + --pt-muted = mix(text, bg||#fff, 0.38)؛ **نص تلقائي ذكي**: bgColor بلا textColor → سطوع > 0.5 → #17151f وإلا #ffffff (+muted مشتق). الغلاف يُطبَّق في مكان واحد داخل `renderBlock()` (أصبحت switch داخل renderBlockInner) فيستفيده مسارات BlockList الثلاثة — بلا ألوان: null = صفر تغيير.
7. `src/components/prototype/blocks/hero-block.tsx` — bgColor صالح (وبلا صورة): خلفية القسم sectionBgGradient(bgColor) بدل النمط الافتراضي + dark مشتق من سطوع bgColor + العنوان/الفرعي يتبعان var(--pt-text)/var(--pt-muted) عند وجود bgColor.
8. `src/components/prototype/blocks/cta-block.tsx` — نفس المنطق للبطاقة: sectionBgGradient بدل gradient/dark/secondary + title/subtitle متغيريان + زر أبيض/أساسي حسب customDark.
9. `src/components/prototype/blocks/banner-block.tsx` — نفس المنطق للشريط + دائرة أيقونة Megaphone تعتمد color-mix من var(--pt-text) عند اللون المخصّص (تبقى بيضاء بدونه).
10. `src/lib/export/generate.ts` — relativeLuminance + sectionHex + sectionBgGradient + sectionVarsStyle + wrapSectionVars؛ renderBlock الأصلية أصبحت renderBlockInner وrenderBlock الجديدة تغلّف كل كتلة ذات bgColor/textColor بـ `<div class="pt-secvars" style="--pt-text:...;--pt-muted:...;--pt-bg:...;--pt-surface:...;--pt-border:...;color:var(--pt-text);background:...">` (نقطة واحدة تستفيدها القشور الثلاث)؛ hero/cta/banner في التصدير: صنف `blk-hero--secvar`/`blk-cta__card--secvar`/`blk-banner--secvar` + تدرّج inline من bgColor + زر حسب السطوع؛ CSS: 6 قواعد secvar بعد قواعد hero/cta/banner عمداً (تتقدم عليها بالترتيب عند تساوي الخصوصية). جذر `:root{--pt-text:theme.text}` لم يُمس.
11. `src/lib/server/agent.ts` — (أ) برومبت LLM: أداة 9 update_theme توثّق text/mutedText + سطر «يمكنك تغيير ألوان الخطوط (text/mutedText)...» + سطر ألوان كل قسم مع مثال update_block بـ bgColor؛ (ب) EXTRA_COLOR_NAMES (صيغ مؤنثة/مركّبة: سوداء/بيضاء/خضراء داكنة/أبيض...) مدمجة في ALL_COLOR_NAMES تستعملها detectColor + detectAllColors الجديدة (كل الألوان بترتيب مواضعها مع تخطّي الأسماء داخل أسماء أطول)؛ mixHexLocal + deriveMuted (مزج نحو الأبيض 0.35 فاتح / الأسود 0.25 داكن)؛ SECTION_KEYWORDS (12 قسماً عربي/إنجليزي)؛ فرعان استدلاليان قبل فرع اللون العام: خلفية/لون قسم (+textColor عند لون ثانٍ مع ذكر نص) → update_block، ولون خط عام → update_theme {text, mutedText مشتق}.

## قرارات (مع المبررات)

- **الأسبقية: صورة القسم المرفوعة > bgColor**: صور المستخدم (جولة 9) محفوظة حرفياً — bgColor يعمل فقط بلا صورة. يحقق «لا تكسر سلوكاً قائماً».
- **حارس أفعال الإضافة** (أضف/أنشئ) قبل فرع ألوان الأقسام: كي لا يبتلع طلبات مثل «أضف قسم أسئلة بخلفية خضراء» (تُترك لمسار الإضافة القائم).
- **bgIntent = «خلفية» أو «لون» بلا كلمة خط/نص**: «غيّر لون قسم المزايا إلى الأزرق» (بلا كلمة خلفية) يُفهم كخلفية القسم — الخلفية هي اللون المهيمن للقسم.
- **--pt-border بنفس اتجاه --pt-surface بنسبة أخف (0.18)**: تفسير «مشتق مماثل أخف» — أخف لمسةً/نسبة مع بقاء اتجاه الاشتقاق.
- **sectionVars بلا معامل theme**: معادلات المواصفة كلها لا تستعمل السمة (السطوع ذاتي) — معامل غير مستعمل كان سيسبب خطأ lint.
- **i18n: sectionBgColor/sectionTextColor مضافان كما نصّت المواصفة** لكن تسميات حقول السجل نصوص مباشرة (النمط السائد في registry/blocks.ts كله — نص المواصفة نفسه أجاز ذلك صراحة).
- **فرز ألوان الأقسام في الاستدلال بالمواضع** مع إزالة التداخل (أزرق داخل «أزرق داكن») لدعم «خلفية سوداء ونص أبيض» بلونين.

## الانحرافات عن المواصفة

1. sectionVars بلا معامل theme (أعلاه) — نفس السلوك.
2. مطابقة «دعوة الإجراء» صيغت `دعوة.{0,14}إجراء` لتشمل «دعوة الإجراء» بالـ ال التعريف (مثال المواصفة الإلزامي).
3. مطابقة أقسام الاستدلال لا تشترط فعلاً (غيّر/اجعل) — يكفي قسم + لون (المواصفة لم تشترط فعلاً) مع حارس الإضافة أعلاه.

## التحقق

- `npx tsc --noEmit`: **صفر أخطاء في src/** (أخطاء examples/ وskills/ القديمة وحدها).
- `bun run lint`: **صفر أخطاء** (تحذير الخطوط القديم وحده).
- dev.log: GET / (200, compile 140ms) + POST /api/projects/[id]/agent (compile 100ms) + GET export (compile 1037ms) — كل المسارات تُبنى نظيفاً بلا أي خطأ.
- تحقق bun مباشر (بلا ملفات): توليد موقع ثابت بمخطط فيه bgColor/textColor → 4 أغلفة pt-secvars + تدرّجات hero/cta/banner من اللون + زر الشريط الفاتح primary والداكن on-dark + قسم بلا ألوان = بلا غلاف حرفياً؛ applyActions مع إجراءات الفرع الجديد → theme.text/mutedText وcta.bgColor تتحدث فعلاً وبقية الكتل لا تُمس؛ منطق detectAllColors وSECTION_KEYWORDS مُتحقق منه على أمثلة المواصفة الإلزامية («اجعل خلفية قسم دعوة الإجراء سوداء» → cta+#111827، «خلفية الشريط الإعلاني خضراء داكنة» → banner+#065f46، «غيّر لون الخط إلى الأزرق» → فرع لون الخط العام).
