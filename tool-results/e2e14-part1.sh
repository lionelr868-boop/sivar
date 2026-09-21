#!/bin/bash
# ============================================================
# E2E الجولة 14 — الجزء 1 (v3): تزامن الخدمات + عدم حذف التعديلات
# فحوصات بعدّ التكرار (صدى المحادثة = 1؛ المعاينة = ≥2) + تحقق من قاعدة البيانات
# ============================================================
set +e
cd /home/z/my-project
OUT=tool-results/e2e14
mkdir -p "$OUT"

snap() { agent-browser snapshot -i -c 2>/dev/null; }

# ---------- تشغيل الخادم ----------
(./node_modules/.bin/next dev -p 3000 2>&1 | tee dev.log > /dev/null) &
for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 1; done
echo "=== SERVER READY (${i}s)"

agent-browser set viewport 1440 900
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
sleep 2

# ---------- دخول تجريبي ----------
LOGIN_REF=$(snap | grep -E 'button "تسجيل الدخول"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$LOGIN_REF"; sleep 2
DEMO_REF=$(snap | grep -E 'button "تجربة سريعة بدون تسجيل"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$DEMO_REF"; sleep 4
PROJ_NAV=$(snap | grep "مشاريعي" | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$PROJ_NAV"; sleep 3
snap > "$OUT/04-projects.txt" 2>&1
OPEN_REF=$(awk '/حجزتي/{found=NR} found && /فتح المشروع/ && NR>found {print; exit}' "$OUT/04-projects.txt" | sed -E 's/.*\[ref=([^]]+)\].*/\1/')
agent-browser click "@$OPEN_REF"; sleep 6
echo "=== BUILDER OPENED"

# ---------- اختبار 1: تزامن الخدمات (الوكيل يحرّر المعرض ← الجدول) ----------
TREF=$(snap | grep -E 'textbox "اطلب أي تعديل' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser fill "@$TREF" 'غيّر اسم أول خدمة في قسم خدمات الموقع إلى قص وتصفيف ملكي وسعرها 3000 دينار'
agent-browser press Enter
echo "=== WAITING FOR AGENT (LLM + sync)..."
SYNC_OK=no
for i in $(seq 1 45); do
  sleep 2
  CNT=$(agent-browser eval "(document.body.innerText.split('قص وتصفيف ملكي').length - 1) + '|' + (document.body.innerText.includes('تحدّثت بيانات لوحة التحكم') ? 'SYNCED' : 'no')" 2>/dev/null)
  if echo "$CNT" | grep -qE "^[2-9]\|SYNCED$"; then SYNC_OK="after ~$((i*2))s ($CNT)"; break; fi
done
echo "=== GALLERY+SYNC RESULT: $SYNC_OK"

# صفحة «الخدمات» من لوحة الصفحات ← المعاينة تعرض جدول الكيان
SREF=$(snap | grep -E 'button "الخدمات"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
echo "=== SERVICES PAGE REF: $SREF"
agent-browser click "@$SREF"; sleep 3
agent-browser eval "document.body.innerText" > "$OUT/07-services-preview-body.txt" 2>&1
echo "=== TABLE NAME COUNT (echo+row >= 2):"
grep -o "قص وتصفيف ملكي" "$OUT/07-services-preview-body.txt" | wc -l
echo "=== TABLE FORMATTED PRICE 3,000 PRESENT:"
grep -c "3,000" "$OUT/07-services-preview-body.txt" || true
agent-browser screenshot "$OUT/07-services-table.png" 2>&1 | tail -1

# ---------- اختبار 2: عدم حذف التعديلات السابقة ----------
LREF=$(snap | grep -E 'button "الرئيسية"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$LREF"; sleep 2
agent-browser eval "(() => { const b = document.querySelectorAll('div[role=\"button\"]'); if (b.length) { b[0].click(); return b.length; } return 0; })()"
sleep 2
snap > "$OUT/08-hero-selected.txt" 2>&1
HREF=$(snap | grep -E 'textbox' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
echo "=== HERO TITLE INPUT REF: $HREF"
agent-browser fill "@$HREF" "عنوان البطل المخصص ج14"
agent-browser press Tab; sleep 2
echo "=== H1 AFTER UNSAVED EDIT:"
agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO H1'" 2>/dev/null

# العودة لتبويب الوكيل ثم طلب لون (مع تعديلات غير محفوظة!)
AGENT_TAB=$(snap | grep -E 'المساعد الذكي' | grep -E 'tab|button' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$AGENT_TAB"; sleep 2
TREF2=$(snap | grep -E 'textbox "اطلب أي تعديل' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser fill "@$TREF2" "اجعل لون الهوية الأساسي أخضر"
agent-browser press Enter
echo "=== COLOR REQUEST SENT — polling for agent completion..."
COLOR_OK=no
for i in $(seq 1 45); do
  sleep 2
  H1=$(agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO'" 2>/dev/null)
  if echo "$H1" | grep -q "عنوان البطل المخصص ج14"; then COLOR_OK="h1-preserved after ~$((i*2))s"; break; fi
done
echo "=== HERO TITLE SURVIVED AGENT: $COLOR_OK"
echo "=== H1 NOW: $(agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO'" 2>/dev/null)"
agent-browser screenshot "$OUT/09-after-color.png" 2>&1 | tail -1
agent-browser eval "document.body.innerText" > "$OUT/09-after-color-body.txt" 2>&1

agent-browser errors > "$OUT/browser-errors.txt" 2>&1
echo "=== BROWSER ERRORS: $(cat "$OUT/browser-errors.txt" | head -3)"

pkill -f "next dev" 2>/dev/null; sleep 1

# ---------- تحقق قاعدة البيانات ----------
echo "=== DB GROUND TRUTH:"
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const p = await db.project.findUnique({ where: { id: 'cmu9urhrq0002oqwirj111d06' } });
  const s = JSON.parse(p.schemaJson);
  const hero = s.pages[0].blocks.find(b => b.type === 'hero');
  console.log('1. hero.title =', JSON.stringify(hero.props.title), hero.props.title === 'عنوان البطل المخصص ج14' ? '✓' : '✗');
  console.log('   hero props intact:', Object.keys(hero.props).length, 'keys');
  console.log('2. theme.primary =', s.theme.primary, /059669|16a34a|22c55e|15803d/.test(s.theme.primary) ? '✓ green' : '?');
  const gal = s.pages.flatMap(pg => pg.blocks.filter(b => b.type === 'gallery'));
  const it = gal[0].props.items[0];
  console.log('3. gallery item0 =', JSON.stringify({ title: it.title, price: it.price, badge: it.badge }), it.title === 'قص وتصفيف ملكي' && it.price === 3000 && it.badge === 'الأكثر طلباً' ? '✓ (badge preserved)' : '✗');
  const r0 = s.mockData.entities.services.rows[0];
  console.log('4. services row0 =', JSON.stringify({ name: r0.name, price: r0.price, category: r0.category }), r0.name === 'قص وتصفيف ملكي' && r0.price === 3000 ? '✓ SYNCED' : '✗ NOT SYNCED');
  console.log('5. exportedAt =', p.exportedAt);
  const vs = await db.projectVersion.findMany({ where: { projectId: p.id }, orderBy: { number: 'desc' }, take: 3, select: { number: true, label: true } });
  console.log('6. latest versions:', JSON.stringify(vs));
  await db.\$disconnect();
})();
" 2>&1
echo "=== DONE PART 1 v3"
