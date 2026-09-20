'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن الشريط الإعلاني: شريط ضيق بأيقونة وزر يعمل
// Task 8-a — الزر ينقل إلى التسعير/الدخول/الرئيسية
// ============================================================
import type { Block } from '@/lib/types'
import { Megaphone } from 'lucide-react'
import { PButton } from '../ui/p-button'
import { bannerButtonTarget } from '@/lib/project/nav-targets'
import { S, type BlockCtx } from './shared'

export function BannerBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = S(p, 'style', 'gradient') === 'dark' ? 'dark' : 'gradient'

  const buttonTarget = bannerButtonTarget(ctx.schema)
  const bannerGo = () => {
    if (ctx.onNavigate && buttonTarget) ctx.onNavigate(buttonTarget)
  }

  return (
    <section className="px-4 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[var(--pt-radius)] px-5 py-5 sm:flex-row md:px-7"
          style={{
            background:
              style === 'dark' ? '#16121f' : 'linear-gradient(120deg, var(--pt-primary), var(--pt-accent))',
            boxShadow: 'var(--pt-shadow)',
          }}
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
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <Megaphone className="size-5" />
          </span>
          <div className="relative min-w-0 flex-1 text-center sm:text-start">
            {title ? <h3 className="text-base font-bold text-white md:text-lg">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-white/80 md:text-sm">{subtitle}</p> : null}
          </div>
          {buttonText ? (
            <PButton
              size="sm"
              className="relative shrink-0 border-white/25 bg-white text-[#16121f] hover:bg-white/90"
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
