'use client'
import type { ReactElement, CSSProperties } from 'react'

// ============================================================
// نموذج — مكوّن دعوة للإجراء: شريط جذاب بزر
// Task 9-a — خلفية صورة للبطاقة (bgImage + bgOverlay) بنبرة نص
// متكيّفة: أبيض مع التعتيم الداكن/المتوسط أو بلا تعتيم (مع ظل
// نص)، داكن مع الغلالة الفاتحة — بلا صورة: السلوك القديم حرفياً.
// ============================================================
import type { Block } from '@/lib/types'
import { PButton } from '../ui/p-button'
import { ctaButtonTarget } from '@/lib/project/nav-targets'
import { S, isImageNoOverlay, sectionImageStyle, type BlockCtx } from './shared'

type CtaStyle = 'default' | 'gradient' | 'dark'

export function CtaBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = (['default', 'gradient', 'dark'] as const).includes(S(p, 'style') as CtaStyle)
    ? (S(p, 'style') as CtaStyle)
    : 'default'

  const isDark = style === 'dark'
  const isGradient = style === 'gradient'

  // ---- خلفية صورة اختيارية (تتقدم على أنماط الألوان) ----
  const { style: imageStyle, dark: imageDark } = sectionImageStyle(p)
  const hasImage = imageStyle != null
  const noOverlay = isImageNoOverlay(p)
  const textDark = hasImage ? imageDark : isDark || isGradient

  const buttonTarget = ctaButtonTarget(ctx.schema)
  const ctaGo = () => {
    if (ctx.onNavigate && buttonTarget) ctx.onNavigate(buttonTarget)
  }

  // خلفية البطاقة: صورة → أنماط الألوان الأصلية
  const cardStyle: CSSProperties = hasImage
    ? { ...imageStyle, boxShadow: 'var(--pt-shadow)' }
    : {
        background: isGradient
          ? 'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))'
          : isDark
            ? '#16121f'
            : 'var(--pt-secondary)',
        border: style === 'default' ? '1px solid var(--pt-border)' : 'none',
        boxShadow: 'var(--pt-shadow)',
      }

  const headingShadow = noOverlay ? { textShadow: '0 2px 12px rgba(0,0,0,.45)' } : undefined

  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="relative overflow-hidden rounded-[calc(var(--pt-radius)+6px)] px-6 py-12 text-center md:px-12 md:py-16"
          style={cardStyle}
        >
          {/* توهج داخلي علوي (Task 8 — جمالية) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{ background: 'radial-gradient(60% 100% at 50% 0%, rgba(255,255,255,.18), transparent 70%)' }}
          />
          <div className="relative">
          {title ? (
            <h2 className="text-2xl font-bold leading-tight md:text-4xl">
              <span style={headingShadow} className={textDark ? 'text-white' : 'text-[var(--pt-text)]'}>
                {title}
              </span>
            </h2>
          ) : null}
          {subtitle ? (
            <p className={`mx-auto mt-3 max-w-xl text-sm leading-relaxed md:text-base ${textDark ? 'text-white/80' : 'text-[var(--pt-muted)]'}`}>
              {subtitle}
            </p>
          ) : null}
          {buttonText ? (
            <PButton
              size="lg"
              variant={textDark ? 'secondary' : 'primary'}
              className={`mt-7 ${textDark ? 'border-white/25 bg-white text-[#16121f] hover:bg-white/90' : ''}`}
              onClick={ctaGo}
            >
              {buttonText}
            </PButton>
          ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
