'use client'
import { type ReactElement, useState } from 'react'

// ============================================================
// SIVAR — المهام: قائمة بمربعات اختيار حقيقية قابلة للتبديل
// + شريط تقدّم وعدّاد يتحدّثان فورياً (حالة محلية).
// Task 8-c — العقد المثبّت في agent-ctx/8-spec.md
// props: { title, subtitle?, items: [{ label, done, meta? }] }
// ============================================================
import type { Block } from '@/lib/types'
import { Check } from 'lucide-react'
import { L, S, iB, iS, type BlockCtx } from './shared'

export function TasksListBlock({ block }: { block: Block; ctx?: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title', 'مهام اليوم')
  const subtitle = S(p, 'subtitle')
  const items = L(p, 'items')

  // حالة محلية: تبدأ من الخصائص وتبقى أثناء التبديل (عرض توضيحي حي)
  const [doneMap, setDoneMap] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    items.forEach((it, i) => {
      initial[i] = iB(it, 'done')
    })
    return initial
  })

  const isDone = (i: number): boolean => (i in doneMap ? doneMap[i] : iB(items[i] ?? {}, 'done'))

  const total = items.length
  const doneCount = items.reduce((acc, _, i) => acc + (isDone(i) ? 1 : 0), 0)
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div
      className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
      style={{ boxShadow: 'var(--pt-shadow)' }}
    >
      {/* الترويسة + شريط التقدّم + العدّاد */}
      <div className="border-b border-[var(--pt-border)] px-4 py-3.5 md:px-5">
        <h3 className="text-sm font-bold text-[var(--pt-text)]">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--pt-muted)]">{subtitle}</p>
        ) : null}
        <div className="mt-3" aria-hidden>
          <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--pt-secondary)]">
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, background: 'var(--pt-primary)' }}
            />
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--pt-muted)]">
          {doneCount} من {total} منجزة
        </p>
      </div>

      {/* قائمة المهام */}
      {total > 0 ? (
        <ul className="divide-y divide-[var(--pt-border)]">
          {items.map((item, i) => {
            const done = isDone(i)
            const label = iS(item, 'label')
            const meta = iS(item, 'meta')
            return (
              <li key={i} className="px-4 py-3 transition-colors duration-150 hover:bg-[var(--pt-secondary)] md:px-5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    aria-label={label}
                    onClick={() => setDoneMap((prev) => ({ ...prev, [i]: !done }))}
                    className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-6px)] border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
                    style={
                      done
                        ? { background: 'var(--pt-primary)', borderColor: 'var(--pt-primary)' }
                        : { borderColor: 'var(--pt-border)', background: 'transparent' }
                    }
                  >
                    {done ? (
                      <Check aria-hidden className="size-3.5 text-[var(--pt-primary-fg)]" strokeWidth={3} />
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-relaxed transition-colors duration-150 ${
                        done ? 'text-[var(--pt-muted)] line-through' : 'font-medium text-[var(--pt-text)]'
                      }`}
                    >
                      {label}
                    </p>
                    {meta ? (
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--pt-muted)]">{meta}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
