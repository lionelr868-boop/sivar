'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — ترويسة اللوحة: عنوان + فرعي + أزرار إجراءات
// ============================================================
import type { Block } from '@/lib/types'
import { Plus } from 'lucide-react'
import { PButton } from '../ui/p-button'
import { S } from './shared'

export function DashboardHeaderBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const actions = S(p, 'actions')
    .split(/[,،]/)
    .map((a) => a.trim())
    .filter(Boolean)

  return (
    <header className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {title ? <h1 className="truncate text-xl font-extrabold text-[var(--pt-text)] md:text-2xl">{title}</h1> : null}
        {subtitle ? <p className="mt-1 text-sm text-[var(--pt-muted)]">{subtitle}</p> : null}
      </div>
      {actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2.5">
          {actions.map((a, i) =>
            i === 0 ? (
              <PButton key={i} size="sm">
                <Plus aria-hidden className="size-4" />
                {a}
              </PButton>
            ) : (
              <PButton key={i} size="sm" variant="outline">
                {a}
              </PButton>
            ),
          )}
        </div>
      ) : null}
    </header>
  )
}
