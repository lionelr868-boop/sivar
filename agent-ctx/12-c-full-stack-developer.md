# Task 12-c — إصلاح خللين من تحقق E2E للجولة 12 (full-stack-developer)

السياق: خللان وثّقهما المُتحقق 12-b في نهاية الجولة 12. هذا التقرير هو سجلّ التنفيذ والإصلاح والتحقق الكامل.

## الخلل 1 — نص زر CTA أبيض-على-أبيض في المعاينة عند bgColor داكن (حقيقي — مُصلَح)

### السبب الجذري (مُثبت بالأدلة، ليس نظرياً)
- `PButton` (src/components/prototype/ui/p-button.tsx): متغير `secondary` يحمل `text-[var(--pt-text)]` ومتغير `primary` يحمل `text-[var(--pt-primary-fg)]`.
- في `cta-block.tsx` الزر الأبيض عند `textDark` كان يحمل `bg-white text-[#16121f]` كصنف إضافي فوق صنف المتغير.
- **ترتيب القواعد في CSS المُجمَّع (_offsets من ملف globals المُصدَّر من خادم التطوير)**:
  - `.text-\[\#16121f\]` عند البايت 93081
  - `.text-\[var\(--pt-primary-fg\)\]` عند 93263 (بعده → يغلب)
  - `.text-\[var\(--pt-text\)\]` عند 93338 (بعده → يغلب)
  - `.text-white` عند 97979 (يغلب كل ما سبق)
  - `.bg-white` عند 74807 يغلب `.bg-\[var\(--pt-secondary\)\]` (60866) و`.bg-\[var\(--pt-primary\)\]` (60788)
- إذن: `text-[#16121f]` يخسر التتالي لصنف var دائماً، بينما `bg-white` يفوز → زر أبيض بنص من `var(--pt-*)`.
- مع secvars (bgColor #111827): `--pt-text:#ffffff` → نص أبيض على زر أبيض (مطابق لتقرير 12-b).
- **اكتشاف إضافي**: الشريط الإعلاني (banner-block.tsx) يحمل **النمط المطابق حرفياً** — والمتغير هناك primary افتراضياً → النص كان `var(--pt-primary-fg)` = `#ffffff` (كل المشاريع) على `bg-white` → **زر الشريط غير مرئي في الحالة الافتراضية أصلاً** (منذ الجولة 7!) وليس فقط مع ألوان الأقسام.

### الإصلاح (أصغر وأمتن حل: نمط inline)
- `cta-block.tsx` (سطر ~91-104): حذف صنف `text-[#16121f]` الخاسر وإضافة `style={textDark ? { color: '#16121f' } : undefined}` — الأسلوب المضمّن يغلب أي صنف CSS مهما كان ترتيب التتالي. `bg-white` و`hover:bg-white/90` بقيا (يفوزان أصلاً + hover خصوصيته أعلى).
- `banner-block.tsx` (سطر ~91-103): نفس الإصلاح حرفياً (نمط مطابق).
- `hero-block.tsx`: **فُحص ولم يُعدَّل** — زره الثانوي الداكن يستعمل `text-white` (يفوز في التتالي عند 97979) على `bg-white/10` شفاف — لا يمكن أن ينتج نصاً غير مرئي.
- مسح شامل لكل `src/components/prototype/blocks/*.tsx` بحثاً عن `bg-white`+var أو text-white+var: المواضع الأخرى كلها زخرفية (نقاط gallery، مقبض settings، iframe custom-html بلا نص) أو تبديل شرطي كامل (hero eyebrow/EmailCapture) — **لا صراع تتالي آخر يمكن أن يخفي نصاً**.
- التصدير لم يُمس (زرّاه pt-btn--on-dark زجاجي بنص أبيض مقروء — غير متأثر أصلاً).

## الخلل 2 — سمتا style مكررتان في HTML المُصدَّر (مُصلَح)

### السبب
`applyReveal` في generate.ts كان يضيف ` style="transition-delay:…ms"` في نهاية رأس الوسم الأول دائماً — فإذا كان الوسم يحمل سمة style أصلاً (غلاف `pt-secvars` من الجولة 12، أو `<section style="background-image:…">` لأقسام الصور من الجولة 9) صار للوسم **سمتا style** — HTML غير صالح والمتصفح يُبقي الأولى فتضيع قيمة التأخير.

### الإصلاح
`applyReveal` الآن: عند delay>0 يبحث عن `style="` في رأس الوسم؛ إن وُجدت يدمج `transition-delay:…ms;` في **مقدمة** قيمتها (بلا سمة ثانية أبداً)، وإلا يضيف سمة جديدة كما كان. delay=0 بلا سمة (كما كان).

## الملفات المعدلة (3 فقط — لا شيء آخر)
1. `src/components/prototype/blocks/cta-block.tsx` — سطرا className/style للزر + تعليق تفسيري.
2. `src/components/prototype/blocks/banner-block.tsx` — نفسه.
3. `src/lib/export/generate.ts` — دالة `applyReveal` فقط (دمج سمة style).

## التحقق (كله ناجح)
- `npx tsc --noEmit`: صفر أخطاء في src/ (المتبقي: أخطاء examples/ وskills/ الموجودة أصلاً).
- `bun run lint`: صفر أخطاء (تحذير الخطوط القديم وحده).
- متصفح حقيقي (agent-browser, جلسة r12fix): دخول تجريبي → فتح «موضة الجزائر»:
  - غلاف secvars: `--pt-text:#ffffff`, خلفية `rgb(17,24,39)` — ظروف إعادة الإنتاج قائمة.
  - زر CTA «إنشاء حساب مجاني»: **computed color = rgb(22,18,31)** (المطلوب حرفياً) على خلفية `rgb(255,255,255)` + inlineStyleColor مطابق — tool-results/r12-fix-cta.png (تحقق بكسلي: 1747 بكسل أبيض + 152 بكسل داكنة للتسمية بينها rgb(22,18,31) الصافية).
  - «متجرتي» (النمط المطابق بلا ألوان قسم): زر الشريط «تسوّق الآن» = أبيض + rgb(22,18,31) inline — tool-results/r12-fix-banner.png (تحقق بكسلي: تسمية داكنة واضحة). زر البطل primary الأخضر لم يتغير (سلوك قائم محفوظ).
- التصدير (curl بالكوكي sivar_session → ZIP 61190 بايت، HTTP 200):
  - **صفر** وسوم بسمتَي style في index.html وhome/index.html (grep `<div [^>]*style="…"[^>]*style="` فارغ، وكذلك لأي وسم).
  - الغلاف المدمج: `<div class="pt-reveal pt-secvars" style="transition-delay:120ms;--pt-bg:#111827;--pt-surface:#0a0e17;--pt-border:#0e1420;--pt-text:#ffffff;--pt-muted:#a5a7ad;color:var(--pt-text);background:#111827">` — سمة واحدة تحمل المتغيرات والتأخير معاً.
  - بقية أغلفة reveal سليمة: 60ms و120ms لوسوم بلا style أصلاً، وأول قسم بلا سمة (delay=0).
  - زر CTA المُصدَّر لم يتغير (pt-btn--on-dark) وبطاقته `blk-cta__card--secvar` بتدرّجها (180deg,#111827,#0f1522).
- dev.log: كل الطلبات 200 والترجمات ✓ بلا أخطاء؛ agent-browser errors فارغ وconsole رسائل HMR فقط.

## قرارات
- inline style بدل `!` important أو صنف مخصص: أمتن حل ضد أي إعادة ترتيب مستقبلية لتتالي Tailwind (خيار المواصفة نفسها).
- إبقاء `bg-white` صنفاً: يفوز مثبتاً بالإزاحات، وhover يعمل بخصوصية أعلى؛ لو صار inline لتعطّل hover — لم نلمسه.
- دمج transition-delay في مقدمة سمة style الموجودة: أبسط من تعديل wrapSectionVars (الذي يخدم 3 قشور بلا reveal) وأشمل (يشفي أيضاً ملفات صور الجولة 9 التي كانت تُصدَّر بسمتين عند delay>0 دون أن يُلاحظ أحد).
