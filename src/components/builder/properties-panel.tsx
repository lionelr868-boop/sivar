'use client'

// لوحة الخصائص: محرّر بصري لمكوّنات الصفحة (المحتوى/التخطيط/المظهر)
// + إعدادات الصفحة عند عدم تحديد مكوّن
import { useEffect, useMemo, useState } from 'react'
import { useAppStore, findBlock, findPage } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { type FieldDefinition, BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { updateBlockPropsInSchema } from '@/lib/project/tools'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MousePointerClick, MoveDown, MoveUp, Trash2 } from 'lucide-react'

const LAYOUT_KEYS = new Set([
  'layout', 'columns', 'align', 'background', 'variant', 'position', 'pageSize', 'chartType', 'dataKey', 'mode', 'radius', 'shadow', 'fontFamily',
])
const APPEARANCE_KEYS = new Set(['color', 'bg', 'background2', 'border', 'style', 'theme'])

function fieldGroup(field: FieldDefinition): 'content' | 'layout' | 'appearance' {
  if (LAYOUT_KEYS.has(field.key)) return 'layout'
  if (APPEARANCE_KEYS.has(field.key)) return 'appearance'
  if (field.type === 'list') return 'content'
  return 'content'
}

export function PropertiesPanel() {
  const schema = useAppStore((s) => s.schema)
  const selectedPageId = useAppStore((s) => s.selectedPageId)
  const selectedBlockId = useAppStore((s) => s.selectedBlockId)
  const selectBlock = useAppStore((s) => s.selectBlock)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)

  const page = useMemo(() => findPage(schema, selectedPageId), [schema, selectedPageId])
  const block = useMemo(() => findBlock(schema, selectedPageId, selectedBlockId), [schema, selectedPageId, selectedBlockId])
  const def = block ? BLOCK_REGISTRY[block.type] : undefined

  if (!schema || !page) return null

  // ===== إعدادات الصفحة (لا مكوّن محدد) =====
  if (!block || !def) {
    const showTitleFields = ['dashboard', 'table', 'form', 'settings', 'profile', 'pricing', 'faq', 'custom'].includes(page.type)
    return (
      <div className="space-y-4 p-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <MousePointerClick className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">{t.builder.noSelection}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">{t.builder.noSelectionHint}</p>
        </div>

        <PageSettingsCard key={page.id} />
        {showTitleFields ? null : null}
      </div>
    )
  }

  // ===== خصائص المكوّن =====
  const groups: { id: 'content' | 'layout' | 'appearance'; label: string; fields: FieldDefinition[] }[] = [
    { id: 'content', label: t.builder.contentSection, fields: [] },
    { id: 'layout', label: t.builder.layoutSection, fields: [] },
    { id: 'appearance', label: t.builder.appearanceSection, fields: [] },
  ]
  for (const f of def.fields) {
    groups.find((g) => g.id === fieldGroup(f))?.fields.push(f)
  }

  const setProps = (patch: Record<string, unknown>) => {
    applySchemaFn((s) => updateBlockPropsInSchema(s, page.id, block.id, patch))
  }

  const blockIdx = page.blocks.findIndex((b) => b.id === block.id)

  return (
    <div className="space-y-4 p-3">
      {/* رأس المكوّن */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold">{def.label}</h4>
            <p className="truncate text-[11px] text-muted-foreground">{def.description}</p>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon" className="size-8" disabled={blockIdx <= 0}
              onClick={() =>
                applySchemaFn((s) => ({
                  ...s,
                  pages: s.pages.map((pg) =>
                    pg.id === page.id ? { ...pg, blocks: moveItem(pg.blocks, blockIdx, blockIdx - 1) } : pg
                  ),
                }))
              }
              aria-label={t.builder.moveUp}>
              <MoveUp className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" disabled={blockIdx >= page.blocks.length - 1}
              onClick={() =>
                applySchemaFn((s) => ({
                  ...s,
                  pages: s.pages.map((pg) =>
                    pg.id === page.id ? { ...pg, blocks: moveItem(pg.blocks, blockIdx, blockIdx + 1) } : pg
                  ),
                }))
              }
              aria-label={t.builder.moveDown}>
              <MoveDown className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive"
              onClick={() => {
                applySchemaFn((s) => ({
                  ...s,
                  pages: s.pages.map((pg) =>
                    pg.id === page.id ? { ...pg, blocks: pg.blocks.filter((b) => b.id !== block.id) } : pg
                  ),
                }))
                selectBlock(null)
              }}
              aria-label={t.builder.deleteBlock}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {groups.map((g) =>
        g.fields.length > 0 ? (
          <section key={g.id} className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</h4>
            <div className="space-y-3 rounded-xl border bg-card p-3">
              {g.fields.map((field) => (
                <FieldEditor key={`${block.id}-${field.key}`} field={field} value={block.props[field.key]} onCommit={setProps} />
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  )
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

// ============================================================
// محرّر حقل واحد (نص يُحفظ عند الخروج، والبقية فورًا)
// ============================================================
function FieldEditor({
  field,
  value,
  onCommit,
}: {
  field: FieldDefinition
  value: unknown
  onCommit: (patch: Record<string, unknown>) => void
}) {
  if (field.type === 'list') {
    const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
    return (
      <ListEditor
        field={field}
        items={items}
        onChange={(next) => onCommit({ [field.key]: next })}
      />
    )
  }

  return <SimpleField field={field} value={value} onCommit={onCommit} />
}

function SimpleField({
  field,
  value,
  onCommit,
}: {
  field: FieldDefinition
  value: unknown
  onCommit: (patch: Record<string, unknown>) => void
}) {
  const [draft, setDraft] = useState(() => valueToString(value, field.type))
  const [lastValue, setLastValue] = useState<unknown>(value)

  // مزامنة عند تغيّر القيمة الخارجية (نمط التعديل أثناء العرض — بدون effect)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(valueToString(value, field.type))
  }

  // حقل قائمة متداخل (نادرًا داخل عناصر القوائم)
  if (field.type === 'list') {
    const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []
    return <ListEditor field={field} items={items} onChange={(next) => onCommit({ [field.key]: next })} />
  }

  const commit = () => {
    const cleaned = draft.trim()
    const current = valueToString(value, field.type)
    if (cleaned === current) return
    if (field.type === 'number') {
      const n = Number(cleaned)
      onCommit({ [field.key]: Number.isFinite(n) ? n : 0 })
    } else {
      onCommit({ [field.key]: cleaned })
    }
  }

  if (field.type === 'switch') {
    const checked = value === true || value === 'true'
    return (
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs font-normal">{field.label}</Label>
        <Switch checked={checked} onCheckedChange={(c) => onCommit({ [field.key]: c })} aria-label={field.label} />
      </div>
    )
  }

  if (field.type === 'select') {
    const current = typeof value === 'string' ? value : (field.options?.[0]?.value ?? '')
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <Select value={current} onValueChange={(v) => onCommit({ [field.key]: v })}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (field.type === 'color') {
    const hex = typeof draft === 'string' && /^#[0-9a-fA-F]{6}$/.test(draft) ? draft : '#7c3aed'
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              setDraft(e.target.value)
              onCommit({ [field.key]: e.target.value })
            }}
            className="size-9 shrink-0 cursor-pointer rounded-md border bg-card p-1"
            aria-label={field.label}
          />
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} className="h-9 font-mono text-xs" dir="ltr" />
        </div>
      </div>
    )
  }

  if (field.type === 'code') {
    const charCount = typeof draft === 'string' ? draft.length : 0
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">{t.builder.codeFieldHint}</p>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
            <span dir="ltr">{charCount.toLocaleString('en-US')}</span> {t.builder.charsUnit}
          </span>
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={12}
          dir="ltr"
          spellCheck={false}
          className="min-h-[220px] bg-muted/40 font-mono text-xs leading-relaxed"
          aria-label={field.label}
        />
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} rows={3} className="min-h-20 text-xs leading-relaxed" />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      <Input
        value={draft}
        type={field.type === 'number' ? 'number' : 'text'}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
        className="h-9 text-xs"
      />
    </div>
  )
}

// ============================================================
// محرّر القوائم (عناصر قابلة للإضافة/الحذف/الترتيب)
// ============================================================
function ListEditor({
  field,
  items,
  onChange,
}: {
  field: Extract<FieldDefinition, { type: 'list' }>
  items: Array<Record<string, unknown>>
  onChange: (next: Array<Record<string, unknown>>) => void
}) {
  const update = (idx: number, key: string, val: unknown) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [key]: val } : it))
    onChange(next)
  }
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx))
  const move = (idx: number, to: number) => {
    if (to < 0 || to >= items.length) return
    onChange(moveItem(items, idx, to))
  }
  const add = () => {
    const blank: Record<string, unknown> = {}
    for (const f of field.itemFields) {
      blank[f.key] = f.type === 'number' ? 0 : f.type === 'switch' ? false : ''
    }
    onChange([...items, blank])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{field.label}</Label>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={add}>
          + {field.itemLabel ?? t.common.create}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed px-2 py-3 text-center text-[11px] text-muted-foreground">—</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/40 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {field.itemLabel ?? t.common.create} {idx + 1}
                </span>
                <span className="flex gap-0.5">
                  <button type="button" onClick={() => move(idx, idx - 1)} disabled={idx === 0} className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-25" aria-label={t.builder.moveUp}>
                    <MoveUp className="size-3" />
                  </button>
                  <button type="button" onClick={() => move(idx, idx + 1)} disabled={idx === items.length - 1} className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-25" aria-label={t.builder.moveDown}>
                    <MoveDown className="size-3" />
                  </button>
                  <button type="button" onClick={() => remove(idx)} className="rounded p-0.5 text-muted-foreground/60 hover:text-destructive" aria-label={t.common.delete}>
                    <Trash2 className="size-3" />
                  </button>
                </span>
              </div>
              <div className="space-y-2">
                {field.itemFields.map((f) => (
                  <SimpleField key={f.key} field={f} value={item[f.key]} onCommit={(patch) => update(idx, f.key, patch[f.key])} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// إعدادات الصفحة
// ============================================================
function PageSettingsCard() {
  const schema = useAppStore((s) => s.schema)
  const selectedPageId = useAppStore((s) => s.selectedPageId)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)
  const page = findPage(schema, selectedPageId)

  const [name, setName] = useState(page?.name ?? '')
  const [title, setTitle] = useState(page?.title ?? '')
  const [subtitle, setSubtitle] = useState(page?.subtitle ?? '')

  // مزامنة عند تبديل الصفحة (نمط التعديل أثناء العرض — بدون effect)
  const syncKey = `${page?.id ?? ''}|${page?.name ?? ''}|${page?.title ?? ''}|${page?.subtitle ?? ''}`
  const [prevKey, setPrevKey] = useState(syncKey)
  if (syncKey !== prevKey) {
    setPrevKey(syncKey)
    setName(page?.name ?? '')
    setTitle(page?.title ?? '')
    setSubtitle(page?.subtitle ?? '')
  }

  if (!schema || !page) return null

  const patch = (p: Partial<typeof page>) =>
    applySchemaFn((s) => ({ ...s, pages: s.pages.map((pg) => (pg.id === page.id ? { ...pg, ...p } : pg)) }))

  return (
    <section className="space-y-3 rounded-xl border bg-card p-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.pageSettings}</h4>
      <div className="space-y-1.5">
        <Label className="text-xs">{t.builder.pageName}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== page.name && patch({ name: name.trim() })} className="h-9 text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">{t.builder.pageTitle}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== (page.title ?? '') && patch({ title })} className="h-9 text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">{t.builder.pageSubtitle}</Label>
        <Textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} onBlur={() => subtitle !== (page.subtitle ?? '') && patch({ subtitle })} rows={2} className="min-h-16 text-xs" />
      </div>
    </section>
  )
}

function valueToString(value: unknown, type: string): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return String(value)
  return type === 'number' ? '0' : ''
}

export { cn }
