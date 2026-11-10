'use client'

// ============================================================
// SIVAR — مركز المساعدة: بطاقات بداية سريعة + أسئلة شائعة
// Task 3-a
// ============================================================
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CircleHelp,
  CloudUpload,
  Download,
  FileQuestion,
  Rocket,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { t } from '@/lib/i18n'

const tHelp = t.help

// بطاقات البداية السريعة — تنقلك إلى السؤال المناسب
const QUICK_CARDS = [
  { id: 'faq-1', icon: Rocket, title: tHelp.quickCreateTitle, desc: tHelp.quickCreateDesc },
  { id: 'faq-6', icon: Download, title: tHelp.quickDownloadTitle, desc: tHelp.quickDownloadDesc },
  { id: 'faq-7', icon: CloudUpload, title: tHelp.quickPublishTitle, desc: tHelp.quickPublishDesc },
]

const FAQ_ITEMS = [
  { id: 'faq-1', q: tHelp.q1, a: tHelp.a1 },
  { id: 'faq-2', q: tHelp.q2, a: tHelp.a2 },
  { id: 'faq-3', q: tHelp.q3, a: tHelp.a3 },
  { id: 'faq-4', q: tHelp.q4, a: tHelp.a4 },
  { id: 'faq-5', q: tHelp.q5, a: tHelp.a5 },
  { id: 'faq-6', q: tHelp.q6, a: tHelp.a6 },
  { id: 'faq-7', q: tHelp.q7, a: tHelp.a7 },
  { id: 'faq-8', q: tHelp.q8, a: tHelp.a8 },
  { id: 'faq-9', q: tHelp.q9, a: tHelp.a9 },
]

export function HelpView() {
  const [openValue, setOpenValue] = useState<string>('')
  const faqRef = useRef<HTMLDivElement | null>(null)

  const goToFaq = (id: string) => {
    setOpenValue(id)
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* الترويسة */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <CircleHelp className="size-5" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{tHelp.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">{tHelp.subtitle}</p>
      </header>

      {/* البداية السريعة */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label={tHelp.quickCreateTitle}>
        {QUICK_CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.button
              key={card.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: 'easeOut' }}
              onClick={() => goToFaq(card.id)}
              className="min-h-11 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Card className="h-full gap-3 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="text-sm font-bold">{card.title}</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
              </Card>
            </motion.button>
          )
        })}
      </section>

      {/* الأسئلة الشائعة */}
      <section ref={faqRef} className="space-y-4">
        <h2 className="font-display text-xl font-bold tracking-tight">{tHelp.faqTitle}</h2>
        <Accordion
          type="single"
          collapsible
          value={openValue}
          onValueChange={setOpenValue}
          className="space-y-3"
        >
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              id={item.id}
              className="scroll-mt-24 rounded-xl border px-4 shadow-sm last:border-b data-[state=open]:border-primary/30"
            >
              <AccordionTrigger className="min-h-11 gap-2 py-4 text-start text-sm font-bold hover:no-underline sm:text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* لم تجد إجابتك؟ */}
      <Card className="border-dashed gap-0 p-6 text-center sm:p-8">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-muted">
          <FileQuestion className="size-8 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-bold">{tHelp.noAnswerTitle}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {tHelp.noAnswerHint}
        </p>
        <Badge variant="secondary" className="mt-4">
          {tHelp.comingSoonBadge}
        </Badge>
      </Card>
    </div>
  )
}
