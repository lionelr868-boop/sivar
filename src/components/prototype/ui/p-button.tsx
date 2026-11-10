'use client'

// ============================================================
// SIVAR — PButton: زر النموذج الأولي (متغيرات --pt-* فقط)
// ============================================================
import type { ReactElement, ButtonHTMLAttributes, ReactNode } from 'react'

export type PButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type PButtonSize = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<PButtonVariant, string> = {
  primary:
    'bg-[var(--pt-primary)] text-[var(--pt-primary-fg)] hover:brightness-110 active:brightness-95 shadow-[0_1px_2px_rgba(0,0,0,.06)]',
  secondary:
    'bg-[var(--pt-secondary)] text-[var(--pt-text)] hover:brightness-97 active:brightness-94 border border-[var(--pt-border)]',
  outline:
    'bg-transparent text-[var(--pt-text)] border border-[var(--pt-border)] hover:bg-[var(--pt-secondary)]',
  ghost: 'bg-transparent text-[var(--pt-text)] hover:bg-[var(--pt-secondary)]',
}

const SIZE_CLASSES: Record<PButtonSize, string> = {
  sm: 'h-10 min-h-10 px-3.5 text-xs gap-1.5',
  md: 'min-h-10 h-10 px-5 text-sm gap-2',
  lg: 'min-h-11 h-11 px-7 text-base gap-2',
}

export function PButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...rest
}: {
  variant?: PButtonVariant
  size?: PButtonSize
  children?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>): ReactElement {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center rounded-[var(--pt-radius)] font-medium transition-all duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)] disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
