'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن الأسئلة الشائعة: أكورديون details أصلي
// ============================================================
import type { Block } from '@/lib/types'
import { ChevronDown } from 'lucide-react'
import { L, S, iS, SectionHeading, SectionShell } from './shared'

export function FaqBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const items = L(p, 'items')

  return (
    <SectionShell>
      <SectionHeading title={title} subtitle={subtitle} />
      {items.length > 0 ? (
        <div className="mx-auto max-w-3xl space-y-3">
          {items.map((item, i) => (
            <details
              key={i}
              className="group rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] transition-colors duration-150 open:border-[color-mix(in_srgb,var(--pt-primary)_35%,var(--pt-border))]"
              style={{ boxShadow: 'var(--pt-shadow)' }}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-start text-sm font-bold text-[var(--pt-text)] transition-colors duration-150 hover:text-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--pt-primary)] [&::-webkit-details-marker]:hidden md:text-base">
                <span className="flex-1 leading-relaxed">{iS(item, 'q')}</span>
                <ChevronDown
                  aria-hidden
                  className="size-5 shrink-0 text-[var(--pt-muted)] transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div className="border-t border-[var(--pt-border)] px-5 py-4">
                <p className="text-sm leading-relaxed text-[var(--pt-muted)]">{iS(item, 'a')}</p>
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </SectionShell>
  )
}
