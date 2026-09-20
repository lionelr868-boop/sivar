'use client'
import type { ReactElement } from 'react'
import { useState } from 'react'

// ============================================================
// SIVAR — DonutChart: رسم دائري SVG يدوي (Task 9-a مُرتقى)
// شرائح dasharray + إجمالي في المركز + شبكة مفتاح بألوان الهوية +
// تفاعل موحّد: تحويم الشريحة أو صف المفتاح يبرزها (سماكة +23
// والبقية تلفّ 0.55) عبر حالة فهرس مشتركة.
// ============================================================
import { CHART_PALETTE } from './chart-frame'
import type { ChartDatum } from './bar-chart'

const MAX_SLICES = 6

interface Segment {
  label: string
  value: number
  /** نسبة الشريحة من الإجمالي */
  frac: number
  /** النسبة التراكمية بعد هذه الشريحة */
  cum: number
}

export function DonutChart({ data }: { data: ChartDatum[] }): ReactElement | null {
  const [hover, setHover] = useState<number | null>(null)
  const raw: ChartDatum[] = (Array.isArray(data) ? data : [])
    .filter((d) => d && typeof d.label === 'string' && Number.isFinite(Number(d.value)) && Number(d.value) > 0)
    .map((d) => ({ label: d.label, value: Number(d.value) }))

  if (raw.length === 0) return null

  // حد أقصى 6 شرائح — الباقي يُجمع في «أخرى»
  const rows: ChartDatum[] =
    raw.length > MAX_SLICES
      ? [
          ...raw.slice(0, MAX_SLICES - 1),
          { label: 'أخرى', value: raw.slice(MAX_SLICES - 1).reduce((a, d) => a + d.value, 0) },
        ]
      : raw

  const total = rows.reduce((a, d) => a + d.value, 0)
  const R = 60
  const C = 2 * Math.PI * R

  // شرائح مع المواضع التراكمية (حساب نقي بلا تعديل جانبي)
  const segments: Segment[] = rows.reduce<Segment[]>((list, d) => {
    const frac = d.value / total
    const cum = list.length > 0 ? list[list.length - 1].cum + frac : frac
    return [...list, { label: d.label, value: d.value, frac, cum }]
  }, [])

  const compactTotal = total >= 1000 ? total.toLocaleString('en-US') : String(total)

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      {/* الدائرة */}
      <div className="relative size-40 shrink-0 md:size-44">
        <svg viewBox="0 0 160 160" className="size-full -rotate-90" role="img" aria-label="رسم بياني دائري">
          <circle cx="80" cy="80" r={R} style={{ fill: 'none', stroke: 'var(--pt-border)', strokeWidth: 20 }} />
          {segments.map((seg, i) => {
            const len = seg.frac * C
            const offset = -(seg.cum - seg.frac) * C
            const isHover = hover === i
            const dimmed = hover != null && hover !== i
            return (
              <g
                key={`s-${i}-${seg.label}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${seg.label}: ${seg.value.toLocaleString('en-US')} (${Math.round(seg.frac * 100)}%)`}</title>
                <circle
                  cx="80"
                  cy="80"
                  r={R}
                  style={{
                    fill: 'none',
                    stroke: CHART_PALETTE[i % CHART_PALETTE.length],
                    strokeWidth: isHover ? 23 : 20,
                    strokeDasharray: `${len} ${C - len}`,
                    strokeDashoffset: offset,
                    strokeLinecap: 'butt',
                    opacity: dimmed ? 0.55 : 1,
                    transition: 'stroke-width .18s ease, opacity .18s ease',
                  }}
                />
              </g>
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-extrabold text-[var(--pt-text)] md:text-2xl">{compactTotal}</span>
          <span className="mt-0.5 text-[11px] font-medium text-[var(--pt-muted)]">الإجمالي</span>
        </div>
      </div>

      {/* المفتاح — تحويم الصف يبرز شريحته */}
      <ul className="grid w-full grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
        {segments.map((seg, i) => {
          const isHover = hover === i
          const dimmed = hover != null && hover !== i
          return (
            <li
              key={`l-${i}-${seg.label}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={`flex cursor-pointer items-center gap-2 rounded-[calc(var(--pt-radius)-6px)] px-1.5 py-0.5 text-sm transition-opacity duration-150 ${dimmed ? 'opacity-55' : 'opacity-100'}`}
              style={isHover ? { background: 'var(--pt-secondary)' } : undefined}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full transition-transform duration-150"
                style={{ background: CHART_PALETTE[i % CHART_PALETTE.length], transform: isHover ? 'scale(1.35)' : undefined }}
              />
              <span className="min-w-0 flex-1 truncate text-[var(--pt-text)]">{seg.label}</span>
              <span className="shrink-0 font-semibold text-[var(--pt-text)]">{Math.round(seg.frac * 100)}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
