'use client'
import type { ReactElement } from 'react'

// ============================================================
// SIVAR — إجراءات سريعة: شبكة أزرار تنقل إلى صفحات المشروع.
// الزر يعمل فقط إذا كان pageId صفحة حقيقية في المخطط
// ووفّر سياق العرض onNavigate — وإلا يُعرض معطّلاً.
// Task 8-c — العقد المثبّت في agent-ctx/8-spec.md
// props: { title, actions: [{ icon, label, pageId }] }
// ============================================================
import type { Block } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import { ProtoIcon } from '../icon-map'
import { L, S, iS, type BlockCtx } from './shared'

/** شبكة متجاوبة حسب عدد الإجراءات */
function gridClass(count: number): string {
  if (count <= 2) return 'grid-cols-2'
  if (count <= 3) return 'grid-cols-2 md:grid-cols-3'
  return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
}

export function QuickActionsBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const title = S(p, 'title', 'إجراءات سريعة')
  const actions = L(p, 'actions')

  const pageIds = new Set(ctx.schema.pages.map((pg) => pg.id))
  const hasNavigate = typeof ctx.onNavigate === 'function'

  return (
    <section aria-label={title}>
      {title ? <h3 className="mb-3 text-sm font-bold text-[var(--pt-text)]">{title}</h3> : null}
      {actions.length > 0 ? (
        <div className={`grid gap-3 ${gridClass(actions.length)}`}>
          {actions.map((action, i) => {
            const icon = iS(action, 'icon', 'zap')
            const label = iS(action, 'label')
            const pageId = iS(action, 'pageId')
            const enabled = pageId !== '' && pageIds.has(pageId) && hasNavigate
            return (
              <button
                key={i}
                type="button"
                disabled={!enabled}
                onClick={() => {
                  if (enabled) ctx.onNavigate?.(pageId)
                }}
                aria-label={label}
                className="group flex min-h-[76px] cursor-pointer items-center gap-3 rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-4 text-start transition-all duration-200 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--pt-primary)_45%,var(--pt-border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ boxShadow: 'var(--pt-shadow)' }}
              >
                {/* بلاطة الأيقونة بتدرج primary → accent شفاف */}
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--pt-radius)-2px)]"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--pt-primary) 14%, transparent), color-mix(in srgb, var(--pt-accent) 18%, transparent))',
                    color: 'var(--pt-primary)',
                  }}
                >
                  <ProtoIcon name={icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--pt-text)]">
                  {label}
                </span>
                {/* سهم للأمام = يسار في RTL */}
                <ArrowLeft
                  aria-hidden
                  className="size-4 shrink-0 text-[var(--pt-muted)] transition-transform duration-200 group-hover:-translate-x-0.5"
                />
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
