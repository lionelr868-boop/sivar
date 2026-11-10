'use client'

// قسم الدعوة الختامية — بطاقة متدرجة بنفسجية
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'

export function CtaSection() {
  const setView = useAppStore((s) => s.setView)

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="from-primary via-primary to-primary/70 bg-gradient-to-l relative overflow-hidden rounded-3xl px-6 py-12 text-center shadow-xl shadow-primary/20 sm:px-10 sm:py-16"
      >
        {/* decorative shapes */}
        <div
          aria-hidden="true"
          className="absolute -top-16 -start-16 size-48 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -end-20 size-56 rounded-full bg-white/10 blur-2xl"
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
          <h2 className="font-display text-2xl font-extrabold leading-snug text-white sm:text-3xl md:text-4xl">
            {t.landing.ctaTitle}
          </h2>
          <p className="text-sm leading-relaxed text-white/85 sm:text-base">
            {t.landing.ctaSubtitle}
          </p>
          <Button
            size="lg"
            className="h-12 bg-white px-8 text-base font-bold text-primary shadow-lg hover:bg-white/90"
            onClick={() => setView('auth')}
          >
            {t.landing.ctaButton}
            <ArrowLeft className="size-4.5" />
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
