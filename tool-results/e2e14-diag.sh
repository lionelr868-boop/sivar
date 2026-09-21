#!/bin/bash
# تشخيص: رسالة واحدة للوكيل وقراءة استجابة الـ LLM الخام من dev.log
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
snap > "$OUT/d1-projects.txt" 2>&1
OPEN_REF=$(awk '/حجزتي/{found=NR} found && /فتح المشروع/ && NR>found {print; exit}' "$OUT/d1-projects.txt" | sed -E 's/.*\[ref=([^]]+)\].*/\1/')
agent-browser click "@$OPEN_REF"; sleep 6

TREF=$(snap | grep -E 'textbox "اطلب أي تعديل' | head -1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' | tr -d ' ')
agent-browser fill "@$TREF" 'غيّر اسم أول خدمة في قسم خدمات الموقع إلى قص وتصفيف ملكي وسعرها 3000 دينار'
agent-browser press Enter
sleep 25
agent-browser eval "document.body.innerText" > "$OUT/d2-after.txt" 2>&1
echo "=== CHAT TAIL:"
grep -oE "لم أفهم.*|تم تغيير.*|نفّذت.*|وسيظهر.*" "$OUT/d2-after.txt" | head -3
pkill -f "next dev" 2>/dev/null; sleep 1
echo "=== AGENT DEBUG FROM dev.log:"
grep -a "AGENT-DEBUG" dev.log | tail -2
