'use client'

// ============================================================
// نموذج — LineChart: رسم خطي SVG يدوي (منحنى ناعم + تدرّج مساحة)
// viewBox ثابت 600x260 + width:100% — RTL: أول فئة يميناً
// ============================================================
import { type ReactElement, useId } from 'react'
import { compactNum } from './chart-frame'
import type { ChartDatum } from './bar-chart'

interface Point {
  x: number
  y: number
}

/** مسار ناعم (Catmull-Rom → Bezier) */
function smoothPath(pts: Point[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

export function LineChart({
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

  if (rows.length < 2) return null

  // RTL: أول فئة في أقصى اليمين
  const rtl = [...rows].reverse()
  const values = rtl.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || max || 1
  const areaW = W - padX * 2
  const areaH = H - padTop - padBottom
  const baseline = padTop + areaH

  const pts: Point[] = rtl.map((d, i) => ({
    x: padX + (areaW / (rtl.length - 1)) * i,
    y: padTop + areaH - ((d.value - min + span * 0.06) / (span * 1.12)) * areaH,
  }))

  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="رسم بياني خطي"
      className="block select-none"
    >
      <defs>
        <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.26 }} />
          <stop offset="100%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.02 }} />
        </linearGradient>
      </defs>

      {/* خطوط الشبكة */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = baseline - areaH * f
        return (
          <g key={`g-${f}`}>
            <line x1={padX} y1={y} x2={W - padX} y2={y} style={{ stroke: 'var(--pt-border)', strokeWidth: 1 }} strokeDasharray={f === 0 ? undefined : '4 6'} />
            <text x={W - padX + 8} y={y + 3.5} textAnchor="start" style={{ fill: 'var(--pt-muted)', fontSize: 10 }}>
              {compactNum(min + span * f)}
            </text>
          </g>
        )
      })}

      {/* المساحة + الخط */}
      <path d={area} style={{ fill: `url(#area-${gid})` }} />
      <path d={line} style={{ stroke: 'var(--pt-primary)', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' }} />

      {/* النقاط */}
      {pts.map((p, i) => (
        <g key={`d-${i}`} className="transition-opacity duration-150 hover:opacity-70">
          <title>{`${rtl[i].label}: ${rtl[i].value.toLocaleString('en-US')}`}</title>
          <circle cx={p.x} cy={p.y} r={4} style={{ fill: 'var(--pt-surface)', stroke: 'var(--pt-primary)', strokeWidth: 2.5 }} />
        </g>
      ))}

      {/* تسميات المحور السيني */}
      {rtl.map((d, i) => {
        if (rtl.length > 8 && i % 2 === 1) return null
        return (
          <text
            key={`x-${i}-${d.label}`}
            x={pts[i].x}
            y={H - 12}
            textAnchor="middle"
            style={{ fill: 'var(--pt-muted)', fontSize: 10.5 }}
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}
