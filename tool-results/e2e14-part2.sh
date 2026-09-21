#!/bin/bash
# ============================================================
# E2E الجولة 14 — الجزء 2: تصدير كامل بالصور + الاحتفاظ 24 ساعة
# ============================================================
set +e
cd /home/z/my-project
OUT=tool-results/e2e14
PROJ=cmu9urhrq0002oqwirj111d06
COOKIE="sivar_session=cmu9urhrh0000oqwid0coi5aq"
snap() { agent-browser snapshot -i -c 2>/dev/null; }

# ---------- 0) حقن صور خلفية في المخطط (محاكاة رفع المستخدم) ----------
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const p = await db.project.findUnique({ where: { id: '$PROJ' } });
  const s = JSON.parse(p.schemaJson);
  const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const hero = s.pages[0].blocks.find(b => b.type === 'hero');
  hero.props.bgImage = PNG;
  hero.props.bgImageName = 'hero-bg-test.png';
  hero.props.bgOverlay = 'medium';
  const gal = s.pages.flatMap(pg => pg.blocks.filter(b => b.type === 'gallery'))[0];
  gal.props.items[2].image = PNG;
  gal.props.items[2].imageName = 'item-test.png';
  await db.project.update({ where: { id: '$PROJ' }, data: { schemaJson: JSON.stringify(s), exportedAt: null, status: 'ready' } });
  console.log('injected: hero.bgImage + gallery item2.image');
  await db.\$disconnect();
})();
" 2>&1

# ---------- 1) تشغيل الخادم + فتح المشروع ----------
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
snap > "$OUT/p2-projects.txt" 2>&1
OPEN_REF=$(awk '/حجزتي/{found=NR} found && /فتح المشروع/ && NR>found {print; exit}' "$OUT/p2-projects.txt" | sed -E 's/.*\[ref=([^]]+)\].*/\1/')
agent-browser click "@$OPEN_REF"; sleep 6
echo "=== BUILDER OPENED (with images in schema)"

# ---------- 2) فتح نافذة التصدير ----------
DL_REF=$(snap | grep -E 'تحميل المشروع' | grep button | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
echo "=== DOWNLOAD BUTTON REF: $DL_REF"
agent-browser click "@$DL_REF"
echo "=== EXPORT DIALOG — waiting for ready phase..."
READY=no
for i in $(seq 1 30); do
  sleep 1
  if agent-browser eval "document.body.innerText.includes('تحميل ZIP')" 2>/dev/null | grep -qi true; then READY="after ${i}s"; break; fi
done
echo "=== EXPORT READY: $READY"
echo "=== RETENTION NOTE VISIBLE:"
agent-browser eval "document.body.innerText.includes('محفوظاً كاملاً في حسابك لمدة 24 ساعة')" 2>/dev/null
agent-browser screenshot "$OUT/p2-export-dialog.png" 2>&1 | tail -1
ZIPBTN=$(snap | grep -E 'button "تحميل ZIP"' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
echo "=== ZIP BUTTON REF: $ZIPBTN"
agent-browser click "@$ZIPBTN"
sleep 6
echo "=== RETENTION TOAST SHOWN:"
agent-browser eval "document.body.innerText.includes('مشروعك محفوظ كاملاً بصوره في حسابك لمدة 24 ساعة')" 2>/dev/null

# ---------- 3) تنزيل ZIP عبر curl وفحص محتواه ----------
curl -s -b "$COOKIE" -o "$OUT/p2-export.zip" "http://localhost:3000/api/projects/$PROJ/export"
echo "=== ZIP SIZE: $(stat -c%s "$OUT/p2-export.zip" 2>/dev/null) bytes"
rm -rf "$OUT/p2-unzipped" && mkdir -p "$OUT/p2-unzipped"
cd "$OUT/p2-unzipped" && unzip -oq ../p2-export.zip && cd /home/z/my-project
echo "=== ASSETS FILES:"
ls -la "$OUT/p2-unzipped/assets/" 2>/dev/null | head -6
echo "=== SERVICES PAGE HTML CONTAINS SYNCED DATA:"
grep -c "قص وتصفيف ملكي" "$OUT/p2-unzipped/الخدمات/index.html" 2>/dev/null || ls "$OUT/p2-unzipped/" | head -15
echo "=== HERO BG IMAGE EMBEDDED (img tag in home):"
grep -oE 'assets/img-[0-9]+\.(png|jpg|webp)' "$OUT/p2-unzipped/index.html" 2>/dev/null | head -3

# ---------- 4) قاعدة البيانات بعد التصدير: كامل + عدّاد 24 ساعة ----------
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const p = await db.project.findUnique({ where: { id: '$PROJ' } });
  const hasImages = p.schemaJson.includes('data:image');
  console.log('1. schema keeps data:image AFTER export:', hasImages ? '✓ (لا حذف بعد التحميل)' : '✗ STRIPPED!');
  console.log('2. exportedAt set:', p.exportedAt ? '✓ ' + p.exportedAt.toISOString() : '✗ null');
  console.log('3. status:', p.status);
  const vs = await db.projectVersion.findMany({ where: { projectId: p.id }, orderBy: { number: 'desc' }, take: 2, select: { number: true, label: true } });
  console.log('4. versions:', JSON.stringify(vs));
  await db.\$disconnect();
})();
" 2>&1

# ---------- 5) محاكاة انقضاء 24 ساعة ← تنقية تلقائية ----------
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const expired = new Date(Date.now() - 25 * 60 * 60 * 1000);
  await db.project.update({ where: { id: '$PROJ' }, data: { exportedAt: expired } });
  console.log('exportedAt set to 25h ago');
  await db.\$disconnect();
})();
" 2>&1
echo "=== GET project after expiry (should purge images, keep everything else):"
curl -s -b "$COOKIE" "http://localhost:3000/api/projects/$PROJ" | bun -e "
const d = await new Promise(r => process.stdin.on('data', r));
const j = JSON.parse(d); const s = j.project.schema;
const gal = s.pages.flatMap(p => p.blocks.filter(b => b.type === 'gallery'));
const hero = s.pages[0].blocks.find(b => b.type === 'hero');
console.log('5. hero.bgImage purged:', hero.props.bgImage === undefined ? '✓' : '✗ still there');
console.log('   hero.title intact:', hero.props.title);
console.log('6. gallery item2.image purged:', gal[0].props.items[2].image === undefined ? '✓' : '✗');
console.log('   gallery items intact:', gal[0].props.items.length, '| item0:', gal[0].props.items[0].title);
console.log('7. services rows intact:', s.mockData.entities.services.rows[0].name, '/', s.mockData.entities.services.rows[0].price);
console.log('8. pages intact:', s.pages.length);
"
bun -e "
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const p = await db.project.findUnique({ where: { id: '$PROJ' } });
  console.log('9. exportedAt reset after purge:', p.exportedAt === null ? '✓' : '✗');
  console.log('10. DB schema purged too:', p.schemaJson.includes('data:image') ? '✗' : '✓');
  await db.\$disconnect();
})();
" 2>&1

agent-browser errors > "$OUT/p2-errors.txt" 2>&1
echo "=== BROWSER ERRORS: $(head -3 "$OUT/p2-errors.txt")"
pkill -f "next dev" 2>/dev/null; sleep 1
echo "=== DONE PART 2"
