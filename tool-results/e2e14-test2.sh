#!/bin/bash
# ============================================================
# E2E الجولة 14 — اختبار 2 مركّز: تعديل غير محفوظ في المحرر ← طلب وكيل ← لا يُحذف
# (الحقل الصحيح: العنوان = مربع النص ذو القيمة الحالية للعنوان)
# ============================================================
set +e
cd /home/z/my-project
OUT=tool-results/e2e14
snap() { agent-browser snapshot -i -c 2>/dev/null; }

(./node_modules/.bin/next dev -p 3000 2>&1 | tee dev.log > /dev/null) &
for i in $(seq 1 90); do curl -s -o /dev/null http://localhost:3000/ && break; sleep 1; done
echo "=== SERVER READY (${i}s)"

agent-browser set viewport 1440 900
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
sleep 2
LOGIN_REF=$(snap | grep -E 'button "تسجيل الدخول"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$LOGIN_REF"; sleep 2
DEMO_REF=$(snap | grep -E 'button "تجربة سريعة بدون تسجيل"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$DEMO_REF"; sleep 4
PROJ_NAV=$(snap | grep "مشاريعي" | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$PROJ_NAV"; sleep 3
snap > "$OUT/t2-projects.txt" 2>&1
OPEN_REF=$(awk '/حجزتي/{found=NR} found && /فتح المشروع/ && NR>found {print; exit}' "$OUT/t2-projects.txt" | sed -E 's/.*\[ref=([^]]+)\].*/\1/')
agent-browser click "@$OPEN_REF"; sleep 6

# اختر مكوّن البطل
agent-browser eval "(() => { const b = document.querySelectorAll('div[role=\"button\"]'); if (b.length) { b[0].click(); return b.length; } return 0; })()"
sleep 2
# مربع نص العنوان = الذي قيمته الحالية «حجزك مضمون»
TREF=$(snap | grep -E 'textbox' | grep 'حجزك مضمون' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
echo "=== TITLE INPUT REF: $TREF"
agent-browser fill "@$TREF" "عنوان البطل المخصص ج14"
agent-browser press Tab; sleep 2
echo "=== H1 AFTER UNSAVED EDIT:"
agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO H1'" 2>/dev/null

# طلب وكيل مختلف تماماً — دون أي حفظ يدوي
AGENT_TAB=$(snap | grep -E 'المساعد الذكي' | grep -E 'tab|button' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$AGENT_TAB"; sleep 2
TREF2=$(snap | grep -E 'textbox "اطلب أي تعديل' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser fill "@$TREF2" "اجعل لون الهوية الأساسي أزرق سماوي"
agent-browser press Enter
echo "=== COLOR REQUEST SENT (with unsaved title edit) — polling..."
OK=no
for i in $(seq 1 45); do
  sleep 2
  BODY=$(agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO'" 2>/dev/null)
  THEME_DONE=$(agent-browser eval "getComputedStyle(document.documentElement).getPropertyValue('--pt-primary') || document.body.innerText.includes('سماوي')" 2>/dev/null)
  if echo "$BODY" | grep -q "عنوان البطل المخصص ج14"; then OK="h1-preserved after ~$((i*2))s"; break; fi
done
echo "=== HERO TITLE SURVIVED AGENT: $OK"
echo "=== H1 NOW: $(agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO'" 2>/dev/null)"
agent-browser screenshot "$OUT/t2-final.png" 2>&1 | tail -1
agent-browser errors > "$OUT/t2-errors.txt" 2>&1
echo "=== ERRORS: $(head -2 "$OUT/t2-errors.txt")"
pkill -f "next dev" 2>/dev/null; sleep 1

echo "=== DB GROUND TRUTH:"
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const p = await db.project.findUnique({ where: { id: 'cmu9urhrq0002oqwirj111d06' } });
  const s = JSON.parse(p.schemaJson);
  const hero = s.pages[0].blocks.find(b => b.type === 'hero');
  console.log('hero.title =', JSON.stringify(hero.props.title), hero.props.title === 'عنوان البطل المخصص ج14' ? '✓ PRESERVED' : '✗ LOST');
  console.log('hero props count:', Object.keys(hero.props).length);
  console.log('theme.primary =', s.theme.primary);
  const gal = s.pages.flatMap(pg => pg.blocks.filter(b => b.type === 'gallery'));
  console.log('gallery item0 still:', JSON.stringify(gal[0].props.items[0].title), '/', gal[0].props.items[0].price);
  console.log('services row0 still:', JSON.stringify(s.mockData.entities.services.rows[0].name), '/', s.mockData.entities.services.rows[0].price);
  const vs = await db.projectVersion.findMany({ where: { projectId: p.id }, orderBy: { number: 'desc' }, take: 3, select: { number: true, label: true } });
  console.log('versions:', JSON.stringify(vs));
  await db.\$disconnect();
})();
" 2>&1
echo "=== DONE TEST2"
