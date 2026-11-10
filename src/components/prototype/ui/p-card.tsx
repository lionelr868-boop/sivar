'use client'

// ============================================================
// SIVAR — PCard: بطاقة النموذج الأولي (متغيرات --pt-* فقط)
// ============================================================
import type { ReactElement, HTMLAttributes, ReactNode } from 'react'

export function PCard({
  className = '',
  children,
  ...rest
}: { children?: ReactNode } & HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={`rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] ${className}`}
      style={{ boxShadow: 'var(--pt-shadow)' }}
      {...rest}
    >
      {children}
    </div>
  )
}

export function PCardHeader({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}): ReactElement {
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-[var(--pt-border)] px-4 py-3.5 md:px-5 ${className}`}>
      {children}
    </div>
  )
}

export function PCardContent({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}): ReactElement {
  return <div className={`p-4 md:p-5 ${className}`}>{children}</div>
}
