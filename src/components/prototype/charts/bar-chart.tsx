'use client'

// ============================================================
// نموذج — BarChart: رسم أعمدة SVG يدوي (Task 9-a مُرتقى)
// RTL: أول فئة يميناً + تدرّجات زوايا علوية دائرية +
// نمو أعمدة متحرك متدرّج التأخير (pt-anim-bar) +
// العمود الأعلى بلون accent + تحويم: تلميح مقيَّد وترتيب شفافية.
// viewBox ثابت 600x260 + width:100% — بلا أي اعتماديات
// ============================================================
import { type ReactElement, useId, useRef, useState } from 'react'
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

/** تنسيق رقم للتلميح — عربي جزائري مع تراجع آمن لـ en-US */
function hintNumber(v: number): string {
  try {
    return v.toLocaleString('ar-DZ')
  } catch {
    return v.toLocaleString('en-US')
  }
}

export function BarChart({
  data,
  height = 260,
}: {
  data: ChartDatum[]
  height?: number
}): ReactElement | null {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
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

  // العمود الأعلى قيمةً يأخذ تدرّج accent (لمسة مقصودة)
  const maxIndex = rtl.reduce((best, d, i) => (d.value > rtl[best].value ? i : best), 0)

  // ---- تحويم: أقرب عمود لموضع المؤشر ----
  const onMove = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0) return
    const vx = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < rtl.length; i++) {
      const cx = padX + slot * i + slot / 2
      const dist = Math.abs(cx - vx)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }
    setHover(best)
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  // موضع تلميح فوق قمة العمود المحوَّم (مقيَّد بالحواف)
  const hovered = hover != null ? rtl[hover] : null
  const hoveredBar =
    hover != null
      ? (() => {
          const h = Math.max(2, (rtl[hover].value / max) * areaH)
          return { cx: padX + slot * hover + slot / 2, y: baseline - h }
        })()
      : null
  const xFrac = hoveredBar ? hoveredBar.cx / W : 0
  const yFrac = hoveredBar ? hoveredBar.y / H : 0
  const tooltipShift = xFrac < 0.18 ? '0%' : xFrac > 0.82 ? '-100%' : '-50%'
  const tooltipAbove = yFrac > 0.22

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="رسم بياني بالأعمدة"
        className="block cursor-crosshair select-none"
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          if (touch) onMove(touch.clientX)
        }}
        onTouchEnd={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`bar-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.62 }} />
          </linearGradient>
          <linearGradient id={`barA-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--pt-accent)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'var(--pt-accent)', stopOpacity: 0.72 }} />
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

        {/* الأعمدة — نمو متدرّج + تفاعل شفافية */}
        {rtl.map((d, i) => {
          const h = Math.max(2, (d.value / max) * areaH)
          const cx = padX + slot * i + slot / 2
          const x = cx - barW / 2
          const y = baseline - h
          const isMax = i === maxIndex
          const dimmed = hover != null && hover !== i
          return (
            <g key={`b-${i}-${d.label}`} style={{ opacity: dimmed ? 0.55 : 1, transition: 'opacity .18s ease' }}>
              <title>{`${d.label}: ${d.value.toLocaleString('en-US')}`}</title>
              <path
                d={topRoundedRect(x, y, barW, h, 6)}
                className="pt-anim-bar"
                style={{
                  fill: isMax ? `url(#barA-${gid})` : `url(#bar-${gid})`,
                  animationDelay: `${i * 60}ms`,
                }}
              />
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

      {/* تلميح التحويم — مقيَّد داخل الحاوية */}
      {hovered && hover != null ? (
        <div
          dir="rtl"
          className="pointer-events-none absolute z-10 rounded-[calc(var(--pt-radius)-4px)] border border-[var(--pt-border)] bg-[var(--pt-surface)] px-2.5 py-1.5 text-xs whitespace-nowrap"
          style={{
            left: `${xFrac * 100}%`,
            top: tooltipAbove ? `calc(${yFrac * 100}% - 10px)` : `calc(${yFrac * 100}% + 14px)`,
            transform: `${tooltipAbove ? 'translateY(-100%)' : ''} translateX(${tooltipShift})`,
            boxShadow: 'var(--pt-shadow)',
          }}
        >
          <span className="font-semibold text-[var(--pt-muted)]">{hovered.label}: </span>
          <span className="font-bold text-[var(--pt-text)]">{hintNumber(hovered.value)}</span>
        </div>
      ) : null}
    </div>
  )
}
