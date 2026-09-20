'use client'
import type { ReactElement } from 'react'

// ============================================================
// SIVAR — مكوّن HTML المخصص (Task 7-b)
// يعرض كود HTML من المستخدم داخل إطار معزول (sandbox بلا
// allow-same-origin) في وضع المعاينة، وبديل خفيف (بلا إطارات)
// في المعاينات المصغّرة فقط (mini).
// ============================================================
import { Code2 } from 'lucide-react'
import type { Block } from '@/lib/types'
import { N, S, type BlockCtx } from './shared'

/** حرف من اليمين لليسار (RLM) ليظهر العدد بترتيبه الصحيح داخل نص عربي */
const RLM = '\u200F'

export function CustomHtmlBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const name = S(p, 'name')
  const html = S(p, 'html')
  const height = Math.max(100, Math.min(4000, Math.round(N(p, 'height', 560))))

  return (
    <section className="px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {name ? (
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--pt-muted)]">
            <Code2 className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{name}</span>
          </div>
        ) : null}

        {!ctx.mini ? (
          // الإطار الحقيقي: كود المستخدم معزولاً عن صفحة المنصة
          <div className="relative">
            <iframe
              srcDoc={html}
              sandbox="allow-scripts allow-popups allow-forms"
              title={name || 'HTML مخصص'}
              loading="lazy"
              style={{ height: `${height}px` }}
              className="w-full rounded-[calc(var(--pt-radius)+4px)] border border-[var(--pt-border)] bg-white"
            />
          </div>
        ) : (
          // بديل خفيف للمصغّرات: بلا إطارات تحميل إطلاقاً (builder/preview تعرض الإطار الحقيقي)
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-[calc(var(--pt-radius)+4px)] border-2 border-dashed border-[var(--pt-border)] bg-[var(--pt-secondary)] p-6 text-center"
            style={{ height: `${height}px` }}
          >
            <Code2 className="size-8" style={{ color: 'var(--pt-primary)' }} aria-hidden />
            <p className="text-sm font-semibold text-[var(--pt-text)]">كود HTML مخصص</p>
            <p className="font-mono text-xs text-[var(--pt-muted)]">{`${RLM}${html.length} حرفاً`}</p>
          </div>
        )}
      </div>
    </section>
  )
}
