'use client'

// ============================================================
// SIVAR — PAlert: تنبيه ناعم بدرجات دلالية
// ============================================================
import type { ReactElement, CSSProperties, ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'

export type PAlertTone = 'info' | 'success' | 'warning' | 'danger'

const TONES: Record<PAlertTone, { style: CSSProperties; icon: ReactNode }> = {
  info: {
    style: {
      background: 'color-mix(in srgb, #0284c7 10%, transparent)',
      border: '1px solid color-mix(in srgb, #0284c7 24%, transparent)',
      color: '#0369a1',
    },
    icon: <Info className="size-4 shrink-0" />,
  },
  success: {
    style: {
      background: 'color-mix(in srgb, #16a34a 10%, transparent)',
      border: '1px solid color-mix(in srgb, #16a34a 24%, transparent)',
      color: '#15803d',
    },
    icon: <CheckCircle2 className="size-4 shrink-0" />,
  },
  warning: {
    style: {
      background: 'color-mix(in srgb, #d97706 10%, transparent)',
      border: '1px solid color-mix(in srgb, #d97706 24%, transparent)',
      color: '#b45309',
    },
    icon: <TriangleAlert className="size-4 shrink-0" />,
  },
  danger: {
    style: {
      background: 'color-mix(in srgb, #dc2626 10%, transparent)',
      border: '1px solid color-mix(in srgb, #dc2626 24%, transparent)',
      color: '#b91c1c',
    },
    icon: <XCircle className="size-4 shrink-0" />,
  },
}

export function PAlert({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: PAlertTone
  title?: ReactNode
  children?: ReactNode
  className?: string
}): ReactElement {
  const t = TONES[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      style={t.style}
      className={`flex items-start gap-2.5 rounded-[var(--pt-radius)] px-3.5 py-3 text-sm ${className}`}
    >
      <span className="mt-0.5">{t.icon}</span>
      <div className="min-w-0 flex-1 leading-relaxed">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className={title ? 'mt-0.5 text-[13px] opacity-90' : 'text-[13px]'}>{children}</div> : null}
      </div>
    </div>
  )
}
