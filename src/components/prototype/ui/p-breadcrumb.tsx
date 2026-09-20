'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — PBreadcrumb: مسار تنقّل نصي بسيط
// ============================================================
import { ChevronLeft } from 'lucide-react'

export function PBreadcrumb({ items, className = '' }: { items: string[]; className?: string }): ReactElement {
  const clean = items.filter((s) => typeof s === 'string' && s.trim())
  if (clean.length === 0) return <nav aria-label="مسار التنقل" className={className} />
  return (
    <nav aria-label="مسار التنقل" className={`flex items-center gap-1.5 text-[13px] ${className}`}>
      {clean.map((item, i) => {
        const isLast = i === clean.length - 1
        return (
          <span key={`${item}-${i}`} className="flex items-center gap-1.5">
            <span className={isLast ? 'font-semibold text-[var(--pt-text)]' : 'text-[var(--pt-muted)]'}>{item}</span>
            {!isLast && <ChevronLeft aria-hidden className="size-3.5 text-[var(--pt-muted)]" />}
          </span>
        )
      })}
    </nav>
  )
}
