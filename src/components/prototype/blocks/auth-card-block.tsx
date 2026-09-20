'use client'

// ============================================================
// SIVAR — بطاقة الدخول / إنشاء الحساب / استعادة كلمة المرور
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block } from '@/lib/types'
import { Lock } from 'lucide-react'
import { PAlert } from '../ui/p-alert'
import { PBadge } from '../ui/p-badge'
import { PButton } from '../ui/p-button'
import { S, type BlockCtx } from './shared'

const inputClass =
  'w-full min-h-11 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] px-3.5 py-2.5 text-sm text-[var(--pt-text)] placeholder:text-[var(--pt-muted)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

export function AuthCardBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const variant = S(p, 'variant', 'login')
  const title = S(p, 'title', 'تسجيل الدخول')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText', 'دخول')
  const demoHint = S(p, 'demoHint')

  const [done, setDone] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Task 8 — الدخول وإنشاء الحساب كلاهما ينقل إلى لوحة التحكم (وضع تجريبي)
    if (ctx.interactive && ctx.onNavigate && (variant === 'login' || variant === 'signup')) {
      const dash = ctx.schema.pages.find((pg) => pg.type === 'dashboard')
      if (dash) {
        ctx.onNavigate(dash.id)
        return
      }
    }
    setDone(true)
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 md:py-14">
      <div
        className="rounded-[calc(var(--pt-radius)+4px)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-6 md:p-8"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        {/* الترويسة */}
        <div className="mb-6 text-center">
          <span
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--pt-primary) 12%, transparent)', color: 'var(--pt-primary)' }}
          >
            <Lock aria-hidden className="size-6" />
          </span>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-extrabold text-[var(--pt-text)] md:text-2xl">{title}</h1>
            <PBadge tone="primary">بيانات تجريبية</PBadge>
          </div>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[var(--pt-muted)]">{subtitle}</p> : null}
        </div>

        {done ? (
          <PAlert tone="success" title="✓ تم بنجاح">
            {variant === 'forgot'
              ? 'أرسلنا لك رابط الاستعادة — تحقق من بريدك الوارد.'
              : variant === 'signup'
                ? 'تم إنشاء حسابك التجريبي بنجاح. مرحباً بك!'
                : 'تم تسجيل الدخول بنجاح (وضع تجريبي).'}
          </PAlert>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {variant === 'signup' ? (
              <div>
                <label htmlFor="ac-name" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  الاسم الكامل
                </label>
                <input
                  id="ac-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد بن علي"
                  className={inputClass}
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="ac-email" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                البريد الإلكتروني
              </label>
              <input
                id="ac-email"
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className={`${inputClass} text-start`}
              />
            </div>

            {variant !== 'forgot' ? (
              <div>
                <label htmlFor="ac-pass" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  كلمة المرور
                </label>
                <input
                  id="ac-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            ) : null}

            <PButton type="submit" size="lg" className="w-full">
              {buttonText}
            </PButton>
          </form>
        )}

        {demoHint ? (
          <div className="mt-5">
            <PAlert tone="info">{demoHint}</PAlert>
          </div>
        ) : null}
      </div>
    </div>
  )
}
