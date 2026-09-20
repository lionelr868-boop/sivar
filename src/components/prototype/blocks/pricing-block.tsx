'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن التسعير: شبكة خطط + خطة مميّزة
// ============================================================
import type { Block } from '@/lib/types'
import { Check } from 'lucide-react'
import { PButton } from '../ui/p-button'
import { num } from '@/lib/content/mock-data'
import { L, S, iB, iN, iS, SectionHeading, SectionShell } from './shared'

export function PricingBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const currency = S(p, 'currency', 'دج') || 'دج'
  const plans = L(p, 'plans')

  return (
    <SectionShell>
      <SectionHeading title={title} subtitle={subtitle} />
      {plans.length > 0 ? (
        <div
          className={`grid grid-cols-1 items-stretch gap-5 md:gap-6 ${
            plans.length === 2 ? 'md:grid-cols-2' : plans.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'
          }`}
        >
          {plans.map((plan, i) => {
            const highlighted = iB(plan, 'highlighted')
            const price = iN(plan, 'price')
            const features = iS(plan, 'features')
              .split('\n')
              .map((f) => f.trim())
              .filter(Boolean)
            return (
              <article
                key={i}
                className={`relative flex flex-col rounded-[var(--pt-radius)] bg-[var(--pt-surface)] p-6 transition-all duration-200 ${
                  highlighted
                    ? 'scale-[1.02] border-2'
                    : 'border border-[var(--pt-border)] hover:-translate-y-1'
                }`}
                style={{
                  borderColor: highlighted ? 'var(--pt-primary)' : undefined,
                  boxShadow: 'var(--pt-shadow)',
                }}
              >
                {highlighted ? (
                  <span
                    className="absolute -top-3.5 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-[11px] font-bold"
                    style={{ background: 'var(--pt-primary)', color: 'var(--pt-primary-fg)' }}
                  >
                    الأكثر شيوعاً
                  </span>
                ) : null}

                <h3 className="text-lg font-bold text-[var(--pt-text)]">{iS(plan, 'name')}</h3>

                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-[var(--pt-text)]">
                    {price === 0 ? 'مجاناً' : num(price)}
                  </span>
                  {price !== 0 ? (
                    <span className="text-sm font-medium text-[var(--pt-muted)]">
                      {currency} / {iS(plan, 'period')}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-[var(--pt-muted)]">{iS(plan, 'period')}</span>
                  )}
                </p>

                {features.length > 0 ? (
                  <ul className="mt-5 flex-1 space-y-2.5 border-t border-[var(--pt-border)] pt-5">
                    {features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-[var(--pt-text)]">
                        <Check
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0"
                          style={{ color: highlighted ? 'var(--pt-primary)' : '#16a34a' }}
                        />
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex-1" />
                )}

                <PButton
                  variant={highlighted ? 'primary' : 'outline'}
                  size="lg"
                  className="mt-6 w-full"
                >
                  {iS(plan, 'buttonText', 'اشترك الآن')}
                </PButton>
              </article>
            )
          })}
        </div>
      ) : null}
    </SectionShell>
  )
}
