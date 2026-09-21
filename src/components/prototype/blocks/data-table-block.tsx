'use client'

// ============================================================
// SIVAR — جدول البيانات: كيان حقيقي + بحث + ترقيم صفحات
// الجولة 15 — إدارة كاملة من لوحة تحكم الموقع نفسه:
// زر «إضافة» + تعديل/حذف لكل صف عبر نافذة نموذج تُبنى من أعمدة
// الكيان. كل عملية تمرّ عبر ctx.onEntityRowChange فتحدّث المخطط
// وتتزامن مع أقسام الموقع المقابلة (معرض/فريق) فوراً.
// ============================================================
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import type { Block, EntityColumn, EntityData } from '@/lib/types'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { num, ENTITY_LABELS, ENTITY_SINGULARS, BADGE_SUGGESTIONS, DEMO_CLIENT_NAME } from '@/lib/content/mock-data'
import { PAvatar } from '../ui/p-avatar'
import { PBadge } from '../ui/p-badge'
import { PButton } from '../ui/p-button'
import { PEmptyState } from '../ui/p-states'
import { PPagination } from '../ui/p-pagination'
import { N, S, B, type BlockCtx } from './shared'

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

// ============================================================
// (الجولة 15) نافذة إضافة/تعديل صف — حقول تُبنى من أعمدة الكيان
// ============================================================

const inputClass =
  'w-full min-h-11 rounded-[calc(var(--pt-radius)-2px)] border border-[var(--pt-border)] bg-[var(--pt-bg)] px-3.5 py-2.5 text-sm text-[var(--pt-text)] transition-colors duration-150 focus:border-[var(--pt-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--pt-primary)]'

/** هل العمود نصي الإدخال؟ (رقمي/شارة تُعالج خاصاً) */
const TEXTUAL = new Set(['text', 'avatar', 'date', 'badge', 'email', 'phone'])

function FieldInput({
  col,
  value,
  onChange,
  autoFocus,
}: {
  col: EntityColumn
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}): ReactElement {
  const id = `ef-${col.key}`
  if (col.type === 'number' || col.type === 'currency' || col.type === 'progress') {
    return (
      <input
        id={id}
        type="number"
        inputMode="decimal"
        dir="ltr"
        className={`${inputClass} text-start`}
        value={value}
        autoFocus={autoFocus}
        min={col.type === 'progress' ? 0 : undefined}
        max={col.type === 'progress' ? 100 : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <>
      <input
        id={id}
        type="text"
        list={col.type === 'badge' ? 'ef-badges' : undefined}
        dir={col.type === 'email' || col.type === 'phone' ? 'ltr' : undefined}
        className={`${inputClass} ${col.type === 'email' || col.type === 'phone' ? 'text-start' : ''}`}
        value={value}
        autoFocus={autoFocus}
        placeholder={col.type === 'date' ? 'مثال: 15 جانفي 2025' : col.type === 'badge' ? 'مثال: نشط' : ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {col.type === 'badge' ? (
        <datalist id="ef-badges">
          {BADGE_SUGGESTIONS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      ) : null}
    </>
  )
}

function RowDialog({
  entityLabel,
  columns,
  initial,
  index,
  onClose,
  onSubmit,
}: {
  /** مفرد الكيان (منتج/خدمة/...) */
  entityLabel: string
  columns: EntityColumn[]
  /** قيم البداية (تعديل) أو فارغة (إضافة) */
  initial: Record<string, string>
  /** فهرس الصف عند التعديل — null عند الإضافة */
  index: number | null
  onClose: () => void
  onSubmit: (row: Record<string, unknown>) => void
}): ReactElement {
  const [values, setValues] = useState<Record<string, string>>(initial)
  const firstRef = useRef<HTMLDivElement | null>(null)

  // تركيز أول حقل عند الفتح + إغلاق بمفتاح Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const focusable = firstRef.current?.querySelector<HTMLElement>('input, select')
    focusable?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const requiredCol = columns.find((c) => c.type === 'text' || c.type === 'avatar')
  const requiredMissing = requiredCol ? !(values[requiredCol.key] ?? '').trim() : false

  const save = () => {
    if (requiredMissing) return
    const row: Record<string, unknown> = {}
    for (const col of columns) {
      const raw = (values[col.key] ?? '').trim()
      if (col.type === 'number' || col.type === 'currency' || col.type === 'progress') {
        row[col.key] = Number(raw) || 0
      } else {
        row[col.key] = raw
      }
    }
    onSubmit(row)
  }

  const title = index == null ? `إضافة ${entityLabel} جديد` : `تعديل ${entityLabel}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rowdlg-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
        }}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-5 shadow-2xl md:p-6"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        <h3 id="rowdlg-title" className="text-base font-extrabold text-[var(--pt-text)] md:text-lg">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[var(--pt-muted)]">
          يُحدَّث الجدول وقسم الموقع المقابل تلقائياً عند الحفظ.
        </p>

        <form
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          {columns.map((col, i) => {
            const required = requiredCol?.key === col.key
            return (
              <div key={col.key} ref={i === 0 ? firstRef : undefined} className={TEXTUAL.has(col.type) ? '' : 'sm:col-span-1'}>
                <label htmlFor={`ef-${col.key}`} className="mb-1.5 block text-sm font-semibold text-[var(--pt-text)]">
                  {col.label}
                  {required ? <span className="ms-1 text-[var(--pt-primary)]">*</span> : null}
                </label>
                <FieldInput
                  col={col}
                  value={values[col.key] ?? ''}
                  autoFocus={i === 0}
                  onChange={(v) => setValues((prev) => ({ ...prev, [col.key]: v }))}
                />
              </div>
            )
          })}
          <div className="col-span-full mt-1 flex items-center justify-end gap-3">
            <PButton variant="outline" onClick={onClose}>
              إلغاء
            </PButton>
            <PButton type="submit" disabled={requiredMissing}>
              {index == null ? 'إضافة' : 'حفظ التعديلات'}
            </PButton>
          </div>
        </form>
      </div>
    </div>
  )
}

/** نافذة تأكيد حذف صف */
function DeleteDialog({
  entityLabel,
  name,
  onClose,
  onConfirm,
}: {
  entityLabel: string
  name: string
  onClose: () => void
  onConfirm: () => void
}): ReactElement {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose} role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deldlg-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)] p-5 md:p-6"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        <h3 id="deldlg-title" className="text-base font-extrabold text-[var(--pt-text)]">
          حذف {entityLabel}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--pt-muted)]">
          هل تريد حذف «{name}»؟ سيُحذف العنصر المقابل من قسم الموقع أيضاً.
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <PButton variant="outline" onClick={onClose}>
            إلغاء
          </PButton>
          <PButton
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
          >
            حذف
          </PButton>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// الجدول
// ============================================================

export function DataTableBlock({ block, ctx }: { block: Block; ctx: BlockCtx }): ReactElement {
  const p = block.props
  const entityKey = S(p, 'entity', 'customers')
  const title = S(p, 'title')
  const pageSize = Math.max(3, Math.min(20, N(p, 'pageSize', 5)))
  // (الجولة 16) وضع الزبون: جدول «طلباتي» للقراءة فقط — صفوف الزبونة فقط
  const clientView = B(p, 'clientView', false)

  const entity: EntityData | undefined = ctx.schema.mockData.entities[entityKey]
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  // (الجولة 15) حالة نوافذ الإدارة — متوفرة فقط في المعاينة التفاعلية
  // (الجولة 16) وضع الزبون للقراءة فقط — لا إضافة ولا تعديل ولا حذف
  const canManage = !clientView && !!ctx.onEntityRowChange && !!entity && entity.columns.length > 0
  const [editing, setEditing] = useState<{ index: number | null } | null>(null)
  const [deleting, setDeleting] = useState<{ index: number; name: string } | null>(null)

  const columns = entity?.columns ?? []
  // (الجولة 16) في وضع الزبون: إن كان للكيان عمود avatar فصفوف الزبونة
  // التجريبية فقط (أمينة بلقاسم) — بلا عمود أو صفر مطابقة تُظهر كل الصفوف
  const rows = useMemo(() => {
    const all = entity?.rows ?? []
    if (!clientView) return all
    const avatarCol = columns.find((c) => c.type === 'avatar')
    if (!avatarCol) return all
    const mine = all.filter((row) => row[avatarCol.key] === DEMO_CLIENT_NAME)
    return mine.length > 0 ? mine : all
  }, [entity, columns, clientView])

  const filtered = useMemo(() => {
    const own = query.trim().toLowerCase()
    const topbar = (ctx.tableSearch ?? '').trim().toLowerCase()
    const indexed = rows.map((row, idx) => ({ row, idx }))
    if (!own && !topbar) return indexed
    return indexed.filter(
      ({ row }) =>
        (!own || columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(own))) &&
        (!topbar || columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(topbar))),
    )
  }, [rows, columns, query, ctx.tableSearch])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const headerTitle = title || ENTITY_LABELS[entityKey] || 'البيانات'
  const singular = ENTITY_SINGULARS[entityKey] || ENTITY_LABELS[entityKey] || 'عنصر'
  const nameColKey = columns.find((c) => c.type === 'text' || c.type === 'avatar')?.key ?? columns[0]?.key ?? 'name'

  /** إرسال عملية إلى المخطط (إضافة/تعديل) */
  const submitRow = (row: Record<string, unknown>) => {
    if (!ctx.onEntityRowChange) return
    ctx.onEntityRowChange(entityKey, { op: 'upsert', index: editing?.index ?? null, row })
    setEditing(null)
  }

  const iconBtnClass =
    'inline-flex size-8 cursor-pointer items-center justify-center rounded-[calc(var(--pt-radius)-4px)] border border-transparent text-[var(--pt-muted)] transition-colors duration-150 hover:border-[var(--pt-border)] hover:bg-[var(--pt-secondary)] hover:text-[var(--pt-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pt-primary)]'

  // كيان غير معرّف: حالة فارغة (لا أعمدة = لا إدارة)
  if (!entity || columns.length === 0) {
    return (
      <div
        className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
        style={{ boxShadow: 'var(--pt-shadow)' }}
      >
        <PEmptyState title="لا توجد بيانات" subtitle="ستظهر العناصر هنا بعد إضافتها أو توليدها." />
      </div>
    )
  }

  return (
    <div
      className="rounded-[var(--pt-radius)] border border-[var(--pt-border)] bg-[var(--pt-surface)]"
      style={{ boxShadow: 'var(--pt-shadow)' }}
    >
      {/* الترويسة + البحث + زر الإضافة */}
      <div className="flex flex-col gap-3 border-b border-[var(--pt-border)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <h3 className="text-sm font-bold text-[var(--pt-text)]">{headerTitle}</h3>
        <div className="flex items-center gap-2.5">
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
          {canManage ? (
            <PButton size="sm" onClick={() => setEditing({ index: null })}>
              <Plus aria-hidden className="size-4" />
              إضافة {singular}
            </PButton>
          ) : null}
        </div>
      </div>

      {/* الجدول */}
      {rows.length === 0 ? (
        <PEmptyState
          title={`لا يوجد ${singular} بعد`}
          subtitle={canManage ? 'اضغط «الإضافة» بالأعلى لإضافة أول عنصر من هنا مباشرة.' : 'ستظهر العناصر هنا بعد إضافتها أو توليدها.'}
        />
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
                  {canManage ? (
                    <th scope="col" className="px-4 py-3 text-start text-xs font-bold whitespace-nowrap text-[var(--pt-muted)] md:px-5">
                      إجراءات
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pt-border)]">
                {visible.map(({ row, idx }) => (
                  <tr key={idx} className="transition-colors duration-100 hover:bg-[var(--pt-secondary)]">
                    {columns.map((col, c) => (
                      <td key={`${col.key}-${c}`} className="px-4 py-3 align-middle md:px-5">
                        <Cell col={col} value={row[col.key]} />
                      </td>
                    ))}
                    {canManage ? (
                      <td className="px-4 py-3 align-middle md:px-5">
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`تعديل ${String(row[nameColKey] ?? singular)}`}
                            title="تعديل"
                            className={iconBtnClass}
                            onClick={() => setEditing({ index: idx })}
                          >
                            <Pencil aria-hidden className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`حذف ${String(row[nameColKey] ?? singular)}`}
                            title="حذف"
                            className={`${iconBtnClass} hover:text-red-600`}
                            onClick={() => setDeleting({ index: idx, name: String(row[nameColKey] ?? '') })}
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        </span>
                      </td>
                    ) : null}
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

      {/* (الجولة 15) نوافذ الإدارة */}
      {canManage && editing ? (
        <RowDialog
          entityLabel={singular}
          columns={columns}
          index={editing.index}
          initial={Object.fromEntries(
            columns.map((col) => {
              const v = editing.index != null ? rows[editing.index]?.[col.key] : undefined
              return [col.key, v == null ? '' : String(v)]
            }),
          )}
          onClose={() => setEditing(null)}
          onSubmit={submitRow}
        />
      ) : null}
      {canManage && deleting ? (
        <DeleteDialog
          entityLabel={singular}
          name={deleting.name || singular}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            ctx.onEntityRowChange?.(entityKey, { op: 'delete', index: deleting.index })
            setDeleting(null)
          }}
        />
      ) : null}
    </div>
  )
}
