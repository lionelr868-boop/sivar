'use client'
import type { ReactElement } from 'react'

// ============================================================
// SIVAR — مكوّن الأرقام: صف بطاقات إحصائية (تسويقي)
// Task 9-a — خلفية صورة للقسم (bgImage + bgOverlay) بنبرة نص متكيّفة
// ============================================================
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { Block } from '@/lib/types'
import { L, S, iS, isNegativeChange, SectionHeading, SectionShell, isImageNoOverlay, sectionImageStyle } from './shared'

export function StatsBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const items = L(p, 'items')

  const { style: sectionStyle, dark } = sectionImageStyle(p)
  const noOverlay = isImageNoOverlay(p)

  return (
    <SectionShell style={sectionStyle}>
      <SectionHeading title={title} dark={dark} textShadow={noOverlay} />
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {items.map((item, i) => {
            const change = iS(item, 'change')
            const neg = isNegativeChange(change)
            return (
              <div
                key={i}
                className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-5 text-center transition-all duration-200 hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--pt-shadow)' }}
              >
                <p
                  className="text-2xl font-extrabold md:text-3xl"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {iS(item, 'value')}
                </p>
                <p className="mt-1.5 text-xs font-medium text-[var(--pt-muted)] md:text-sm">{iS(item, 'label')}</p>
                {change ? (
                  <p
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold"
                    style={{ color: neg ? '#dc2626' : '#16a34a' }}
                  >
                    {neg ? <TrendingDown aria-hidden className="size-3.5" /> : <TrendingUp aria-hidden className="size-3.5" />}
                    {change}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </SectionShell>
  )
}
