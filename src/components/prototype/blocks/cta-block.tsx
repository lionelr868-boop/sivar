'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن دعوة للإجراء: شريط جذاب بزر
// ============================================================
import type { Block } from '@/lib/types'
import { PButton } from '../ui/p-button'
import { S } from './shared'

type CtaStyle = 'default' | 'gradient' | 'dark'

export function CtaBlock({ block }: { block: Block }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const buttonText = S(p, 'buttonText')
  const style = (['default', 'gradient', 'dark'] as const).includes(S(p, 'style') as CtaStyle)
    ? (S(p, 'style') as CtaStyle)
    : 'default'

  const isDark = style === 'dark'
  const isGradient = style === 'gradient'

  return (
    <section className="px-4 py-14 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div
          className="rounded-[calc(var(--pt-radius)+6px)] px-6 py-12 text-center md:px-12 md:py-16"
          style={{
            background: isGradient
              ? 'linear-gradient(135deg, var(--pt-primary), var(--pt-accent))'
              : isDark
                ? '#16121f'
                : 'var(--pt-secondary)',
            border: style === 'default' ? '1px solid var(--pt-border)' : 'none',
            boxShadow: 'var(--pt-shadow)',
          }}
        >
          {title ? (
            <h2 className="text-2xl font-bold leading-tight md:text-4xl">
              <span className={isDark || isGradient ? 'text-white' : 'text-[var(--pt-text)]'}>{title}</span>
            </h2>
          ) : null}
          {subtitle ? (
            <p className={`mx-auto mt-3 max-w-xl text-sm leading-relaxed md:text-base ${isDark || isGradient ? 'text-white/80' : 'text-[var(--pt-muted)]'}`}>
              {subtitle}
            </p>
          ) : null}
          {buttonText ? (
            <PButton
              size="lg"
              variant={isDark || isGradient ? 'secondary' : 'primary'}
              className={`mt-7 ${isDark || isGradient ? 'border-white/25 bg-white text-[#16121f] hover:bg-white/90' : ''}`}
            >
              {buttonText}
            </PButton>
          ) : null}
        </div>
      </div>
    </section>
  )
}
