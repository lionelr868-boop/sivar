'use client'

// ============================================================
// نموذج — ChartFrame: غلاف بطاقة موحّد للرسوم البيانية
// + لوحة الألوان المشتركة (متغير --pt-primary أولاً)
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
        <div className="border-b border-[var(--pt-border)] px-4 py-3.5 md:px-5">
          <h3 className="text-sm font-bold text-[var(--pt-text)]">{title}</h3>
        </div>
      ) : null}
      <div className="p-4 md:p-5">{children}</div>
    </PCard>
  )
}
