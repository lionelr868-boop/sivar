'use client'

// ============================================================
// نموذج — BarChart: رسم أعمدة SVG يدوي (RTL: أول فئة يميناً)
// viewBox ثابت 600x260 + width:100% — بلا أي اعتماديات
// ============================================================
import { type ReactElement, useId } from 'react'
import { compactNum } from './chart-frame'

export interface ChartDatum {
  label: string
  value: number
}

/** مستطيل بزوايا علوية دائرية (path) */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h))
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

export function BarChart({
  data,
  height = 260,
}: {
  data: ChartDatum[]
  height?: number
}): ReactElement | null {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const W = 600
  const H = Math.max(200, height)
  const padX = 40
  const padTop = 16
  const padBottom = 38

  const rows: ChartDatum[] = (Array.isArray(data) ? data : [])
    .filter((d) => d && typeof d.label === 'string' && Number.isFinite(Number(d.value)))
    .map((d) => ({ label: d.label, value: Number(d.value) }))

  if (rows.length === 0) return null

  // RTL: أول فئة في أقصى اليمين
  const rtl = [...rows].reverse()
  const max = Math.max(...rtl.map((d) => d.value), 1)
  const areaW = W - padX * 2
  const areaH = H - padTop - padBottom
  const baseline = padTop + areaH
  const slot = areaW / rtl.length
  const barW = Math.min(slot * 0.58, 56)
  const skipLabels = rtl.length > 8

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="رسم بياني بالأعمدة"
      className="block select-none"
    >
      <defs>
        <linearGradient id={`bar-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.62 }} />
        </linearGradient>
      </defs>

      {/* خطوط الشبكة + قيم المحور */}
      {gridLines.map((f) => {
        const y = baseline - areaH * f
        const val = max * f
        return (
          <g key={`g-${f}`}>
            <line x1={padX} y1={y} x2={W - padX} y2={y} style={{ stroke: 'var(--pt-border)', strokeWidth: 1 }} strokeDasharray={f === 0 ? undefined : '4 6'} />
            <text x={W - padX + 8} y={y + 3.5} textAnchor="start" style={{ fill: 'var(--pt-muted)', fontSize: 10 }}>
              {compactNum(val)}
            </text>
          </g>
        )
      })}

      {/* الأعمدة */}
      {rtl.map((d, i) => {
        const h = Math.max(2, (d.value / max) * areaH)
        const cx = padX + slot * i + slot / 2
        const x = cx - barW / 2
        const y = baseline - h
        return (
          <g key={`b-${i}-${d.label}`} className="transition-opacity duration-150 hover:opacity-75">
            <title>{`${d.label}: ${d.value.toLocaleString('en-US')}`}</title>
            <path d={topRoundedRect(x, y, barW, h, 6)} style={{ fill: `url(#bar-${gid})` }} />
          </g>
        )
      })}

      {/* تسميات المحور السيني */}
      {rtl.map((d, i) => {
        if (skipLabels && i % 2 === 1) return null
        const cx = padX + slot * i + slot / 2
        return (
          <text key={`x-${i}-${d.label}`} x={cx} y={H - 12} textAnchor="middle" style={{ fill: 'var(--pt-muted)', fontSize: 10.5 }}>
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
