'use client'

// ============================================================
// SIVAR — ChartFrame: غلاف بطاقة موحّد للرسوم البيانية
// + لوحة الألوان المشتركة (متغير --pt-primary أولاً)
// Task 9-a — ترويسة ببلاطة أيقونة صغيرة (رسم صاعد) تبدو حقيقية.
// ============================================================
import type { ReactElement, ReactNode } from 'react'
import { PCard } from '../ui/p-card'

/** لوحة ألوان الرسوم: اللون الأساسي للهوية + ألوان مساندة */
export const CHART_PALETTE: string[] = [
  'var(--pt-primary)',
  '#0d9488',
  '#d97706',
  '#db2777',
  '#2563eb',
  '#64748b',
]

/** اختصار رقمي للنطاقات (3.4م / 12ألف) */
export function compactNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) {
    const m = v / 1_000_000
    return `${Number.isInteger(m) ? m : m.toFixed(1)}م`
  }
  if (Math.abs(v) >= 1000) {
    const k = v / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}ألف`
  }
  return String(v)
}

/** بلاطة أيقونة صغيرة بجانب عنوان الرسم (لمسة واقعية) */
function ChartTitleIcon(): ReactElement {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-4px)] bg-[var(--pt-secondary)]"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 12.5 6 8l3 2.5L14 4"
          stroke="var(--pt-primary)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 4h4v4" stroke="var(--pt-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function ChartFrame({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}): ReactElement {
  return (
    <PCard className={className}>
      {title ? (
        <div className="flex items-center gap-2.5 border-b border-[var(--pt-border)] px-4 py-3 md:px-5">
          <ChartTitleIcon />
          <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--pt-text)]">{title}</h3>
        </div>
      ) : null}
      <div className="p-4 md:p-5">{children}</div>
    </PCard>
  )
}
