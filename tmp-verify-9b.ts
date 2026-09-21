// ============================================================
// سكربت تحقق مؤقت — Task 9-b (يُحذف بعد التشغيل)
// ============================================================
import { buildTemplateSchema } from './src/lib/project/templates'
import { generateStaticSite, dataUrlToAsset } from './src/lib/export/generate'
import { stripTransientImages } from './src/lib/project/tools'

let pass = 0
let fail = 0
const failures: string[] = []
function check(name: string, ok: boolean): void {
  if (ok) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    failures.push(name)
    console.log(`  ✗ ${name}`)
  }
}

// 1x1 PNGs (base64) — ألوان مختلفة للمطابقة
const PNG_A = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const PNG_B = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const PNG_C = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hDwADhQGAWjR9igAAAABJRU5ErkJggg=='

console.log('== 0) صلاحية الصور الصغيرة ==')
check('dataUrlToAsset يقبل PNG_A', !!dataUrlToAsset(PNG_A))
check('dataUrlToAsset يقبل PNG_B', !!dataUrlToAsset(PNG_B))
check('dataUrlToAsset يقبل PNG_C', !!dataUrlToAsset(PNG_C))

// ============================================================
// 1) مخطط غني بالصور: بطل analytics + صورة + cta bgImage + معرض + فريق + branding
// ============================================================
const schema = buildTemplateSchema('saas-suite')
const landing = schema.pages.find((p) => p.type === 'landing')
if (!landing) throw new Error('no landing page')

const hero = landing.blocks.find((b) => b.type === 'hero')
if (!hero) throw new Error('no hero block')
hero.props.visual = 'analytics'
hero.props.bgImage = PNG_A
hero.props.bgImageName = 'hero.png'

let cta = landing.blocks.find((b) => b.type === 'cta')
if (!cta) {
  cta = { id: 'test-cta', type: 'cta', props: { title: 'جرّب الآن', buttonText: 'ابدأ' } }
  landing.blocks.push(cta)
}
cta.props.bgImage = PNG_B
cta.props.bgImageName = 'cta.png'
cta.props.bgOverlay = 'dark'

landing.blocks.push({
  id: 'test-gallery',
  type: 'gallery',
  props: {
    title: 'معرض الاختبار',
    items: [
      { title: 'عنصر بصورة', description: 'وصف', price: 1500, image: PNG_A, imageName: 'g1.png' },
      { title: 'عنصر بلا صورة', description: 'وصف', price: 900 },
    ],
  },
})
landing.blocks.push({
  id: 'test-team',
  type: 'team',
  props: {
    title: 'فريق الاختبار',
    items: [
      { name: 'أحمد بن علي', role: 'مدير', image: PNG_B, imageName: 't1.png' },
      { name: 'سارة بوزيد', role: 'مصممة' },
    ],
  },
})
// رسم دائري لاختبار ترقية donut (القوالب تستعمل bar/line فقط)
const dashPage = schema.pages.find((p) => p.type === 'dashboard')
dashPage?.blocks.push({ id: 'test-donut', type: 'chart', props: { title: 'التوزيع', chartType: 'donut', dataKey: 'salesByCity' } })
const features = landing.blocks.find((b) => b.type === 'features')
if (features) {
  features.props.bgImage = PNG_C
  features.props.bgOverlay = 'light'
}
schema.branding = {
  ...(schema.branding ?? {}),
  logo: 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#059669"/></svg>').toString('base64'),
  bgImage: PNG_B,
  bgImageName: 'bg.png',
  bgOverlay: 'soft',
}

console.log('\n== 1) توليد الموقع بالصور ==')
const out = generateStaticSite(schema)
const files = out.files
const indexHtml = String(files['index.html'] ?? '')
const stylesCss = String(files['styles.css'] ?? '')
const scriptJs = String(files['script.js'] ?? '')
const htmlFiles = Object.keys(files).filter((k) => k.endsWith('.html'))

check('assets/img-1.png موجود كثنائي (بطل)', files['assets/img-1.png'] instanceof Uint8Array)
check('assets/img-2.png موجود كثنائي (features)', files['assets/img-2.png'] instanceof Uint8Array)
check('assets/img-3.png موجود كثنائي (cta/فريق)', files['assets/img-3.png'] instanceof Uint8Array)
check('التكرار مُزال: لا img-4 (معرض/فريق يعيدان نفس الصور)', files['assets/img-4.png'] === undefined)
check('assets/bg.png موجود كثنائي (خلفية المشروع)', files['assets/bg.png'] instanceof Uint8Array)
check('لا آثار لآلية hero-bg القديمة', !Object.keys(files).some((k) => k.includes('hero-bg')))
check('assets/logo.svg موجود', files['assets/logo.svg'] instanceof Uint8Array)

console.log('\n== 2) الرسوم الجانبية الواقعية ==')
check('بطل analytics: pt-mock-analytics في index.html', indexHtml.includes('pt-mock-analytics'))
check('بطل analytics: تقرير الأداء', indexHtml.includes('تقرير الأداء'))
check('بطل analytics: منحنى متحرك pt-anim-line', indexHtml.includes('pt-anim-line'))
check('بطل analytics: تلميح data-tip داخل المنحنى', /data-tip="[^"]+:/.test(indexHtml))

for (const kind of ['dashboard', 'phone', 'orders', 'chat', 'calendar', 'testimonial'] as const) {
  const s2 = buildTemplateSchema('saas-suite')
  const h2 = s2.pages.find((p) => p.type === 'landing')!.blocks.find((b) => b.type === 'hero')!
  h2.props.visual = kind
  const idx2 = String(generateStaticSite(s2).files['index.html'] ?? '')
  const markers: Record<string, string> = {
    dashboard: 'pt-mock-dash',
    phone: 'pt-mock-phone',
    orders: 'pt-mock-orders',
    chat: 'pt-mock-typing',
    calendar: 'pt-mock-cal',
    testimonial: 'pt-mock-quote',
  }
  check(`visual=${kind} يُصدر موكه (${markers[kind]})`, idx2.includes(markers[kind]))
}
{
  const s3 = buildTemplateSchema('saas-suite')
  const h3 = s3.pages.find((p) => p.type === 'landing')!.blocks.find((b) => b.type === 'hero')!
  h3.props.visual = 'form'
  h3.props.layout = 'split'
  const idx3 = String(generateStaticSite(s3).files['index.html'] ?? '')
  check('visual=form يُصدر نموذج البريد (pt-lead-form)', idx3.includes('pt-lead-form'))
  const s4 = buildTemplateSchema('saas-suite')
  const h4 = s4.pages.find((p) => p.type === 'landing')!.blocks.find((b) => b.type === 'hero')!
  h4.props.visual = 'chat'
  h4.props.layout = 'centered'
  const idx4 = String(generateStaticSite(s4).files['index.html'] ?? '')
  check('centered + chat → لا رسم جانبي (قاعدة المكدس)', !idx4.includes('pt-mock-chat'))
}

console.log('\n== 3) صور الأقسام (bgImage/bgOverlay) ==')
check('cta بخلفية dark: تدرّج + url assets/img-3', indexHtml.includes("background-image:linear-gradient(180deg,rgba(13,10,25,.62),rgba(13,10,25,.78)),url('assets/img-3.png')"))
check('features بتراكب light: تدرّج فاتح + url assets/img-2', indexHtml.includes("background-image:linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,.72)),url('assets/img-2.png')"))
check('cta: صنف onimage (نص أبيض)', indexHtml.includes('blk-section--onimage '))
check('features بتراكب light: صنف onimage-light', indexHtml.includes('blk-section--onimage-light'))
check('بطاقة معرض بصورة: blk-gallery__photo', indexHtml.includes('class="blk-gallery__photo"') && indexHtml.includes("src=\"assets/img-1.png\""))
check('عضو فريق بصورة: blk-team__photo', indexHtml.includes('class="blk-team__photo"') && indexHtml.includes("src=\"assets/img-3.png\""))
{
  const s5 = buildTemplateSchema('saas-suite')
  const f5 = s5.pages.find((p) => p.type === 'landing')!.blocks.find((b) => b.type === 'features')!
  f5.props.bgImage = PNG_A
  f5.props.bgOverlay = 'none'
  const idx5 = String(generateStaticSite(s5).files['index.html'] ?? '')
  check('تراكب none: صنف onimage-none', idx5.includes('blk-section--onimage-none'))
}

console.log('\n== 4) خلفية المشروع الثابتة ==')
check('body فيها pt-hasbg pt-hasbg--soft', indexHtml.includes('<body class="pt-hasbg pt-hasbg--soft">'))
check('pt-pagebg أول ابن للجسم', indexHtml.includes('<div class="pt-pagebg" aria-hidden="true" style="background-image:url(\'assets/bg.png\')"></div>'))
check('الرابط يتخطى الخلفية (ترتيب الأولاد)', indexHtml.indexOf('pt-pagebg') < indexHtml.indexOf('pt-skip'))
const folderPage = Object.keys(files).find((k) => /\/index\.html$/.test(k)) ?? ''
check('صفحة مجلد موجودة', folderPage !== '')
const folderHtml = String(files[folderPage] ?? '')
check('صفحة مجلد: pt-hasbg + ../assets/bg.png', folderHtml.includes('pt-hasbg--soft') && folderHtml.includes("url('../assets/bg.png')"))
const notFound = String(files['404.html'] ?? '')
check('404: pt-hasbg + pt-pagebg', notFound.includes('pt-hasbg--soft') && notFound.includes('pt-pagebg'))
check('CSS: .pt-pagebg + wash soft .55', stylesCss.includes('.pt-pagebg{position:fixed;inset:0;z-index:-1') && stylesCss.includes('body.pt-hasbg--soft::after') && stylesCss.includes('opacity:.55'))
check('CSS: body.pt-hasbg شفافة + الشريط الجانبي شفاف', stylesCss.includes('body.pt-hasbg{background:transparent}') && stylesCss.includes('body.pt-hasbg .pt-sidebar-layout{background:transparent}'))

console.log('\n== 5) لا data URLs في HTML ==')
let noDataImages = true
for (const k of htmlFiles) {
  const h = String(files[k] ?? '')
  if (h.includes('data:image/png') || h.includes('data:image/jpeg') || h.includes('data:image/webp')) {
    noDataImages = false
    console.log(`    ✗ data URL في ${k}`)
  }
}
check('لا data:image/png|jpeg|webp في أي HTML', noDataImages)
check('favicon svg data URL مسموح (الشعار هنا ملف)', indexHtml.includes('assets/logo.svg'))

console.log('\n== 6) الرسوم البيانية + التلميحات ==')
const dashPageKey = Object.keys(files).find((k) => /dashboard.*index\.html$/.test(k)) ?? ''
check('صفحة لوحة تحكم موجودة', dashPageKey !== '')
const dashHtml = String(files[dashPageKey] ?? '')
check('lineChart: pathLength="1" + pt-anim-line', dashHtml.includes('pathLength="1"') && dashHtml.includes('pt-anim-line'))
check('lineChart: تدرّج الخط العمودي line-', dashHtml.includes('line-g'))
check('lineChart: مناطق hover r="14" مع data-tip', dashHtml.includes('r="14" fill="transparent" tabindex="0" data-tip='))
check('barChart: pt-anim-bar + تأخير متتابع', dashHtml.includes('pt-anim-bar') && /animation-delay:\d+ms/.test(dashHtml))
const allHtml = htmlFiles.map((k) => String(files[k] ?? '')).join('\n')
check('donut: pt-donut-seg + data-tip نسبة (عبر كل الصفحات)', allHtml.includes('pt-donut-seg') && /data-tip="[^"]+: [\d,.]+ \(\d+%\)"/.test(allHtml))
check('CSS: pt-draw/pt-grow/pt-fadein + donut hover', stylesCss.includes('@keyframes pt-draw') && stylesCss.includes('@keyframes pt-grow') && stylesCss.includes('@keyframes pt-fadein') && stylesCss.includes('.blk-donut:hover .pt-donut-seg{opacity:.55}'))
check('CSS: .pt-tip مُنمّق', stylesCss.includes('.pt-tip{position:fixed;z-index:9999'))
check('CSS: reduced-motion يعيد الحالة النهائية', stylesCss.includes('.pt-anim-line{stroke-dasharray:none;stroke-dashoffset:0;animation:none}') && stylesCss.includes('.pt-anim-bar{transform:none;animation:none}'))
check('script.js: معالج التلميح المفوَّض', scriptJs.includes("closest('[data-tip]')") && scriptJs.includes('pt-tip') && scriptJs.includes('focusin'))
check('script.js: keyframes typing في CSS', stylesCss.includes('@keyframes pt-typing'))
check('script.js صالح نحوياً', (() => { try { new Function(scriptJs); return true } catch { return false } })())
const open = (stylesCss.match(/{/g) ?? []).length
const close = (stylesCss.match(/}/g) ?? []).length
check(`أقواس styles.css متوازنة (${open}/${close})`, open === close)

console.log('\n== 7) الميزات القديمة باقية ==')
const loginHtml = String(files['login/index.html'] ?? '')
check('زر العودة pt-back في صفحة غير رئيسية (login)', loginHtml.includes('class="pt-back"') && loginHtml.includes('data-home="../"'))
check('الرئيسية بلا pt-back', !indexHtml.includes('pt-back'))
check('تروستة اللوحة (pt-topbar)', dashHtml.includes('pt-topbar'))
check('ترقيم الجداول (data-pager)', dashHtml.includes('data-pager'))
check('netlify.toml موجود', typeof files['netlify.toml'] === 'string')
check('404.html موجود', '404.html' in files)
check('README يذكر assets/img-* و assets/bg', String(files['README.md'] ?? '').includes('assets/img-*') && String(files['README.md'] ?? '').includes('assets/bg'))
check('README لا يذكر hero-bg', !String(files['README.md'] ?? '').includes('hero-bg'))
check('hero أساسي → signup/ في index', indexHtml.includes('signup/'))
check('مؤشر reveal موجود', indexHtml.includes('pt-reveal'))
check('صفحة مجلد موجودة', loginHtml !== '')

console.log('\n== 8) التوافق الرجعي (مخطط نظيف بلا صور) ==')
const clean = buildTemplateSchema('saas-suite')
const cleanOut = generateStaticSite(clean)
const cleanFiles = cleanOut.files
const cleanIndex = String(cleanFiles['index.html'] ?? '')
check('لا assets/img-* في الحزمة النظيفة', !Object.keys(cleanFiles).some((k) => /assets\/img-/.test(k)))
check('لا assets/bg في الحزمة النظيفة', !('assets/bg.png' in cleanFiles))
check('body نظيفة بلا أصناف (بايت-متطابق)', cleanIndex.includes('<body>\n<a class="pt-skip"'))
check('لا صنف onimage ولا خلفيات صور في الحزمة النظيفة', !cleanIndex.includes('blk-section--onimage') && !cleanIndex.includes('background-image:linear-gradient'))
check('قسم features كما هو مع pt-reveal (نمط قديم)', cleanIndex.includes('<section id="features" class="pt-reveal blk-section">'))
check('قسم cta كما هو مع pt-reveal tight (نمط قديم)', /<section class="pt-reveal blk-section blk-section--tight"[^>]*><div class="blk-section__inner">/.test(cleanIndex))
check('الرسم الافتراضي dashboard موجود', cleanIndex.includes('pt-mock-dash'))

console.log('\n== 9) stripTransientImages ==')
const stripped = stripTransientImages(schema)
const stHero = stripped.pages.flatMap((p) => p.blocks).find((b) => b.id === hero.id)
const stGallery = stripped.pages.flatMap((p) => p.blocks).find((b) => b.id === 'test-gallery')
const stTeam = stripped.pages.flatMap((p) => p.blocks).find((b) => b.id === 'test-team')
check('bgImage/bgImageName زالت من البطل', stHero?.props.bgImage === undefined && stHero?.props.bgImageName === undefined)
check('bgImage زالت من cta', stripped.pages.flatMap((p) => p.blocks).find((b) => b.id === cta?.id)?.props.bgImage === undefined)
check('image/imageName زالت من عناصر المعرض', (stGallery?.props.items as Array<Record<string, unknown>>)?.every((it) => it.image === undefined && it.imageName === undefined))
check('image زالت من عناصر الفريق', (stTeam?.props.items as Array<Record<string, unknown>>)?.every((it) => it.image === undefined && it.imageName === undefined))
check('branding: bgImage/bgImageName/bgOverlay زالت', stripped.branding?.bgImage === undefined && stripped.branding?.bgImageName === undefined && stripped.branding?.bgOverlay === undefined)
check('branding: الشعار باقٍ', typeof stripped.branding?.logo === 'string' && stripped.branding.logo.length > 0)
check('نفس المرجع لمخطط نظيف (توافق رجعي)', stripTransientImages(clean) === clean)
check('كل الصور زالت من JSON كله', !JSON.stringify(stripped).includes('data:image/png'))

console.log(`\n========================`)
console.log(`النتيجة: ${pass} ناجح / ${fail} فاشل`)
if (failures.length) {
  console.log('الفاشلة:')
  for (const f of failures) console.log(`  ✗ ${f}`)
  process.exit(1)
}
