'use client'

// ============================================================
// SIVAR — تبويب «قوالبي»: القوالب المحفوظة من المشاريع
// قائمة + إنشاء مشروع من قالب + حذف + حالة فارغة
// Task 7-d
// ============================================================
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Loader2, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { PROJECT_TYPE_LABELS } from '@/lib/types'
import type { SavedTemplateDTO } from '@/lib/types'
import { ProtoIcon } from '@/components/prototype/icon-map'

const tTpl = t.templates

// ============================================================
// بطاقة قالب محفوظ (بدون معاينة حيّة — الـ schema ثقيل)
// ============================================================
function SavedTemplateCard({
  template,
  index,
  creating,
  onUse,
  onDelete,
}: {
  template: SavedTemplateDTO
  index: number
  creating: boolean
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
        {/* أيقونة + اسم */}
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <ProtoIcon name={template.icon} className="size-5.5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="truncate font-bold leading-tight" title={template.name}>
              {template.name}
            </h3>
            {template.description ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            ) : null}
          </div>
        </div>

        {/* ميتا */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">
            {PROJECT_TYPE_LABELS[template.type]}
          </Badge>
          <span className="font-medium">
            {template.pageCount} {tTpl.pagesLabel}
          </span>
          <span aria-hidden>·</span>
          <span>{timeAgo(template.createdAt)}</span>
        </div>

        {/* الأزرار */}
        <div className="mt-auto flex items-center gap-2">
          <Button className="h-11 flex-1" disabled={creating} onClick={onUse}>
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {creating ? tTpl.savedCreating : tTpl.savedCreateProject}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={tTpl.savedDeleteTitle}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

/** بطاقات هيكلية أثناء التحميل */
function SavedTemplateSkeleton() {
  return (
    <Card className="h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-5 w-40 rounded-full" />
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-11" />
      </div>
    </Card>
  )
}

// ============================================================
// التبويب
// ============================================================
export function SavedTemplatesTab() {
  const openProject = useAppStore((s) => s.openProject)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  const [templates, setTemplates] = useState<SavedTemplateDTO[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  // نافذة «إنشاء مشروع من القالب»
  const [useTarget, setUseTarget] = useState<SavedTemplateDTO | null>(null)
  const [useName, setUseName] = useState('')
  const [creating, setCreating] = useState(false)

  // تأكيد الحذف
  const [deleteTarget, setDeleteTarget] = useState<SavedTemplateDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setTemplates(null)
    setLoadError(false)
    try {
      const { templates: list } = await api.listSavedTemplates()
      setTemplates(list)
    } catch {
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openUseDialog = (tpl: SavedTemplateDTO) => {
    setUseName(`${tpl.name} ${tTpl.savedNameCopySuffix}`)
    setUseTarget(tpl)
  }

  const createFromSaved = async () => {
    if (!useTarget) return
    const name = useName.trim()
    if (name === '') return
    setCreating(true)
    try {
      const { project } = await api.useSavedTemplate(useTarget.id, { name })
      setUseTarget(null)
      await openProject(project.id)
    } catch {
      toast.error(tTpl.savedUseError)
    } finally {
      setCreating(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteSavedTemplate(deleteTarget.id)
      setTemplates((list) => (list ? list.filter((tpl) => tpl.id !== deleteTarget.id) : list))
      setDeleteTarget(null)
      toast.success(tTpl.savedDeletedToast)
    } catch {
      toast.error(tTpl.savedDeleteError)
    } finally {
      setDeleting(false)
    }
  }

  // ---------- التحميل ----------
  if (templates === null && !loadError) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SavedTemplateSkeleton key={i} />
        ))}
      </div>
    )
  }

  // ---------- خطأ التحميل ----------
  if (loadError) {
    return (
      <Card className="border-dashed p-10 text-center">
        <h2 className="text-lg font-bold">{t.common.error}</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {tTpl.savedLoadError}
        </p>
        <Button variant="outline" className="mt-5 h-11 px-6" onClick={() => void load()}>
          {t.common.retry}
        </Button>
      </Card>
    )
  }

  // ---------- حالة فارغة ----------
  if (templates !== null && templates.length === 0) {
    return (
      <Card className="border-dashed p-10 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10">
          <Bookmark className="size-9 text-primary" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-bold">{tTpl.savedEmptyTitle}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {tTpl.savedEmptySubtitle}
        </p>
        <Button className="mt-5 h-11 px-6" onClick={() => setDashboardSection('projects')}>
          {tTpl.savedBrowseProjects}
        </Button>
      </Card>
    )
  }

  // ---------- القائمة ----------
  return (
    <div className="space-y-4">
      <div className="max-h-[70vh] overflow-y-auto pe-1">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(templates ?? []).map((tpl, i) => (
            <SavedTemplateCard
              key={tpl.id}
              template={tpl}
              index={i}
              creating={creating && useTarget?.id === tpl.id}
              onUse={() => openUseDialog(tpl)}
              onDelete={() => setDeleteTarget(tpl)}
            />
          ))}
        </div>
      </div>

      {/* نافذة إنشاء مشروع من القالب */}
      <Dialog open={useTarget !== null} onOpenChange={(o) => !o && setUseTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tTpl.savedUseTitle}</DialogTitle>
            <DialogDescription>{tTpl.savedUseHint}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <Label htmlFor="saved-template-name">{tTpl.savedNameLabel}</Label>
            <Input
              id="saved-template-name"
              value={useName}
              onChange={(e) => setUseName(e.target.value)}
              className="bg-background"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={creating} onClick={() => setUseTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button disabled={creating || useName.trim() === ''} onClick={() => void createFromSaved()}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : null}
              {tTpl.savedCreateProject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* تأكيد حذف قالب محفوظ */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tTpl.savedDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{tTpl.savedDeleteBody}</AlertDialogDescription>
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
              {tTpl.savedDeleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
