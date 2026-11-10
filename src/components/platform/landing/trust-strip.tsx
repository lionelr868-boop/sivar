'use client'

// شريط الثقة — 4 ميزات صغيرة بأيقونات
import { motion } from 'framer-motion'
import { Code2, Languages, MapPin, UploadCloud } from 'lucide-react'
import { t } from '@/lib/i18n'

const TRUST_ITEMS = [
  { icon: Code2, label: t.landing.trustNoCode },
  { icon: Languages, label: t.landing.trustRtl },
  { icon: UploadCloud, label: t.landing.trustNetlify },
  { icon: MapPin, label: t.landing.trustAlgerian },
]

export function TrustStrip() {
  return (
    <section className="border-y border-border/70 bg-muted/25">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-5 sm:px-6 md:grid-cols-4 md:gap-4">
        {TRUST_ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="bg-card/60 border-border/60 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-center"
          >
            <item.icon className="text-primary size-4 shrink-0" strokeWidth={2.2} />
            <span className="text-foreground/90 text-xs font-semibold sm:text-sm">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
