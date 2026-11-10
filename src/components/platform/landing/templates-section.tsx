'use client'

// قسم القوالب — شبكة بطاقات القوالب (8 الأولى)
// ملاحظة: TEMPLATES + TemplateMiniPreview ملك الوكيل 2-a (عقد مثبّت)
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TemplateMiniPreview } from '@/components/prototype/template-mini-preview'
import { TEMPLATES } from '@/lib/project/templates'
import { PROJECT_TYPE_LABELS } from '@/lib/types'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'

const SHOWCASE_COUNT = 8

export function TemplatesSection() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  const openTemplatesLibrary = () => {
    if (user) setDashboardSection('templates')
    else setView('auth')
  }

  const showcase = TEMPLATES.slice(0, SHOWCASE_COUNT)

  return (
    <section id="templates" className="border-y border-border/70 bg-muted/25">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto mb-10 max-w-2xl text-center sm:mb-12"
        >
          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            {t.landing.templatesTitle}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            {t.landing.templatesSubtitle}
          </p>
        </motion.div>

        {/* grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {showcase.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.08, ease: 'easeOut' }}
              className="h-full"
            >
              <Card className="group h-full gap-0 overflow-hidden py-0 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                {/* mini live preview */}
                <div className="border-border/70 bg-muted/30 relative aspect-[4/3] w-full overflow-hidden border-b">
                  <TemplateMiniPreview
                    templateId={tpl.id}
                    className="absolute inset-0 h-full w-full"
                  />
                </div>

                {/* meta */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold leading-tight">{tpl.name}</h3>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {tpl.tagline}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      {PROJECT_TYPE_LABELS[tpl.category]}
                    </Badge>
                    <span className="text-muted-foreground text-xs font-medium">
                      {tpl.pageCount} {t.landing.pagesLabel}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-auto h-10 w-full"
                    onClick={openTemplatesLibrary}
                  >
                    {t.landing.templatesUse}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* more link */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-8 flex justify-center sm:mt-10"
        >
          <Button variant="ghost" size="lg" className="h-11 px-6" onClick={openTemplatesLibrary}>
            {t.landing.templatesMore}
            <ArrowLeft className="size-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
