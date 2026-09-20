'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن آراء العملاء: بطاقات + نجوم + صور رمزية
// ============================================================
import { Star } from 'lucide-react'
import type { Block } from '@/lib/types'
import { PAvatar } from '../ui/p-avatar'
import { L, S, iN, iS, SectionHeading, SectionShell } from './shared'

export function TestimonialsBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const items = L(p, 'items')

  return (
    <SectionShell>
      <SectionHeading title={title} />
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((item, i) => {
            const rating = Math.max(0, Math.min(5, Math.round(iN(item, 'rating', 5))))
            return (
              <figure
                key={i}
                className="flex flex-col rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-5 transition-all duration-200 hover:-translate-y-1"
                style={{ boxShadow: 'var(--pt-shadow)' }}
              >
                {/* النجوم */}
                <div className="mb-3 flex items-center gap-0.5" aria-label={`التقييم: ${rating} من 5`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      aria-hidden
                      className={`size-4 ${s <= rating ? 'fill-current' : 'fill-none'}`}
                      style={{ color: s <= rating ? '#d97706' : 'var(--pt-border)', strokeWidth: s <= rating ? 0 : 2 }}
                    />
                  ))}
                </div>

                <blockquote className="flex-1 text-sm leading-relaxed text-[var(--pt-text)]">
                  <p>«{iS(item, 'text')}»</p>
                </blockquote>

                <figcaption className="mt-4 flex items-center gap-3 border-t border-[var(--pt-border)] pt-4">
                  <PAvatar name={iS(item, 'name')} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--pt-text)]">{iS(item, 'name')}</p>
                    <p className="truncate text-xs text-[var(--pt-muted)]">{iS(item, 'role')}</p>
                  </div>
                </figcaption>
              </figure>
            )
          })}
        </div>
      ) : null}
    </SectionShell>
  )
}
