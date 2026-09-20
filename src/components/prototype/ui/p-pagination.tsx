'use client'
import type { ReactElement } from 'react'

// ============================================================
// نموذج — PPagination: ترقيم صفحات بعناوين عربية
// ============================================================
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** يبني قائمة أرقام صفحات مضغوطة (مع فواصل …) */
function pageSequence(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const out: Array<number | '…'> = [1]
  const from = Math.max(2, page - 1)
  const to = Math.min(pageCount - 1, page + 1)
  if (from > 2) out.push('…')
  for (let p = from; p <= to; p++) out.push(p)
  if (to < pageCount - 1) out.push('…')
  out.push(pageCount)
  return out
}

export function PPagination({
  page,
  pageCount,
  onPage,
  className = '',
}: {
  page: number
  pageCount: number
  onPage: (page: number) => void
  className?: string
}): ReactElement | null {
  if (pageCount <= 1) return null
  const safePage = Math.max(1, Math.min(page, pageCount))
  const btnBase =
    'inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-2px)] border px-2.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

  return (
    <nav aria-label="ترقيم الصفحات" className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        disabled={safePage <= 1}
        onClick={() => onPage(safePage - 1)}
        aria-label="الصفحة السابقة"
        className={`${btnBase} border-[var(--pt-border)] bg-[var(--pt-surface)] text-[var(--pt-text)] hover:bg-[var(--pt-secondary)] disabled:opacity-40 disabled:pointer-events-none`}
      >
        <ChevronRight aria-hidden className="size-4" />
        <span className="hidden sm:inline">السابق</span>
      </button>

      {pageSequence(safePage, pageCount).map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={`p-${p}`}
            type="button"
            aria-current={p === safePage ? 'page' : undefined}
            onClick={() => onPage(p)}
            className={`${btnBase} ${
              p === safePage
                ? 'border-[var(--pt-primary)] bg-[var(--pt-primary)] font-bold text-[var(--pt-primary-fg)]'
                : 'border-[var(--pt-border)] bg-[var(--pt-surface)] text-[var(--pt-text)] hover:bg-[var(--pt-secondary)]'
            }`}
          >
            {p}
          </button>
        ) : (
          <span key={`${p}-${i}`} aria-hidden className="px-1 text-[var(--pt-muted)]">
            …
          </span>
        ),
      )}

      <button
        type="button"
        disabled={safePage >= pageCount}
        onClick={() => onPage(safePage + 1)}
        aria-label="الصفحة التالية"
        className={`${btnBase} border-[var(--pt-border)] bg-[var(--pt-surface)] text-[var(--pt-text)] hover:bg-[var(--pt-secondary)] disabled:opacity-40 disabled:pointer-events-none`}
      >
        <span className="hidden sm:inline">التالي</span>
        <ChevronLeft aria-hidden className="size-4" />
      </button>
    </nav>
  )
}
