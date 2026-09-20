'use client'

// ============================================================
// نموذج — مخطط مصغّر لنمط صفحة هبوط (wireframe بسيط بالـ CSS)
// مشترك: نافذة إضافة صفحة (Builder) + مكتبة صفحات الهبوط
// ============================================================
import type { LandingVariantMeta } from '@/lib/project/landing-kit'
import { cn } from '@/lib/utils'

function Lines({ count = 3, className, strong = 0 }: { count?: number; className?: string; strong?: number }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5', 'w-2/3', 'w-1/2']
  return (
    <div className={cn('space-y-1', className)} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'block h-1 rounded-full',
            widths[i % widths.length],
            i < strong ? 'bg-foreground/70' : 'bg-foreground/25'
          )}
        />
      ))}
    </div>
  )
}

function MiniCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded border border-foreground/15 bg-background/80 p-1.5', className)} aria-hidden>
      <span className="mb-1 block h-0.5 w-2/3 rounded-full bg-foreground/20" />
      <div className="flex items-end gap-1">
        {[40, 65, 50, 80, 60].map((h, i) => (
          <span key={i} className="w-1 rounded-t-sm bg-primary/60" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}

function PhoneShape() {
  return (
    <div className="flex h-full w-1/3 items-center justify-center" aria-hidden>
      <div className="relative h-[92%] w-[62%] rounded-[6px] border-2 border-foreground/25 bg-background/90 p-1">
        <span className="mx-auto mb-1 block h-0.5 w-1/3 rounded-full bg-foreground/20" />
        <span className="mb-1 block h-1.5 w-3/4 rounded-full bg-foreground/30" />
        <span className="mb-1 block h-1 w-1/2 rounded-full bg-foreground/15" />
        <div className="space-y-0.5">
          <span className="block h-0.5 w-full rounded-full bg-foreground/12" />
          <span className="block h-0.5 w-4/5 rounded-full bg-foreground/12" />
          <span className="block h-0.5 w-2/3 rounded-full bg-foreground/12" />
        </div>
        <span className="mt-1 block h-2 w-full rounded bg-primary/30" />
      </div>
    </div>
  )
}

function PlayShape() {
  return (
    <div className="flex h-full w-1/2 items-center justify-center" aria-hidden>
      <div className="flex aspect-video w-full items-center justify-center rounded-md border border-foreground/15 bg-gradient-to-br from-primary/15 to-primary/5">
        <span className="flex size-4 items-center justify-center rounded-full bg-primary/80">
          <span className="ms-[1px] size-0 border-y-[3px] border-s-[5px] border-y-transparent border-s-white" />
        </span>
      </div>
    </div>
  )
}

function InputShape({ centered = false }: { centered?: boolean }) {
  return (
    <div className={cn('flex gap-1', centered ? 'w-3/4 mx-auto' : 'w-full')} aria-hidden>
      <span className="h-2.5 flex-1 rounded-sm border border-foreground/20 bg-background" />
      <span className="h-2.5 w-5 rounded-sm bg-primary/80" />
    </div>
  )
}

function StatsRow() {
  return (
    <div className="flex gap-1" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex-1 rounded border border-foreground/12 bg-background/70 p-1 text-center">
          <span className="mx-auto block h-1 w-2/3 rounded-full bg-foreground/40" />
          <span className="mx-auto mt-0.5 block h-0.5 w-1/2 rounded-full bg-foreground/15" />
        </div>
      ))}
    </div>
  )
}

/** مخطط مصغّر لنمط صفحة الهبوط — 100% CSS، بدون تفاعل */
export function LandingVariantThumb({ variant, className }: { variant: LandingVariantMeta; className?: string }) {
  const base = 'relative flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-md border border-border bg-muted/60 p-2'

  const inner = (() => {
    switch (variant.thumb) {
      case 'split':
        return (
          <>
            <div className="flex h-full flex-1 gap-1.5">
              <div className="flex w-1/2 flex-col justify-center gap-1">
                <span className="block h-1.5 w-3/4 rounded-full bg-foreground/70" />
                <span className="block h-1 w-full rounded-full bg-foreground/25" />
                <span className="block h-1 w-4/5 rounded-full bg-foreground/25" />
                <div className="mt-1 flex gap-1">
                  <span className="h-2 w-6 rounded-sm bg-primary/80" />
                  <span className="h-2 w-5 rounded-sm border border-foreground/20" />
                </div>
              </div>
              <MiniCard className="w-1/2" />
            </div>
            <StatsRow />
          </>
        )
      case 'centered':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <span className="block h-1 w-8 rounded-full bg-primary/50" />
            <span className="block h-2 w-4/5 rounded-full bg-foreground/75" />
            <span className="block h-2 w-3/5 rounded-full bg-foreground/75" />
            <span className="block h-1 w-2/3 rounded-full bg-foreground/25" />
            <div className="mt-1 flex gap-1">
              <span className="h-2 w-6 rounded-sm bg-primary/80" />
              <span className="h-2 w-5 rounded-sm border border-foreground/20" />
            </div>
          </div>
        )
      case 'gradient':
      case 'event':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-1 rounded bg-gradient-to-br from-primary/80 to-rose-500/70 p-2 text-center">
            <span className={cn('block h-1 rounded-full', variant.thumb === 'event' ? 'w-3/5 bg-white/70' : 'w-6 bg-white/60')} />
            <span className="block h-2 w-4/5 rounded-full bg-white/90" />
            <span className="block h-2 w-3/5 rounded-full bg-white/90" />
            <span className="block h-1 w-2/3 rounded-full bg-white/50" />
            <span className="mt-1 h-2 w-7 rounded-sm bg-white/90" />
          </div>
        )
      case 'dark':
      case 'agency':
        return (
          <div className="flex h-full flex-col justify-center gap-1 rounded bg-foreground p-2">
            <span className="block h-1 w-8 rounded-full bg-primary" />
            <span className="block h-2 w-4/5 rounded-full bg-white/85" />
            <span className="block h-2 w-3/5 rounded-full bg-white/85" />
            <span className="block h-1 w-2/3 rounded-full bg-white/40" />
            <div className="mt-1 flex gap-1">
              <span className="h-2 w-6 rounded-sm bg-primary" />
              <span className="h-2 w-5 rounded-sm border border-white/40" />
            </div>
          </div>
        )
      case 'phone':
        return (
          <>
            <div className="flex h-full flex-1 gap-1.5">
              <div className="flex w-1/2 flex-col justify-center gap-1">
                <span className="block h-1.5 w-3/4 rounded-full bg-foreground/70" />
                <span className="block h-1 w-full rounded-full bg-foreground/25" />
                <span className="block h-1 w-4/5 rounded-full bg-foreground/25" />
                <span className="mt-1 block h-2 w-7 rounded-sm bg-primary/80" />
              </div>
              <PhoneShape />
            </div>
          </>
        )
      case 'form':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
            <span className="block h-2 w-4/5 rounded-full bg-foreground/75" />
            <span className="block h-1 w-2/3 rounded-full bg-foreground/25" />
            <InputShape centered />
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-2 rounded-full bg-primary/50" />
              ))}
              <span className="h-0.5 w-6 rounded-full bg-foreground/20" />
            </div>
          </div>
        )
      case 'video':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
            <span className="block h-1.5 w-3/4 rounded-full bg-foreground/70" />
            <span className="block h-1 w-2/3 rounded-full bg-foreground/25" />
            <PlayShape />
            <span className="mt-1 block h-2 w-7 rounded-sm bg-primary/80" />
          </div>
        )
      case 'store':
        return (
          <>
            <div className="flex h-full flex-1 items-center gap-1.5">
              <div className="flex w-1/2 flex-col gap-1">
                <span className="block h-1.5 w-3/4 rounded-full bg-foreground/70" />
                <span className="block h-1 w-full rounded-full bg-foreground/25" />
                <span className="mt-1 block h-2 w-7 rounded-sm bg-primary/80" />
              </div>
              <div className="grid w-1/2 grid-cols-2 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-sm border border-foreground/12 bg-background/80 p-1">
                    <span className="mb-1 block h-2 w-full rounded-sm bg-primary/20" />
                    <span className="block h-0.5 w-2/3 rounded-full bg-foreground/20" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      case 'minimal':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="size-3 rounded-full bg-primary" />
            <span className="block h-2 w-1/2 rounded-full bg-foreground/70" />
            <span className="block h-1 w-2/3 rounded-full bg-foreground/20" />
            <span className="mt-1 block h-2 w-8 rounded-sm bg-primary/80" />
          </div>
        )
      case 'stats':
        return (
          <>
            <div className="flex h-full flex-1 gap-1.5">
              <div className="flex w-1/2 flex-col justify-center gap-1">
                <span className="block h-1.5 w-3/4 rounded-full bg-foreground/70" />
                <span className="block h-1 w-full rounded-full bg-foreground/25" />
                <span className="mt-1 block h-2 w-7 rounded-sm bg-primary/80" />
              </div>
              <MiniCard className="w-1/2" />
            </div>
            <StatsRow />
            <div className="flex items-center justify-center gap-1">
              <span className="block h-1 w-6 rounded-full bg-primary/60" />
              <span className="block h-1 w-6 rounded-full bg-foreground/25" />
            </div>
          </>
        )
      default:
        return <Lines count={3} />
    }
  })()

  return (
    <div className={cn(base, className)} role="img" aria-label={`مخطط ${variant.name}`}>
      {inner}
    </div>
  )
}
