'use client'

// قسم "كيف تعمل المنصة" — 4 خطوات + مثال تفاعلي
import { motion } from 'framer-motion'
import {
  ArrowDown,
  Blocks,
  CalendarCheck,
  Globe,
  LayoutDashboard,
  LogIn,
  PenLine,
  Rocket,
  Settings,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { t } from '@/lib/i18n'

const STEPS = [
  { icon: PenLine, title: t.landing.step1Title, desc: t.landing.step1Desc },
  { icon: Blocks, title: t.landing.step2Title, desc: t.landing.step2Desc },
  { icon: WandSparkles, title: t.landing.step3Title, desc: t.landing.step3Desc },
  { icon: Rocket, title: t.landing.step4Title, desc: t.landing.step4Desc },
]

const RESULT_CHIPS = [
  { icon: Globe, label: t.landing.exampleChipLanding },
  { icon: LogIn, label: t.landing.exampleChipAuth },
  { icon: LayoutDashboard, label: t.landing.exampleChipDashboard },
  { icon: CalendarCheck, label: t.landing.exampleChipBookings },
  { icon: Users, label: t.landing.exampleChipCustomers },
  { icon: Settings, label: t.landing.exampleChipSettings },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"
      >
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          {t.landing.howTitle}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          {t.landing.howSubtitle}
        </p>
      </motion.div>

      {/* steps + dashed connector (desktop) */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="border-primary/25 absolute top-7 hidden w-full border-t-2 border-dashed md:block"
        />
        <div className="relative grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
            >
              <Card className="h-full gap-4 border-border/70 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="bg-primary text-primary-foreground font-display grid size-11 shrink-0 place-items-center rounded-full text-base font-extrabold shadow-sm shadow-primary/30">
                    {i + 1}
                  </span>
                  <span className="bg-accent/70 text-accent-foreground grid size-10 place-items-center rounded-xl">
                    <step.icon className="size-5" strokeWidth={2} />
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* example box */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
        className="mt-8 sm:mt-10"
      >
        <Card className="bg-gradient-to-b from-accent/40 to-card border-primary/15">
          <CardContent className="flex flex-col items-center gap-4 py-2 text-center">
            {/* prompt */}
            <div className="flex w-full flex-col items-center gap-2.5">
              <p className="text-muted-foreground text-xs font-semibold sm:text-sm">
                {t.landing.exampleLabel}
              </p>
              <div className="bg-background border-border/80 flex max-w-md items-center gap-2.5 rounded-xl border px-4 py-3 shadow-sm">
                <Sparkles className="text-primary size-4 shrink-0" />
                <p className="text-foreground text-sm font-medium sm:text-base">
                  {t.landing.exampleInput}
                </p>
              </div>
            </div>

            {/* arrow */}
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="text-primary/70"
              aria-hidden="true"
            >
              <ArrowDown className="size-5" />
            </motion.span>

            {/* result chips */}
            <div className="flex w-full flex-col items-center gap-3">
              <p className="text-muted-foreground text-xs font-semibold sm:text-sm">
                {t.landing.exampleResultLabel}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {RESULT_CHIPS.map((chip, i) => (
                  <motion.span
                    key={chip.label}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: 0.25 + i * 0.09, ease: 'easeOut' }}
                    className="bg-background text-foreground border-primary/25 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm sm:text-sm"
                  >
                    <chip.icon className="text-primary size-3.5" />
                    {chip.label}
                  </motion.span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  )
}
