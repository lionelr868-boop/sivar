'use client'

// ============================================================
// SIVAR — نموذج الإعدادات: أقسام + حقول + مفاتيح تشغيل + حفظ
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block } from '@/lib/types'
import { PAlert } from '../ui/p-alert'
import { PButton } from '../ui/p-button'
import { L, S, iS } from './shared'

type SettingFieldType = 'text' | 'switch' | 'select' | 'password'

const FIELD_TYPES: SettingFieldType[] = ['text', 'switch', 'select', 'password']

const inputClass =
  'w-full min-h-11 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] px-3.5 py-2.5 text-sm text-[var(--pt-text)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

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

export function SettingsFormBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title', 'الإعدادات')
  const sections = L(p, 'sections').map((sec) => ({
    title: iS(sec, 'title'),
    fields: L(sec, 'fields').map((f) => {
      const rawType = iS(f, 'type', 'text')
      const type: SettingFieldType = (FIELD_TYPES as string[]).includes(rawType) ? (rawType as SettingFieldType) : 'text'
      return {
        label: iS(f, 'label'),
        type,
        value: iS(f, 'value'),
        hint: iS(f, 'hint'),
        options: optionsOf(f),
      }
    }),
  }))

  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    sections.forEach((sec, si) =>
      sec.fields.forEach((f, fi) => {
        if (f.type === 'switch') init[`${si}-${fi}`] = f.value === 'true'
      }),
    )
    return init
  })

  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaved(true)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {title ? <h1 className="mb-5 text-xl font-extrabold text-[var(--pt-text)] md:text-2xl">{title}</h1> : null}

      {saved ? (
        <div className="mb-4">
          <PAlert tone="success" title="✓ تم الحفظ">
            حُفظت التغييرات بنجاح وستُطبَّق فوراً على مشروعك.
          </PAlert>
        </div>
      ) : null}

      <form onSubmit={save} className="space-y-5">
        {sections.map((sec, si) => (
          <section
            key={si}
            className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
            style={{ boxShadow: 'var(--pt-shadow)' }}
          >
            <h2 className="border-b border-[var(--pt-border)] px-5 py-3.5 text-sm font-bold text-[var(--pt-text)]">
              {sec.title}
            </h2>
            <div className="space-y-4 p-5">
              {sec.fields.map((f, fi) => {
                const key = `${si}-${fi}`
                if (f.type === 'switch') {
                  const on = toggles[key] ?? false
                  return (
                    <div key={fi} className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--pt-text)]">{f.label}</p>
                        {f.hint ? <p className="mt-0.5 text-xs text-[var(--pt-muted)]">{f.hint}</p> : null}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={f.label}
                        onClick={() => setToggles((prev) => ({ ...prev, [key]: !on }))}
                        className="relative h-6.5 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
                        style={{ background: on ? 'var(--pt-primary)' : 'var(--pt-border)' }}
                      >
                        <span
                          aria-hidden
                          className="absolute top-1 size-4.5 rounded-full bg-white shadow-sm transition-all duration-200"
                          style={{ insetInlineStart: on ? 'calc(100% - 1.25rem)' : '0.25rem' }}
                        />
                      </button>
                    </div>
                  )
                }
                if (f.type === 'select') {
                  return (
                    <div key={fi}>
                      <label htmlFor={`sf-${key}`} className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                        {f.label}
                      </label>
                      <select id={`sf-${key}`} defaultValue={f.value} className={`${inputClass} cursor-pointer`}>
                        {f.options.map((o, j) => (
                          <option key={j} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      {f.hint ? <p className="mt-1 text-xs text-[var(--pt-muted)]">{f.hint}</p> : null}
                    </div>
                  )
                }
                return (
                  <div key={fi}>
                    <label htmlFor={`sf-${key}`} className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                      {f.label}
                    </label>
                    <input
                      id={`sf-${key}`}
                      type={f.type === 'password' ? 'password' : 'text'}
                      defaultValue={f.value}
                      placeholder={f.type === 'password' ? '••••••••' : ''}
                      className={inputClass}
                    />
                    {f.hint ? <p className="mt-1 text-xs text-[var(--pt-muted)]">{f.hint}</p> : null}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <div className="flex items-center justify-end gap-3">
          <PButton type="submit" size="lg">
            حفظ التغييرات
          </PButton>
        </div>
      </form>
    </div>
  )
}
