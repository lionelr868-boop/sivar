'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن الشريط الإعلاني: شريط ضيق بأيقونة وزر
// ============================================================
import type { Block } from '@/lib/types'
import { Megaphone } from 'lucide-react'
import { PButton } from '../ui/p-button'
import { S } from './shared'

export function BannerBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = S(p, 'style', 'gradient') === 'dark' ? 'dark' : 'gradient'

  return (
    <section className="px-4 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="flex flex-col items-center gap-4 overflow-hidden rounded-[var(--pt-radius)] px-5 py-5 sm:flex-row md:px-7"
          style={{
            background:
              style === 'dark' ? '#16121f' : 'linear-gradient(120deg, var(--pt-primary), var(--pt-accent))',
            boxShadow: 'var(--pt-shadow)',
          }}
          role="region"
          aria-label={title || 'شريط إعلاني'}
        >
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <Megaphone className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-center sm:text-start">
            {title ? <h3 className="text-base font-bold text-white md:text-lg">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-white/80 md:text-sm">{subtitle}</p> : null}
          </div>
          {buttonText ? (
            <PButton
              size="sm"
              className="shrink-0 border-white/25 bg-white text-[#16121f] hover:bg-white/90"
            >
              {buttonText}
            </PButton>
          ) : null}
        </div>
      </div>
    </section>
  )
}
