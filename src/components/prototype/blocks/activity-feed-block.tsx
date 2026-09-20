'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — سجل النشاطات: خط زمني عمودي لآخر عمليات
// المستخدمين (أفاتار + سطر «من فعل ماذا على ماذا» + وقت).
// Task 8-c — العقد المثبّت في agent-ctx/8-spec.md
// props: { title, items: [{ user, action, target?, time }] }
// ============================================================
import type { Block } from '@/lib/types'
import { PAvatar } from '../ui/p-avatar'
import { L, S, iS, type BlockCtx } from './shared'

/** أقصى عدد عناصر معروضة (العقد: 6) */
const MAX_ITEMS = 6

export function ActivityFeedBlock({ block }: { block: Block; ctx?: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title', 'آخر النشاطات')
  const items = L(p, 'items').slice(0, MAX_ITEMS)

  return (
    <div
      className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
      style={{ boxShadow: 'var(--pt-shadow)' }}
    >
      {/* الترويسة */}
      <div className="border-b border-[var(--pt-border)] px-4 py-3.5 md:px-5">
        <h3 className="text-sm font-bold text-[var(--pt-text)]">{title}</h3>
      </div>

      {/* الخط الزمني */}
      {items.length > 0 ? (
        <ul className="divide-y divide-[var(--pt-border)]">
          {items.map((item, i) => {
            const user = iS(item, 'user')
            const action = iS(item, 'action')
            const target = iS(item, 'target')
            const time = iS(item, 'time')
            return (
              <li
                key={i}
                className="flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-[var(--pt-secondary)] md:px-5"
              >
                {/* نقطة زمنية بلون primary */}
                <span
                  aria-hidden
                  className="mt-[10px] size-2 shrink-0 rounded-full"
                  style={{ background: 'var(--pt-primary)' }}
                />
                <PAvatar name={user} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-relaxed text-[var(--pt-text)]">
                    {user ? <span className="font-semibold">{user}</span> : null}
                    {user && action ? ' ' : null}
                    {action ? <span>{action}</span> : null}
                    {action && target ? ' ' : null}
                    {target ? <span className="text-[var(--pt-muted)]">{target}</span> : null}
                  </p>
                  {time ? (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--pt-muted)]">{time}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
