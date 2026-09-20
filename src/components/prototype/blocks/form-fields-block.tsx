'use client'

// ============================================================
// نموذج — مكوّن نموذج حقول ديناميكي + حالة نجاح
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block } from '@/lib/types'
import { PAlert } from '../ui/p-alert'
import { PButton } from '../ui/p-button'
import { L, S, iB, iS, type BlockCtx } from './shared'

type FieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox'

const FIELD_TYPES: FieldType[] = ['text', 'email', 'password', 'number', 'select', 'textarea', 'checkbox']

const inputClass =
  'w-full min-h-11 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] px-3.5 py-2.5 text-sm text-[var(--pt-text)] placeholder:text-[var(--pt-muted)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

function optionsOf(item: Record<string, unknown>): string[] {
  const v = item['options']
  if (Array.isArray(v)) return v.filter((o): o is string => typeof o === 'string' && o.trim() !== '')
  if (typeof v === 'string')
    return v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  return []
}

export function FormFieldsBlock({ block }: { block: Block; ctx?: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const submitText = S(p, 'submitText', 'إرسال')
  const successText = S(p, 'successText', 'تم إرسال بياناتك بنجاح.')

  const fields = L(p, 'fields').map((f) => {
    const rawType = iS(f, 'type', 'text')
    const type: FieldType = (FIELD_TYPES as string[]).includes(rawType) ? (rawType as FieldType) : 'text'
    return {
      label: iS(f, 'label'),
      type,
      required: iB(f, 'required'),
      placeholder: iS(f, 'placeholder'),
      options: optionsOf(f),
    }
  })

  const [sent, setSent] = useState(false)
  const [checks, setChecks] = useState<Record<number, boolean>>({})

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {title || subtitle ? (
        <div className="mb-5">
          {title ? <h2 className="text-xl font-extrabold text-[var(--pt-text)] md:text-2xl">{title}</h2> : null}
          {subtitle ? <p className="mt-1 text-sm text-[var(--pt-muted)]">{subtitle}</p> : null}
        </div>
      ) : null}

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
            {fields.map((f, i) => {
              const id = `ff-${block.id}-${i}`
              if (f.type === 'checkbox') {
                return (
                  <label key={i} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--pt-text)]">
                    <input
                      id={id}
                      type="checkbox"
                      checked={checks[i] ?? false}
                      onChange={(e) => setChecks((prev) => ({ ...prev, [i]: e.target.checked }))}
                      className="size-4.5 shrink-0 cursor-pointer accent-[var(--pt-primary)]"
                    />
                    <span>
                      {f.label}
                      {f.required ? <span className="ms-0.5 text-[var(--pt-primary)]">*</span> : null}
                    </span>
                  </label>
                )
              }
              return (
                <div key={i}>
                  <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                    {f.label}
                    {f.required ? <span className="ms-0.5 text-[var(--pt-primary)]">*</span> : null}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea
                      id={id}
                      rows={4}
                      required={f.required}
                      placeholder={f.placeholder}
                      className={`${inputClass} resize-y`}
                    />
                  ) : f.type === 'select' ? (
                    <select id={id} required={f.required} className={`${inputClass} cursor-pointer`} defaultValue="">
                      <option value="" disabled>
                        {f.placeholder || 'اختر...'}
                      </option>
                      {f.options.map((o, j) => (
                        <option key={j} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type={f.type}
                      required={f.required}
                      placeholder={f.placeholder}
                      dir={f.type === 'email' || f.type === 'number' ? undefined : 'auto'}
                      className={`${inputClass} ${f.type === 'email' ? 'text-start' : ''}`}
                    />
                  )}
                </div>
              )
            })}
            {fields.length > 0 ? (
              <PButton type="submit" size="lg" className="w-full sm:w-auto">
                {submitText}
              </PButton>
            ) : null}
          </form>
        )}
      </div>
    </div>
  )
}
