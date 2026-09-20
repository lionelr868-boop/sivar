'use client'

// ============================================================
// SIVAR — تبويب «مكتبة HTML»: مدير قصاصات HTML القابلة لإعادة الاستخدام
// إضافة (لصق/رفع ملف) + معاينة iframe + استخدام في مشروع + حذف
// Task 7-d
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Code2,
  Eye,
  Globe,
  LayoutDashboard,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { timeAgo } from '@/lib/i18n/common'
import { HTML_SNIPPET_KIND_LABELS, PROJECT_STATUS_LABELS } from '@/lib/types'
import type { HtmlSnippetDTO, HtmlSnippetKind, ProjectSummaryDTO } from '@/lib/types'
import { ProtoIcon } from '@/components/prototype/icon-map'

const tTpl = t.templates

const SNIPPET_KINDS: HtmlSnippetKind[] = ['landing', 'dashboard', 'section']

const MAX_FILE_SIZE = 500 * 1024

function kindBadgeVariant(kind: HtmlSnippetKind): 'secondary' | 'default' | 'outline' {
  switch (kind) {
    case 'landing':
      return 'secondary'
    case 'dashboard':
      return 'default'
    default:
      return 'outline'
  }
}

function snippetExcerpt(html: string): string {
  return html.trim().slice(0, 120)
}

// ============================================================
// بطاقة قصاصة
// ============================================================
function SnippetCard({
  snippet,
  index,
  using,
  onPreview,
  onUse,
  onDelete,
}: {
  snippet: HtmlSnippetDTO
  index: number
  using: boolean
  onPreview: () => void
  onUse: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="flex h-full flex-col gap-3 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
        {/* الاسم + النوع */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="size-4.5" aria-hidden />
            </span>
            <h3 className="truncate font-bold leading-tight" title={snippet.name}>
              {snippet.name}
            </h3>
          </div>
          <Badge variant={kindBadgeVariant(snippet.kind)} className="shrink-0 text-[10px]">
            {HTML_SNIPPET_KIND_LABELS[snippet.kind]}
          </Badge>
        </div>

        {/* مقتطف الكود */}
        <p
          dir="ltr"
          className="truncate rounded-md bg-muted/60 px-2.5 py-2 font-mono text-start text-[11px] text-muted-foreground"
          title={snippetExcerpt(snippet.html)}
        >
          {snippetExcerpt(snippet.html)}
        </p>

        {/* ميتا */}
        <p className="text-xs text-muted-foreground">
          {snippet.html.length.toLocaleString('ar-DZ')} {tTpl.htmlCharsUnit}
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          {timeAgo(snippet.updatedAt)}
        </p>

        {/* الأزرار */}
        <div className="mt-auto flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-11 flex-1"
            disabled={using}
            onClick={onPreview}
          >
            <Eye className="size-4" />
            {tTpl.variantPreview}
          </Button>
          <Button className="h-11 flex-1" disabled={using} onClick={onUse}>
            {using ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {using ? tTpl.htmlUsing : tTpl.htmlUseButton}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={tTpl.htmlDeleteTitle}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

/** بطاقات هيكلية أثناء التحميل */
function SnippetSkeleton() {
  return (
    <Card className="h-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="ms-auto h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-3 w-32" />
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-11" />
      </div>
    </Card>
  )
}

// ============================================================
// التبويب
// ============================================================
export function HtmlLibraryTab() {
  const openProject = useAppStore((s) => s.openProject)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  const [snippets, setSnippets] = useState<HtmlSnippetDTO[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  // ---------- نافذة الإضافة ----------
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addKind, setAddKind] = useState<HtmlSnippetKind>('landing')
  const [addHtml, setAddHtml] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // ---------- المعاينة ----------
  const [previewTarget, setPreviewTarget] = useState<HtmlSnippetDTO | null>(null)

  // ---------- الاستخدام في مشروع ----------
  const [useTarget, setUseTarget] = useState<HtmlSnippetDTO | null>(null)
  const [useProjects, setUseProjects] = useState<ProjectSummaryDTO[] | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [placement, setPlacement] = useState<'site' | 'dashboard'>('site')
  const [pageName, setPageName] = useState('')
  const [using, setUsing] = useState(false)

  // ---------- الحذف ----------
  const [deleteTarget, setDeleteTarget] = useState<HtmlSnippetDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setSnippets(null)
    setLoadError(false)
    try {
      const { snippets: list } = await api.listSnippets()
      setSnippets(list)
    } catch {
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // ---------- إضافة ----------
  const openAddDialog = () => {
    setAddName('')
    setAddKind('landing')
    setAddHtml('')
    setAddOpen(true)
  }

  const onPickFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(tTpl.htmlFileTooBig)
      return
    }
    try {
      const text = await file.text()
      setAddHtml(text)
      if (addName.trim() === '') {
        setAddName(file.name.replace(/\.html?$/i, ''))
      }
    } catch {
      toast.error(tTpl.htmlFileReadError)
    }
  }

  const addFormValid = addName.trim() !== '' && addHtml.includes('<')

  const submitAdd = async () => {
    if (!addFormValid) return
    setAddSaving(true)
    try {
      const { snippet } = await api.createSnippet({
        name: addName.trim(),
        kind: addKind,
        html: addHtml,
      })
      setSnippets((list) => (list ? [snippet, ...list] : [snippet]))
      setAddOpen(false)
      toast.success(tTpl.htmlAddedToast)
    } catch {
      toast.error(tTpl.htmlAddError)
    } finally {
      setAddSaving(false)
    }
  }

  // ---------- الاستخدام في مشروع ----------
  const openUseDialog = (snippet: HtmlSnippetDTO) => {
    setUseTarget(snippet)
    setUseProjects(null)
    setSelectedProjectId('')
    setPlacement('site')
    setPageName('')
    // جلب المشاريع عند فتح النافذة فقط
    void (async () => {
      try {
        const { projects } = await api.listProjects()
        setUseProjects(projects)
      } catch {
        setUseProjects([])
      }
    })()
  }

  const submitUse = async () => {
    if (!useTarget || selectedProjectId === '') return
    setUsing(true)
    try {
      const { project } = await api.useSnippet(useTarget.id, {
        projectId: selectedProjectId,
        placement,
        pageName: pageName.trim() === '' ? undefined : pageName.trim(),
      })
      setUseTarget(null)
      toast.success(tTpl.htmlUseSuccessToast)
      await openProject(project.id)
    } catch {
      toast.error(tTpl.htmlUseError)
    } finally {
      setUsing(false)
    }
  }

  // ---------- الحذف ----------
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteSnippet(deleteTarget.id)
      setSnippets((list) => (list ? list.filter((s) => s.id !== deleteTarget.id) : list))
      setDeleteTarget(null)
      toast.success(tTpl.htmlDeletedToast)
    } catch {
      toast.error(tTpl.htmlDeleteError)
    } finally {
      setDeleting(false)
    }
  }

  const list = snippets ?? []

  return (
    <div className="space-y-6">
      {/* الترويسة + زر الإضافة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          {tTpl.htmlEmptySubtitle}
        </p>
        <Button className="h-11" onClick={openAddDialog}>
          <Plus className="size-4.5" />
          {tTpl.htmlAddButton}
        </Button>
      </div>

      {/* التحميل */}
      {snippets === null && !loadError ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SnippetSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <Card className="border-dashed p-10 text-center">
          <h2 className="text-lg font-bold">{t.common.error}</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tTpl.htmlLoadError}
          </p>
          <Button variant="outline" className="mt-5 h-11 px-6" onClick={() => void load()}>
            {t.common.retry}
          </Button>
        </Card>
      ) : list.length === 0 ? (
        /* حالة فارغة */
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10">
            <Code2 className="size-9 text-primary" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-bold">{tTpl.htmlEmptyTitle}</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {tTpl.htmlEmptySubtitle}
          </p>
          <Button className="mt-5 h-11 px-6" onClick={openAddDialog}>
            <Plus className="size-4.5" />
            {tTpl.htmlAddButton}
          </Button>
        </Card>
      ) : (
        /* القائمة */
        <div className="max-h-[70vh] overflow-y-auto pe-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((snippet, i) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                index={i}
                using={using && useTarget?.id === snippet.id}
                onPreview={() => setPreviewTarget(snippet)}
                onUse={() => openUseDialog(snippet)}
                onDelete={() => setDeleteTarget(snippet)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============ نافذة الإضافة ============ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tTpl.htmlAddTitle}</DialogTitle>
            <DialogDescription>{tTpl.htmlAddHint}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* الاسم + النوع */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="snippet-name">{tTpl.htmlNameLabel}</Label>
                <Input
                  id="snippet-name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="snippet-kind">{tTpl.htmlKindLabel}</Label>
                <Select value={addKind} onValueChange={(v) => setAddKind(v as HtmlSnippetKind)}>
                  <SelectTrigger id="snippet-kind" className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SNIPPET_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {HTML_SNIPPET_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* الكود */}
            <div className="space-y-2">
              <Label htmlFor="snippet-html">{tTpl.htmlCodeLabel}</Label>
              <Textarea
                id="snippet-html"
                dir="ltr"
                value={addHtml}
                onChange={(e) => setAddHtml(e.target.value)}
                className="min-h-44 bg-background font-mono text-xs leading-relaxed"
                rows={10}
              />
            </div>

            {/* رفع ملف */}
            <div className="space-y-1.5">
              <input
                ref={fileRef}
                type="file"
                accept=".html,text/html"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void onPickFile(file)
                  e.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-dashed"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" />
                {tTpl.htmlUploadButton}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">{tTpl.htmlUploadHint}</p>
            </div>

            {addName.trim() !== '' || addHtml !== '' ? (
              addFormValid ? null : (
                <p className="text-xs text-amber-600 dark:text-amber-400" role="alert">
                  {tTpl.htmlInvalidForm}
                </p>
              )
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button disabled={addSaving || !addFormValid} onClick={() => void submitAdd()}>
              {addSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {tTpl.htmlAddButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ نافذة المعاينة (iframe) ============ */}
      <Dialog open={previewTarget !== null} onOpenChange={(o) => !o && setPreviewTarget(null)}>
        <DialogContent className="flex h-[72vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          {previewTarget ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b p-4">
                <DialogTitle className="truncate text-start">{previewTarget.name}</DialogTitle>
                <Badge variant={kindBadgeVariant(previewTarget.kind)} className="shrink-0 text-[10px]">
                  {HTML_SNIPPET_KIND_LABELS[previewTarget.kind]}
                </Badge>
              </div>
              <div className="flex-1 overflow-hidden p-3">
                <iframe
                  title={previewTarget.name}
                  sandbox="allow-scripts allow-popups allow-forms"
                  srcDoc={previewTarget.html}
                  className="h-[60vh] w-full rounded-md border bg-white"
                />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ============ نافذة الاستخدام في مشروع ============ */}
      <Dialog open={useTarget !== null} onOpenChange={(o) => !o && setUseTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tTpl.htmlUseTitle}</DialogTitle>
            <DialogDescription>{tTpl.htmlUseHint}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* اختيار المشروع */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">{tTpl.htmlSelectProject}</p>
              {useProjects === null ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                      <Skeleton className="size-8 shrink-0 rounded-lg" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="ms-auto h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : useProjects.length === 0 ? (
                <Card className="border-dashed p-6 text-center">
                  <h3 className="text-sm font-bold">{tTpl.htmlProjectsEmptyTitle}</h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                    {tTpl.htmlProjectsEmptySubtitle}
                  </p>
                  <Button
                    className="mt-4 h-10 px-5"
                    onClick={() => {
                      setUseTarget(null)
                      setDashboardSection('new')
                    }}
                  >
                    <Plus className="size-4" />
                    {tTpl.htmlGoNewProject}
                  </Button>
                </Card>
              ) : (
                <div className="max-h-52 space-y-1.5 overflow-y-auto pe-1">
                  {useProjects.map((p) => {
                    const selected = selectedProjectId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          selected
                            ? 'border-primary/50 bg-secondary/70'
                            : 'border-border hover:bg-accent/50'
                        }`}
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <ProtoIcon name={p.icon} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={p.name}>
                          {p.name}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[10px] font-normal text-muted-foreground">
                          {PROJECT_STATUS_LABELS[p.status]}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* موضع الإضافة */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">{tTpl.htmlPlacementLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'site', icon: Globe, label: tTpl.htmlPlacementSite, hint: tTpl.htmlPlacementSiteHint },
                    {
                      id: 'dashboard',
                      icon: LayoutDashboard,
                      label: tTpl.htmlPlacementDashboard,
                      hint: tTpl.htmlPlacementDashboardHint,
                    },
                  ] as const
                ).map((opt) => {
                  const selected = placement === opt.id
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPlacement(opt.id)}
                      className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        selected
                          ? 'border-primary/50 bg-secondary/70'
                          : 'border-border hover:bg-accent/50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Icon className={`size-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        {opt.label}
                      </span>
                      <span className="text-[11px] leading-snug text-muted-foreground">{opt.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* اسم الصفحة */}
            <div className="space-y-2">
              <Label htmlFor="snippet-page-name">{tTpl.htmlPageNameLabel}</Label>
              <Input
                id="snippet-page-name"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder={tTpl.htmlPageNamePlaceholder}
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={using} onClick={() => setUseTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button disabled={using || selectedProjectId === ''} onClick={() => void submitUse()}>
              {using ? <Loader2 className="size-4 animate-spin" /> : null}
              {using ? tTpl.htmlUsing : tTpl.htmlUseSubmit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ تأكيد الحذف ============ */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tTpl.htmlDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{tTpl.htmlDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              {tTpl.htmlDeleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
