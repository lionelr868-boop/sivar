'use client'

// ============================================================
// SIVAR — التقويم الشهري: شبكة أيام + أحداث + تنقّل تجريبي
// ============================================================
import { type ReactElement, useState } from 'react'
import type { Block } from '@/lib/types'
import { ARABIC_DAYS, ARABIC_MONTHS } from '@/lib/content/mock-data'
import { L, S, iN, iS } from './shared'

/** رؤوس الأيام تبدأ من الأحد (RTL: الأحد في أقصى اليمين) */
const WEEKDAYS: string[] = [...ARABIC_DAYS.slice(6), ...ARABIC_DAYS.slice(0, 6)]

const DAYS_IN_MONTH = 30
const TODAY = 15

function parseMonth(monthStr: string): { index: number; year: number } {
  const clean = monthStr.trim()
  const idx = ARABIC_MONTHS.findIndex((m) => clean.startsWith(m))
  const yearMatch = /\d{4}/.exec(clean)
  return { index: idx >= 0 ? idx : 11, year: yearMatch ? Number(yearMatch[0]) : 2024 }
}

export function CalendarBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const events = L(p, 'events').map((e) => ({ day: iN(e, 'day'), label: iS(e, 'label') }))

  const initial = parseMonth(S(p, 'month', 'ديسمبر 2024'))
  const [monthIndex, setMonthIndex] = useState(initial.index)
  const [year, setYear] = useState(initial.year)

  const eventByDay = new Map<number, string>()
  for (const e of events) if (e.day >= 1 && e.day <= DAYS_IN_MONTH) eventByDay.set(e.day, e.label)

  const prev = () => {
    if (monthIndex === 0) {
      setMonthIndex(11)
      setYear((y) => y - 1)
    } else setMonthIndex((m) => m - 1)
  }
  const next = () => {
    if (monthIndex === 11) {
      setMonthIndex(0)
      setYear((y) => y + 1)
    } else setMonthIndex((m) => m + 1)
  }

  const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1)

  return (
    <div
      className="mx-auto w-full max-w-xl rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
      style={{ boxShadow: 'var(--pt-shadow)' }}
    >
      {/* الترويسة + أزرار التنقل */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--pt-border)] px-4 py-3.5 md:px-5">
        <div className="min-w-0">
          {title ? <h2 className="truncate text-sm font-bold text-[var(--pt-text)]">{title}</h2> : null}
          <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--pt-primary)' }}>
            {ARABIC_MONTHS[monthIndex]} {year}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={prev}
            aria-label="الشهر السابق"
            className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] text-sm text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="الشهر التالي"
            className="flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] text-sm text-[var(--pt-text)] transition-colors duration-150 hover:bg-[var(--pt-secondary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="p-4 md:p-5">
        {/* رؤوس الأيام */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] font-bold text-[var(--pt-muted)]">
              {d}
            </div>
          ))}
        </div>

        {/* شبكة الأيام */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const ev = eventByDay.get(day)
            const isToday = day === TODAY
            return (
              <div
                key={day}
                title={ev ?? undefined}
                className={`relative flex min-h-11 cursor-default flex-col items-center justify-center rounded-[calc(var(--pt-radius)-4px)] text-sm transition-colors duration-100 ${
                  ev ? 'font-bold' : 'font-medium'
                }`}
                style={{
                  background: ev ? 'color-mix(in srgb, var(--pt-primary) 10%, transparent)' : 'var(--pt-bg)',
                  color: ev ? 'var(--pt-primary)' : 'var(--pt-text)',
                  border: isToday
                    ? '2px solid var(--pt-primary)'
                    : '1px solid color-mix(in srgb, var(--pt-border) 60%, transparent)',
                }}
              >
                {day}
                {ev ? (
                  <span
                    aria-hidden
                    className="absolute bottom-1.5 size-1.5 rounded-full"
                    style={{ background: 'var(--pt-primary)' }}
                  />
                ) : null}
              </div>
            )
          })}
        </div>

        {/* قائمة الأحداث */}
        {events.length > 0 ? (
          <ul className="mt-4 space-y-2 border-t border-[var(--pt-border)] pt-4">
            {events.map((e, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: 'var(--pt-secondary)', color: 'var(--pt-primary)' }}
                >
                  {e.day}
                </span>
                <span className="min-w-0 flex-1 truncate text-[var(--pt-text)]">{e.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
