'use client'

// ============================================================
// نموذج — PrototypeRenderer: محرّك عرض النموذج الأولي
// Task 2-a-cont — قشرة الصفحة حسب نوعها + عرض المكوّنات +
// وضع التحرير (outline) عبر onBlockSelect + وضع المعاينة interactive
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block, ProjectPage, ProjectSchema } from '@/lib/types'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { Menu, X } from 'lucide-react'
import { ProtoIcon } from './icon-map'
import { PrototypeThemeScope } from './theme-provider'
import { PAvatar } from './ui/p-avatar'
import { PBadge } from './ui/p-badge'
import { PButton } from './ui/p-button'

// ---- المكوّنات ----
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
import { SettingsFormBlock } from './blocks/settings-form-block'
import { StatsBlock } from './blocks/stats-block'
import { StatsRowBlock } from './blocks/stats-row-block'
import { StepsBlock } from './blocks/steps-block'
import { TeamBlock } from './blocks/team-block'
import { TestimonialsBlock } from './blocks/testimonials-block'
import type { BlockCtx } from './blocks/shared'

// ============================================================
// عرض مكوّن واحد حسب نوعه
// ============================================================
function renderBlock(block: Block, ctx: BlockCtx): ReactElement {
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
      return <PricingBlock block={block} />
    case 'testimonials':
      return <TestimonialsBlock block={block} />
    case 'faq':
      return <FaqBlock block={block} />
    case 'cta':
      return <CtaBlock block={block} />
    case 'custom-html':
      return <CustomHtmlBlock key={block.id} block={block} ctx={ctx} />
    case 'contact-form':
      return <ContactFormBlock block={block} />
    case 'gallery':
      return <GalleryBlock block={block} />
    case 'banner':
      return <BannerBlock block={block} />
    case 'list':
      return <ListBlock block={block} />
    case 'team':
      return <TeamBlock block={block} />
    case 'auth-card':
      return <AuthCardBlock block={block} ctx={ctx} />
    case 'dashboard-header':
      return <DashboardHeaderBlock block={block} />
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
      return <EmptyStateBlock block={block} />
    case 'loading-state':
      return <LoadingStateBlock block={block} />
    case 'error-state':
      return <ErrorStateBlock block={block} />
    case 'calendar':
      return <CalendarBlock block={block} />
    default:
      return <></>
  }
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
  const homeId = schema.pages.find((pg) => pg.type === 'landing')?.id ?? schema.pages[0]?.id
  const go = (pageId: string) => {
    if (ctx.onNavigate) ctx.onNavigate(pageId)
  }

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
    <div className="flex min-h-screen w-full flex-col bg-[var(--pt-bg)] text-[var(--pt-text)]">
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
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[var(--pt-bg)] px-4 py-10 text-[var(--pt-text)]">
      <button
        type="button"
        onClick={() => homeId && ctx.onNavigate?.(homeId)}
        aria-label={`الذهاب إلى ${schema.navigation.brand}`}
        className="mb-6 flex cursor-pointer items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--pt-primary)]"
      >
        <span className="size-10 rounded-[calc(var(--pt-radius)-2px)]" style={{ background: 'var(--pt-primary)' }} />
        <span className="text-lg font-extrabold">{schema.navigation.brand}</span>
      </button>
      <main className="w-full">
        <BlockList page={page} ctx={ctx} selectedBlockId={selectedBlockId} onBlockSelect={onBlockSelect} />
      </main>
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
  const go = (pageId: string) => {
    if (ctx.onNavigate) ctx.onNavigate(pageId)
  }

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
    <div className="flex min-h-screen w-full bg-[var(--pt-bg)] text-[var(--pt-text)]">
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

        {/* بطاقة المستخدم التجريبي */}
        <div className="border-t border-[var(--pt-border)] p-3">
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
        {/* صف التنقل الأفقي — الهاتف/اللوحي */}
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
            <span className="ms-auto">
              <PAvatar name="م" size={30} />
            </span>
          </div>
          <nav
            aria-label="تنقل لوحة التحكم"
            className="flex gap-2 overflow-x-auto px-4 py-2.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--pt-border) transparent' }}
          >
            {items.map((item) => navItem(item, true))}
          </nav>
        </div>

        {/* محتوى الصفحة */}
        <main className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl space-y-5">
            <BlockList page={page} ctx={ctx} selectedBlockId={selectedBlockId} onBlockSelect={onBlockSelect} />
          </div>
        </main>
      </div>
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

  return (
    <PrototypeThemeScope theme={schema.theme} className="w-full">
      {!page ? (
        <div className="flex min-h-96 items-center justify-center bg-[var(--pt-bg)] p-8 text-center text-sm text-[var(--pt-muted)]">
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
