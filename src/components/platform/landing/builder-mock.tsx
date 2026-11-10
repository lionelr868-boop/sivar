'use client'

// المعاينة البصرية التفاعلية في قسم الهيرو — إطار متصفح يحاكي بيئة البناء
import { motion } from 'framer-motion'
import {
  Blocks,
  Bot,
  Home,
  LayoutDashboard,
  LogIn,
  Plus,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

const MOCK_PAGES = [
  { icon: Home, label: t.landing.mockPageHome, active: true },
  { icon: LogIn, label: t.landing.mockPageAuth, active: false },
  { icon: LayoutDashboard, label: t.landing.mockPageDashboard, active: false },
  { icon: Users, label: t.landing.mockPageCustomers, active: false },
  { icon: ShoppingCart, label: t.landing.mockPageOrders, active: false },
  { icon: Settings, label: t.landing.mockPageSettings, active: false },
]

export function BuilderMock() {
  return (
    <div className="relative w-full">
      {/* decorative glow */}
      <div
        aria-hidden="true"
        className="absolute -top-8 -end-8 size-44 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-10 -start-10 size-48 rounded-full bg-primary/15 blur-3xl"
      />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* browser chrome frame */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
          {/* browser bar */}
          <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-amber-500/70" />
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <div className="bg-background text-muted-foreground mx-auto flex w-full max-w-[190px] items-center justify-center rounded-md border px-3 py-1 text-[10px] tracking-wide" dir="ltr">
              {t.landing.mockUrl}
            </div>
            <span className="w-10 shrink-0" aria-hidden="true" />
          </div>

          {/* builder body — RTL: أول عنصر يظهر يمينًا */}
          <div className="flex h-[300px] text-start sm:h-[330px]">
            {/* pages sidebar (يمين) */}
            <aside className="flex w-[92px] shrink-0 flex-col border-e bg-muted/25 sm:w-[104px]">
              <p className="text-muted-foreground px-2.5 pb-1 pt-2.5 text-[9px] font-semibold uppercase tracking-wide">
                {t.landing.mockPagesTitle}
              </p>
              <ul className="flex flex-col gap-0.5 px-1.5">
                {MOCK_PAGES.map((page) => (
                  <li key={page.label} className="relative">
                    <span
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium',
                        page.active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      <page.icon className="size-3 shrink-0" strokeWidth={2.2} />
                      <span className="truncate">{page.label}</span>
                    </span>
                    {page.active && (
                      <span
                        aria-hidden="true"
                        className="bg-primary absolute start-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </aside>

            {/* center — mini landing preview */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* mini navbar */}
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-primary" aria-hidden="true" />
                  <span className="text-[10px] font-bold">{t.landing.mockPreviewBrand}</span>
                </div>
                <div className="text-muted-foreground hidden items-center gap-2.5 text-[8px] sm:flex">
                  <span>{t.landing.mockPreviewNav}</span>
                  <span>{t.landing.mockPreviewNav2}</span>
                  <span>{t.landing.mockPreviewNav3}</span>
                </div>
              </div>
              {/* mini hero */}
              <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-gradient-to-b from-primary/5 to-transparent px-4 text-center">
                <p className="font-display text-sm font-bold leading-snug sm:text-base">
                  {t.landing.mockPreviewTitle}
                </p>
                <p className="text-muted-foreground max-w-[220px] text-[9px] leading-relaxed sm:text-[10px]">
                  {t.landing.mockPreviewSubtitle}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="bg-primary text-primary-foreground rounded-md px-2.5 py-1 text-[9px] font-semibold">
                    {t.landing.mockPreviewCta}
                  </span>
                  <span className="border-border text-foreground rounded-md border px-2.5 py-1 text-[9px] font-medium">
                    {t.landing.mockPreviewCtaSecondary}
                  </span>
                </div>
                {/* skeleton feature chips */}
                <div className="mt-2.5 flex w-full items-center justify-center gap-1.5" aria-hidden="true">
                  <span className="bg-muted h-4 w-12 rounded-full" />
                  <span className="bg-muted h-4 w-16 rounded-full" />
                  <span className="bg-muted h-4 w-10 rounded-full" />
                </div>
              </div>
            </div>

            {/* AI panel (يسار) */}
            <aside className="bg-accent/40 hidden w-[168px] shrink-0 flex-col border-s md:flex">
              <div className="flex items-center gap-1.5 border-b px-2.5 py-2">
                <span className="bg-primary/10 text-primary grid size-5 place-items-center rounded-md">
                  <Bot className="size-3" strokeWidth={2.2} />
                </span>
                <p className="text-[10px] font-bold">{t.landing.mockAssistantTitle}</p>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2.5 px-2.5">
                {/* user bubble */}
                <div className="flex justify-end">
                  <p className="bg-primary text-primary-foreground max-w-[85%] rounded-xl rounded-ee-sm px-2.5 py-1.5 text-[9px] leading-relaxed">
                    {t.landing.mockUserMessage}
                  </p>
                </div>
                {/* agent bubble */}
                <div className="flex justify-start">
                  <p className="bg-background text-foreground max-w-[85%] rounded-xl rounded-es-sm border px-2.5 py-1.5 text-[9px] leading-relaxed">
                    {t.landing.mockAgentMessage}
                  </p>
                </div>
                {/* tool chips */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-muted-foreground border bg-background inline-flex items-center gap-1 rounded-full border-dashed px-2 py-0.5 text-[8px]">
                    <Plus className="size-2.5" />
                    {t.landing.mockToolCreatePage}
                  </span>
                  <span className="text-muted-foreground border bg-background inline-flex items-center gap-1 rounded-full border-dashed px-2 py-0.5 text-[8px]">
                    <Blocks className="size-2.5" />
                    {t.landing.mockToolAddBlock}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
