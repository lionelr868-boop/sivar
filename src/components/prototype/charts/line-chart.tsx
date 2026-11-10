'use client'

// ============================================================
// SIVAR — LineChart: رسم خطي SVG يدوي (Task 9-a مُرتقى)
// Catmull-Rom ناعم + تدرّج مساحة + تدرّج خط رأسي (primary → مفتّح)
// + توهج drop-shadow + رسم متحرك عند الظهور (pt-draw/pt-fade-in)
// + تفاعل تحويم: خط تسديد + نقطة مكبّرة + تلميح مقيَّد بالحواف.
// viewBox ثابت 600x260 + width:100% — RTL: أول فئة يميناً
// ============================================================
import { type ReactElement, useId, useRef, useState } from 'react'
import { compactNum } from './chart-frame'
import type { ChartDatum } from './bar-chart'

export interface CurvePoint {
  x: number
  y: number
}

/** مسار ناعم (Catmull-Rom → Bezier) — مشترك مع رسوم البطل الواقعية */
export function smoothPath(pts: CurvePoint[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p1.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }
  return d
}

/** تنسيق رقم للتلميح — عربي جزائري مع تراجع آمن لـ en-US */
function hintNumber(v: number): string {
  try {
    return v.toLocaleString('ar-DZ')
  } catch {
    return v.toLocaleString('en-US')
  }
}

export function LineChart({
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

  const pts: CurvePoint[] = rtl.map((d, i) => ({
    x: padX + (areaW / (rtl.length - 1)) * i,
    y: padTop + areaH - ((d.value - min + span * 0.06) / (span * 1.12)) * areaH,
  }))

  const line = smoothPath(pts)
  const area = `${line} L${pts[pts.length - 1].x},${baseline} L${pts[0].x},${baseline} Z`

  // ---- تحويم: تحويل موضع المؤشر إلى إحداثي viewBox ثم أقرب نقطة ----
  const onMove = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0) return
    const vx = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < pts.length; i++) {
      const dist = Math.abs(pts[i].x - vx)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }
    setHover(best)
  }

  // موضع التلميح (نِسب من الحاوية — مقيَّد بالحواف)
  const hp = hover != null ? pts[hover] : null
  const xFrac = hp ? hp.x / W : 0
  const yFrac = hp ? hp.y / H : 0
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
        aria-label="رسم بياني خطي"
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
          <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.26 }} />
            <stop offset="100%" style={{ stopColor: 'var(--pt-primary)', stopOpacity: 0.02 }} />
          </linearGradient>
          {/* تدرّج الخط الرأسي — primary يذوب نحو الأبيض (فخم على الفاتح والداكن) */}
          <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--pt-primary)' }} />
            <stop offset="100%" style={{ stopColor: 'color-mix(in srgb, var(--pt-primary) 55%, white)' }} />
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

        {/* المساحة (تظهر بتلاشٍ) + الخط (يُرسم تدريجياً بتوهج) */}
        <path d={area} className="pt-anim-area" style={{ fill: `url(#area-${gid})` }} />
        <path
          d={line}
          className="pt-anim-line"
          pathLength={1}
          style={{
            stroke: `url(#stroke-${gid})`,
            strokeWidth: 3,
            fill: 'none',
            strokeLinecap: 'round',
            strokeDasharray: '1',
            filter: 'drop-shadow(0 6px 10px color-mix(in srgb, var(--pt-primary) 40%, transparent))',
          }}
        />

        {/* خط تسديد متقطع عند النقطة المحوَّمة */}
        {hp ? (
          <line
            x1={hp.x}
            y1={padTop}
            x2={hp.x}
            y2={baseline}
            strokeDasharray="3 5"
            style={{ stroke: 'var(--pt-muted)', strokeWidth: 1, opacity: 0.55 }}
          />
        ) : null}

        {/* النقاط — المحوَّمة تتضخم */}
        {pts.map((p, i) => (
          <g key={`d-${i}`}>
            <title>{`${rtl[i].label}: ${rtl[i].value.toLocaleString('en-US')}`}</title>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 6 : 4}
              style={{
                fill: hover === i ? 'var(--pt-primary)' : 'var(--pt-surface)',
                stroke: 'var(--pt-primary)',
                strokeWidth: hover === i ? 2.5 : 2.5,
                transition: 'r .15s ease, fill .15s ease',
              }}
            />
            {hover === i ? <circle cx={p.x} cy={p.y} r={10} style={{ fill: 'var(--pt-primary)', opacity: 0.14 }} /> : null}
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

      {/* تلميح التحويم — سطح + حد + ظل، مقيَّد داخل الحاوية */}
      {hp && hover != null ? (
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
          <span className="font-semibold text-[var(--pt-muted)]">{rtl[hover].label}: </span>
          <span className="font-bold text-[var(--pt-text)]">{hintNumber(rtl[hover].value)}</span>
        </div>
      ) : null}
    </div>
  )
}
