'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن خطوات العمل: دوائر مرقّمة + خط واصل
// Task 9-a — خلفية صورة للقسم (bgImage + bgOverlay) بنبرة نص متكيّفة
// ============================================================
import type { Block } from '@/lib/types'
import { L, S, iS, SectionHeading, SectionShell, isImageNoOverlay, sectionImageStyle } from './shared'

export function StepsBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const steps = L(p, 'steps')

  const { style: sectionStyle, dark } = sectionImageStyle(p)
  const noOverlay = isImageNoOverlay(p)

  return (
    <SectionShell style={sectionStyle}>
      <SectionHeading title={title} subtitle={subtitle} dark={dark} textShadow={noOverlay} />
      {steps.length > 0 ? (
        <ol className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
          {/* الخط الواصل على الشاشات الكبيرة */}
          <span
            aria-hidden
            className="absolute top-6 hidden h-0.5 w-full md:block"
            style={{ background: 'var(--pt-border)' }}
          />
          {steps.map((step, i) => (
            <li key={i} className="relative flex flex-col items-center text-center">
              <span
                className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold"
                style={{
                  background: i === 0 ? 'var(--pt-primary)' : 'var(--pt-surface)',
                  color: i === 0 ? 'var(--pt-primary-fg)' : 'var(--pt-primary)',
                  border: `2px solid ${i === 0 ? 'var(--pt-primary)' : 'color-mix(in srgb, var(--pt-primary) 35%, var(--pt-border))'}`,
                  boxShadow: 'var(--pt-shadow)',
                }}
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-[var(--pt-text)] md:text-lg">{iS(step, 'title')}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--pt-muted)]">{iS(step, 'description')}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </SectionShell>
  )
}
