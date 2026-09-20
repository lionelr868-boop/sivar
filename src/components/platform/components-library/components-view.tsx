'use client'

// ============================================================
// SIVAR — مكتبة المكونات: ملعب نظام التصميم + معاينة حية
// لكل عناصر الواجهة والحالات والجداول والرسوم وأقسام الصفحات
// Task 3-a
// ============================================================
import { useMemo, useState } from 'react'
import { Info, Shapes } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'
import type { Block, ProjectSchema, ProjectTheme } from '@/lib/types'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { buildMockData } from '@/lib/content/mock-data'
import { PrototypeThemeScope } from '@/components/prototype/theme-provider'
import { PButton } from '@/components/prototype/ui/p-button'
import type { PButtonVariant } from '@/components/prototype/ui/p-button'
import { PBadge } from '@/components/prototype/ui/p-badge'
import { PAvatar } from '@/components/prototype/ui/p-avatar'
import { PAlert } from '@/components/prototype/ui/p-alert'
import type { PAlertTone } from '@/components/prototype/ui/p-alert'
import { PTabsAuto } from '@/components/prototype/ui/p-tabs'
import { PDropdown } from '@/components/prototype/ui/p-dropdown'
import { PBreadcrumb } from '@/components/prototype/ui/p-breadcrumb'
import { PPagination } from '@/components/prototype/ui/p-pagination'
import { PEmptyState, PErrorState, PLoadingState } from '@/components/prototype/ui/p-states'
import { HeroBlock } from '@/components/prototype/blocks/hero-block'
import { FeaturesBlock } from '@/components/prototype/blocks/features-block'
import { PricingBlock } from '@/components/prototype/blocks/pricing-block'
import { FaqBlock } from '@/components/prototype/blocks/faq-block'
import { AuthCardBlock } from '@/components/prototype/blocks/auth-card-block'
import { DataTableBlock } from '@/components/prototype/blocks/data-table-block'
import { ChartBlock } from '@/components/prototype/blocks/chart-block'
import type { BlockCtx } from '@/components/prototype/blocks/shared'

const tComp = t.components

// ---------- لوحات الألوان (4 هويات جاهزة) ----------
const PALETTES = [
  { id: 'violet', label: tComp.paletteViolet, primary: '#7c3aed', secondary: '#ede9fe', accent: '#db2777' },
  { id: 'teal', label: tComp.paletteTeal, primary: '#0d9488', secondary: '#ccfbf1', accent: '#f59e0b' },
  { id: 'amber', label: tComp.paletteAmber, primary: '#d97706', secondary: '#fef3c7', accent: '#0d9488' },
  { id: 'rose', label: tComp.paletteRose, primary: '#db2777', secondary: '#fce7f3', accent: '#7c3aed' },
] as const

type PaletteId = (typeof PALETTES)[number]['id']

const FONTS: ProjectTheme['fontFamily'][] = ['IBM Plex Sans Arabic', 'Tajawal', 'Cairo']
const FONT_LABELS: Record<ProjectTheme['fontFamily'], string> = {
  'IBM Plex Sans Arabic': tComp.fontIBM,
  Tajawal: tComp.fontTajawal,
  Cairo: tComp.fontCairo,
}

/** قاعدة الهوية (فاتحة) — تُلبس باللوحة والخط والاستدارة */
const BASE_THEME: Omit<ProjectTheme, 'primary' | 'secondary' | 'accent' | 'radius' | 'fontFamily'> = {
  primaryForeground: '#ffffff',
  background: '#fafafa',
  surface: '#ffffff',
  text: '#1c1726',
  mutedText: '#6e6880',
  border: '#eae7f0',
  shadow: 'md',
  mode: 'light',
}

/** بطاقة قسم داخل الملعب (بنمط النموذج نفسه) */
function PlaygroundSection({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-4 sm:p-6">
      <h3 className="text-base font-bold text-[var(--pt-text)]">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-[var(--pt-muted)]">{desc}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/** تسمية صغيرة لمجموعة عناصر */
function DemoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold tracking-wide text-[var(--pt-muted)]">
      {children}
    </p>
  )
}

export function ComponentsView() {
  // ---------- حالة الملعب ----------
  const [paletteId, setPaletteId] = useState<PaletteId>('violet')
  const [font, setFont] = useState<ProjectTheme['fontFamily']>('IBM Plex Sans Arabic')
  const [radius, setRadius] = useState(12)

  // عناصر تفاعلية للعرض الحي
  const [activeTab, setActiveTab] = useState('overview')
  const [demoPage, setDemoPage] = useState(3)

  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0]

  const theme: ProjectTheme = useMemo(
    () => ({
      ...BASE_THEME,
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      radius,
      fontFamily: font,
    }),
    [palette, radius, font],
  )

  // ---------- بيانات وسِياق العرض الحي ----------
  const demoSchema = useMemo<ProjectSchema>(
    () => ({
      version: 1,
      metadata: {
        name: 'design-system-demo',
        description: '',
        type: 'services',
        style: 'modern',
        audience: '',
        icon: 'sparkles',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      theme: {
        ...BASE_THEME,
        primary: PALETTES[0].primary,
        secondary: PALETTES[0].secondary,
        accent: PALETTES[0].accent,
        radius: 12,
        fontFamily: 'IBM Plex Sans Arabic',
      },
      navigation: { brand: '', items: [], footerNote: '' },
      dashboardNav: { items: [] },
      pages: [],
      mockData: buildMockData('services'),
      settings: { dir: 'rtl', lang: 'ar', currency: 'DZD', projectName: 'demo' },
    }),
    [],
  )

  const ctx: BlockCtx = useMemo(() => ({ schema: demoSchema, interactive: false }), [demoSchema])

  // ---------- كتل العرض (افتراضيات السجل نفسه) ----------
  const demoBlocks = useMemo(() => {
    const make = (type: keyof typeof BLOCK_REGISTRY, props?: Record<string, unknown>): Block => ({
      id: `demo-${type}`,
      type,
      props: { ...BLOCK_REGISTRY[type].defaults(), ...props },
    })
    return {
      hero: make('hero'),
      features: make('features'),
      pricing: make('pricing'),
      faq: make('faq'),
      auth: make('auth-card'),
      table: make('data-table'),
      chartBar: make('chart', { title: '', chartType: 'bar', dataKey: 'revenueMonthly' }),
      chartLine: make('chart', { title: '', chartType: 'line', dataKey: 'ordersWeekly' }),
      chartDonut: make('chart', { title: '', chartType: 'donut', dataKey: 'salesByCategory' }),
    }
  }, [])

  const demoNames = [tComp.demoName1, tComp.demoName2, tComp.demoName3, tComp.demoName4]

  const badgeTones: { tone: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'; label: string }[] = [
    { tone: 'default', label: tComp.badgeDefault },
    { tone: 'primary', label: tComp.badgePrimary },
    { tone: 'success', label: tComp.badgeSuccess },
    { tone: 'warning', label: tComp.badgeWarning },
    { tone: 'danger', label: tComp.badgeDanger },
    { tone: 'info', label: tComp.badgeInfo },
  ]

  const alertSamples: { tone: PAlertTone; title: string; body: string }[] = [
    { tone: 'info', title: tComp.alertInfoTitle, body: tComp.alertInfoBody },
    { tone: 'success', title: tComp.alertSuccessTitle, body: tComp.alertSuccessBody },
    { tone: 'warning', title: tComp.alertWarningTitle, body: tComp.alertWarningBody },
    { tone: 'danger', title: tComp.alertDangerTitle, body: tComp.alertDangerBody },
  ]

  const buttonVariants: { variant: PButtonVariant; label: string }[] = [
    { variant: 'primary', label: tComp.btnPrimary },
    { variant: 'secondary', label: tComp.btnSecondary },
    { variant: 'outline', label: tComp.btnOutline },
    { variant: 'ghost', label: tComp.btnGhost },
  ]

  const tabs = [
    { id: 'overview', label: tComp.tabOverview },
    { id: 'reports', label: tComp.tabReports },
    { id: 'team', label: tComp.tabTeam },
  ]
  const activeTabLabel = tabs.find((tb) => tb.id === activeTab)?.label ?? tabs[0].label

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Shapes className="size-5" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{tComp.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">{tComp.subtitle}</p>
      </header>

      {/* ملعب نظام التصميم */}
      <Card className="gap-0 p-4 sm:p-6">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">{tComp.playgroundTitle}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {tComp.playgroundDesc}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* اللوحة */}
            <div className="space-y-2.5">
              <p className="text-sm font-semibold">{tComp.paletteLabel}</p>
              <div className="flex flex-wrap gap-2">
                {PALETTES.map((p) => {
                  const active = paletteId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPaletteId(p.id)}
                      className={cn(
                        'flex min-h-11 items-center gap-2 rounded-full border py-1.5 pe-3.5 ps-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                        active
                          ? 'border-primary bg-secondary text-secondary-foreground'
                          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-7 rounded-full ring-1 ring-black/5"
                        style={{ background: `linear-gradient(135deg, ${p.primary} 60%, ${p.accent} 60%)` }}
                      />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* الخط */}
            <div className="space-y-2.5">
              <label htmlFor="demo-font" className="text-sm font-semibold">
                {tComp.fontLabel}
              </label>
              <Select value={font} onValueChange={(v) => setFont(v as ProjectTheme['fontFamily'])}>
                <SelectTrigger id="demo-font" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {FONT_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الاستدارة */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="demo-radius" className="text-sm font-semibold">
                  {tComp.radiusLabel}
                </label>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {radius}px
                </span>
              </div>
              <Slider
                id="demo-radius"
                min={0}
                max={24}
                step={1}
                value={[radius]}
                onValueChange={(vals) => setRadius(vals[0] ?? 0)}
              />
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" aria-hidden />
            {tComp.liveNote}
          </p>
        </div>
      </Card>

      {/* ---------- المعاينة الحية ---------- */}
      <PrototypeThemeScope theme={theme} className="overflow-hidden rounded-xl border">
        <div className="space-y-6 p-3 sm:p-5">
          {/* 1) عناصر الواجهة */}
          <PlaygroundSection title={tComp.widgetsTitle} desc={tComp.widgetsDesc}>
            <div className="space-y-6">
              {/* الأزرار */}
              <div className="space-y-3">
                <DemoLabel>{tComp.buttonsLabel}</DemoLabel>
                <div className="flex flex-wrap items-center gap-3">
                  {buttonVariants.map((b) => (
                    <PButton key={b.variant} variant={b.variant}>
                      {b.label}
                    </PButton>
                  ))}
                </div>
              </div>

              {/* الأحجام */}
              <div className="space-y-3">
                <DemoLabel>{tComp.sizesLabel}</DemoLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <PButton size="sm">{tComp.sizeSmall}</PButton>
                  <PButton size="md">{tComp.sizeMedium}</PButton>
                  <PButton size="lg">{tComp.sizeLarge}</PButton>
                </div>
              </div>

              {/* الشارات */}
              <div className="space-y-3">
                <DemoLabel>{tComp.badgesLabel}</DemoLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {badgeTones.map((b) => (
                    <PBadge key={b.tone} tone={b.tone}>
                      {b.label}
                    </PBadge>
                  ))}
                </div>
              </div>

              {/* الصور الرمزية */}
              <div className="space-y-3">
                <DemoLabel>{tComp.avatarsLabel}</DemoLabel>
                <div className="flex flex-wrap items-center gap-5">
                  {demoNames.map((name) => (
                    <div key={name} className="flex flex-col items-center gap-2">
                      <PAvatar name={name} size={44} />
                      <span className="text-xs font-medium text-[var(--pt-muted)]">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* التنبيهات */}
              <div className="space-y-3">
                <DemoLabel>{tComp.alertsLabel}</DemoLabel>
                <div className="grid gap-3 sm:grid-cols-2">
                  {alertSamples.map((a) => (
                    <PAlert key={a.tone} tone={a.tone} title={a.title}>
                      {a.body}
                    </PAlert>
                  ))}
                </div>
              </div>

              {/* التبويبات */}
              <div className="space-y-3">
                <DemoLabel>{tComp.tabsLabel}</DemoLabel>
                <PTabsAuto tabs={tabs} initial={activeTab} onChange={setActiveTab} />
                <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-4 text-sm text-[var(--pt-muted)]">
                  {tComp.tabContentPrefix} &quot;{activeTabLabel}&quot; {tComp.tabContentSuffix}
                </div>
              </div>

              {/* القائمة المنسدلة + مسار التنقل */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <DemoLabel>{tComp.dropdownLabel}</DemoLabel>
                  <PDropdown
                    label={tComp.dropdownTrigger}
                    items={[
                      { label: tComp.dropdownItem1 },
                      { label: tComp.dropdownItem2 },
                      { label: tComp.dropdownItem3 },
                    ]}
                  />
                </div>
                <div className="space-y-3">
                  <DemoLabel>{tComp.breadcrumbLabel}</DemoLabel>
                  <PBreadcrumb
                    items={[
                      tComp.breadcrumbHome,
                      tComp.breadcrumbProjects,
                      tComp.breadcrumbCurrent,
                    ]}
                  />
                </div>
              </div>

              {/* ترقيم الصفحات */}
              <div className="space-y-3">
                <DemoLabel>{tComp.paginationLabel}</DemoLabel>
                <PPagination page={demoPage} pageCount={8} onPage={setDemoPage} />
              </div>
            </div>
          </PlaygroundSection>

          {/* 2) الحالات */}
          <PlaygroundSection title={tComp.statesTitle} desc={tComp.statesDesc}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]">
                <PEmptyState
                  title={tComp.emptyTitle}
                  subtitle={tComp.emptySubtitle}
                  actionText={tComp.emptyAction}
                />
              </div>
              <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]">
                <PLoadingState label={tComp.loadingLabel} />
              </div>
              <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]">
                <PErrorState
                  title={tComp.errorTitle}
                  subtitle={tComp.errorSubtitle}
                  actionText={tComp.errorAction}
                />
              </div>
            </div>
          </PlaygroundSection>

          {/* 3) الجداول والرسوم */}
          <PlaygroundSection title={tComp.dataTitle} desc={tComp.dataDesc}>
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]">
                <DataTableBlock block={demoBlocks.table} ctx={ctx} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-2">
                  <ChartBlock block={demoBlocks.chartBar} ctx={ctx} />
                </div>
                <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-2">
                  <ChartBlock block={demoBlocks.chartLine} ctx={ctx} />
                </div>
                <div className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-2">
                  <ChartBlock block={demoBlocks.chartDonut} ctx={ctx} />
                </div>
              </div>
            </div>
          </PlaygroundSection>

          {/* 4) أقسام الصفحات */}
          <PlaygroundSection title={tComp.sectionsTitle} desc={tComp.sectionsDesc}>
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)]">
                <HeroBlock block={demoBlocks.hero} ctx={ctx} />
              </div>
              <div className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)]">
                <FeaturesBlock block={demoBlocks.features} />
              </div>
              <div className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)]">
                <PricingBlock block={demoBlocks.pricing} ctx={ctx} />
              </div>
              <div className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)]">
                <FaqBlock block={demoBlocks.faq} />
              </div>
              <div className="overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-bg)]">
                <AuthCardBlock block={demoBlocks.auth} ctx={ctx} />
              </div>
            </div>
          </PlaygroundSection>
        </div>
      </PrototypeThemeScope>
    </div>
  )
}
