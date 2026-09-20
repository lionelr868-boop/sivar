'use client'
import type { ReactElement } from 'react'

// ============================================================
// SIVAR — مكوّن قائمة عناصر: صفوف بصورة رمزية + نص جانبي
// ============================================================
import type { Block } from '@/lib/types'
import { PAvatar } from '../ui/p-avatar'
import { L, S, iS, SectionHeading, SectionShell } from './shared'

export function ListBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const items = L(p, 'items')

  return (
    <SectionShell tight>
      {title ? <h2 className="mb-5 text-xl font-bold text-[var(--pt-text)] md:text-2xl">{title}</h2> : null}
      <ul
        className="max-h-96 divide-y divide-[var(--pt-border)] overflow-y-auto rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
        style={{ boxShadow: 'var(--pt-shadow)', scrollbarWidth: 'thin', scrollbarColor: 'var(--pt-border) transparent' }}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors duration-150 hover:bg-[var(--pt-secondary)] md:px-5">
            <PAvatar name={iS(item, 'title')} size={38} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--pt-text)]">{iS(item, 'title')}</p>
              {iS(item, 'subtitle') ? (
                <p className="mt-0.5 truncate text-xs leading-relaxed text-[var(--pt-muted)]">{iS(item, 'subtitle')}</p>
              ) : null}
            </div>
            {iS(item, 'meta') ? (
              <span className="shrink-0 text-xs font-medium text-[var(--pt-muted)]">{iS(item, 'meta')}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
