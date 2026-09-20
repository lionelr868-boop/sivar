'use client'

// شريط البناء العلوي: اسم المشروع + حفظ + حفظ كقالب + تراجع/إعادة + أجهزة + معاينة + تحميل
import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { renameProjectInSchema } from '@/lib/project/tools'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SaveTemplateDialog } from './save-template-dialog'
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
  ArrowRight,
  Bookmark,
  Download,
  Eye,
  History,
  Loader2,
  Monitor,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react'
import type { DeviceMode } from '@/lib/types'

export function BuilderHeader() {
  const schema = useAppStore((s) => s.schema)
  const dirty = useAppStore((s) => s.dirty)
  const saving = useAppStore((s) => s.saving)
  const device = useAppStore((s) => s.device)
  const past = useAppStore((s) => s.past)
  const future = useAppStore((s) => s.future)
  const setDevice = useAppStore((s) => s.setDevice)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const saveProject = useAppStore((s) => s.saveProject)
  const applySchemaFn = useAppStore((s) => s.applySchemaFn)
  const setPreviewOpen = useAppStore((s) => s.setPreviewOpen)
  const openExport = useAppStore((s) => s.openExport)
  const runExport = useAppStore((s) => s.runExport)
  const closeBuilder = useAppStore((s) => s.closeBuilder)
  const setRightPanel = useAppStore((s) => s.setRightPanel)
  const projectId = useAppStore((s) => s.projectId)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [confirmExit, setConfirmExit] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const projectName = schema?.metadata.name ?? ''

  // اختصارات لوحة المفاتيح
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!saving) void saveProject()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, saveProject, saving])

  const commitName = () => {
    setEditingName(false)
    const next = nameDraft.trim()
    if (schema && next && next !== projectName) {
      applySchemaFn((s) => renameProjectInSchema(s, next))
    }
  }

  const handleDownload = async () => {
    if (dirty) await saveProject(t.builder.versionLabelBeforeDownload)
    openExport()
    void runExport()
  }

  const handleExit = () => {
    if (dirty) setConfirmExit(true)
    else closeBuilder()
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card/60 px-2 sm:px-3">
      {/* رجوع */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-10 rounded-lg" onClick={handleExit} aria-label={t.builder.backToDashboard}>
            <ArrowRight className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t.builder.backToDashboard}</TooltipContent>
      </Tooltip>

      {/* اسم المشروع */}
      <div className="flex min-w-0 items-center gap-2">
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') setEditingName(false)
            }}
            autoFocus
            className="w-40 rounded-md border bg-background px-2 py-1 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-56"
            aria-label={t.builder.projectName}
          />
        ) : (
          <button
            type="button"
            className="max-w-40 truncate rounded-md px-2 py-1 text-sm font-semibold hover:bg-accent/60 sm:max-w-56"
            onClick={() => {
              setNameDraft(projectName)
              setEditingName(true)
            }}
            title={t.builder.projectName}
          >
            {projectName}
          </button>
        )}
        {dirty ? (
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            {t.builder.unsavedChanges}
          </span>
        ) : null}
      </div>

      <div className="flex-1" />

      {/* مبدّل الأجهزة */}
      <div className="hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 sm:flex" role="group" aria-label={t.builder.preview}>
        {(
          [
            { id: 'desktop' as DeviceMode, icon: Monitor, label: t.builder.desktop },
            { id: 'tablet' as DeviceMode, icon: Tablet, label: t.builder.tablet },
            { id: 'mobile' as DeviceMode, icon: Smartphone, label: t.builder.mobile },
          ] as const
        ).map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setDevice(id)}
                aria-pressed={device === id}
                aria-label={label}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  device === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* تراجع / إعادة */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10 rounded-lg" onClick={undo} disabled={past.length === 0} aria-label={t.builder.undo}>
              <Undo2 className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t.builder.undo}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10 rounded-lg" onClick={redo} disabled={future.length === 0} aria-label={t.builder.redo}>
              <Redo2 className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t.builder.redo}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden size-10 rounded-lg xl:inline-flex" onClick={() => setRightPanel('history')} aria-label={t.builder.history}>
              <History className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t.builder.history}</TooltipContent>
        </Tooltip>
      </div>

      {/* الإجراءات الأساسية */}
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-9 gap-1.5 sm:inline-flex"
              onClick={() => setTemplateOpen(true)}
              disabled={!projectId}
              aria-label={t.builder.saveAsTemplateBtn}
            >
              <Bookmark className="size-4" />
              <span className="hidden xl:inline">{t.builder.saveAsTemplateBtn}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t.builder.saveAsTemplateBtn}</TooltipContent>
        </Tooltip>
        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setPreviewOpen(true)}>
          <Eye className="size-4" />
          <span className="hidden sm:inline">{t.builder.preview}</span>
        </Button>
        <Button size="sm" className="h-9 gap-1.5" onClick={handleDownload}>
          <Download className="size-4" />
          <span className="hidden sm:inline">{t.builder.downloadProject}</span>
        </Button>
        <Button
          size="sm"
          variant={dirty ? 'default' : 'secondary'}
          className="h-9 gap-1.5"
          onClick={() => void saveProject()}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span className="hidden sm:inline">{saving ? t.builder.saving : t.builder.saveBtn}</span>
        </Button>
      </div>

      {/* نافذة حفظ كقالب */}
      <SaveTemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />

      {/* تأكيد الخروج مع تغييرات غير محفوظة */}
      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.builder.unsavedTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.builder.unsavedDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={async () => {
                setConfirmExit(false)
                await saveProject()
                closeBuilder()
              }}
            >
              {t.builder.saveAndExit}
            </Button>
            <AlertDialogAction onClick={closeBuilder}>{t.builder.exitWithoutSave}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
