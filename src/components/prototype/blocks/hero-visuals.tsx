'use client'

// ============================================================
// SIVAR — hero-visuals: الرسوم الجانبية الواقعية للبطل (Task 9-a)
// سبع بطاقات تبدو كلقطة شاشة لمنتج حقيقي: لوحة تحكم، هاتف تطبيق،
// تقرير أداء، أحدث الطلبات، المحادثات، التقويم، ورأي عميل.
// كل الألوان عبر متغيرات --pt-* — الجذر role=img والداخل aria-hidden.
// ============================================================
import { type ReactElement, useId } from 'react'
import { Bell, ChevronLeft, ChevronRight, Send, Star } from 'lucide-react'
import { PAvatar } from '../ui/p-avatar'
import { PBadge } from '../ui/p-badge'
import { ProtoIcon } from '../icon-map'
import { smoothPath } from '../charts/line-chart'

/** لون النمو الأخضر الثابت (نفس نبرة PBadge success) */
const GROW_GREEN = '#16a34a'

// ---------- غلاف موحّد: توهجات + لوحة سطح ----------

function VisualShell({
  label,
  maxW,
  children,
  chip,
}: {
  label: string
  maxW: string
  children: React.ReactNode
  /** شارة عائمة تتداخل مع زاوية اللوحة */
  chip?: React.ReactNode
}): ReactElement {
  return (
    <div className={`relative mx-auto w-full ${maxW}`}>
      {/* هالة توهج — accent أعلى النهاية وprimary أسفل البداية */}
      <div aria-hidden className="absolute -top-8 -end-6 size-44 rounded-full opacity-30 blur-2xl" style={{ background: 'var(--pt-accent)' }} />
      <div aria-hidden className="absolute -bottom-10 -start-8 size-52 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--pt-primary)' }} />

      {/* شارة عائمة فوق زاوية اللوحة (زخرفية) */}
      {chip ? (
        <div aria-hidden className="absolute -top-3 -start-3 z-10">
          {chip}
        </div>
      ) : null}

      <div
        role="img"
        aria-label={label}
        className="relative overflow-hidden border border-[var(--pt-border)] bg-[var(--pt-surface)]"
        style={{ borderRadius: 'calc(var(--pt-radius) + 6px)', boxShadow: 'var(--pt-shadow)' }}
      >
        <div aria-hidden className="flex flex-col">{children}</div>
      </div>
    </div>
  )
}

/** بطاقة KPI مصغّرة داخل الرسوم */
function MiniKpi({ label, value, change }: { label: string; value: string; change: string }): ReactElement {
  return (
    <div className="min-w-0 flex-1 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-2.5">
      <p className="truncate text-[10px] font-medium text-[var(--pt-muted)]">{label}</p>
      <p className="mt-0.5 truncate text-[15px] font-bold leading-tight text-[var(--pt-text)]">{value}</p>
      <p className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold" style={{ color: GROW_GREEN }}>
        {change}
      </p>
    </div>
  )
}

// ============================================================
// 1) لوحة التحكم — رسم توضيحي حي لواجهة لوحة التحكم
// ============================================================

const DASH_MONTHS: Array<{ label: string; v: number }> = [
  { label: 'جانفي', v: 32 },
  { label: 'فيفري', v: 45 },
  { label: 'مارس', v: 38 },
  { label: 'أفريل', v: 56 },
  { label: 'ماي', v: 50 },
  { label: 'جوان', v: 68 },
  { label: 'جويلية', v: 82 },
]

/** منحنى مصغّر حقيقي (Catmull-Rom ناعم + تدرّج مساحة + نقاط بيضاء) */
function MiniLineChart(): ReactElement {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const W = 260
  const H = 90
  const padX = 8
  const padTop = 10
  const baseline = 68

  // RTL: أول فئة (جانفي) في أقصى اليمين — منحنى صاعد نحو اليسار
  const rtl = [...DASH_MONTHS].reverse()
  const vs = rtl.map((d) => d.v)
  const min = Math.min(...vs)
  const max = Math.max(...vs)
  const span = max - min || 1
  const pts = rtl.map((d, i) => ({
    x: padX + ((W - padX * 2) / (rtl.length - 1)) * i,
    y: baseline - ((d.v - min) / (span * 1.08)) * (baseline - padTop),
  }))
  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" className="block">
      <defs>
        <linearGradient id={`marea-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.26 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.02 }} />
        </linearGradient>
      </defs>
      {/* خطوط شبكة متقطعة */}
      {[0.5, 1].map((f) => (
        <line
          key={f}
          x1={padX}
          y1={baseline - (baseline - padTop) * f}
          x2={W - padX}
          y2={baseline - (baseline - padTop) * f}
          strokeDasharray="3 5"
          style={{ stroke: 'var(--pt-border)', strokeWidth: 1 }}
        />
      ))}
      {/* المساحة + المنحنى */}
      <path d={area} style={{ fill: `url(#marea-${gid})` }} />
      <path d={line} style={{ stroke: 'var(--pt-primary)', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' }} />
      {/* نقاط بيضاء */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#ffffff" style={{ stroke: 'var(--pt-primary)', strokeWidth: 1 }} />
      ))}
      {/* تسميات شهرية مصغّرة */}
      {[6, 4, 2].map((i) => (
        <text key={i} x={pts[i].x} y={H - 4} textAnchor="middle" style={{ fill: 'var(--pt-muted)', fontSize: 8 }}>
          {rtl[i].label}
        </text>
      ))}
    </svg>
  )
}

const DASH_NAV = [
  { icon: 'layout-dashboard', label: 'لوحة التحكم' },
  { icon: 'package', label: 'الطلبات' },
  { icon: 'users', label: 'العملاء' },
  { icon: 'settings', label: 'الإعدادات' },
]

const DASH_ORDERS = [
  { name: 'أحمد بن علي', status: 'جديد', tone: 'warning' as const, amount: '12,500 دج' },
  { name: 'سارة بوزيد', status: 'مكتمل', tone: 'success' as const, amount: '8,200 دج' },
  { name: 'ياسين مراد', status: 'قيد المعالجة', tone: 'warning' as const, amount: '24,300 دج' },
]

export function DashboardMockVisual(): ReactElement {
  return (
    <VisualShell
      label="رسم توضيحي حي لواجهة لوحة التحكم"
      maxW="max-w-lg"
      chip={
        <div
          className="flex items-center gap-2.5 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-surface)] px-3 py-2"
          style={{ boxShadow: 'var(--pt-shadow)' }}
        >
          <span className="size-2 shrink-0 rounded-full" style={{ background: GROW_GREEN }} />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-bold text-[var(--pt-text)]">طلب جديد من وهران</span>
            <span className="block truncate text-[10px] text-[var(--pt-muted)]">12,500 دج — قبل دقيقتين</span>
          </span>
        </div>
      }
    >
      {/* الشريط العلوي: نقاط النافذة + عنوان الموقع + جرس */}
      <div className="flex items-center gap-2 border-b border-[var(--pt-border)] px-3.5 py-2.5">
        <span className="size-2.5 rounded-full" style={{ background: 'var(--pt-primary)' }} />
        <span className="size-2.5 rounded-full opacity-60" style={{ background: 'var(--pt-accent)' }} />
        <span className="size-2.5 rounded-full opacity-30" style={{ background: 'var(--pt-border)' }} />
        <span
          dir="ltr"
          className="ms-2 rounded-full bg-[var(--pt-secondary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--pt-muted)]"
        >
          app.example.dz
        </span>
        <span className="relative ms-auto">
          <Bell aria-hidden className="size-4 text-[var(--pt-muted)]" />
          <span className="absolute -top-0.5 -end-0.5 size-1.5 rounded-full" style={{ background: '#dc2626' }} />
        </span>
      </div>

      {/* الجسد: شريط جانبي + عمود رئيسي */}
      <div className="flex min-h-0">
        {/* الشريط الجانبي المصغّر — يختفي في الشاشات الضيقة جداً */}
        <div className="hidden w-28 shrink-0 flex-col gap-1 border-e border-[var(--pt-border)] p-2.5 sm:flex">
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <span className="size-6 shrink-0 rounded-[calc(var(--pt-radius)-4px)]" style={{ background: 'var(--pt-primary)' }} />
            <span className="truncate text-xs font-bold text-[var(--pt-text)]">لوحتي</span>
          </div>
          {DASH_NAV.map((item, i) => {
            const active = i === 0
            return (
              <div
                key={item.label}
                className="relative flex items-center gap-2 rounded-[calc(var(--pt-radius)-4px)] px-2 py-1.5"
                style={active ? { background: 'var(--pt-secondary)' } : undefined}
              >
                {active ? (
                  <span className="absolute inset-y-1 start-0 w-0.5 rounded-full" style={{ background: 'var(--pt-primary)' }} />
                ) : null}
                <ProtoIcon name={item.icon} className={`size-3.5 ${active ? 'text-[var(--pt-primary)]' : 'text-[var(--pt-muted)]'}`} />
                <span className={`truncate text-[11px] ${active ? 'font-bold text-[var(--pt-primary)]' : 'text-[var(--pt-muted)]'}`}>
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* العمود الرئيسي */}
        <div className="min-w-0 flex-1 space-y-3 p-3 md:p-3.5">
          {/* صف المؤشرات */}
          <div className="flex gap-2.5">
            <MiniKpi label="الإيرادات" value="3.4م دج" change="+12.5%" />
            <MiniKpi label="الطلبات" value="1,248" change="+8.2%" />
            <MiniKpi label="العملاء" value="5,880" change="+4.6%" />
          </div>

          {/* الرسم الخطي */}
          <div className="rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-2.5">
            <MiniLineChart />
          </div>

          {/* قائمة الطلبات */}
          <div className="divide-y divide-[var(--pt-border)] rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)]">
            {DASH_ORDERS.map((order) => (
              <div key={order.name} className="flex items-center gap-2.5 px-2.5 py-2">
                <PAvatar name={order.name} size={26} />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--pt-text)]">{order.name}</span>
                <PBadge tone={order.tone} className="shrink-0 text-[9px]">
                  {order.status}
                </PBadge>
                <span className="shrink-0 text-xs font-bold text-[var(--pt-text)]">{order.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VisualShell>
  )
}

// ============================================================
// 2) الهاتف — رسم توضيحي لهاتف التطبيق
// ============================================================

const PHONE_BARS = [40, 65, 50, 80, 60, 90]
const PHONE_ACTIONS = [
  { icon: 'wallet', label: 'تحويل' },
  { icon: 'shopping-bag', label: 'طلب' },
  { icon: 'file-text', label: 'فواتير' },
  { icon: 'plus', label: 'المزيد' },
]
const PHONE_TABS = [
  { icon: 'home', label: 'الرئيسية', active: true },
  { icon: 'shopping-bag', label: 'الطلبات', active: false },
  { icon: 'message-circle', label: 'الرسائل', active: false },
  { icon: 'user', label: 'الحساب', active: false },
]

/** رموز حالة صغيرة (إشارة/واي فاي/بطارية) — SVG خفيف بلا مكتبات */
function StatusGlyphs(): ReactElement {
  return (
    <span dir="ltr" className="flex items-end gap-1 text-[var(--pt-muted)]">
      <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor" aria-hidden>
        <rect x="0" y="6" width="2" height="4" rx="0.5" />
        <rect x="3.2" y="4" width="2" height="6" rx="0.5" />
        <rect x="6.4" y="2" width="2" height="8" rx="0.5" />
        <rect x="9.6" y="0" width="2" height="10" rx="0.5" opacity=".35" />
      </svg>
      <svg width="12" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
        <path d="M1 3.8a9 9 0 0 1 12 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M3.6 6.3a5.5 5.5 0 0 1 6.8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="7" cy="8.8" r="1.1" fill="currentColor" />
      </svg>
      <svg width="16" height="10" viewBox="0 0 18 10" aria-hidden>
        <rect x="0.5" y="1" width="14" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
        <rect x="2" y="2.5" width="9" height="5" rx="1" fill="currentColor" />
        <rect x="16" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity=".5" />
      </svg>
    </span>
  )
}

export function PhoneMockVisual(): ReactElement {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* هالات توهج */}
      <div aria-hidden className="absolute -top-8 -end-6 size-40 rounded-full opacity-30 blur-2xl" style={{ background: 'var(--pt-accent)' }} />
      <div aria-hidden className="absolute -bottom-10 -start-6 size-44 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--pt-primary)' }} />

      {/* إطار الهاتف */}
      <div
        role="img"
        aria-label="رسم توضيحي لهاتف التطبيق"
        className="relative flex aspect-[9/19] flex-col overflow-hidden border border-[var(--pt-border)] bg-[var(--pt-surface)]"
        style={{ borderRadius: '34px', boxShadow: 'var(--pt-shadow)' }}
      >
        <div aria-hidden className="flex min-h-0 flex-1 flex-col">
          {/* شريط الحالة + النوتش */}
          <div className="flex shrink-0 items-center justify-between px-6 pt-3.5">
            <span dir="ltr" className="text-[10px] font-bold text-[var(--pt-text)]">
              9:41
            </span>
            <StatusGlyphs />
          </div>
          <div className="mx-auto mt-1.5 h-1.5 w-16 shrink-0 rounded-full bg-[var(--pt-secondary)]" />

          {/* رأس التطبيق */}
          <div className="flex shrink-0 items-center gap-2.5 px-4 pt-3">
            <PAvatar name="س" size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold leading-tight text-[var(--pt-text)]">صباح الخير، سارة</p>
              <p className="truncate text-[10px] text-[var(--pt-muted)]">إليك ملخص اليوم</p>
            </div>
            <span className="relative shrink-0">
              <Bell className="size-4 text-[var(--pt-muted)]" />
              <span className="absolute -top-0.5 -end-0.5 size-1.5 rounded-full" style={{ background: '#dc2626' }} />
            </span>
          </div>

          {/* بطاقة الرصيد */}
          <div
            className="mx-4 mt-3 shrink-0 rounded-[calc(var(--pt-radius)+2px)] p-3.5"
            style={{ background: 'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))' }}
          >
            <p className="text-[10px] font-medium text-white/70">الرصيد الحالي</p>
            <p className="mt-0.5 text-[18px] font-extrabold leading-tight text-white">248,500 دج</p>
            <span className="mt-2 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white">
              +12.5% هذا الشهر
            </span>
          </div>

          {/* الإجراءات السريعة */}
          <div className="mt-3 grid shrink-0 grid-cols-4 gap-1 px-4">
            {PHONE_ACTIONS.map((action) => (
              <div key={action.label} className="flex flex-col items-center gap-1">
                <span className="flex size-10 items-center justify-center rounded-full bg-[var(--pt-secondary)]">
                  <ProtoIcon name={action.icon} className="size-4.5 text-[var(--pt-primary)]" />
                </span>
                <span className="text-[9px] font-medium text-[var(--pt-muted)]">{action.label}</span>
              </div>
            ))}
          </div>

          {/* بطاقة رسم الأعمدة — تمتص الفراغ المتبقي */}
          <div className="mx-4 mt-3 flex min-h-0 flex-1 flex-col rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-3">
            <p className="shrink-0 text-[10px] font-bold text-[var(--pt-text)]">آخر 7 أيام</p>
            <div className="mt-2 flex min-h-0 flex-1 items-end justify-between gap-1.5">
              {PHONE_BARS.map((h, i) => {
                const last = i === PHONE_BARS.length - 1
                return (
                  <span
                    key={i}
                    className="w-full rounded-t-[4px]"
                    style={{
                      height: `${h}%`,
                      background: last ? 'var(--pt-accent)' : 'var(--pt-primary)',
                      opacity: last ? 1 : 0.45 + (i / (PHONE_BARS.length - 1)) * 0.55,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* المعاملات */}
          <div className="mx-4 mt-3 shrink-0 space-y-2">
            <div className="flex items-center gap-2.5">
              <PAvatar name="أحمد بن علي" size={26} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight text-[var(--pt-text)]">أحمد بن علي</p>
                <p className="truncate text-[10px] text-[var(--pt-muted)]">تحويل صادر</p>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-[var(--pt-text)]" dir="ltr">
                −2,400 دج
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <PAvatar name="سارة بوزيد" size={26} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold leading-tight text-[var(--pt-text)]">سارة بوزيد</p>
                <p className="truncate text-[10px] text-[var(--pt-muted)]">طلب جديد</p>
              </div>
              <span className="shrink-0 text-[11px] font-bold" style={{ color: 'var(--pt-primary)' }} dir="ltr">
                +12,500 دج
              </span>
            </div>
          </div>

          {/* شريط التبويب السفلي */}
          <div className="mt-3 shrink-0 border-t border-[var(--pt-border)] px-4 pt-2.5">
            <div className="grid grid-cols-4">
              {PHONE_TABS.map((tab) => (
                <div key={tab.label} className="flex flex-col items-center gap-0.5">
                  <ProtoIcon name={tab.icon} className={`size-4 ${tab.active ? 'text-[var(--pt-primary)]' : 'text-[var(--pt-muted)]'}`} />
                  <span className={`text-[9px] font-medium ${tab.active ? 'font-bold text-[var(--pt-primary)]' : 'text-[var(--pt-muted)]'}`}>
                    {tab.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mx-auto mb-2 mt-2 h-1 w-24 rounded-full bg-[var(--pt-secondary)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 3) بطاقة تحليلات — تقرير الأداء
// ============================================================

const ANALYTICS_POINTS: number[] = [24, 32, 28, 41, 38, 52, 47, 63, 72, 88]
const ANALYTICS_LABELS = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر']

function BigCurve(): ReactElement {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const W = 520
  const H = 180
  const padX = 14
  const padTop = 16
  const baseline = 142

  const rtl = ANALYTICS_POINTS.slice().reverse()
  const rtlLabels = ANALYTICS_LABELS.slice().reverse()
  const min = Math.min(...rtl)
  const max = Math.max(...rtl)
  const span = max - min || 1
  const pts = rtl.map((v, i) => ({
    x: padX + ((W - padX * 2) / (rtl.length - 1)) * i,
    y: baseline - ((v - min) / (span * 1.08)) * (baseline - padTop),
  }))
  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" className="block">
      <defs>
        <linearGradient id={`aarea-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.26 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.02 }} />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padX}
          y1={baseline - (baseline - padTop) * f}
          x2={W - padX}
          y2={baseline - (baseline - padTop) * f}
          strokeDasharray="4 7"
          style={{ stroke: 'var(--pt-border)', strokeWidth: 1 }}
        />
      ))}
      <path d={area} style={{ fill: `url(#aarea-${gid})` }} />
      <path
        d={line}
        style={{
          stroke: 'var(--pt-primary)',
          strokeWidth: 3,
          fill: 'none',
          strokeLinecap: 'round',
          filter: 'drop-shadow(0 6px 10px color-mix(in srgb, var(--pt-primary) 40%, transparent))',
        }}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#ffffff" style={{ stroke: 'var(--pt-primary)', strokeWidth: 1.5 }} />
      ))}
      {rtlLabels.map((label, i) =>
        i % 2 === 0 ? (
          <text key={label} x={pts[i].x} y={H - 6} textAnchor="middle" style={{ fill: 'var(--pt-muted)', fontSize: 9 }}>
            {label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

const ANALYTICS_KPIS = [
  { label: 'النمو', value: '+12.5%' },
  { label: 'معدل التحويل', value: '3.8%' },
  { label: 'متوسط الطلب', value: '4,200 دج' },
]

export function AnalyticsVisual(): ReactElement {
  return (
    <VisualShell label="بطاقة تقرير الأداء" maxW="max-w-xl">
      {/* الترويسة */}
      <div className="flex items-center gap-2.5 border-b border-[var(--pt-border)] px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-4px)] bg-[var(--pt-secondary)]">
          <ProtoIcon name="trending-up" className="size-4 text-[var(--pt-primary)]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--pt-text)]">تقرير الأداء</span>
        <span className="shrink-0 rounded-full bg-[var(--pt-secondary)] px-2.5 py-1 text-[10px] font-semibold text-[var(--pt-muted)]">
          آخر 30 يوماً
        </span>
      </div>

      {/* المنحنى الكبير */}
      <div className="p-3.5 md:p-4">
        <BigCurve />

        {/* رقائق المؤشرات */}
        <div className="mt-3 flex flex-wrap gap-2">
          {ANALYTICS_KPIS.map((kpi) => (
            <span key={kpi.label} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pt-secondary)] px-3 py-1.5 text-[11px]">
              <span className="text-[var(--pt-muted)]">{kpi.label}</span>
              <span className="font-bold text-[var(--pt-text)]">{kpi.value}</span>
            </span>
          ))}
        </div>
      </div>
    </VisualShell>
  )
}

// ============================================================
// 4) طلبات المتجر — بطاقة أحدث الطلبات
// ============================================================

const ORDERS_ROWS = [
  { name: 'أحمد بن علي', city: 'الجزائر', status: 'مكتمل', tone: 'success' as const, amount: '12,500 دج', date: 'اليوم 14:20' },
  { name: 'سارة بوزيد', city: 'وهران', status: 'جديد', tone: 'warning' as const, amount: '8,200 دج', date: 'اليوم 13:05' },
  { name: 'ياسين مراد', city: 'قسنطينة', status: 'قيد المعالجة', tone: 'warning' as const, amount: '24,300 دج', date: 'اليوم 11:47' },
  { name: 'ليلى مزيان', city: 'سطيف', status: 'مكتمل', tone: 'success' as const, amount: '5,900 دج', date: 'أمس 18:30' },
  { name: 'محمد قادري', city: 'عنابة', status: 'ملغى', tone: 'danger' as const, amount: '15,700 دج', date: 'أمس 09:12' },
]

export function OrdersVisual(): ReactElement {
  return (
    <VisualShell label="بطاقة أحدث الطلبات" maxW="max-w-md">
      {/* الترويسة */}
      <div className="flex items-center gap-2.5 border-b border-[var(--pt-border)] px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-4px)] bg-[var(--pt-secondary)]">
          <ProtoIcon name="package" className="size-4 text-[var(--pt-primary)]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--pt-text)]">أحدث الطلبات</span>
        <span className="shrink-0 rounded-full bg-[var(--pt-secondary)] px-2.5 py-1 text-[10px] font-semibold text-[var(--pt-muted)]">هذا الأسبوع</span>
      </div>

      {/* الصفوف */}
      <div className="divide-y divide-[var(--pt-border)]">
        {ORDERS_ROWS.map((row) => (
          <div key={row.name} className="flex items-center gap-2.5 px-4 py-2.5 transition-colors duration-150 hover:bg-[var(--pt-secondary)]">
            <PAvatar name={row.name} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-bold leading-tight text-[var(--pt-text)]">{row.name}</span>
                <span className="shrink-0 text-[10px] text-[var(--pt-muted)]">— {row.city}</span>
              </div>
              <span className="block truncate text-[10px] text-[var(--pt-muted)]">{row.date}</span>
            </div>
            <PBadge tone={row.tone} className="shrink-0">
              {row.status}
            </PBadge>
            <span className="shrink-0 text-[13px] font-bold text-[var(--pt-text)]">{row.amount}</span>
          </div>
        ))}
      </div>

      {/* التذييل */}
      <div className="border-t border-[var(--pt-border)] px-4 py-2.5">
        <p className="text-center text-[11px] font-medium text-[var(--pt-muted)]">5 طلبات جديدة هذا الأسبوع</p>
      </div>
    </VisualShell>
  )
}

// ============================================================
// 5) المحادثات — بطاقة الدعم
// ============================================================

export function ChatVisual(): ReactElement {
  return (
    <VisualShell label="بطاقة المحادثات" maxW="max-w-md">
      {/* الترويسة */}
      <div className="flex items-center gap-2.5 border-b border-[var(--pt-border)] px-4 py-3">
        <span className="relative shrink-0">
          <PAvatar name="د" size={34} />
          <span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-[var(--pt-surface)]" style={{ background: GROW_GREEN }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-[var(--pt-text)]">فريق الدعم</p>
          <p className="flex items-center gap-1 text-[10px] text-[var(--pt-muted)]">
            <span className="size-1.5 rounded-full" style={{ background: GROW_GREEN }} />
            متصل الآن
          </p>
        </div>
      </div>

      {/* منطقة المحادثة */}
      <div className="space-y-2.5 bg-[var(--pt-bg)] p-3.5">
        {/* رسالة واردة */}
        <div className="flex gap-2">
          <PAvatar name="سارة بوزيد" size={26} />
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-semibold text-[var(--pt-muted)]">سارة بوزيد</p>
            <div className="rounded-xl rounded-es-sm border border-[var(--pt-border)] bg-[var(--pt-surface)] px-3 py-2">
              <p className="text-[13px] leading-relaxed text-[var(--pt-text)]">السلام عليكم، متى يصل طلبي؟</p>
            </div>
          </div>
        </div>

        {/* رسالة صادرة */}
        <div className="ms-auto max-w-[85%]">
          <div className="rounded-xl rounded-ee-sm px-3 py-2" style={{ background: 'var(--pt-primary)' }}>
            <p className="text-[13px] leading-relaxed text-white">وصل طلبك إلى مركز التوزيع — سيصلك غداً إن شاء الله</p>
          </div>
        </div>

        {/* مؤشر الكتابة */}
        <div className="flex items-center gap-2">
          <PAvatar name="سارة بوزيد" size={26} />
          <div className="flex items-center gap-1 rounded-xl rounded-es-sm border border-[var(--pt-border)] bg-[var(--pt-surface)] px-3 py-2.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-[var(--pt-muted)]"
                style={{ animation: `pt-typing 1.1s ease-in-out ${i * 0.18}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* شريط الإدخال الوهمي */}
      <div className="border-t border-[var(--pt-border)] p-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--pt-border)] bg-[var(--pt-bg)] py-1.5 pe-1.5 ps-4">
          <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--pt-muted)]">اكتب رسالتك...</span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--pt-primary)' }}>
            <Send aria-hidden className="size-3.5 text-white" style={{ transform: 'scaleX(-1)' }} />
          </span>
        </div>
      </div>
    </VisualShell>
  )
}

// ============================================================
// 6) التقويم — بطاقة مواعيد ديسمبر
// ============================================================

const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
/** أيام تحمل نقطة حدث ملونة أسفل الرقم */
const EVENT_DOTS: Record<number, string> = { 3: 'var(--pt-primary)', 18: 'var(--pt-accent)', 25: '#db2777' }
const TODAY_DAY = 12

export function CalendarVisual(): ReactElement {
  // ديسمبر 2024 يبدأ الأحد — اليوم 1 في العمود الأول
  const cells: Array<number | null> = []
  for (let d = 1; d <= 31; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <VisualShell label="بطاقة التقويم" maxW="max-w-sm">
      {/* الترويسة */}
      <div className="flex items-center gap-2 border-b border-[var(--pt-border)] px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--pt-text)]">ديسمبر 2024</span>
        <span className="flex size-6 items-center justify-center rounded-[calc(var(--pt-radius)-4px)] text-[var(--pt-muted)]">
          <ChevronRight aria-hidden className="size-4" />
        </span>
        <span className="flex size-6 items-center justify-center rounded-[calc(var(--pt-radius)-4px)] text-[var(--pt-muted)]">
          <ChevronLeft aria-hidden className="size-4" />
        </span>
      </div>

      {/* أيام الأسبوع */}
      <div className="grid grid-cols-7 gap-1 px-3 pt-3">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-center text-[9px] font-medium text-[var(--pt-muted)]">
            {day}
          </span>
        ))}
      </div>

      {/* شبكة الأيام */}
      <div className="grid grid-cols-7 gap-1 p-3">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />
          const isToday = day === TODAY_DAY
          const dotColor = EVENT_DOTS[day]
          return (
            <span key={day} className="relative flex h-8 flex-col items-center justify-center">
              <span
                className={`flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ${isToday ? 'font-bold' : ''}`}
                style={
                  isToday
                    ? { background: 'var(--pt-primary)', color: 'var(--pt-primary-fg)' }
                    : { color: 'var(--pt-text)' }
                }
              >
                {day}
              </span>
              {dotColor ? (
                <span className="absolute bottom-0 size-1 rounded-full" style={{ background: dotColor }} aria-hidden />
              ) : null}
            </span>
          )
        })}
      </div>

      {/* التذييل */}
      <div className="border-t border-[var(--pt-border)] px-4 py-2.5">
        <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-[var(--pt-secondary)] px-3 py-1 text-[11px]">
          <ProtoIcon name="calendar" className="size-3 text-[var(--pt-primary)]" />
          <span className="font-semibold text-[var(--pt-muted)]">3 مواعيد هذا الأسبوع</span>
        </span>
      </div>
    </VisualShell>
  )
}

// ============================================================
// 7) رأي عميل — بطاقة شهادة
// ============================================================

export function TestimonialVisual(): ReactElement {
  return (
    <VisualShell label="بطاقة رأي عميل" maxW="max-w-md">
      <div className="relative p-5 md:p-6">
        {/* علامة الاقتباس العملاقة */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 start-4 select-none font-black leading-none text-[80px]"
          style={{ color: 'var(--pt-primary)', opacity: 0.15 }}
        >
          &quot;
        </span>

        {/* النجوم */}
        <div className="relative mb-3 flex items-center gap-0.5" aria-label="التقييم: 5 من 5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} aria-hidden className="size-4 fill-current" style={{ color: '#f59e0b' }} />
          ))}
        </div>

        {/* نص الشهادة */}
        <blockquote className="relative">
          <p className="text-[15px] leading-relaxed text-[var(--pt-text)]">
            وفّرت علينا المنصة أسابيع من العمل — تجربة ممتازة من البداية للنهاية.
          </p>
        </blockquote>

        {/* صف الشخص */}
        <div className="mt-5 flex items-center gap-3 border-t border-[var(--pt-border)] pt-4">
          <PAvatar name="أحمد بن علي" size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--pt-text)]">أحمد بن علي</p>
            <p className="truncate text-[11px] text-[var(--pt-muted)]">مدير تقنية — شركة ناشئة</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--pt-secondary)] px-2.5 py-1">
            <span
              className="flex size-4 items-center justify-center rounded-full text-white"
              style={{ background: GROW_GREEN }}
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2.5 6.5 4.8 8.8 9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[10px] font-bold text-[var(--pt-text)]">عميل موثّق</span>
          </span>
        </div>
      </div>
    </VisualShell>
  )
}
