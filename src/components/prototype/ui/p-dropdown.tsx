'use client'

// ============================================================
// SIVAR — PDropdown: قائمة منسدلة بصفر اعتماديات (native details)
// ============================================================
import type { ReactElement, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export interface PDropdownItem {
  label: string
  onClick?: () => void
}

export function PDropdown({
  label,
  items,
  className = '',
}: {
  label: ReactNode
  items: PDropdownItem[]
  className?: string
}): ReactElement {
  return (
    <details className={`group relative inline-block text-start ${className}`}>
      <summary
        className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] px-4 py-2 text-sm font-medium text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)] [&::-webkit-details-marker]:hidden"
      >
        {label}
        <ChevronDown className="size-4 shrink-0 text-[var(--pt-muted)] transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="absolute end-0 z-20 mt-1.5 min-w-40 rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-1.5" style={{ boxShadow: 'var(--pt-shadow)' }}>
        {items.map((item, i) => (
          <button
            key={`${item.label}-${i}`}
            type="button"
            onClick={item.onClick}
            className="block w-full min-h-10 cursor-pointer rounded-[calc(var(--pt-radius)-4px)] px-3 py-2 text-start text-sm text-[var(--pt-text)] transition-colors duration-100 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--pt-primary)]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  )
}
