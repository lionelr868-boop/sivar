'use client'

// قسم الهيرو — العنوان الرئيسي + المعاينة التفاعلية
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { BuilderMock } from './builder-mock'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: 'easeOut' as const },
}

export function HeroSection() {
  const setView = useAppStore((s) => s.setView)

  return (
    <section className="relative overflow-hidden">
      {/* subtle dotted backdrop */}
      <div
        aria-hidden="true"
        className="bg-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_35%,black,transparent)]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-16 pb-12 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-24 lg:pb-20">
        {/* copy */}
        <motion.div {...reveal} className="flex flex-col items-start gap-6 text-start">
          {/* badge pill */}
          <span className="border-primary/25 bg-accent/70 text-accent-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold sm:text-sm">
            <Sparkles className="size-3.5" />
            {t.landing.heroBadge}
          </span>

          {/* headline */}
          <h1 className="font-display text-3xl font-extrabold leading-[1.25] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.4rem]">
            {t.landing.heroTitleLead}{' '}
            <span className="text-gradient">{t.landing.heroTitleHighlight}</span>{' '}
            {t.landing.heroTitleTail}
          </h1>

          {/* subtitle */}
          <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
            {t.landing.heroSubtitle}
          </p>

          {/* CTAs */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button size="lg" className="h-12 px-7 text-base" onClick={() => setView('auth')}>
              {t.landing.heroCtaPrimary}
              <ArrowLeft className="size-4.5" />
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-7 text-base" asChild>
              <a href="#templates">{t.landing.heroCtaSecondary}</a>
            </Button>
          </div>
        </motion.div>

        {/* interactive visual preview */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="relative"
        >
          <span className="sr-only">{t.landing.heroPreviewLabel}</span>
          <BuilderMock />
        </motion.div>
      </div>
    </section>
  )
}
