'use client'

// ============================================================
// SIVAR — مكوّن المعرض: بطاقات بصور (مرفوعة أو رمزية) + سعر وشارة
// Task 9-a — خلفية صورة للقسم + صور عنصر حقيقية اختيارية
// (image داخل كل عنصر → تُعرض مكان الصورة الرمزية)
// ============================================================
import type { ReactElement, CSSProperties } from 'react'
import type { Block } from '@/lib/types'
import { num } from '@/lib/content/mock-data'
import { PBadge } from '../ui/p-badge'
import { L, S, iN, iS, SectionHeading, SectionShell, isImageNoOverlay, sectionImageStyle } from './shared'

const THUMB_GRADIENTS: CSSProperties[] = [
  { background: 'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))' },
  { background: 'linear-gradient(135deg, var(--pt-accent), color-mix(in srgb, var(--pt-primary) 55%, #db2777))' },
  { background: 'linear-gradient(135deg, color-mix(in srgb, var(--pt-primary) 70%, #16121f), var(--pt-primary))' },
  { background: 'linear-gradient(135deg, var(--pt-accent), color-mix(in srgb, var(--pt-primary) 45%, #0d9488))' },
]

export function GalleryBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const variant = S(p, 'variant', 'products')
  const items = L(p, 'items')

  const { style: sectionStyle, dark } = sectionImageStyle(p)
  const noOverlay = isImageNoOverlay(p)

  return (
    <SectionShell style={sectionStyle}>
      <SectionHeading title={title} subtitle={subtitle} dark={dark} textShadow={noOverlay} />
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {items.map((item, i) => {
            const itemTitle = iS(item, 'title')
            const price = iN(item, 'price')
            const badge = iS(item, 'badge')
            const image = iS(item, 'image')
            const tone =
              badge === 'جديد' || badge === 'قريباً'
                ? 'info'
                : badge === 'تخفيض' || badge === 'الأكثر مبيعاً' || badge === 'الأكثر طلباً'
                  ? 'warning'
                  : 'primary'
            return (
              <article
                key={i}
                className="group overflow-hidden rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] transition-all duration-200 hover:-translate-y-1"
                style={{ boxShadow: 'var(--pt-shadow)' }}
              >
                {/* صورة العنصر: مرفوعة حقيقية أو رمزية متدرّجة بالحرف الأول */}
                {image ? (
                  <div className="relative h-40 overflow-hidden md:h-44">
                    <img
                      src={image}
                      alt={itemTitle}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {badge ? (
                      <span className="absolute top-3 start-3">
                        <PBadge tone={tone as 'info' | 'warning' | 'primary'} className="backdrop-blur-sm">
                          {badge}
                        </PBadge>
                      </span>
                    ) : null}
                  </div>
                ) : (
                <div
                  className="relative flex h-40 items-center justify-center overflow-hidden md:h-44"
                  style={THUMB_GRADIENTS[i % THUMB_GRADIENTS.length]}
                  role="img"
                  aria-label={`صورة رمزية لـ ${itemTitle}`}
                >
                  <span
                    aria-hidden
                    className="absolute -top-6 -start-6 size-24 rounded-full opacity-20"
                    style={{ background: '#ffffff' }}
                  />
                  <span aria-hidden className="absolute bottom-3 end-4 size-2.5 rounded-full bg-white/50" />
                  <span aria-hidden className="absolute bottom-6 end-9 size-1.5 rounded-full bg-white/35" />
                  <span className="text-5xl font-extrabold text-white/95 drop-shadow-sm md:text-6xl">
                    {itemTitle.trim().charAt(0) || '؟'}
                  </span>
                  {badge ? (
                    <span className="absolute top-3 start-3">
                      <PBadge tone={tone as 'info' | 'warning' | 'primary'} className="backdrop-blur-sm">
                        {badge}
                      </PBadge>
                    </span>
                  ) : null}
                </div>
                )}

                <div className="p-4 md:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-[var(--pt-text)] transition-colors duration-150 group-hover:text-[var(--pt-primary)]">
                      {itemTitle}
                    </h3>
                    {price > 0 ? (
                      <p className="shrink-0 text-base font-extrabold" style={{ color: 'var(--pt-primary)' }}>
                        {num(price)} <span className="text-xs font-medium text-[var(--pt-muted)]">دج</span>
                      </p>
                    ) : null}
                  </div>
                  {iS(item, 'description') ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--pt-muted)]">{iS(item, 'description')}</p>
                  ) : null}
                  {variant === 'properties' ? (
                    <p className="mt-3 text-xs font-medium text-[var(--pt-muted)]">متاح للمعاينة — {iS(item, 'city', 'الجزائر')}</p>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </SectionShell>
  )
}
