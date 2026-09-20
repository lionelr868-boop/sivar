'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن البطل (Hero)
// التخطيط: موسّط أو مُقسَّم (نص + رسم مجرّد) — بلا صور
// ============================================================
import type { Block } from '@/lib/types'
import { PButton } from '../ui/p-button'
import { B, S, type BlockCtx } from './shared'

type HeroBackground = 'default' | 'muted' | 'dark' | 'gradient'

function bgClasses(bg: HeroBackground): { style?: React.CSSProperties; dark: boolean } {
  switch (bg) {
    case 'muted':
      return { style: { background: 'var(--pt-secondary)' }, dark: false }
    case 'dark':
      return { style: { background: '#16121f' }, dark: true }
    case 'gradient':
      return {
        style: { background: 'linear-gradient(135deg, var(--pt-primary), #db2777)' },
        dark: true,
      }
    default:
      return { dark: false }
  }
}

/** رسم مجرّد يحاكي واجهة لوحة تحكم (أشكال هندسية فقط) */
function HeroVisual(): ReactElement {
  const bars = [38, 62, 45, 78, 56, 88, 70]
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* هالة دائرية خلف البطاقة */}
      <div
        aria-hidden
        className="absolute -top-8 -end-6 size-44 rounded-full opacity-30 blur-2xl"
        style={{ background: 'var(--pt-accent)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -start-8 size-52 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--pt-primary)' }}
      />

      <div
        className="relative overflow-hidden rounded-[calc(var(--pt-radius)+6px)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-4 md:p-5"
        style={{ boxShadow: 'var(--pt-shadow)' }}
        role="img"
        aria-label="رسم توضيحي لواجهة المنتج"
      >
        {/* شريط علوي */}
        <div className="mb-4 flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: 'var(--pt-primary)' }} />
          <span className="size-2.5 rounded-full opacity-60" style={{ background: 'var(--pt-accent)' }} />
          <span className="size-2.5 rounded-full opacity-30" style={{ background: 'var(--pt-border)' }} />
          <span className="ms-2 h-2.5 w-24 rounded-full bg-[var(--pt-secondary)]" />
        </div>

        {/* بطاقات أرقام مصغّرة */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-3">
              <span className="mb-2 block h-2 w-2/3 rounded-full bg-[var(--pt-secondary)]" />
              <span
                className="block h-3 rounded-[4px]"
                style={{
                  background: i === 0 ? 'var(--pt-primary)' : 'var(--pt-border)',
                  width: `${70 - i * 12}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* رسم أعمدة مصغّر */}
        <div className="flex h-32 items-end justify-between gap-2 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-3">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-full rounded-t-[6px] transition-all duration-500 hover:opacity-80"
              style={{
                height: `${h}%`,
                background: i % 3 === 0 ? 'var(--pt-accent)' : 'var(--pt-primary)',
                opacity: 0.45 + (i / bars.length) * 0.55,
              }}
            />
          ))}
        </div>

        {/* أسطر نصية مجرّدة */}
        <div className="mt-4 space-y-2">
          <span className="block h-2.5 w-full rounded-full bg-[var(--pt-secondary)]" />
          <span className="block h-2.5 w-3/4 rounded-full bg-[var(--pt-secondary)]" />
        </div>
      </div>
    </div>
  )
}

export function HeroBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title')
  const subtitle = S(p, 'subtitle')
  const primaryButton = S(p, 'primaryButton')
  const primaryButtonPage = S(p, 'primaryButtonPage')
  const secondaryButton = S(p, 'secondaryButton')
  const layout = S(p, 'layout', 'split') === 'centered' ? 'centered' : 'split'
  const background = (['default', 'muted', 'dark', 'gradient'] as const).includes(S(p, 'background') as HeroBackground)
    ? (S(p, 'background') as HeroBackground)
    : 'default'
  const align = S(p, 'align', 'start') === 'center' ? 'center' : 'start'
  const hasSecondary = B(p, 'secondary', true) && secondaryButton.trim() !== ''

  const { style: bgStyle, dark } = bgClasses(background)
  const navigate = () => {
    if (ctx.onNavigate && primaryButtonPage.trim() !== '') {
      ctx.onNavigate(primaryButtonPage.trim())
    }
  }

  const textCol = (
    <div className={layout === 'split' ? 'md:w-[46%] md:shrink-0' : 'mx-auto max-w-2xl'}>
      <div className={align === 'center' ? 'text-center' : 'text-start'}>
        {title ? (
          <h1 className={`text-3xl font-extrabold leading-[1.2] md:text-5xl ${dark ? 'text-white' : 'text-[var(--pt-text)]'}`}>
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className={`mt-4 text-base leading-relaxed md:text-lg ${dark ? 'text-white/80' : 'text-[var(--pt-muted)]'}`}>
            {subtitle}
          </p>
        ) : null}
        {primaryButton || hasSecondary ? (
          <div className={`mt-7 flex flex-wrap items-center gap-3 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
            {primaryButton ? (
              <PButton size="lg" onClick={navigate}>
                {primaryButton}
              </PButton>
            ) : null}
            {hasSecondary ? (
              <PButton
                size="lg"
                variant={dark ? 'secondary' : 'outline'}
                className={dark ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : ''}
              >
                {secondaryButton}
              </PButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )

  return (
    <section style={bgStyle} className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        {layout === 'split' ? (
          <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:gap-12">
            {textCol}
            <div className="w-full md:flex-1">
              <HeroVisual />
            </div>
          </div>
        ) : (
          textCol
        )}
      </div>
    </section>
  )
}
