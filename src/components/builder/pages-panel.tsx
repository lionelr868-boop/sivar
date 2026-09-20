'use client'

// لوحة الصفحات: قائمة الصفحات + مكونات الصفحة الحالية + إضافة/حذف/ترتيب
import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { addBlockToPage, addPageToSchema, deletePageFromSchema } from '@/lib/project/tools'
import { type AuthVariant, type BlockType, type PageType, PAGE_TYPE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  LogIn,
  Plus,
  Settings,
  Table2,
  Tag,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

const PAGE_ICONS: Record<PageType, React.ComponentType<{ className?: string }>> = {
  landing: Home,
  auth: LogIn,
  dashboard: LayoutDashboard,
  pricing: Tag,
  table: Table2,
  form: ClipboardList,
  settings: Settings,
  profile: User,
  faq: CircleHelp,
  custom: FileText,
}

const ADD_PAGE_OPTIONS: { type: PageType; authVariant?: AuthVariant; label: string; desc: string }[] = [
  { type: 'custom', label: 'صفحة فارغة', desc: 'ابدأ من الصفر' },
  { type: 'landing', label: 'Landing', desc: 'صفحة رئيسية تسويقية' },
  { type: 'dashboard', label: 'Dashboard', desc: 'لوحة تحكم بإحصائيات' },
  { type: 'pricing', label: 'Pricing', desc: 'باقات وأسعار' },
  { type: 'auth', authVariant: 'login', label: 'Login', desc: 'تسجيل الدخول' },
  { type: 'auth', authVariant: 'signup', label: 'Signup', desc: 'إنشاء حساب' },
  { type: 'settings', label: 'Settings', desc: 'صفحة إعدادات' },
  { type: 'profile', label: 'Profile', desc: 'الملف الشخصي' },
  { type: 'table', label: 'Table', desc: 'جدول بيانات' },
  { type: 'form', label: 'Form', desc: 'نموذج إدخال' },
  { type: 'faq', label: 'FAQ', desc: 'أسئلة شائعة' },
]

export function PagesPanel({ onNavigated }: { onNavigated?: () => void }) {
  const schema = useAppStore((s) => s.schema)
  const selectedPageId = useAppStore((s) => s.selectedPageId)
  const selectedBlockId = useAppStore((s) => s.selectedBlockId)
  const selectPage = useAppStore((s) => s.selectPage)
  const selectBlock = useAppStore((s) => s.selectBlock)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)

  const [addOpen, setAddOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const page = useMemo(() => schema?.pages.find((p) => p.id === selectedPageId) ?? null, [schema, selectedPageId])
  const entityKeys = useMemo(() => (schema ? Object.keys(schema.mockData.entities) : []), [schema])

  if (!schema) return null

  const handleAddBlock = (blockType: BlockType) => {
    if (!page) return
    try {
      let newId = ''
      applySchemaFn((s) => {
        const res = addBlockToPage(s, page.id, blockType)
        newId = res.blockId
        return res.schema
      })
      selectBlock(newId)
      toast.success(`تمت إضافة «${BLOCK_REGISTRY[blockType].label}»`)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const commitRename = () => {
    if (!renameTarget) return
    const name = renameDraft.trim()
    if (name) {
      applySchemaFn((s) => ({
        ...s,
        pages: s.pages.map((p) => (p.id === renameTarget ? { ...p, name, title: p.title ?? name } : p)),
      }))
    }
    setRenameTarget(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* الصفحات */}
      <div className="flex items-center justify-between px-3 pb-1.5 pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.pagesPanel}</h3>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          {t.builder.addPage}
        </Button>
      </div>

      <ul className="max-h-64 overflow-y-auto px-2 pb-2">
        {schema.pages.map((p) => {
          const Icon = PAGE_ICONS[p.type] ?? FileText
          const isActive = p.id === selectedPageId
          return (
            <li key={p.id} className="group/page">
              {renameTarget === p.id ? (
                <Input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenameTarget(null)
                  }}
                  className="h-9 text-sm"
                  aria-label={t.builder.renamePage}
                />
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-secondary font-medium text-secondary-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-start"
                    onClick={() => {
                      selectPage(p.id)
                      onNavigated?.()
                    }}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                  <button
                    type="button"
                    className="hidden rounded p-1 text-muted-foreground/70 hover:text-foreground group-hover/page:block"
                    onClick={() => {
                      setRenameTarget(p.id)
                      setRenameDraft(p.name)
                    }}
                    aria-label={t.builder.renamePage}
                  >
                    <FileText className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="hidden rounded p-1 text-muted-foreground/70 hover:text-destructive group-hover/page:block disabled:opacity-30"
                    onClick={() => setDeleteTarget(p.id)}
                    disabled={schema.pages.length <= 1}
                    aria-label={t.builder.deletePage}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* مكوّنات الصفحة الحالية */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col border-t">
        <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.builder.componentsPanel}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                <Plus className="size-3.5" />
                {t.builder.addBlock}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" align="start" className="w-60 max-h-96 overflow-y-auto">
              {(
                [
                  { key: 'marketing', label: t.builder.marketingBlocks },
                  { key: 'dashboard', label: t.builder.dashboardBlocks },
                  { key: 'auth', label: t.builder.authBlocks },
                  { key: 'states', label: t.builder.stateBlocks },
                ] as const
              ).map((group) => {
                const defs = Object.values(BLOCK_REGISTRY).filter((d) => d.category === group.key)
                if (!defs.length) return null
                return (
                  <DropdownMenuLabel key={group.key}>{group.label}</DropdownMenuLabel>
                )
              })}
              <DropdownMenuSeparator />
              {Object.values(BLOCK_REGISTRY)
                .sort((a, b) => a.category.localeCompare(b.category))
                .map((def) => (
                  <DropdownMenuItem key={def.type} onClick={() => handleAddBlock(def.type)} className="gap-2">
                    <span className="text-xs font-semibold text-primary">{def.label}</span>
                    <span className="truncate text-xs text-muted-foreground">{def.description}</span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {page && page.blocks.length > 0 ? (
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {page.blocks.map((block, idx) => {
              const def = BLOCK_REGISTRY[block.type]
              const isSel = block.id === selectedBlockId
              return (
                <li
                  key={block.id}
                  className={cn(
                    'group/blk mb-1 flex items-center gap-1 rounded-lg border px-2 py-1.5 text-sm transition-colors',
                    isSel ? 'border-primary/50 bg-secondary/70 font-medium' : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent/40'
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-start"
                    onClick={() => selectBlock(block.id)}
                    title={def?.description}
                  >
                    {def?.label ?? block.type}
                  </button>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-25"
                      disabled={idx === 0}
                      onClick={() =>
                        applySchemaFn((s) => ({
                          ...s,
                          pages: s.pages.map((pg) =>
                            pg.id === page.id
                              ? {
                                  ...pg,
                                  blocks: (() => {
                                    const blocks = [...pg.blocks]
                                    const [moved] = blocks.splice(idx, 1)
                                    blocks.splice(idx - 1, 0, moved)
                                    return blocks
                                  })(),
                                }
                              : pg
                          ),
                        }))
                      }
                      aria-label={t.builder.moveUp}
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-25"
                      disabled={idx === page.blocks.length - 1}
                      onClick={() =>
                        applySchemaFn((s) => ({
                          ...s,
                          pages: s.pages.map((pg) =>
                            pg.id === page.id
                              ? {
                                  ...pg,
                                  blocks: (() => {
                                    const blocks = [...pg.blocks]
                                    const [moved] = blocks.splice(idx, 1)
                                    blocks.splice(idx + 1, 0, moved)
                                    return blocks
                                  })(),
                                }
                              : pg
                          ),
                        }))
                      }
                      aria-label={t.builder.moveDown}
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground/60 hover:text-destructive"
                      onClick={() => {
                        applySchemaFn((s) => ({
                          ...s,
                          pages: s.pages.map((pg) => (pg.id === page.id ? { ...pg, blocks: pg.blocks.filter((b) => b.id !== block.id) } : pg)),
                        }))
                        if (isSel) selectBlock(null)
                      }}
                      aria-label={t.builder.deleteBlock}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mx-2 mb-3 rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">{t.builder.noBlocks}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{t.builder.noBlocksHint}</p>
          </div>
        )}
      </div>

      {/* نافذة إضافة صفحة */}
      <AddPageDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        entityKeys={entityKeys}
        onCreate={(opts) => {
          let pageId = ''
          applySchemaFn((s) => {
            const res = addPageToSchema(s, opts)
            pageId = res.pageId
            return res.schema
          })
          if (pageId) {
            selectPage(pageId)
            toast.success(`تمت إضافة «${opts.name}»`)
            onNavigated?.()
          }
        }}
      />

      {/* تأكيد حذف الصفحة */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.builder.deletePageTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.builder.deletePageDesc.replace('{name}', schema.pages.find((p) => p.id === deleteTarget)?.name ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  applySchemaFn((s) => deletePageFromSchema(s, deleteTarget))
                  if (deleteTarget === selectedPageId) {
                    const next = schema.pages.find((p) => p.id !== deleteTarget)
                    if (next) selectPage(next.id)
                  }
                }
                setDeleteTarget(null)
              }}
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AddPageDialog({
  open,
  onOpenChange,
  entityKeys,
  onCreate,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  entityKeys: string[]
  onCreate: (opts: { name: string; type: PageType; entity?: string; authVariant?: AuthVariant }) => void
}) {
  const [type, setType] = useState<PageType>('landing')
  const [authVariant, setAuthVariant] = useState<AuthVariant>('login')
  const [name, setName] = useState('')
  const [entity, setEntity] = useState<string>('')

  const selected = ADD_PAGE_OPTIONS.find((o) => o.type === type && (o.type !== 'auth' || o.authVariant === authVariant))
  const defaultName = selected?.label ?? ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.builder.addPageTitle}</DialogTitle>
          <DialogDescription>{t.builder.addPageSubtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ADD_PAGE_OPTIONS.map((opt) => {
            const isActive = opt.type === type && (opt.type !== 'auth' || opt.authVariant === authVariant)
            const Icon = PAGE_ICONS[opt.type]
            return (
              <button
                key={`${opt.type}-${opt.authVariant ?? 'x'}`}
                type="button"
                onClick={() => {
                  setType(opt.type)
                  if (opt.authVariant) setAuthVariant(opt.authVariant)
                  setName('')
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
                  isActive ? 'border-primary bg-secondary/70' : 'border-border hover:bg-accent/50'
                )}
              >
                <Icon className={cn('size-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{opt.desc}</span>
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-page-name">{t.builder.pageName}</Label>
            <Input
              id="new-page-name"
              value={name}
              placeholder={defaultName}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {type === 'table' && entityKeys.length > 0 ? (
            <div className="space-y-1.5">
              <Label>{t.builder.tableEntity}</Label>
              <Select value={entity || entityKeys[0]} onValueChange={setEntity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {entityKeys.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={() => {
              onCreate({
                name: name.trim() || defaultName,
                type,
                authVariant: type === 'auth' ? authVariant : undefined,
                entity: type === 'table' ? entity || entityKeys[0] : undefined,
              })
              onOpenChange(false)
              setName('')
              setEntity('')
            }}
          >
            {t.builder.createPageBtn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ADD_PAGE_OPTIONS }
export type { PageType }
