'use client'

// ============================================================
// نموذج — مكوّن نموذج التواصل: اسم + بريد + رسالة → نجاح
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block } from '@/lib/types'
import { Send } from 'lucide-react'
import { PAlert } from '../ui/p-alert'
import { PButton } from '../ui/p-button'
import { S, SectionHeading, SectionShell } from './shared'

const inputClass =
  'w-full min-h-11 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] px-3.5 py-2.5 text-sm text-[var(--pt-text)] placeholder:text-[var(--pt-muted)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

export function ContactFormBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText', 'إرسال الرسالة')
  const successText = S(p, 'successText', 'تم إرسال رسالتك بنجاح.')

  const [sent, setSent] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <SectionShell>
      <div className="mx-auto max-w-xl">
        <SectionHeading title={title} subtitle={subtitle} />
        <div
          className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-5 md:p-7"
          style={{ boxShadow: 'var(--pt-shadow)' }}
        >
          {sent ? (
            <PAlert tone="success" title="✓ تم الإرسال">
              {successText}
            </PAlert>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="cf-name" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  الاسم الكامل
                </label>
                <input
                  id="cf-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد بن علي"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="cf-email" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  البريد الإلكتروني
                </label>
                <input
                  id="cf-email"
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className={`${inputClass} text-start`}
                />
              </div>
              <div>
                <label htmlFor="cf-msg" className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  الرسالة
                </label>
                <textarea
                  id="cf-msg"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className={`${inputClass} resize-y`}
                />
              </div>
              <PButton type="submit" size="lg" className="w-full">
                <Send aria-hidden className="size-4" />
                {buttonText}
              </PButton>
            </form>
          )}
        </div>
      </div>
    </SectionShell>
  )
}
