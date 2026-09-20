'use client'

// ============================================================
// نموذج — حالات العرض: فارغ / تحميل / خطأ (رسومات SVG بسيطة)
// ============================================================
import type { ReactElement, ReactNode } from 'react'
import { ProtoIcon } from '../icon-map'
import { PButton } from './p-button'

function StateShell({ children, className = '' }: { children: ReactNode; className?: string }): ReactElement {
  return (
    <div className={`flex items-center justify-center px-4 py-10 ${className}`}>
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  )
}

// ---------- PEmptyState ----------

export function PEmptyState({
  title,
  subtitle,
  actionText,
  icon,
  onAction,
  className = '',
}: {
  title: string
  subtitle?: string
  actionText?: string
  icon?: string
  onAction?: () => void
  className?: string
}): ReactElement {
  return (
    <StateShell className={className}>
      {/* رسم توضيحي بسيط */}
      <div
        aria-hidden
        className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, var(--pt-primary) 9%, transparent)' }}
      >
        <svg viewBox="0 0 96 96" className="size-16" fill="none">
          <rect x="26" y="22" width="44" height="40" rx="6" style={{ stroke: 'var(--pt-primary)', strokeWidth: 2.5, opacity: 0.85 }} />
          <rect x="26" y="64" width="44" height="12" rx="4" style={{ stroke: 'var(--pt-primary)', strokeWidth: 2.5, opacity: 0.4 }} />
          <circle cx="48" cy="18" r="4" style={{ fill: 'var(--pt-accent)' }} />
          <path d="M36 36h24M36 44h16" style={{ stroke: 'var(--pt-primary)', strokeWidth: 2.5, strokeLinecap: 'round', opacity: 0.55 }} />
          <circle cx="64" cy="50" r="6" style={{ fill: 'color-mix(in srgb, var(--pt-accent) 35%, transparent)' }} />
          <path d="M20 78l56-14" style={{ stroke: 'var(--pt-accent)', strokeWidth: 2, strokeLinecap: 'round', strokeDasharray: '3 5', opacity: 0.7 }} />
        </svg>
      </div>

      {icon ? (
        <span
          aria-hidden
          className="mx-auto mb-3 flex size-11 items-center justify-center rounded-[var(--pt-radius)]"
          style={{ background: 'color-mix(in srgb, var(--pt-primary) 10%, transparent)', color: 'var(--pt-primary)' }}
        >
          <ProtoIcon name={icon} className="size-5" />
        </span>
      ) : null}

      <h3 className="text-lg font-bold text-[var(--pt-text)]">{title}</h3>
      {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-[var(--pt-muted)]">{subtitle}</p> : null}
      {actionText ? (
        <PButton variant="primary" size="md" className="mt-5" onClick={onAction}>
          {actionText}
        </PButton>
      ) : null}
    </StateShell>
  )
}

// ---------- PLoadingState ----------

export function PLoadingState({ label, className = '' }: { label: string; className?: string }): ReactElement {
  return (
    <StateShell className={className}>
      <div className="mx-auto mb-5 flex size-20 items-center justify-center">
        <svg viewBox="0 0 64 64" className="size-16 animate-spin" style={{ animationDuration: '1.2s' }}>
          <circle cx="32" cy="32" r="26" style={{ stroke: 'var(--pt-border)', strokeWidth: 6, fill: 'none' }} />
          <path
            d="M32 6a26 26 0 0 1 26 26"
            style={{ stroke: 'var(--pt-primary)', strokeWidth: 6, fill: 'none', strokeLinecap: 'round' }}
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--pt-text)]">{label}</p>
      <div aria-hidden className="mx-auto mt-5 max-w-56 space-y-2.5">
        {[100, 78, 88].map((w, i) => (
          <div
            key={i}
            className="h-2.5 animate-pulse rounded-full bg-[var(--pt-secondary)]"
            style={{ width: `${w}%`, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </StateShell>
  )
}

// ---------- PErrorState ----------

export function PErrorState({
  title,
  subtitle,
  actionText,
  onAction,
  className = '',
}: {
  title: string
  subtitle?: string
  actionText?: string
  onAction?: () => void
  className?: string
}): ReactElement {
  return (
    <StateShell className={className}>
      <div
        aria-hidden
        className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, #dc2626 9%, transparent)' }}
      >
        <svg viewBox="0 0 96 96" className="size-16" fill="none">
          <path
            d="M48 24l28 46H20l28-46z"
            style={{ stroke: '#dc2626', strokeWidth: 4, strokeLinejoin: 'round', fill: 'color-mix(in srgb, #dc2626 10%, transparent)' }}
          />
          <path d="M48 40v14" style={{ stroke: '#dc2626', strokeWidth: 4, strokeLinecap: 'round' }} />
          <circle cx="48" cy="62" r="2.6" style={{ fill: '#dc2626' }} />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[var(--pt-text)]">{title}</h3>
      {subtitle ? <p className="mt-1.5 text-sm leading-relaxed text-[var(--pt-muted)]">{subtitle}</p> : null}
      {actionText ? (
        <PButton variant="primary" size="md" className="mt-5" onClick={onAction}>
          {actionText}
        </PButton>
      ) : null}
    </StateShell>
  )
}
