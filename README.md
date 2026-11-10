# سيفار — SIVAR

**سيفار** هو منصة عربية لبناء مشاريع ويب بالذكاء الاصطناعي. يتيح لك تصميم صفحات هبوط، لوحات تحكم، متاجر إلكترونية والمزيد — كل ذلك عبر واجهة بصرية سهلة ومساعد ذكي يفهم العربية.

## ✨ المميزات

- 🏗️ بناء مشاريع ويب كاملة (صفحات هبوط، لوحات تحكم، متاجر...)
- 🤖 مساعد ذكي بالعربية لتعديل وإنشاء الصفحات
- 🎨 نظام ثيمات وألوان مرن
- 📦 تصدير المشاريع كملفات ZIP
- 📝 قوالب جاهزة ومكتبة مقتطفات HTML
- 🔄 نظام إصدارات للمشاريع (حتى 50 إصدار)

## 🛠️ التقنيات

- **الإطار**: [Next.js 16](https://nextjs.org/) (App Router)
- **اللغة**: TypeScript
- **التنسيق**: [Tailwind CSS 4](https://tailwindcss.com/)
- **المكونات**: [shadcn/ui](https://ui.shadcn.com/) (New York style)
- **قاعدة البيانات**: PostgreSQL عبر [Supabase](https://supabase.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **النشر**: [Vercel](https://vercel.com/)

## 🚀 البدء السريع

### المتطلبات

- Node.js 18+ أو [Bun](https://bun.sh/)
- حساب [Supabase](https://supabase.com/) (لقاعدة البيانات)

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/lionelr868-boop/sivar.git
cd sivar

# تثبيت الحزم
npm install
# أو
bun install

# إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env وأضف روابط Supabase الخاصة بك

# إنشاء الجداول في قاعدة البيانات
npx prisma db push

# تشغيل خادم التطوير
npm run dev
# أو
bun dev
```

ثم افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## 📁 هيكل المشروع

```
src/
├── app/          # صفحات و API routes (Next.js App Router)
│   ├── api/      # نقاط النهاية (auth, projects, templates, snippets)
│   ├── page.tsx  # الصفحة الرئيسية
│   └── layout.tsx
├── components/   # مكونات React (UI + مكونات المشروع)
├── hooks/        # React hooks مخصصة
├── lib/          # أدوات وخدمات
│   ├── server/   # كود الخادم (agent, analyze, session)
│   ├── project/  # أدوات المشاريع
│   ├── registry/ # سجل البلوكات
│   └── content/  # بيانات تجريبية
└── store/        # Zustand stores
prisma/
└── schema.prisma # مخطط قاعدة البيانات
```

## 🌐 النشر على Vercel

1. ارفع المشروع على GitHub
2. اربط المستودع بـ [Vercel](https://vercel.com/new)
3. أضف متغيرات البيئة (`DATABASE_URL`, `DIRECT_URL`) في إعدادات Vercel
4. انشر! 🎉

## 📄 الرخصة

هذا المشروع خاص. جميع الحقوق محفوظة.
