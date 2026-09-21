'use client'

// ============================================================
// SIVAR — PrototypeRenderer: محرّك عرض النموذج الأولي
// Task 8-a — زر عودة عائم في كل صفحة غير الرئيسية +
// تروستة لوحة تحكم حقيقية (بحث + إشعارات + قائمة مستخدم) +
// بحث مدمج يفلتر جداول الصفحة + رابط العودة في الشريط الجانبي.
// Task 12 — ألوان كل قسم (bgColor/textColor): غلاف متغيرات CSS
// واحد داخل renderBlock يستفيده كل مسارات BlockList الثلاثة،
// مع نص تلقائي ذكي (داكن على الفاتح / أبيض على الداكن).
// ============================================================
import { type CSSProperties, type ReactElement, useState } from 'react'
import type { Block, ProjectPage, ProjectSchema } from '@/lib/types'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { ArrowRight, Bell, Globe, LogOut, Menu, Search, Settings, User, X } from 'lucide-react'
import { ProtoIcon } from './icon-map'
import { hexDarken, hexLighten, PrototypeThemeScope } from './theme-provider'
import { PAvatar } from './ui/p-avatar'
import { PBadge } from './ui/p-badge'
import { PButton } from './ui/p-button'

// ---- المكوّنات ----
import { ActivityFeedBlock } from './blocks/activity-feed-block'
import { AuthCardBlock } from './blocks/auth-card-block'
import { BannerBlock } from './blocks/banner-block'
import { CalendarBlock } from './blocks/calendar-block'
import { ChartBlock } from './blocks/chart-block'
import { ContactFormBlock } from './blocks/contact-form-block'
import { CtaBlock } from './blocks/cta-block'
import { CustomHtmlBlock } from './blocks/custom-html-block'
import { DashboardHeaderBlock } from './blocks/dashboard-header-block'
import { DataTableBlock } from './blocks/data-table-block'
import { EmptyStateBlock, ErrorStateBlock, LoadingStateBlock } from './blocks/state-blocks'
import { FaqBlock } from './blocks/faq-block'
import { FeaturesBlock } from './blocks/features-block'
import { FormFieldsBlock } from './blocks/form-fields-block'
import { GalleryBlock } from './blocks/gallery-block'
import { HeroBlock } from './blocks/hero-block'
import { ListBlock } from './blocks/list-block'
import { PricingBlock } from './blocks/pricing-block'
import { ProfileCardBlock } from './blocks/profile-card-block'
import { QuickActionsBlock } from './blocks/quick-actions-block'
import { SettingsFormBlock } from './blocks/settings-form-block'
import { StatsBlock } from './blocks/stats-block'
import { StatsRowBlock } from './blocks/stats-row-block'
import { StepsBlock } from './blocks/steps-block'
import { TasksListBlock } from './blocks/tasks-list-block'
import { TeamBlock } from './blocks/team-block'
import { TestimonialsBlock } from './blocks/testimonials-block'
import type { BlockCtx } from './blocks/shared'
import { hexLuminance, sectionHexColor } from './blocks/shared'

// ============================================================
// ألوان كل قسم (Task 12) — sectionVars
// ============================================================

/** مزج لونين محلياً — ratio = وزن اللون الثاني (0..1) */
function ptMix(a: string, b: string, ratio: number): string {
  const expand = (hex: string): [number, number, number] | null => {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
    if (!m) return null
    let h = m[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const ca = expand(a)
  const cb = expand(b)
  if (!ca || !cb) return a
  const t = Math.max(0, Math.min(1, ratio))
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const mixed = [0, 1, 2].map((i) => clamp(ca[i] + (cb[i] - ca[i]) * t))
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * متغيرات CSS لألوان قسم واحد (bgColor/textColor اختياريان):
 * - bgColor: خلفية + --pt-bg + --pt-surface/--pt-border مشتقان حسب السطوع.
 * - textColor: --pt-text + --pt-muted ممزوج نحو الخلفية 0.38.
 * - نص تلقائي ذكي: مع bgColor بلا textColor → نص داكن على الخلفية
 *   الفاتحة (سطوع > 0.5) وأبيض على الداكنة (+ ثانوي مشتق).
 * تُرجع null عندما لا ألوان مخصّصة (سلوك قديم مطابق بالبايت).
 */
export function sectionVars(bgColor: unknown, textColor: unknown): CSSProperties | null {
  const bg = sectionHexColor(bgColor)
  const tx = sectionHexColor(textColor)
  if (!bg && !tx) return null

  const vars: Record<string, string> = {}
  if (bg) {
    const bright = hexLuminance(bg) > 0.55
    vars['--pt-bg'] = bg
    vars['--pt-surface'] = bright ? hexLighten(bg, 0.42) : hexDarken(bg, 0.42)
    vars['--pt-border'] = bright ? hexLighten(bg, 0.18) : hexDarken(bg, 0.18)
    vars.background = bg
  }

  let text = tx
  if (bg && !tx) text = hexLuminance(bg) > 0.5 ? '#17151f' : '#ffffff'
  if (text) {
    vars['--pt-text'] = text
    vars['--pt-muted'] = ptMix(text, bg || '#ffffff', 0.38)
  }
  vars.color = 'var(--pt-text)'

  return vars as CSSProperties
}

// ============================================================
// عرض مكوّن واحد حسب نوعه
// ============================================================
function renderBlockInner(block: Block, ctx: BlockCtx): ReactElement {
  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} ctx={ctx} />
    case 'features':
      return <FeaturesBlock block={block} />
    case 'stats':
      return <StatsBlock block={block} />
    case 'steps':
      return <StepsBlock block={block} />
    case 'pricing':
      return <PricingBlock block={block} ctx={ctx} />
    case 'testimonials':
      return <TestimonialsBlock block={block} />
    case 'faq':
      return <FaqBlock block={block} />
    case 'cta':
      return <CtaBlock block={block} ctx={ctx} />
    case 'custom-html':
      return <CustomHtmlBlock key={block.id} block={block} ctx={ctx} />
    case 'contact-form':
      return <ContactFormBlock block={block} />
    case 'gallery':
      return <GalleryBlock block={block} />
    case 'banner':
      return <BannerBlock block={block} ctx={ctx} />
    case 'list':
      return <ListBlock block={block} />
    case 'team':
      return <TeamBlock block={block} />
    case 'auth-card':
      return <AuthCardBlock block={block} ctx={ctx} />
    case 'dashboard-header':
      return <DashboardHeaderBlock block={block} ctx={ctx} />
    case 'stats-row':
      return <StatsRowBlock block={block} />
    case 'chart':
      return <ChartBlock block={block} ctx={ctx} />
    case 'data-table':
      return <DataTableBlock block={block} ctx={ctx} />
    case 'form-fields':
      return <FormFieldsBlock block={block} />
    case 'settings-form':
      return <SettingsFormBlock block={block} />
    case 'profile-card':
      return <ProfileCardBlock block={block} />
    case 'empty-state':
      return <EmptyStateBlock block={block} ctx={ctx} />
    case 'loading-state':
      return <LoadingStateBlock block={block} />
    case 'error-state':
      return <ErrorStateBlock block={block} ctx={ctx} />
    case 'calendar':
      return <CalendarBlock block={block} />
    case 'activity-feed':
      return <ActivityFeedBlock block={block} ctx={ctx} />
    case 'tasks-list':
      return <TasksListBlock block={block} ctx={ctx} />
    case 'quick-actions':
      return <QuickActionsBlock block={block} ctx={ctx} />
    default:
      return <></>
  }
}

/**
 * عرض مكوّن واحد مع غلاف ألوان القسم (Task 12) — نقطة واحدة
 * يستفيدها كل مسارات BlockList الثلاثة (تفاعلي/عادي/تحرير):
 * متغيرات CSS تتوارثها عناصر القسم الداخلية تلقائياً.
 */
function renderBlock(block: Block, ctx: BlockCtx): ReactElement {
  const content = renderBlockInner(block, ctx)
  const vars = sectionVars(block.props?.bgColor, block.props?.textColor)
  if (!vars) return content
  return (
    <div className="pt-secvars" style={vars}>
      {content}
    </div>
  )
}

/** قائمة المكوّنات مع أغلفة وضع التحرير (outline) عند توفّر onBlockSelect */
function BlockList({
  page,
  ctx,
  selectedBlockId,
  onBlockSelect,
}: {
  page: ProjectPage
  ctx: BlockCtx
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string | null) => void
}): ReactElement {
  return (
    <>
      {page.blocks.map((block, index) => {
        const label = BLOCK_REGISTRY[block.type]?.label ?? block.type
        const selected = selectedBlockId === block.id
        const dimmed = selectedBlockId != null && selectedBlockId !== block.id

        if (!onBlockSelect) {
          // حركة دخول متدرّجة في وضع المعاينة التفاعلي فقط (بلا وضع التحرير)
          if (ctx.interactive) {
            return (
              <div key={block.id} className="pt-rise" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
                {renderBlock(block, ctx)}
              </div>
            )
          }
          return <div key={block.id}>{renderBlock(block, ctx)}</div>
        }

        return (
          <div
            key={block.id}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            onClick={(e) => {
              e.stopPropagation()
              onBlockSelect(selected ? null : block.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onBlockSelect(selected ? null : block.id)
              }
            }}
            className={`relative group/block cursor-pointer transition-opacity duration-200 ${dimmed ? 'opacity-55' : ''}`}
          >
            {/* المحتوى معطّل المؤشر في وضع التحرير */}
            <div className="pointer-events-none">{renderBlock(block, ctx)}</div>

            {/* إطار التحديد */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 z-[6] rounded-[var(--pt-radius)] border-2 transition-opacity duration-150 ${
                selected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'
              }`}
              style={{ borderColor: 'var(--pt-primary)' }}
            />

            {/* شارة اسم المكوّن */}
            <span
              className={`pointer-events-none absolute top-1 start-1 z-[7] rounded px-2 py-0.5 text-[11px] font-bold text-white transition-opacity duration-150 ${
                selected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'
              }`}
              style={{ background: 'var(--pt-primary)' }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </>
  )
}

// ============================================================
// زر العودة العائم (كل صفحة غير الرئيسية — Task 8)
// ============================================================
function FloatingBackButton({ label, onBack }: { label: string; onBack: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={label}
      className="group fixed bottom-5 start-5 z-40 flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--pt-border)] bg-[var(--pt-surface)] px-3.5 text-sm font-bold text-[var(--pt-text)] shadow-[0_6px_20px_rgba(0,0,0,.16)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
    >
      <ArrowRight aria-hidden className="size-4.5 shrink-0" style={{ color: 'var(--pt-primary)' }} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs transition-all duration-200 group-hover:max-w-24 group-focus-visible:max-w-24">
        {label}
      </span>
    </button>
  )
}

// ============================================================
// قشرة الموقع العام (landing / pricing / faq / custom)
// ============================================================
function SiteShell({
  schema,
  page,
  ctx,
  selectedBlockId,
  onBlockSelect,
}: {
  schema: ProjectSchema
  page: ProjectPage
  ctx: BlockCtx
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string | null) => void
}): ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = schema.navigation
  const logo = ctx.schema.branding?.logo
  // خلفية المشروع كلّه (Task 9) — الجذر يصبح شفافاً والصورة خلفه
  const projectBg = ctx.schema.branding?.bgImage
  const homeId = schema.pages.find((pg) => pg.type === 'landing')?.id ?? schema.pages[0]?.id
  const go = (pageId: string) => {
    if (ctx.onNavigate) ctx.onNavigate(pageId)
  }
  const isHome = page.type === 'landing' || page.id === homeId

  const navLinks = (extraClass: string) => (
    <>
      {nav.items.map((item) => {
        const active = item.pageId === page.id
        return (
          <button
            key={item.pageId}
            type="button"
            onClick={() => {
              go(item.pageId)
              setMenuOpen(false)
            }}
            className={`min-h-10 cursor-pointer rounded-[calc(var(--pt-radius)-2px)] px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)] ${
              active ? 'text-[var(--pt-primary)]' : 'text-[var(--pt-text)] hover:text-[var(--pt-primary)]'
            } ${extraClass}`}
          >
            {item.label}
          </button>
        )
      })}
    </>
  )

  return (
    <div className={`flex min-h-screen w-full flex-col ${projectBg ? 'bg-transparent' : 'bg-[var(--pt-bg)]'} text-[var(--pt-text)]`}>
      {/* الترويسة */}
      <header className="sticky top-0 z-30 border-b border-[var(--pt-border)] bg-[var(--pt-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button
            type="button"
            onClick={() => homeId && go(homeId)}
            aria-label={`الذهاب إلى ${nav.brand}`}
            className="flex min-h-10 cursor-pointer items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
          >
            {logo ? (
              <img
                src={logo}
                alt={nav.brand}
                loading="lazy"
                decoding="async"
                className="h-8 w-auto max-w-[120px] object-contain md:h-9"
              />
            ) : (
              <>
                <span className="size-8 rounded-[calc(var(--pt-radius)-2px)]" style={{ background: 'var(--pt-primary)' }} />
                <span className="text-base font-extrabold text-[var(--pt-text)] md:text-lg">{nav.brand}</span>
              </>
            )}
          </button>

          {/* تنقل سطح المكتب */}
          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-1 md:flex">
            {navLinks('')}
            {nav.cta ? (
              <span className="ms-2">
                <PButton size="sm" onClick={() => go(nav.cta!.pageId)}>
                  {nav.cta.label}
                </PButton>
              </span>
            ) : null}
          </nav>

          {/* زر القائمة (الهاتف) */}
          <button
            type="button"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)] md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* قائمة الهاتف المنسدلة */}
        {menuOpen ? (
          <nav aria-label="قائمة الهاتف" className="border-t border-[var(--pt-border)] bg-[var(--pt-surface)] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks('text-start')}
              {nav.cta ? (
                <PButton
                  size="md"
                  className="mt-2 w-full"
                  onClick={() => {
                    go(nav.cta!.pageId)
                    setMenuOpen(false)
                  }}
                >
                  {nav.cta.label}
                </PButton>
              ) : null}
            </div>
          </nav>
        ) : null}
      </header>

      {/* المحتوى */}
      <main className="flex-1">
        <BlockList page={page} ctx={ctx} selectedBlockId={selectedBlockId} onBlockSelect={onBlockSelect} />
      </main>

      {/* التذييل */}
      <footer className="mt-auto border-t border-[var(--pt-border)] bg-[var(--pt-surface)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              {logo ? (
                <img
                  src={logo}
                  alt={nav.brand}
                  loading="lazy"
                  decoding="async"
                  className="h-7 w-auto max-w-[100px] object-contain"
                />
              ) : (
                <>
                  <span className="size-6 rounded-[calc(var(--pt-radius)-4px)]" style={{ background: 'var(--pt-primary)' }} />
                  <span className="text-sm font-bold text-[var(--pt-text)]">{nav.brand}</span>
                </>
              )}
              <PBadge tone="primary">بيانات تجريبية</PBadge>
            </div>
            <nav aria-label="تنقل التذييل" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {nav.items.map((item) => (
                <button
                  key={`f-${item.pageId}`}
                  type="button"
                  onClick={() => go(item.pageId)}
                  className="min-h-10 cursor-pointer text-[13px] text-[var(--pt-muted)] transition-colors duration-150 hover:text-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          {nav.footerNote ? (
            <div className="mt-4 flex flex-col items-center gap-2 border-t border-[var(--pt-border)] pt-4 text-center">
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-auto max-w-[90px] object-contain opacity-80"
                />
              ) : null}
              <p className="text-xs text-[var(--pt-muted)]">{nav.footerNote}</p>
            </div>
          ) : null}
        </div>
      </footer>

      {/* زر العودة للخلف — كل صفحة غير الرئيسية */}
      {!isHome && ctx.interactive && ctx.onNavigate && homeId ? (
        <FloatingBackButton label="عودة" onBack={() => go(homeId)} />
      ) : null}
    </div>
  )
}

// ============================================================
// قشرة الدخول (auth)
// ============================================================
function AuthShell({
  schema,
  page,
  ctx,
  selectedBlockId,
  onBlockSelect,
}: {
  schema: ProjectSchema
  page: ProjectPage
  ctx: BlockCtx
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string | null) => void
}): ReactElement {
  const homeId = schema.pages.find((pg) => pg.type === 'landing')?.id ?? schema.pages[0]?.id
  const projectBg = ctx.schema.branding?.bgImage
  const goHome = () => {
    if (homeId && ctx.onNavigate) ctx.onNavigate(homeId)
  }
  return (
    <div
      className={`relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden ${projectBg ? 'bg-transparent' : 'bg-[var(--pt-bg)]'} px-4 py-10 text-[var(--pt-text)]`}
    >
      {/* توهجات خلفية ناعمة (Task 8 — جمالية) */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -start-24 size-96 rounded-full opacity-[.14] blur-3xl"
        style={{ background: 'var(--pt-primary)' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -end-24 size-96 rounded-full opacity-[.10] blur-3xl"
        style={{ background: 'var(--pt-accent)' }}
      />

      <button
        type="button"
        onClick={goHome}
        aria-label={`الذهاب إلى ${schema.navigation.brand}`}
        className="relative mb-6 flex cursor-pointer items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pt-primary)]"
      >
        {ctx.schema.branding?.logo ? (
          <img
            src={ctx.schema.branding.logo}
            alt={schema.navigation.brand}
            loading="lazy"
            decoding="async"
            className="h-10 w-auto max-w-[140px] object-contain"
          />
        ) : (
          <>
            <span className="size-10 rounded-[calc(var(--pt-radius)-2px)]" style={{ background: 'var(--pt-primary)' }} />
            <span className="text-lg font-extrabold">{schema.navigation.brand}</span>
          </>
        )}
      </button>
      <main className="relative w-full">
        <BlockList page={page} ctx={ctx} selectedBlockId={selectedBlockId} onBlockSelect={onBlockSelect} />
      </main>

      {/* رابط عودة صريح أسفل البطاقة */}
      <button
        type="button"
        onClick={goHome}
        className="relative mt-6 inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-semibold text-[var(--pt-muted)] transition-colors duration-150 hover:text-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
      >
        <ArrowRight aria-hidden className="size-4" />
        العودة إلى الرئيسية
      </button>
    </div>
  )
}

// ============================================================
// تروستة لوحة التحكم: بحث + إشعارات + قائمة المستخدم (Task 8)
// ============================================================
const NOTIFICATIONS = [
  { title: 'طلب جديد من وهران', detail: 'قيمة 12,500 دج — بانتظار التأكيد', time: 'قبل 4 دقائق' },
  { title: 'تم تحديث تقرير الأسبوع', detail: 'نمو 8.2% عن الأسبوع الماضي', time: 'قبل ساعة' },
  { title: 'رسالة من سارة بوزيد', detail: '«متى يجهز طلبي؟» — تحتاج رداً', time: 'قبل 3 ساعات' },
]

function DashboardTopbar({
  schema,
  ctx,
  tableSearch,
  onTableSearch,
  go,
}: {
  schema: ProjectSchema
  ctx: BlockCtx
  tableSearch: string
  onTableSearch: (q: string) => void
  go: (pageId: string) => void
}): ReactElement {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [unread, setUnread] = useState(true)

  const profilePage = schema.pages.find((pg) => pg.type === 'profile')
  const settingsPage = schema.pages.find((pg) => pg.type === 'settings')
  const loginPage = schema.pages.find((pg) => pg.type === 'auth' && (pg.authVariant ?? 'login') === 'login')

  const closeMenus = () => {
    setNotifOpen(false)
    setUserOpen(false)
  }

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--pt-border)] bg-[var(--pt-surface)]/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 md:gap-3 md:px-6">
        {/* بحث الصفحة — يفلتر جداول data-table */}
        <div className="relative min-w-0 flex-1 md:max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--pt-muted)]"
          />
          <input
            type="search"
            value={tableSearch}
            onChange={(e) => onTableSearch(e.target.value)}
            placeholder="ابحث في الصفحة..."
            aria-label="ابحث في جداول الصفحة"
            className="w-full min-h-9 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] py-1.5 pe-3 ps-9 text-sm text-[var(--pt-text)] placeholder:text-[var(--pt-muted)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
          />
        </div>

        <div className="flex-1 md:hidden" />

        {/* الإشعارات */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setUserOpen(false)
              setNotifOpen((v) => !v)
            }}
            aria-label="الإشعارات"
            aria-expanded={notifOpen}
            className="relative flex size-9 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
          >
            <Bell className="size-4.5" />
            {unread ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -end-0.5 size-2.5 rounded-full border-2"
                style={{ background: '#dc2626', borderColor: 'var(--pt-surface)' }}
              />
            ) : null}
          </button>
          {notifOpen ? (
            <div
              className="absolute end-0 top-11 z-40 w-72 overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
              style={{ boxShadow: 'var(--pt-shadow)' }}
              role="menu"
              aria-label="الإشعارات"
            >
              <div className="flex items-center justify-between border-b border-[var(--pt-border)] px-3.5 py-2.5">
                <p className="text-sm font-bold">الإشعارات</p>
                <button
                  type="button"
                  onClick={() => setUnread(false)}
                  className="min-h-8 cursor-pointer rounded px-2 py-1 text-[11px] font-semibold text-[var(--pt-primary)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
                >
                  تحديد الكل كمقروء
                </button>
              </div>
              <ul className="max-h-64 divide-y divide-[var(--pt-border)] overflow-y-auto">
                {NOTIFICATIONS.map((n, i) => (
                  <li key={i} className="flex gap-2.5 px-3.5 py-3">
                    <span
                      aria-hidden
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: 'var(--pt-primary)' }}
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[var(--pt-text)]">{n.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--pt-muted)]">{n.detail}</p>
                      <p className="mt-1 text-[10px] font-medium text-[var(--pt-muted)] opacity-80">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* قائمة المستخدم */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false)
              setUserOpen((v) => !v)
            }}
            aria-label="قائمة الحساب"
            aria-expanded={userOpen}
            className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-[var(--pt-border)] py-1 pe-2.5 ps-1 transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
          >
            <PAvatar name="م" size={28} />
            <span className="hidden text-[13px] font-bold text-[var(--pt-text)] md:inline">مستخدم تجريبي</span>
          </button>
          {userOpen ? (
            <div
              className="absolute end-0 top-11 z-40 w-52 overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
              style={{ boxShadow: 'var(--pt-shadow)' }}
              role="menu"
              aria-label="قائمة الحساب"
            >
              <div className="border-b border-[var(--pt-border)] px-3.5 py-2.5">
                <p className="text-sm font-bold">مستخدم تجريبي</p>
                <p className="truncate text-[11px] text-[var(--pt-muted)]" dir="ltr">
                  demo@sivar.dz
                </p>
              </div>
              <div className="p-1.5">
                {profilePage ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenus()
                      go(profilePage.id)
                    }}
                    className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-[calc(var(--pt-radius)-4px)] px-2.5 text-[13px] font-medium text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
                  >
                    <User aria-hidden className="size-4" />
                    الملف الشخصي
                  </button>
                ) : null}
                {settingsPage ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenus()
                      go(settingsPage.id)
                    }}
                    className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-[calc(var(--pt-radius)-4px)] px-2.5 text-[13px] font-medium text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
                  >
                    <Settings aria-hidden className="size-4" />
                    الإعدادات
                  </button>
                ) : null}
                {loginPage ? (
                  <>
                    <div className="my-1 h-px bg-[var(--pt-border)]" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        closeMenus()
                        go(loginPage.id)
                      }}
                      className="flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-[calc(var(--pt-radius)-4px)] px-2.5 text-[13px] font-semibold transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
                      style={{ color: '#dc2626' }}
                    >
                      <LogOut aria-hidden className="size-4" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// قشرة لوحة التحكم (dashboard / table / form / settings / profile)
// ============================================================
function DashboardShell({
  schema,
  page,
  ctx,
  selectedBlockId,
  onBlockSelect,
}: {
  schema: ProjectSchema
  page: ProjectPage
  ctx: BlockCtx
  selectedBlockId?: string | null
  onBlockSelect?: (blockId: string | null) => void
}): ReactElement {
  const items = schema.dashboardNav.items
  const logo = ctx.schema.branding?.logo
  const projectBg = ctx.schema.branding?.bgImage
  const homeId = schema.pages.find((pg) => pg.type === 'landing')?.id ?? schema.pages[0]?.id
  const go = (pageId: string) => {
    if (ctx.onNavigate) ctx.onNavigate(pageId)
  }

  // بحث التروستة — يُمرَّر للكتل عبر ctx
  const [tableSearch, setTableSearch] = useState('')
  const ctxWithSearch: BlockCtx = { ...ctx, tableSearch }

  const navItem = (item: { label: string; pageId: string; icon: string }, pill: boolean) => {
    const active = item.pageId === page.id
    const base = pill
      ? 'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150'
      : 'flex items-center gap-2.5 rounded-[calc(var(--pt-radius)-2px)] px-3 py-2.5 text-sm font-medium transition-colors duration-150'
    const tone = active
      ? 'border-transparent'
      : 'border-[var(--pt-border)] text-[var(--pt-text)] hover:bg-[var(--pt-secondary)]'
    return (
      <button
        key={item.pageId}
        type="button"
        onClick={() => go(item.pageId)}
        aria-current={active ? 'page' : undefined}
        className={`min-h-10 cursor-pointer ${base} ${tone} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]`}
        style={active ? { background: 'var(--pt-secondary)', color: 'var(--pt-primary)' } : undefined}
      >
        <ProtoIcon name={item.icon} className={pill ? 'size-4' : 'size-4.5'} />
        <span className="truncate">{item.label}</span>
      </button>
    )
  }

  return (
    <div className={`flex min-h-screen w-full ${projectBg ? 'bg-transparent' : 'bg-[var(--pt-bg)]'} text-[var(--pt-text)]`}>
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-[var(--pt-border)] bg-[var(--pt-surface)] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-[var(--pt-border)] px-4 py-4">
          {logo ? (
            <img
              src={logo}
              alt={schema.navigation.brand}
              loading="lazy"
              decoding="async"
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <>
              <span className="size-8 shrink-0 rounded-[calc(var(--pt-radius)-2px)]" style={{ background: 'var(--pt-primary)' }} />
              <span className="truncate text-sm font-extrabold">{schema.navigation.brand}</span>
            </>
          )}
        </div>

        <nav aria-label="تنقل لوحة التحكم" className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => navItem(item, false))}
        </nav>

        {/* العودة إلى الموقع + بطاقة المستخدم التجريبي */}
        <div className="space-y-1 border-t border-[var(--pt-border)] p-3">
          {homeId ? (
            <button
              type="button"
              onClick={() => go(homeId)}
              className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-[calc(var(--pt-radius)-2px)] px-3 py-2 text-[13px] font-semibold text-[var(--pt-muted)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] hover:text-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
            >
              <Globe aria-hidden className="size-4" />
              العودة إلى الموقع
            </button>
          ) : null}
          <div className="flex items-center gap-2.5 rounded-[calc(var(--pt-radius)-2px)] p-2">
            <PAvatar name="م" size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">مستخدم تجريبي</p>
              <PBadge tone="primary">بيانات تجريبية</PBadge>
            </div>
          </div>
        </div>
      </aside>

      {/* العمود الرئيسي */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* رأس الجوال */}
        <div className="sticky top-0 z-30 border-b border-[var(--pt-border)] bg-[var(--pt-surface)] lg:hidden">
          <div className="flex items-center gap-2.5 border-b border-[var(--pt-border)] px-4 py-3">
            {logo ? (
              <img
                src={logo}
                alt={schema.navigation.brand}
                loading="lazy"
                decoding="async"
                className="h-7 w-auto max-w-[110px] object-contain"
              />
            ) : (
              <>
                <span className="size-7 shrink-0 rounded-[calc(var(--pt-radius)-4px)]" style={{ background: 'var(--pt-primary)' }} />
                <span className="truncate text-sm font-extrabold">{schema.navigation.brand}</span>
              </>
            )}
            {homeId ? (
              <button
                type="button"
                onClick={() => go(homeId)}
                aria-label="العودة إلى الموقع"
                className="ms-auto flex size-9 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] text-[var(--pt-muted)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
              >
                <Globe aria-hidden className="size-4" />
              </button>
            ) : null}
          </div>
          <nav
            aria-label="تنقل لوحة التحكم"
            className="flex gap-2 overflow-x-auto px-4 py-2.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--pt-border) transparent' }}
          >
            {items.map((item) => navItem(item, true))}
          </nav>
        </div>

        {/* تروستة لوحة التحكم (بحث + إشعارات + مستخدم) */}
        {!ctx.mini ? (
          <DashboardTopbar schema={schema} ctx={ctx} tableSearch={tableSearch} onTableSearch={setTableSearch} go={go} />
        ) : null}

        {/* محتوى الصفحة */}
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl space-y-5">
            <BlockList
              page={page}
              ctx={ctxWithSearch}
              selectedBlockId={selectedBlockId}
              onBlockSelect={onBlockSelect}
            />
          </div>
        </main>
      </div>

      {/* زر العودة للخلف — يظهر في المعاينة التفاعلية */}
      {ctx.interactive && ctx.onNavigate && homeId ? (
        <FloatingBackButton label="عودة" onBack={() => go(homeId)} />
      ) : null}
    </div>
  )
}

// ============================================================
// PrototypeRenderer — العقد المثبّت
// ============================================================
export function PrototypeRenderer({
  schema,
  pageId,
  selectedBlockId,
  onBlockSelect,
  onNavigate,
  interactive,
  mini,
}: {
  schema: ProjectSchema
  pageId: string
  selectedBlockId?: string | null
  /** وضع التحرير: أغلفة تحديد حول كل مكوّن */
  onBlockSelect?: (blockId: string | null) => void
  /** روابط التنقل بين صفحات النموذج */
  onNavigate?: (pageId: string) => void
  /** وضع المعاينة: النماذج والأزرار حيّة */
  interactive?: boolean
  /** معاينة مصغّرة — بديل خفيف لأقسام HTML المخصصة */
  mini?: boolean
}): ReactElement {
  const page =
    schema.pages.find((pg) => pg.id === pageId) ??
    schema.pages.find((pg) => pg.slug === pageId) ??
    schema.pages[0]

  const ctx: BlockCtx = {
    schema,
    interactive: interactive ?? false,
    mini,
    onNavigate,
  }

  const shellProps = { schema, page, ctx, selectedBlockId, onBlockSelect }

  // خلفية المشروع كلّه (Task 9) — تُمرَّر للنطاق فترسم خلف كل الصفحات
  const brandingBg = schema.branding?.bgImage

  return (
    <PrototypeThemeScope
      theme={schema.theme}
      className="w-full"
      bgImage={brandingBg}
      bgOverlay={schema.branding?.bgOverlay ?? 'medium'}
    >
      {!page ? (
        <div className="flex min-h-96 items-center justify-center bg-transparent p-8 text-center text-sm text-[var(--pt-muted)]">
          لا توجد صفحات في هذا النموذج بعد.
        </div>
      ) : page.type === 'auth' ? (
        <AuthShell {...shellProps} />
      ) : page.type === 'dashboard' || page.type === 'table' || page.type === 'form' || page.type === 'settings' || page.type === 'profile' ? (
        <DashboardShell {...shellProps} />
      ) : (
        <SiteShell {...shellProps} />
      )}
    </PrototypeThemeScope>
  )
}
