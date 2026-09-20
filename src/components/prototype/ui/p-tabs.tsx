'use client'

// ============================================================
// نموذج — PTabs: تبويبات بخط سفلي (متحكَّم بها أو بحالة داخلية)
// ============================================================
import { type ReactElement, useState } from 'react'

export interface PTabItem {
  id: string
  label: string
}

function TabList({
  tabs,
  active,
  onSelect,
  className = '',
}: {
  tabs: PTabItem[]
  active: string
  onSelect: (id: string) => void
  className?: string
}): ReactElement {
  return (
    <div role="tablist" aria-label="تبويبات" className={`flex gap-1 overflow-x-auto border-b border-[var(--pt-border)] ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={`relative min-h-10 cursor-pointer whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--pt-primary)] ${
              isActive
                ? 'text-[var(--pt-primary)]'
                : 'text-[var(--pt-muted)] hover:text-[var(--pt-text)]'
            }`}
          >
            {tab.label}
            <span
              aria-hidden
              className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-opacity duration-150 ${
                isActive ? 'bg-[var(--pt-primary)] opacity-100' : 'opacity-0'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

/** نسخة متحكَّم بها: active + onChange */
export function PTabs({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: PTabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}): ReactElement {
  return <TabList tabs={tabs} active={active} onSelect={onChange} className={className} />
}

/** نسخة بحالة داخلية — ترجع الـ id النشط عبر onChange */
export function PTabsAuto({
  tabs,
  initial,
  onChange,
  className = '',
}: {
  tabs: PTabItem[]
  initial?: string
  onChange?: (id: string) => void
  className?: string
}): ReactElement {
  const [active, setActive] = useState<string>(initial ?? tabs[0]?.id ?? '')
  const handle = (id: string) => {
    setActive(id)
    onChange?.(id)
  }
  return <TabList tabs={tabs} active={active} onSelect={handle} className={className} />
}
