'use client'
import type { ReactElement, CSSProperties } from 'react'

// ============================================================
// SIVAR — مكوّن الشريط الإعلاني: شريط ضيق بأيقونة وزر يعمل
// Task 8-a — الزر ينقل إلى التسعير/الدخول/الرئيسية
// Task 9-a — خلفية صورة للشريط (bgImage + bgOverlay) — مع صورة
// يصبح النص أبيضاً إلا مع الغلالة الفاتحة؛ بلا صورة كما كان.
// Task 12 — لون خلفية القسم (bgColor): تدرّج لطيف منه بدل
// التدرّج/الداكن الافتراضي + نص يتبع var(--pt-text) (تلقائي ذكي).
// ============================================================
import type { Block } from '@/lib/types'
import { Megaphone } from 'lucide-react'
import { PButton } from '../ui/p-button'
import { bannerButtonTarget } from '@/lib/project/nav-targets'
import { S, hexLuminance, isImageNoOverlay, sectionBgGradient, sectionHexColor, sectionImageStyle, type BlockCtx } from './shared'

export function BannerBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = S(p, 'style', 'gradient') === 'dark' ? 'dark' : 'gradient'

  // ---- خلفية صورة اختيارية (تتقدم على أنماط الألوان) ----
  const { style: imageStyle, dark: imageDark } = sectionImageStyle(p)
  const hasImage = imageStyle != null
  const noOverlay = isImageNoOverlay(p)

  // ---- لون خلفية القسم (Task 12) — تدرّج منه + نص تلقائي ذكي ----
  // (صورة المستخدم المرفوعة تتقدم على اللون — توافق خلفي كامل)
  const bgColor = sectionHexColor(p.bgColor)
  const hasCustomBg = bgColor !== '' && !hasImage
  const customDark = hasCustomBg && hexLuminance(bgColor) <= 0.5
  // الشريط نصّه أبيض دائماً في الأنماط الأصلية؛ مع لون مخصّص فاتح/صورة فاتحة يصبح داكناً
  const textDark = hasImage ? imageDark : hasCustomBg ? customDark : true

  const buttonTarget = bannerButtonTarget(ctx.schema)
  const bannerGo = () => {
    if (ctx.onNavigate && buttonTarget) ctx.onNavigate(buttonTarget)
  }

  const barStyle: CSSProperties = hasImage
    ? { ...imageStyle, boxShadow: 'var(--pt-shadow)' }
    : hasCustomBg
      ? { background: sectionBgGradient(bgColor), boxShadow: 'var(--pt-shadow)' }
      : {
          background:
            style === 'dark' ? '#16121f' : 'linear-gradient(120deg, var(--pt-primary), var(--pt-accent))',
          boxShadow: 'var(--pt-shadow)',
        }

  const headingShadow = noOverlay ? { textShadow: '0 2px 12px rgba(0,0,0,.45)' } : undefined

  return (
    <section className="px-4 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[var(--pt-radius)] px-5 py-5 sm:flex-row md:px-7"
          style={barStyle}
          role="region"
          aria-label={title || 'شريط إعلاني'}
        >
          {/* توهج داخلي (Task 8 — جمالية) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-24"
            style={{ background: 'radial-gradient(55% 100% at 50% 0%, rgba(255,255,255,.16), transparent 70%)' }}
          />
          <span
            aria-hidden
            className={`relative flex size-11 shrink-0 items-center justify-center rounded-full ${hasCustomBg ? '' : 'text-white'}`}
            style={
              hasCustomBg
                ? { background: 'color-mix(in srgb, var(--pt-text) 14%, transparent)', color: 'var(--pt-text)' }
                : { background: 'rgba(255,255,255,.15)' }
            }
          >
            <Megaphone className="size-5" />
          </span>
          <div className="relative min-w-0 flex-1 text-center sm:text-start">
            {title ? (
              <h3 style={headingShadow} className={`text-base font-bold md:text-lg ${!textDark || hasCustomBg ? 'text-[var(--pt-text)]' : 'text-white'}`}>
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className={`mt-0.5 text-xs md:text-sm ${!textDark || hasCustomBg ? 'text-[var(--pt-muted)]' : 'text-white/80'}`}>{subtitle}</p>
            ) : null}
          </div>
          {buttonText ? (
            <PButton
              size="sm"
              className={`relative shrink-0 ${textDark ? 'border-white/25 bg-white hover:bg-white/90' : ''}`}
              // Task 12-c — نفس إصلاح CTA: text-[var(--pt-primary-fg)] من المتغير
              // الأساسي يسبق text-[#…] في تتالي CSS فيبيّض النص فوق الزر الأبيض —
              // الأسلوب المضمّن يضمن نصاً داكناً مقروءاً مهما كانت --pt-*.
              style={textDark ? { color: '#16121f' } : undefined}
              onClick={bannerGo}
            >
              {buttonText}
            </PButton>
          ) : null}
        </div>
      </div>
    </section>
  )
}
