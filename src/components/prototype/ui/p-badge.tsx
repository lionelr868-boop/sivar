'use client'

// ============================================================
// نموذج — PBadge: شارة ناعمة بدرجات دلالية (متغيرات --pt-* فقط)
// Task 9-a — دمج className عبر cn حتى تتجاوز الأحجام المخصصة
// (text-[9px] في رسوم البطل) القيمة الافتراضية بلا صراع.
// ============================================================
import type { ReactElement, CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PBadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

const TONE_STYLES: Record<PBadgeTone, CSSProperties> = {
  default: {
    background: 'color-mix(in srgb, var(--pt-muted) 14%, transparent)',
    color: 'var(--pt-muted)',
    border: '1px solid color-mix(in srgb, var(--pt-muted) 22%, transparent)',
  },
  primary: {
    background: 'color-mix(in srgb, var(--pt-primary) 12%, transparent)',
    color: 'var(--pt-primary)',
    border: '1px solid color-mix(in srgb, var(--pt-primary) 25%, transparent)',
  },
  success: {
    background: 'color-mix(in srgb, #16a34a 12%, transparent)',
    color: '#15803d',
    border: '1px solid color-mix(in srgb, #16a34a 24%, transparent)',
  },
  warning: {
    background: 'color-mix(in srgb, #d97706 12%, transparent)',
    color: '#b45309',
    border: '1px solid color-mix(in srgb, #d97706 24%, transparent)',
  },
  danger: {
    background: 'color-mix(in srgb, #dc2626 12%, transparent)',
    color: '#b91c1c',
    border: '1px solid color-mix(in srgb, #dc2626 24%, transparent)',
  },
  info: {
    background: 'color-mix(in srgb, #0284c7 12%, transparent)',
    color: '#0369a1',
    border: '1px solid color-mix(in srgb, #0284c7 24%, transparent)',
  },
}

export function PBadge({
  tone = 'default',
  children,
  className = '',
}: {
  tone?: PBadgeTone
  children?: ReactNode
  className?: string
}): ReactElement {
  return (
    <span
      style={TONE_STYLES[tone]}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] leading-5 font-semibold whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  )
}
