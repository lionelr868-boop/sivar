'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — بطاقة الملف الشخصي: صورة رمزية + معلومات تواصل
// ============================================================
import type { Block } from '@/lib/types'
import { Mail, Phone } from 'lucide-react'
import { PAvatar } from '../ui/p-avatar'
import { S } from './shared'

export function ProfileCardBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const name = S(p, 'name')
  const role = S(p, 'role')
  const email = S(p, 'email')
  const phone = S(p, 'phone')
  const bio = S(p, 'bio')

  return (
    <div
      className="mx-auto w-full max-w-md overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
      style={{ boxShadow: 'var(--pt-shadow)' }}
    >
      {/* رأس متدرّج */}
      <div className="h-24" style={{ background: 'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))' }} />

      <div className="px-5 pb-6 md:px-6">
        <span
          className="-mt-10 mb-4 flex rounded-full border-4 border-[var(--pt-surface)]"
          style={{ display: 'inline-flex' }}
        >
          <PAvatar name={name} size={80} />
        </span>

        <h2 className="text-lg font-extrabold text-[var(--pt-text)] md:text-xl">{name}</h2>
        {role ? (
          <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--pt-primary)' }}>
            {role}
          </p>
        ) : null}
        {bio ? <p className="mt-3 text-sm leading-relaxed text-[var(--pt-muted)]">{bio}</p> : null}

        <ul className="mt-5 space-y-2.5 border-t border-[var(--pt-border)] pt-5">
          {email ? (
            <li className="flex items-center gap-3 text-sm text-[var(--pt-text)]">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-4px)]"
                style={{ background: 'color-mix(in srgb, var(--pt-primary) 10%, transparent)', color: 'var(--pt-primary)' }}
              >
                <Mail aria-hidden className="size-4" />
              </span>
              <span dir="ltr" className="min-w-0 flex-1 truncate text-start">
                {email}
              </span>
            </li>
          ) : null}
          {phone ? (
            <li className="flex items-center gap-3 text-sm text-[var(--pt-text)]">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-4px)]"
                style={{ background: 'color-mix(in srgb, var(--pt-primary) 10%, transparent)', color: 'var(--pt-primary)' }}
              >
                <Phone aria-hidden className="size-4" />
              </span>
              <span dir="ltr" className="min-w-0 flex-1 truncate text-start">
                {phone}
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
