#!/bin/bash
# ============================================================
# E2E الجولة 14 — اختبار 2ب: ينتظر اكتمال ردّ الوكيل فعلياً ثم يتحقق
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
snap > "$OUT/t2b-projects.txt" 2>&1
OPEN_REF=$(awk '/حجزتي/{found=NR} found && /فتح المشروع/ && NR>found {print; exit}' "$OUT/t2b-projects.txt" | sed -E 's/.*\[ref=([^]]+)\].*/\1/')
agent-browser click "@$OPEN_REF"; sleep 6

# تعديل غير محفوظ في العنوان
agent-browser eval "(() => { const b = document.querySelectorAll('div[role=\"button\"]'); if (b.length) { b[0].click(); return b.length; } return 0; })()"
sleep 2
TREF=$(snap | grep -E 'textbox' | grep 'عنوان البطل المخصص' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
echo "=== TITLE INPUT REF: $TREF"
agent-browser fill "@$TREF" "عنوان تجريبي 2ب للجولة 14"
agent-browser press Tab; sleep 2
echo "=== H1 AFTER UNSAVED EDIT:"
agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO H1'" 2>/dev/null

# طلب الوكيل + انتظار اكتمال ردّه (الرد يحتوي أحد هذه العلامات)
AGENT_TAB=$(snap | grep -E 'المساعد الذكي' | grep -E 'tab|button' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser click "@$AGENT_TAB"; sleep 2
TREF2=$(snap | grep -E 'textbox "اطلب أي تعديل' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser fill "@$TREF2" "غيّر نصف قطر الحواف إلى 20"
agent-browser press Enter
echo "=== AGENT REQUEST SENT — waiting for COMPLETION (reply marker)..."
DONE=no
for i in $(seq 1 50); do
  sleep 2
  REPLY=$(agent-browser eval "document.body.innerText.includes('نفّذت تعديلاتك') || document.body.innerText.includes('تم تحديث هوية') || document.body.innerText.includes('نصف القطر') || document.body.innerText.includes('لم أفهم') || document.body.innerText.includes('لا توجد قيم')" 2>/dev/null)
  if echo "$REPLY" | grep -qiE "true"; then DONE="after ~$((i*2))s"; break; fi
done
echo "=== AGENT COMPLETED: $DONE"
sleep 2
echo "=== H1 AFTER AGENT COMPLETED:"
agent-browser eval "document.querySelector('h1') ? document.querySelector('h1').innerText : 'NO H1'" 2>/dev/null
agent-browser screenshot "$OUT/t2b-final.png" 2>&1 | tail -1
agent-browser eval "document.body.innerText" > "$OUT/t2b-body.txt" 2>&1
echo "=== AGENT CHAT REPLY:"
grep -oE "(غيّر نصف[^\"]{0,120}|نفّذت[^\"]{0,100}|تم تحديث[^\"]{0,100}|لم أفهم[^\"]{0,80})" "$OUT/t2b-body.txt" | tail -4
agent-browser errors > "$OUT/t2b-errors.txt" 2>&1
echo "=== ERRORS: $(head -2 "$OUT/t2b-errors.txt")"
pkill -f "next dev" 2>/dev/null; sleep 1

echo "=== DB GROUND TRUTH:"
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const p = await db.project.findUnique({ where: { id: 'cmu9urhrq0002oqwirj111d06' } });
  const s = JSON.parse(p.schemaJson);
  const hero = s.pages[0].blocks.find(b => b.type === 'hero');
  console.log('hero.title =', JSON.stringify(hero.props.title), hero.props.title === 'عنوان تجريبي 2ب للجولة 14' ? '✓ PRESERVED THROUGH AGENT' : '✗');
  console.log('theme.radius =', s.theme.radius);
  const gal = s.pages.flatMap(pg => pg.blocks.filter(b => b.type === 'gallery'));
  console.log('gallery item0 still synced:', gal[0].props.items[0].title, '/', gal[0].props.items[0].price);
  console.log('services row0 still synced:', s.mockData.entities.services.rows[0].name);
  const vs = await db.projectVersion.findMany({ where: { projectId: p.id }, orderBy: { number: 'desc' }, take: 3, select: { number: true, label: true } });
  console.log('versions:', JSON.stringify(vs));
  await db.\$disconnect();
})();
" 2>&1
echo "=== DONE TEST 2B"
