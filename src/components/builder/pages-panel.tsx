'use client'

// لوحة الصفحات: قائمة الصفحات + مكونات الصفحة الحالية + إضافة/حذف/ترتيب
// + مكتبة أنماط صفحات الهبوط (12 نمطاً) + صفحات HTML المخصصة (لصق/رفع/مكتبة)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { BLOCK_REGISTRY } from '@/lib/registry/blocks'
import { addBlockToPage, addHtmlPageToSchema, addPageToSchema, deletePageFromSchema } from '@/lib/project/tools'
import { changeLandingVariant, getLandingVariant, LANDING_VARIANTS } from '@/lib/project/landing-kit'
import type { LandingVariantMeta } from '@/lib/project/landing-kit'
import { LandingVariantThumb } from '@/components/platform/templates-library/landing-variant-thumb'
import {
  type AuthVariant,
  type BlockType,
  type HtmlSnippetDTO,
  type LandingVariantId,
  type PageType,
  type ProjectPage,
  HTML_SNIPPET_KIND_LABELS,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  ClipboardList,
  Code2,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  LogIn,
  Plus,
  Settings,
  Table2,
  Tag,
  Trash2,
  Upload,
  User,
  Wand2,
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

type AddPageOption =
  | { kind: 'page'; type: PageType; authVariant?: AuthVariant; label: string; desc: string; icon: LucideIcon }
  | { kind: 'html'; label: string; desc: string; icon: LucideIcon }

const ADD_PAGE_OPTIONS: AddPageOption[] = [
  { kind: 'page', type: 'custom', label: t.builder.pageTypeBlank, desc: t.builder.pageTypeCustomDesc, icon: FileText },
  { kind: 'page', type: 'landing', label: 'Landing', desc: t.builder.pageTypeLandingDesc, icon: Home },
  { kind: 'page', type: 'dashboard', label: 'Dashboard', desc: t.builder.pageTypeDashboardDesc, icon: LayoutDashboard },
  { kind: 'page', type: 'pricing', label: 'Pricing', desc: t.builder.pageTypePricingDesc, icon: Tag },
  { kind: 'page', type: 'auth', authVariant: 'login', label: 'Login', desc: t.builder.pageTypeLoginDesc, icon: LogIn },
  { kind: 'page', type: 'auth', authVariant: 'signup', label: 'Signup', desc: t.builder.pageTypeSignupDesc, icon: LogIn },
  { kind: 'page', type: 'settings', label: 'Settings', desc: t.builder.pageTypeSettingsDesc, icon: Settings },
  { kind: 'page', type: 'profile', label: 'Profile', desc: t.builder.pageTypeProfileDesc, icon: User },
  { kind: 'page', type: 'table', label: 'Table', desc: t.builder.pageTypeTableDesc, icon: Table2 },
  { kind: 'page', type: 'form', label: 'Form', desc: t.builder.pageTypeFormDesc, icon: ClipboardList },
  { kind: 'page', type: 'faq', label: 'FAQ', desc: t.builder.pageTypeFaqDesc, icon: CircleHelp },
  { kind: 'html', label: 'HTML', desc: t.builder.pageTypeHtmlDesc, icon: Code2 },
]

const MAX_HTML_FILE_BYTES = 500 * 1024

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function PagesPanel({ onNavigated }: { onNavigated?: () => void }) {
  const schema = useAppStore((s) => s.schema)
  const selectedPageId = useAppStore((s) => s.selectedPageId)
  const selectedBlockId = useAppStore((s) => s.selectedBlockId)
  const selectPage = useAppStore((s) => s.selectPage)
  const selectBlock = useAppStore((s) => s.selectBlock)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)

  const [addOpen, setAddOpen] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)
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
      toast.success(t.builder.blockAddedToast.replace('{name}', BLOCK_REGISTRY[blockType].label))
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
        <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 pb-1.5 pt-2.5">
          <h3 className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.builder.componentsPanel}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {page?.type === 'landing' ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setStyleOpen(true)}
                title={t.builder.changeStyleBtn}
              >
                <Wand2 className="size-3.5 text-primary" />
                {t.builder.changeStyleBtn}
              </Button>
            ) : null}
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
            const res = addPageToSchema(s, {
              name: opts.name,
              type: opts.type,
              authVariant: opts.authVariant,
              entity: opts.entity,
              landingVariant: opts.landingVariant,
            })
            pageId = res.pageId
            return res.schema
          })
          if (pageId) {
            selectPage(pageId)
            toast.success(t.builder.pageAddedToast.replace('{name}', opts.name))
            onNavigated?.()
          }
        }}
        onCreateHtml={(opts) => {
          let pageId = ''
          applySchemaFn((s) => {
            const res = addHtmlPageToSchema(s, { name: opts.name, html: opts.html, placement: opts.placement, height: 640 })
            pageId = res.pageId
            return res.schema
          })
          if (pageId) {
            selectPage(pageId)
            toast.success(t.builder.pageAddedToast.replace('{name}', opts.name))
            onNavigated?.()
            // حفظ في مكتبة HTML — غير حاجز (لا يمنع إنشاء الصفحة)
            if (opts.saveToLibrary && opts.snippetName) {
              api
                .createSnippet({
                  name: opts.snippetName,
                  kind: opts.placement === 'dashboard' ? 'dashboard' : 'landing',
                  html: opts.html,
                })
                .then(() => toast.success(t.builder.htmlSavedToLibrary))
                .catch((e) => toast.error((e as Error).message || t.builder.htmlSaveLibraryError))
            }
          }
        }}
      />

      {/* نافذة تغيير نمط صفحة الهبوط */}
      {page && page.type === 'landing' ? (
        <VariantStyleDialog page={page} open={styleOpen} onOpenChange={setStyleOpen} />
      ) : null}

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

// ============================================================
// بطاقة نمط صفحة هبوط (مشتركة بين نافذتي الإضافة وتغيير النمط)
// ============================================================
function VariantCard({
  variant,
  selected,
  onSelect,
}: {
  variant: LandingVariantMeta
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border p-2 text-start transition-colors',
        selected ? 'border-primary bg-secondary/70 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-accent/50'
      )}
    >
      {selected ? (
        <span
          className="absolute end-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"
          aria-hidden="true"
        >
          <Check className="size-3" />
        </span>
      ) : null}
      <span className="block aspect-[4/3] w-full">
        <LandingVariantThumb variant={variant} className="h-full w-full" />
      </span>
      <span className="text-sm font-medium leading-tight">{variant.name}</span>
      <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{variant.tagline}</span>
    </button>
  )
}

function VariantGrid({
  selected,
  onSelect,
  maxHeightClass = 'max-h-72',
}: {
  selected: LandingVariantId
  onSelect: (id: LandingVariantId) => void
  maxHeightClass?: string
}) {
  return (
    <div className={cn('overflow-y-auto pe-1', maxHeightClass)}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LANDING_VARIANTS.map((v) => (
          <VariantCard key={v.id} variant={v} selected={selected === v.id} onSelect={() => onSelect(v.id)} />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// نافذة تغيير نمط صفحة هبوط قائمة (إعادة بناء فورية)
// ============================================================
function VariantStyleDialog({
  page,
  open,
  onOpenChange,
}: {
  page: ProjectPage
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)
  const selectBlock = useAppStore((s) => s.selectBlock)
  const [selected, setSelected] = useState<LandingVariantId>('classic-split')

  // إعادة ضبط الاختيار عند فتح النافذة (نمط المزامنة أثناء العرض — بدون effect)
  const syncKey = `${open ? 'open' : 'closed'}|${page.id}`
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey)
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey)
    if (open) setSelected('classic-split')
  }

  const apply = () => {
    const variant = getLandingVariant(selected)
    applySchemaFn((s) => changeLandingVariant(s, page.id, selected))
    selectBlock(null)
    toast.success(t.builder.changeStyleSuccess.replace('{name}', variant.name))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            {t.builder.changeStyleTitle}
          </DialogTitle>
          <DialogDescription>{t.builder.changeStyleDesc}</DialogDescription>
        </DialogHeader>

        <VariantGrid selected={selected} onSelect={setSelected} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={apply}>
            <Wand2 className="size-4" />
            {t.builder.changeStyleApplyBtn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// نافذة إضافة صفحة — أنواع + أنماط الهبوط + صفحة HTML
// ============================================================
type HtmlSourceTab = 'paste' | 'upload' | 'library'
type HtmlPlacement = 'site' | 'dashboard'

function AddPageDialog({
  open,
  onOpenChange,
  entityKeys,
  onCreate,
  onCreateHtml,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  entityKeys: string[]
  onCreate: (opts: { name: string; type: PageType; authVariant?: AuthVariant; entity?: string; landingVariant?: LandingVariantId }) => void
  onCreateHtml: (opts: { name: string; html: string; placement: HtmlPlacement; saveToLibrary: boolean; snippetName: string }) => void
}) {
  const [type, setType] = useState<PageType>('landing')
  const [authVariant, setAuthVariant] = useState<AuthVariant>('login')
  const [name, setName] = useState('')
  const [entity, setEntity] = useState<string>('')
  const [landingVariant, setLandingVariant] = useState<LandingVariantId>('classic-split')
  const [isHtml, setIsHtml] = useState(false)

  // حالة صفحة HTML
  const [htmlTab, setHtmlTab] = useState<HtmlSourceTab>('paste')
  const [html, setHtml] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [placement, setPlacement] = useState<HtmlPlacement>('site')
  const [saveToLibrary, setSaveToLibrary] = useState(false)
  const [snippetName, setSnippetName] = useState('')
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // مكتبة HTML
  const [snippets, setSnippets] = useState<HtmlSnippetDTO[] | null>(null)
  const [snippetsLoading, setSnippetsLoading] = useState(false)
  const [snippetsError, setSnippetsError] = useState(false)

  // جلب المكتبة (يُستدعى عند فتح تبويب «من مكتبتي» أو عند إعادة المحاولة)
  const loadSnippets = useCallback(async () => {
    setSnippetsLoading(true)
    setSnippetsError(false)
    try {
      const { snippets: list } = await api.listSnippets()
      setSnippets(list)
    } catch {
      setSnippetsError(true)
    } finally {
      setSnippetsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || !isHtml || htmlTab !== 'library') return
    void loadSnippets()
  }, [open, isHtml, htmlTab, loadSnippets])

  // إعادة ضبط الحالة عند إغلاق النافذة (نمط المزامنة أثناء العرض — بدون effect)
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setName('')
      setEntity('')
      setType('landing')
      setLandingVariant('classic-split')
      setIsHtml(false)
      setHtmlTab('paste')
      setHtml('')
      setFileName(null)
      setFileSize(null)
      setPlacement('site')
      setSaveToLibrary(false)
      setSnippetName('')
      setSelectedSnippetId(null)
    }
  }

  const selectedOption = ADD_PAGE_OPTIONS.find(
    (o) => o.kind === 'page' && o.type === type && (o.type !== 'auth' || o.authVariant === authVariant)
  )
  const defaultName = isHtml
    ? placement === 'dashboard'
      ? t.builder.htmlDefaultDashboardName
      : t.builder.htmlDefaultPageName
    : (selectedOption && selectedOption.kind === 'page' ? selectedOption.label : '')

  const handleFile = (file: File) => {
    if (file.size > MAX_HTML_FILE_BYTES) {
      toast.error(t.builder.htmlFileTooLarge)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setHtml(text)
      setFileName(file.name)
      setFileSize(file.size)
      setSelectedSnippetId(null)
    }
    reader.onerror = () => toast.error(t.common.error)
    reader.readAsText(file)
  }

  const create = () => {
    if (isHtml) {
      const trimmedHtml = html.trim()
      if (!trimmedHtml || !trimmedHtml.includes('<')) {
        toast.error(t.builder.htmlInvalid)
        return
      }
      if (saveToLibrary && !snippetName.trim()) {
        toast.error(t.common.required)
        return
      }
      onCreateHtml({
        name: name.trim() || defaultName,
        html: trimmedHtml,
        placement,
        saveToLibrary,
        snippetName: snippetName.trim(),
      })
      onOpenChange(false)
      return
    }
    onCreate({
      name: name.trim() || defaultName,
      type,
      authVariant: type === 'auth' ? authVariant : undefined,
      entity: type === 'table' ? entity || entityKeys[0] : undefined,
      landingVariant: type === 'landing' ? landingVariant : undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.builder.addPageTitle}</DialogTitle>
          <DialogDescription>{t.builder.addPageSubtitle}</DialogDescription>
        </DialogHeader>

        {/* أنواع الصفحات */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ADD_PAGE_OPTIONS.map((opt) => {
            const isActive =
              opt.kind === 'html' ? isHtml : !isHtml && opt.type === type && (opt.type !== 'auth' || opt.authVariant === authVariant)
            const Icon = opt.icon
            return (
              <button
                key={opt.kind === 'html' ? 'html' : `${opt.type}-${opt.authVariant ?? 'x'}`}
                type="button"
                onClick={() => {
                  if (opt.kind === 'html') {
                    setIsHtml(true)
                  } else {
                    setIsHtml(false)
                    setType(opt.type)
                    if (opt.authVariant) setAuthVariant(opt.authVariant)
                  }
                  setName('')
                }}
                aria-pressed={isActive}
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

        {isHtml ? (
          /* ===== لوحة صفحة HTML ===== */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-page-name">{t.builder.pageName}</Label>
              <Input id="new-page-name" value={name} placeholder={defaultName} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t.builder.htmlSourceLabel}</Label>
              <Tabs value={htmlTab} onValueChange={(v) => setHtmlTab(v as HtmlSourceTab)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="paste" className="text-xs">{t.builder.htmlPasteTab}</TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs">{t.builder.htmlUploadTab}</TabsTrigger>
                  <TabsTrigger value="library" className="text-xs">{t.builder.htmlLibraryTab}</TabsTrigger>
                </TabsList>

                {/* لصق الكود */}
                <TabsContent value="paste" className="mt-2">
                  <Textarea
                    value={html}
                    onChange={(e) => {
                      setHtml(e.target.value)
                      setSelectedSnippetId(null)
                    }}
                    dir="ltr"
                    rows={8}
                    spellCheck={false}
                    placeholder={t.builder.htmlPlaceholder}
                    className="min-h-36 bg-muted/40 font-mono text-xs leading-relaxed"
                    aria-label={t.builder.htmlSourceLabel}
                  />
                </TabsContent>

                {/* رفع ملف */}
                <TabsContent value="upload" className="mt-2 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html,.htm,text/html"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(file)
                      e.target.value = ''
                    }}
                  />
                  {fileName ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" title={fileName}>{fileName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span dir="ltr">
                            {fileSize != null ? (fileSize / 1024).toFixed(1) : '0'} {t.builder.fileSizeKb}
                          </span>
                          <span aria-hidden="true">•</span>
                          <span dir="ltr">{formatCount(html.length)}</span>
                          <span>{t.builder.charsUnit}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setFileName(null)
                          setFileSize(null)
                          setHtml('')
                        }}
                        aria-label={t.common.delete}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-border p-6 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground"
                    aria-label={t.builder.htmlChooseFile}
                  >
                    <Upload className="size-6" />
                    <span className="text-sm font-medium">{t.builder.htmlChooseFile}</span>
                    <span className="text-[11px] text-muted-foreground/70">{t.builder.htmlFileHint}</span>
                  </button>
                </TabsContent>

                {/* من مكتبتي */}
                <TabsContent value="library" className="mt-2">
                  {snippetsLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : snippetsError ? (
                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-xs text-muted-foreground">{t.builder.htmlLibraryError}</p>
                      <Button variant="outline" size="sm" className="mt-2 h-8 text-xs" onClick={() => void loadSnippets()}>
                        {t.common.retry}
                      </Button>
                    </div>
                  ) : !snippets || snippets.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center">
                      <p className="text-xs leading-relaxed text-muted-foreground">{t.builder.htmlLibraryEmpty}</p>
                    </div>
                  ) : (
                    <div className="max-h-56 space-y-1.5 overflow-y-auto pe-1">
                      {snippets.map((sn) => {
                        const isSel = selectedSnippetId === sn.id
                        return (
                          <button
                            key={sn.id}
                            type="button"
                            onClick={() => {
                              setSelectedSnippetId(sn.id)
                              setHtml(sn.html)
                              setFileName(null)
                              setFileSize(null)
                              if (!name.trim()) setName(sn.name)
                            }}
                            aria-pressed={isSel}
                            className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-lg border p-2.5 text-start transition-colors',
                              isSel ? 'border-primary bg-secondary/70 ring-1 ring-primary/30' : 'border-border hover:bg-accent/50'
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{sn.name}</span>
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                <span dir="ltr">{formatCount(sn.html.length)}</span> {t.builder.charsUnit}
                              </span>
                            </span>
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              {HTML_SNIPPET_KIND_LABELS[sn.kind]}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* موضع الصفحة */}
            <div className="space-y-1.5">
              <Label className="text-xs">{t.builder.htmlPlacementLabel}</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlacement('site')}
                  aria-pressed={placement === 'site'}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
                    placement === 'site' ? 'border-primary bg-secondary/70 ring-1 ring-primary/30' : 'border-border hover:bg-accent/50'
                  )}
                >
                  <Globe className={cn('size-5', placement === 'site' ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{t.builder.htmlPlacementSite}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{t.builder.htmlPlacementSiteDesc}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlacement('dashboard')}
                  aria-pressed={placement === 'dashboard'}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
                    placement === 'dashboard' ? 'border-primary bg-secondary/70 ring-1 ring-primary/30' : 'border-border hover:bg-accent/50'
                  )}
                >
                  <LayoutDashboard className={cn('size-5', placement === 'dashboard' ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{t.builder.htmlPlacementDashboard}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{t.builder.htmlPlacementDashboardDesc}</span>
                </button>
              </div>
            </div>

            {/* حفظ في المكتبة */}
            <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save-snippet"
                  checked={saveToLibrary}
                  onCheckedChange={(c) => setSaveToLibrary(c === true)}
                />
                <Label htmlFor="save-snippet" className="cursor-pointer text-xs font-normal leading-snug">
                  {t.builder.htmlSaveToLibrary}
                </Label>
              </div>
              {saveToLibrary ? (
                <div className="space-y-1.5">
                  <Label htmlFor="snippet-name" className="text-xs">
                    {t.builder.htmlSnippetNameLabel}
                  </Label>
                  <Input
                    id="snippet-name"
                    value={snippetName}
                    onChange={(e) => setSnippetName(e.target.value)}
                    placeholder={t.builder.htmlSnippetNamePlaceholder}
                    className="h-9 text-xs"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* ===== الحقول الاعتيادية ===== */
          <div className="space-y-3">
            {type === 'landing' ? (
              <section className="space-y-2">
                <div>
                  <Label className="text-xs">{t.builder.landingVariantsSection}</Label>
                  <p className="text-[11px] text-muted-foreground">{t.builder.landingVariantsHint}</p>
                </div>
                <VariantGrid selected={landingVariant} onSelect={setLandingVariant} />
              </section>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="new-page-name">{t.builder.pageName}</Label>
              <Input id="new-page-name" value={name} placeholder={defaultName} onChange={(e) => setName(e.target.value)} />
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
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={create}>
            {isHtml ? <Code2 className="size-4" /> : null}
            {t.builder.createPageBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ADD_PAGE_OPTIONS }
export type { PageType }
