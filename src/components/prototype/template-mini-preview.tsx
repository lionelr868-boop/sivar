'use client'

// ============================================================
// نموذج — TemplateMiniPreview: معاينة حيّة مصغّرة لقالب
// Task 2-a-cont — PrototypeRenderer داخل حاوية مصغّرة بـ transform scale
// (غير تفاعلي: pointer-events-none + بلا تنقل)
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { buildTemplateSchema, TEMPLATES } from '@/lib/project/templates'
import { PrototypeRenderer } from './prototype-renderer'

const PREVIEW_WIDTH = 1100
const BASE_SCALE = 0.28

export function TemplateMiniPreview({
  templateId,
  className = '',
}: {
  templateId: string
  className?: string
}): ReactElement {
  const exists = useMemo(() => TEMPLATES.some((t) => t.id === templateId), [templateId])
  const schema = useMemo(() => buildTemplateSchema(templateId), [templateId])
  const landingPageId = useMemo(
    () => schema.pages.find((pg) => pg.type === 'landing')?.id ?? schema.pages[0]?.id ?? '',
    [schema],
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState<number>(BASE_SCALE)

  // قياس عرض الحاوية لملء العرض تماماً ( fallback ثابت 0.28 )
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width
        if (typeof w === 'number' && w > 40) {
          setScale(Math.min(0.7, Math.max(0.12, w / PREVIEW_WIDTH)))
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!exists) {
    return (
      <div
        className={`flex items-center justify-center bg-[#f8fafc] text-[11px] font-medium text-[#94a3b8] ${className}`}
        style={{ aspectRatio: '4 / 3' }}
      >
        معاينة غير متوفرة
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-white ${className}`}
      style={{ aspectRatio: '4 / 3' }}
      aria-hidden
    >
      {/* النموذج المصغّر */}
      <div
        className="pointer-events-none absolute top-0 right-0 origin-top-right select-none"
        style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})` }}
      >
        <PrototypeRenderer schema={schema} pageId={landingPageId} interactive={false} />
      </div>

      {/* تدرّج علوي خفيف */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 18%)' }}
      />
    </div>
  )
}
