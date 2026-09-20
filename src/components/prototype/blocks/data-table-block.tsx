'use client'

// ============================================================
// SIVAR — جدول البيانات: كيان حقيقي + بحث + ترقيم صفحات
// ============================================================
import { type ReactElement, useMemo, useState } from 'react'
import type { Block, EntityColumn, EntityData } from '@/lib/types'
import { Search } from 'lucide-react'
import { num } from '@/lib/content/mock-data'
import { ENTITY_LABELS } from '@/lib/content/mock-data'
import { PAvatar } from '../ui/p-avatar'
import { PBadge } from '../ui/p-badge'
import { PEmptyState } from '../ui/p-states'
import { PPagination } from '../ui/p-pagination'
import { N, S, type BlockCtx } from './shared'

// خريطة الحالات الدلالية (العقد المثبّت + امتدادات منطقية)
const STATUS_TONES: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  // success
  مكتمل: 'success',
  نشط: 'success',
  مدفوع: 'success',
  متاح: 'success',
  مؤكد: 'success',
  نشطة: 'success',
  // warning
  جديد: 'warning',
  'قيد المعالجة': 'warning',
  معلق: 'warning',
  'معلّقة': 'warning',
  'قيد المراجعة': 'warning',
  متأخرة: 'warning',
  // danger
  ملغى: 'danger',
  فاشل: 'danger',
  ملغاة: 'danger',
  نفد: 'danger',
  'نفد المخزون': 'danger',
  متوقف: 'danger',
  موقوفة: 'danger',
  'غير نشط': 'danger',
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'default' {
  return STATUS_TONES[status] ?? 'default'
}

/** خلية واحدة حسب نوع العمود */
function Cell({ col, value }: { col: EntityColumn; value: unknown }): ReactElement {
  switch (col.type) {
    case 'avatar':
      return (
        <span className="flex items-center gap-2.5">
          <PAvatar name={typeof value === 'string' ? value : ''} size={32} />
          <span className="text-sm font-semibold text-[var(--pt-text)]">{typeof value === 'string' ? value : '—'}</span>
        </span>
      )
    case 'badge':
      return <PBadge tone={statusTone(String(value ?? ''))}>{String(value ?? '—')}</PBadge>
    case 'currency':
      return (
        <span className="whitespace-nowrap text-sm font-bold text-[var(--pt-text)]">
          {num(Number(value) || 0)} <span className="text-[11px] font-medium text-[var(--pt-muted)]">دج</span>
        </span>
      )
    case 'number':
      return <span className="text-sm text-[var(--pt-text)]">{num(Number(value) || 0)}</span>
    case 'progress': {
      const v = Math.max(0, Math.min(100, Number(value) || 0))
      return (
        <span className="flex min-w-24 items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--pt-secondary)]" aria-hidden>
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{ width: `${v}%`, background: 'var(--pt-primary)' }}
            />
          </span>
          <span className="text-xs font-semibold text-[var(--pt-muted)]">{v}%</span>
        </span>
      )
    }
    case 'email':
    case 'phone':
      return (
        <span dir="ltr" className="block text-start text-[13px] text-[var(--pt-muted)]">
          {String(value ?? '—')}
        </span>
      )
    case 'date':
      return <span className="whitespace-nowrap text-[13px] text-[var(--pt-muted)]">{String(value ?? '—')}</span>
    default:
      return <span className="text-sm text-[var(--pt-text)]">{String(value ?? '—')}</span>
  }
}

export function DataTableBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const entityKey = S(p, 'entity', 'customers')
  const title = S(p, 'title')
  const pageSize = Math.max(3, Math.min(20, N(p, 'pageSize', 5)))

  const entity: EntityData | undefined = ctx.schema.mockData.entities[entityKey]
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const columns = entity?.columns ?? []
  const rows = entity?.rows ?? []

  const filtered = useMemo(() => {
    const own = query.trim().toLowerCase()
    const topbar = (ctx.tableSearch ?? '').trim().toLowerCase()
    if (!own && !topbar) return rows
    return rows.filter(
      (row) =>
        (!own || columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(own))) &&
        (!topbar || columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(topbar))),
    )
  }, [rows, columns, query, ctx.tableSearch])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const headerTitle = title || ENTITY_LABELS[entityKey] || 'البيانات'

  return (
    <div
      className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
      style={{ boxShadow: 'var(--pt-shadow)' }}
    >
      {/* الترويسة + البحث */}
      <div className="flex flex-col gap-3 border-b border-[var(--pt-border)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <h3 className="text-sm font-bold text-[var(--pt-text)]">{headerTitle}</h3>
        {rows.length > 0 ? (
          <div className="relative sm:w-64">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--pt-muted)]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="بحث..."
              aria-label="بحث في الجدول"
              className="w-full min-h-10 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] py-2 pe-3 ps-9 text-sm text-[var(--pt-text)] placeholder:text-[var(--pt-muted)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]"
            />
          </div>
        ) : null}
      </div>

      {/* الجدول */}
      {!entity || rows.length === 0 ? (
        <PEmptyState title="لا توجد بيانات" subtitle="ستظهر العناصر هنا بعد إضافتها أو توليدها." />
      ) : filtered.length === 0 ? (
        <PEmptyState title="لا نتائج مطابقة" subtitle={`لم نجد أي صف يطابق «${query || ctx.tableSearch}». جرّب كلمة أخرى.`} />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-start">
              <thead>
                <tr className="border-b border-[var(--pt-border)] bg-[var(--pt-secondary)]">
                  {columns.map((col, i) => (
                    <th
                      key={`${col.key}-${i}`}
                      scope="col"
                      className="px-4 py-3 text-start text-xs font-bold whitespace-nowrap text-[var(--pt-muted)] md:px-5"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pt-border)]">
                {visible.map((row, r) => (
                  <tr key={r} className="transition-colors duration-100 hover:bg-[var(--pt-secondary)]">
                    {columns.map((col, c) => (
                      <td key={`${col.key}-${c}`} className="px-4 py-3 align-middle md:px-5">
                        <Cell col={col} value={row[col.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* التذييل: عدد + ترقيم */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--pt-border)] px-4 py-3.5 sm:flex-row md:px-5">
            <p className="text-xs text-[var(--pt-muted)]">
              عرض {visible.length} من {filtered.length} صف
              {query ? ` (المجموع الكلي: ${rows.length})` : ''}
            </p>
            <PPagination page={safePage} pageCount={pageCount} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
