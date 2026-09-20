'use client'
import type { CSSProperties, ReactElement } from 'react'

// ============================================================
// نموذج — مكوّن البطل (Hero)
// التخطيط: موسّط أو مُقسَّم (نص + رسم مجرّد) — بلا صور
// Task 7-b — خصائص موسّعة: eyebrow (شارة فوق العنوان) +
// visual (dashboard/phone/video/form/none) + titleSize +
// نموذج التقاط بريد داخل عمود النص عند visual=form
// ============================================================
import type { Block } from '@/lib/types'
import { PButton } from '../ui/p-button'
import { PAvatar } from '../ui/p-avatar'
import { B, S, type BlockCtx } from './shared'

type HeroBackground = 'default' | 'muted' | 'dark' | 'gradient'
type HeroVisualKind = 'dashboard' | 'phone' | 'video' | 'form' | 'none'
type HeroTitleSize = 'md' | 'lg' | 'xl'

const VISUAL_KINDS: readonly HeroVisualKind[] = ['dashboard', 'phone', 'video', 'form', 'none']
const TITLE_SIZE_CLASSES: Record<HeroTitleSize, string> = {
  md: 'text-3xl md:text-5xl',
  lg: 'text-4xl md:text-6xl',
  xl: 'text-5xl md:text-7xl tracking-tight',
}

function bgClasses(bg: HeroBackground): { style?: CSSProperties; dark: boolean } {
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

/** إطار هاتف يعرض واجهة تطبيق مصغّرة (أشكال هندسية فقط) */
function PhoneVisual(): ReactElement {
  const bars = [34, 58, 42, 72, 50, 66]
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      {/* هالة دائرية خلف الهاتف */}
      <div
        aria-hidden
        className="absolute -top-8 -end-6 size-40 rounded-full opacity-30 blur-2xl"
        style={{ background: 'var(--pt-accent)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -start-6 size-44 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--pt-primary)' }}
      />

      <div
        role="img"
        aria-label="رسم توضيحي لتطبيق الهاتف"
        className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[28px] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-3"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        {/* نوتش علوي */}
        <div className="mx-auto mb-3 h-1.5 w-16 shrink-0 rounded-full bg-[var(--pt-secondary)]" />

        {/* رأس التطبيق: نقصة رمزية + سطرا نص */}
        <div className="mb-3 flex shrink-0 items-center gap-2.5">
          <span className="size-6 shrink-0 rounded-full" style={{ background: 'var(--pt-primary)' }} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="block h-1.5 w-3/4 rounded-full bg-[var(--pt-secondary)]" />
            <span className="block h-1.5 w-1/2 rounded-full bg-[var(--pt-secondary)]" />
          </span>
        </div>

        {/* بطاقتا أرقام مصغّرتان */}
        <div className="mb-3 grid shrink-0 grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-2.5"
            >
              <span className="mb-1.5 block h-1.5 w-2/3 rounded-full bg-[var(--pt-secondary)]" />
              <span
                className="block h-2 rounded-[4px]"
                style={{
                  background: i === 0 ? 'var(--pt-primary)' : 'var(--pt-border)',
                  width: `${72 - i * 18}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* رسم أعمدة مصغّر */}
        <div className="mb-3 flex min-h-0 flex-1 items-end justify-between gap-1.5 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] p-2.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-full rounded-t-[4px]"
              style={{
                height: `${h}%`,
                background: i % 3 === 0 ? 'var(--pt-accent)' : 'var(--pt-primary)',
                opacity: 0.4 + (i / bars.length) * 0.6,
              }}
            />
          ))}
        </div>

        {/* شريط زر سفلي */}
        <div
          className="flex h-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--pt-primary)' }}
        >
          <span className="block h-1.5 w-12 rounded-full bg-[var(--pt-primary-fg)] opacity-90" />
        </div>
      </div>
    </div>
  )
}

/** بطاقة فيديو 16:9 بزر تشغيل (أشكال هندسية فقط) */
function VideoVisual(): ReactElement {
  return (
    <div className="relative mx-auto w-full max-w-xl">
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
        role="img"
        aria-label="بطاقة فيديو توضيحية"
        className="relative overflow-hidden rounded-[calc(var(--pt-radius)+6px)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        {/* مسرح الفيديو 16:9 مع غسلة تدرّج خفيفة */}
        <div
          className="relative flex aspect-video items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--pt-secondary) 0%, var(--pt-surface) 55%, var(--pt-secondary) 100%)',
          }}
        >
          {/* زر التشغيل الدائري — مثلث أبيض يشير يميناً (▶) */}
          <span
            className="flex size-16 items-center justify-center rounded-full"
            style={{ background: 'var(--pt-primary)', boxShadow: 'var(--pt-shadow)' }}
          >
            <span
              dir="ltr"
              aria-hidden
              className="block size-0"
              style={{
                borderInlineStart: '17px solid var(--pt-primary-fg)',
                borderBlockStart: '11px solid transparent',
                borderBlockEnd: '11px solid transparent',
                marginInlineEnd: '-5px',
              }}
            />
          </span>
        </div>

        {/* شريط تعليق سفلي — سطرا هيكل */}
        <div className="space-y-2.5 border-t border-[var(--pt-border)] p-4">
          <span className="block h-2.5 w-2/3 rounded-full bg-[var(--pt-secondary)]" />
          <span className="block h-2.5 w-1/3 rounded-full bg-[var(--pt-secondary)]" />
        </div>
      </div>
    </div>
  )
}

/** التقاط بريد داخل عمود النص (زخرفي — بلا حقول حقيقية) */
function EmailCapture({
  dark,
  align,
  placeholder,
  buttonLabel,
  onActivate,
}: {
  dark: boolean
  align: 'start' | 'center'
  placeholder: string
  buttonLabel: string
  onActivate: () => void
}): ReactElement {
  const ring = dark ? 'ring-2 ring-white/25' : 'ring-2 ring-[var(--pt-bg)]'
  return (
    <div className={`mt-8 ${align === 'center' ? 'flex flex-col items-center' : ''}`}>
      {/* صف النموذج */}
      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center">
        <div
          aria-hidden
          dir="ltr"
          className={`flex min-h-11 flex-1 items-center rounded-[var(--pt-radius)] border px-4 py-2.5 text-start text-sm select-none ${
            dark
              ? 'border-white/30 bg-white/10 text-white'
              : 'border-[var(--pt-border)] bg-[var(--pt-surface)] text-[var(--pt-muted)]'
          }`}
        >
          {placeholder}
        </div>
        <PButton size="lg" className="shrink-0" onClick={onActivate}>
          {buttonLabel}
        </PButton>
      </div>

      {/* دليل اجتماعي: ثلاث صور رمزية متداخلة + نص */}
      <div className="mt-4 flex items-center gap-2.5">
        <span className="flex" aria-hidden>
          <PAvatar name="أ" size={32} className={ring} />
          <PAvatar name="س" size={32} className={`-ms-2 ${ring}`} />
          <PAvatar name="ي" size={32} className={`-ms-2 ${ring}`} />
        </span>
        <span className={`text-xs font-medium ${dark ? 'text-white/75' : 'text-[var(--pt-muted)]'}`}>
          انضم إلى 2,400+ مهتم
        </span>
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

  // ---- خصائص 7-b (كلها اختيارية — توافق خلفي كامل) ----
  const eyebrow = S(p, 'eyebrow')
  const visual = VISUAL_KINDS.includes(S(p, 'visual') as HeroVisualKind)
    ? (S(p, 'visual') as HeroVisualKind)
    : 'dashboard'
  const titleSize = (['md', 'lg', 'xl'] as const).includes(S(p, 'titleSize') as HeroTitleSize)
    ? (S(p, 'titleSize') as HeroTitleSize)
    : 'md'
  const emailPlaceholder = S(p, 'emailPlaceholder', 'بريدك الإلكتروني') || 'بريدك الإلكتروني'
  const emailButton = S(p, 'emailButton', 'سجّلني') || 'سجّلني'

  const { style: bgStyle, dark } = bgClasses(background)
  const navigate = () => {
    if (ctx.onNavigate && primaryButtonPage.trim() !== '') {
      ctx.onNavigate(primaryButtonPage.trim())
    }
  }

  // الرسم الجانبي لا يظهر إلا في التخطيط المقسّم وللأنواع البصرية فقط
  const hasSideVisual = layout === 'split' && (visual === 'dashboard' || visual === 'phone' || visual === 'video')

  const textCol = (
    <div className={hasSideVisual ? 'md:w-[46%] md:shrink-0' : 'mx-auto max-w-2xl'}>
      <div className={align === 'center' ? 'text-center' : 'text-start'}>
        {eyebrow ? (
          <span
            className={`mb-5 inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              dark
                ? 'border-white/25 bg-white/10 text-white'
                : 'border-[var(--pt-border)] bg-[var(--pt-secondary)] text-[var(--pt-text)]'
            }`}
          >
            {eyebrow}
          </span>
        ) : null}
        {title ? (
          <h1
            className={`${TITLE_SIZE_CLASSES[titleSize]} font-extrabold leading-[1.2] ${
              dark ? 'text-white' : 'text-[var(--pt-text)]'
            }`}
          >
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
        {visual === 'form' ? (
          <EmailCapture
            dark={dark}
            align={align}
            placeholder={emailPlaceholder}
            buttonLabel={emailButton}
            onActivate={navigate}
          />
        ) : null}
      </div>
    </div>
  )

  // اختيار الرسم حسب النوع
  const visualNode: ReactElement =
    visual === 'phone' ? <PhoneVisual /> : visual === 'video' ? <VideoVisual /> : <HeroVisual />

  // التخطيط الموسّط: الرسوم الجديدة (فيديو/هاتف) تُكوَّم تحت النص (نمط video-lead)
  // وليست رسماً جانبياً — يبقى «dashboard» مخفياً حفاظاً على سلوك المشاريع السابقة
  const stackedVisual =
    layout === 'centered' && (visual === 'video' || visual === 'phone') ? (
      <div className="mt-12 md:mt-16">{visualNode}</div>
    ) : null

  return (
    <section style={bgStyle} className="px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        {hasSideVisual ? (
          <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:gap-12">
            {textCol}
            <div className="w-full md:flex-1">{visualNode}</div>
          </div>
        ) : (
          <>
            {textCol}
            {stackedVisual}
          </>
        )}
      </div>
    </section>
  )
}
