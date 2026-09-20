'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن المميزات: شبكة بطاقات بأيقونات مصبوغة
// Task 9-a — خلفية صورة للقسم (bgImage + bgOverlay) بنبرة نص متكيّفة
// ============================================================
import type { Block } from '@/lib/types'
import { ProtoIcon } from '../icon-map'
import { L, S, iS, SectionHeading, SectionShell, isImageNoOverlay, sectionImageStyle } from './shared'

export function FeaturesBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const items = L(p, 'items')
  const colsRaw = S(p, 'columns', '3')
  const cols = colsRaw === '2' ? 2 : colsRaw === '4' ? 4 : 3

  // خلفية صورة القسم (اختيارية) — بلا صورة: السلوك القديم حرفياً
  const { style: sectionStyle, dark } = sectionImageStyle(p)
  const noOverlay = isImageNoOverlay(p)

  const gridClass =
    cols === 2
      ? 'sm:grid-cols-2'
      : cols === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <SectionShell id="features" style={sectionStyle}>
      <SectionHeading title={title} subtitle={subtitle} dark={dark} textShadow={noOverlay} />
      {items.length > 0 ? (
        <div className={`grid grid-cols-1 gap-4 md:gap-6 ${gridClass}`}>
          {items.map((item, i) => (
            <article
              key={i}
              className="group rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--pt-primary)_35%,var(--pt-border))]"
              style={{ boxShadow: 'var(--pt-shadow)' }}
            >
              <span
                className="mb-4 flex size-12 items-center justify-center rounded-[calc(var(--pt-radius)-2px)] transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--pt-primary) 14%, transparent), color-mix(in srgb, var(--pt-accent) 18%, transparent))',
                  color: 'var(--pt-primary)',
                }}
              >
                <ProtoIcon name={iS(item, 'icon', 'sparkles')} className="size-6" />
              </span>
              <h3 className="text-base font-bold text-[var(--pt-text)] md:text-lg">{iS(item, 'title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--pt-muted)]">{iS(item, 'description')}</p>
            </article>
          ))}
        </div>
      ) : null}
    </SectionShell>
  )
}
