'use client'
import type { ReactElement } from 'react'

// ============================================================
// SIVAR — صف بطاقات الإحصائيات (لوحة تحكم) بأيقونات وتغيّر
// ============================================================
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { Block } from '@/lib/types'
import { ProtoIcon } from '../icon-map'
import { L, iS, isNegativeChange } from './shared'

export function StatsRowBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const items = L(p, 'items')

  if (items.length === 0) return <></>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, i) => {
        const change = iS(item, 'change')
        const neg = isNegativeChange(change)
        return (
          <div
            key={i}
            className="flex items-center gap-4 rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-4 transition-all duration-200 hover:-translate-y-0.5 md:p-5"
            style={{ boxShadow: 'var(--pt-shadow)' }}
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-2px)]"
              style={{
                background: 'color-mix(in srgb, var(--pt-primary) 11%, transparent)',
                color: 'var(--pt-primary)',
              }}
            >
              <ProtoIcon name={iS(item, 'icon', 'chart')} className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[var(--pt-muted)] md:text-[13px]">{iS(item, 'label')}</p>
              <p className="mt-0.5 truncate text-lg font-extrabold text-[var(--pt-text)] md:text-xl">{iS(item, 'value')}</p>
            </div>
            {change ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  background: `color-mix(in srgb, ${neg ? '#dc2626' : '#16a34a'} 12%, transparent)`,
                  color: neg ? '#dc2626' : '#16a34a',
                }}
              >
                {neg ? <TrendingDown aria-hidden className="size-3" /> : <TrendingUp aria-hidden className="size-3" />}
                {change}
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
