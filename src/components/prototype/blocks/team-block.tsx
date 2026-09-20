'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن الفريق: بطاقات أعضاء بصور (مرفوعة أو رمزية)
// Task 9-a — خلفية صورة للقسم + صورة عضو دائرية اختيارية
// (image داخل كل عنصر → تحل محل أفاتار الحروف)
// ============================================================
import type { Block } from '@/lib/types'
import { PAvatar } from '../ui/p-avatar'
import { L, S, iS, SectionHeading, SectionShell, isImageNoOverlay, sectionImageStyle } from './shared'

export function TeamBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const items = L(p, 'items')

  const { style: sectionStyle, dark } = sectionImageStyle(p)
  const noOverlay = isImageNoOverlay(p)

  return (
    <SectionShell style={sectionStyle}>
      <SectionHeading title={title} dark={dark} textShadow={noOverlay} />
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((item, i) => {
            const name = iS(item, 'name')
            const image = iS(item, 'image')
            return (
            <article
              key={i}
              className="flex flex-col items-center rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-6 text-center transition-all duration-200 hover:-translate-y-1"
              style={{ boxShadow: 'var(--pt-shadow)' }}
            >
              <span
                aria-hidden
                className="mb-4 flex size-20 items-center justify-center rounded-full p-1"
                style={{ background: 'color-mix(in srgb, var(--pt-primary) 12%, transparent)' }}
              >
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <PAvatar name={name} size={64} />
                )}
              </span>
              <h3 className="text-sm font-bold text-[var(--pt-text)] md:text-base">{name}</h3>
              <p className="mt-1 text-xs text-[var(--pt-muted)] md:text-sm">{iS(item, 'role')}</p>
            </article>
          )
          })}
        </div>
      ) : null}
    </SectionShell>
  )
}
