'use client'

// قسم الأسئلة الشائعة
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { t } from '@/lib/i18n'

const FAQS = [
  { q: t.landing.faq1Q, a: t.landing.faq1A },
  { q: t.landing.faq2Q, a: t.landing.faq2A },
  { q: t.landing.faq3Q, a: t.landing.faq3A },
  { q: t.landing.faq4Q, a: t.landing.faq4A },
  { q: t.landing.faq5Q, a: t.landing.faq5A },
]

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto mb-8 text-center sm:mb-10"
      >
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
          {t.landing.faqTitle}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          {t.landing.faqSubtitle}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="border-border/70">
              <AccordionTrigger className="text-start text-sm font-bold hover:text-primary hover:no-underline sm:text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-start text-sm leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  )
}
