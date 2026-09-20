'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن الفريق: بطاقات أعضاء بصور رمزية دائرية
// ============================================================
import type { Block } from '@/lib/types'
import { PAvatar } from '../ui/p-avatar'
import { L, S, iS, SectionHeading, SectionShell } from './shared'

export function TeamBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const items = L(p, 'items')

  return (
    <SectionShell>
      <SectionHeading title={title} />
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item, i) => (
            <article
              key={i}
              className="flex flex-col items-center rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-6 text-center transition-all duration-200 hover:-translate-y-1"
              style={{ boxShadow: 'var(--pt-shadow)' }}
            >
              <span
                aria-hidden
                className="mb-4 flex size-20 items-center justify-center rounded-full p-1"
                style={{ background: 'color-mix(in srgb, var(--pt-primary) 12%, transparent)' }}
              >
                <PAvatar name={iS(item, 'name')} size={64} />
              </span>
              <h3 className="text-sm font-bold text-[var(--pt-text)] md:text-base">{iS(item, 'name')}</h3>
              <p className="mt-1 text-xs text-[var(--pt-muted)] md:text-sm">{iS(item, 'role')}</p>
            </article>
          ))}
        </div>
      ) : null}
    </SectionShell>
  )
}
