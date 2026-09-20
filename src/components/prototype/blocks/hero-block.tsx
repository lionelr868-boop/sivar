'use client'
import type { CSSProperties, ReactElement } from 'react'
import { useState } from 'react'

// ============================================================
// نموذج — مكوّن البطل (Hero)
// Task 8-a — خلفية صورة مرفوعة (bgImage + bgOverlay) +
// خلفيات جديدة (gradient-soft / mesh) + أزرار عاملة:
// الأساسي → هدف ذكي (دخول/تسعير/لوحة)، والثانوي → مرساة قسم
// أو صفحة، وزر تشغيل الفيديو يتبدّل حالةً.
// ============================================================
import type { Block } from '@/lib/types'
import { PButton } from '../ui/p-button'
import { PAvatar } from '../ui/p-avatar'
import { heroPrimaryTarget, heroSecondaryTarget } from '@/lib/project/nav-targets'
import { B, S, scrollToAnchor, type BlockCtx } from './shared'

type HeroBackground = 'default' | 'muted' | 'gradient-soft' | 'mesh' | 'dark' | 'gradient'
type HeroVisualKind = 'dashboard' | 'phone' | 'video' | 'form' | 'none'
type HeroTitleSize = 'md' | 'lg' | 'xl'
type HeroOverlay = 'dark' | 'medium' | 'light' | 'none'

const VISUAL_KINDS: readonly HeroVisualKind[] = ['dashboard', 'phone', 'video', 'form', 'none']
const BG_KINDS: readonly HeroBackground[] = ['default', 'muted', 'gradient-soft', 'mesh', 'dark', 'gradient']
const OVERLAYS: readonly HeroOverlay[] = ['dark', 'medium', 'light', 'none']
const TITLE_SIZE_CLASSES: Record<HeroTitleSize, string> = {
  md: 'text-3xl md:text-5xl',
  lg: 'text-4xl md:text-6xl',
  xl: 'text-5xl md:text-7xl tracking-tight',
}

function bgClasses(bg: HeroBackground): { style?: CSSProperties; dark: boolean } {
  switch (bg) {
    case 'muted':
      return { style: { background: 'var(--pt-secondary)' }, dark: false }
    case 'gradient-soft':
      return {
        style: {
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--pt-primary) 10%, var(--pt-bg)) 0%, var(--pt-bg) 100%)',
        },
        dark: false,
      }
    case 'mesh':
      return {
        style: {
          background:
            'radial-gradient(42rem 24rem at 85% -10%, color-mix(in srgb, var(--pt-primary) 14%, transparent), transparent 60%), radial-gradient(38rem 22rem at 8% 0%, color-mix(in srgb, var(--pt-accent) 16%, transparent), transparent 55%), var(--pt-bg)',
        },
        dark: false,
      }
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

/** غطاء الصورة الخلفية حسب شدة التعتيم */
function overlayStyle(overlay: HeroOverlay): string | undefined {
  switch (overlay) {
    case 'dark':
      return 'linear-gradient(180deg, rgba(13,10,25,.62), rgba(13,10,25,.78))'
    case 'medium':
      return 'linear-gradient(180deg, rgba(13,10,25,.38), rgba(13,10,25,.55))'
    case 'light':
      return 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,.72))'
    default:
      return undefined
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

/** بطاقة فيديو 16:9 بزر تشغيل يتبدّل حالةً عند الضغط */
function VideoVisual({ playing, onToggle }: { playing: boolean; onToggle: () => void }): ReactElement {
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
          {/* موجة صوت متحركة عند «التشغيل» */}
          {playing ? (
            <span aria-hidden className="absolute bottom-4 end-4 flex items-end gap-1">
              {[10, 18, 12, 22, 14].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: h,
                    background: 'var(--pt-primary)',
                    opacity: 0.85,
                    animation: `pt-wave .9s ease-in-out ${i * 0.12}s infinite alternate`,
                  }}
                />
              ))}
            </span>
          ) : null}

          {/* زر التشغيل الدائري — مثلث أبيض يشير يميناً (▶) */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? 'إيقاف الفيديو' : 'تشغيل الفيديو'}
            className="flex size-16 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]"
            style={{ background: 'var(--pt-primary)', boxShadow: 'var(--pt-shadow)' }}
          >
            {playing ? (
              <span aria-hidden className="flex gap-1.5" dir="ltr">
                <span className="block h-6 w-1.5 rounded-sm" style={{ background: 'var(--pt-primary-fg)' }} />
                <span className="block h-6 w-1.5 rounded-sm" style={{ background: 'var(--pt-primary-fg)' }} />
              </span>
            ) : (
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
            )}
          </button>
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

/** التقاط بريد داخل عمود النص (يعمل: نجاح عند الإرسال) */
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
  const backgroundRaw = S(p, 'background') as HeroBackground
  const background = BG_KINDS.includes(backgroundRaw) ? backgroundRaw : 'default'
  const align = S(p, 'align', 'start') === 'center' ? 'center' : 'start'
  const hasSecondary = B(p, 'secondary', true) && secondaryButton.trim() !== ''

  // ---- خصائص الصورة الخلفية (Task 8) ----
  const bgImage = S(p, 'bgImage')
  const overlayRaw = S(p, 'bgOverlay', 'dark') as HeroOverlay
  const bgOverlay = OVERLAYS.includes(overlayRaw) ? overlayRaw : 'dark'
  const hasImage = bgImage.trim() !== ''
  // مع صورة: النص أبيض إلا مع الغطاء الفاتح
  const dark = hasImage ? bgOverlay !== 'light' : bgClasses(background).dark

  // ---- خصائص 7-b ----
  const eyebrow = S(p, 'eyebrow')
  const visual = VISUAL_KINDS.includes(S(p, 'visual') as HeroVisualKind)
    ? (S(p, 'visual') as HeroVisualKind)
    : 'dashboard'
  const titleSize = (['md', 'lg', 'xl'] as const).includes(S(p, 'titleSize') as HeroTitleSize)
    ? (S(p, 'titleSize') as HeroTitleSize)
    : 'md'
  const emailPlaceholder = S(p, 'emailPlaceholder', 'بريدك الإلكتروني') || 'بريدك الإلكتروني'
  const emailButton = S(p, 'emailButton', 'سجّلني') || 'سجّلني'

  // ---- حالة تشغيل الفيديو ----
  const [playing, setPlaying] = useState(false)

  const { style: bgStyle } = bgClasses(background)

  // ---- الأزرار: أهداف ذكية دائماً ----
  const primaryTarget = heroPrimaryTarget(ctx.schema, primaryButtonPage)
  const secondaryTarget = heroSecondaryTarget(ctx.schema, block.id ? pageIdOf(ctx, block.id) : '')

  const navigatePrimary = () => {
    if (ctx.onNavigate && primaryTarget) ctx.onNavigate(primaryTarget)
  }
  const activateSecondary = () => {
    if (secondaryTarget.anchor) {
      scrollToAnchor(secondaryTarget.anchor)
      return
    }
    if (ctx.onNavigate && secondaryTarget.pageId) ctx.onNavigate(secondaryTarget.pageId)
  }
  const activateEmail = () => {
    if (ctx.onNavigate && primaryTarget) ctx.onNavigate(primaryTarget)
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
            style={hasImage && bgOverlay === 'none' ? { textShadow: '0 2px 12px rgba(0,0,0,.45)' } : undefined}
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
              <PButton size="lg" onClick={navigatePrimary}>
                {primaryButton}
              </PButton>
            ) : null}
            {hasSecondary ? (
              <PButton
                size="lg"
                variant={dark ? 'secondary' : 'outline'}
                className={dark ? 'border-white/25 bg-white/10 text-white hover:bg-white/20' : ''}
                onClick={activateSecondary}
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
            onActivate={activateEmail}
          />
        ) : null}
      </div>
    </div>
  )

  // اختيار الرسم حسب النوع
  const visualNode: ReactElement =
    visual === 'phone' ? (
      <PhoneVisual />
    ) : visual === 'video' ? (
      <VideoVisual playing={playing} onToggle={() => setPlaying((v) => !v)} />
    ) : (
      <HeroVisual />
    )

  // التخطيط الموسّط: الرسوم الجديدة (فيديو/هاتف) تُكوَّم تحت النص (نمط video-lead)
  const stackedVisual =
    layout === 'centered' && (visual === 'video' || visual === 'phone') ? (
      <div className="mt-12 md:mt-16">{visualNode}</div>
    ) : null

  // ---- خلفية القسم: صورة أو نمط لوني ----
  const sectionStyle: CSSProperties = hasImage
    ? {
        backgroundImage: `${overlayStyle(bgOverlay) ? `${overlayStyle(bgOverlay)}, ` : ''}url("${bgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : (bgStyle ?? {})

  return (
    <section style={sectionStyle} className="px-4 py-16 md:px-8 md:py-24">
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

/** معرّف الصفحة التي تحتوي كتلة معينة */
function pageIdOf(ctx: BlockCtx, _blockId: string): string {
  for (const page of ctx.schema.pages ?? []) {
    if (page.blocks?.some((b) => b.id === _blockId)) return page.id
  }
  return ''
}
