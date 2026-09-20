'use client'

// ============================================================
// نموذج — قسم "مشاريعي": بحث + تصفية بالحالة + شبكة مشاريع + حذف
// يصدّر ProjectCard (بطاقة مشتركة مع قسم الرئيسية)
// Task 3-a
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FolderKanban,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { timeAgo } from '@/lib/i18n/common'
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '@/lib/types'
import type { ProjectStatus, ProjectSummaryDTO } from '@/lib/types'
import { ProtoIcon } from '@/components/prototype/icon-map'

// مفتاح تمرير كلمة البحث من ترويسة التطبيق إلى هذا القسم
export const SEARCH_QUERY_KEY = 'namudhaj:project-search'

const tDash = t.dashboard

/** شارة الحالة بألوان دلالية (بدون أزرق/نيلي افتراضي) */
function StatusBadge({ status }: { status: ProjectStatus }) {
  const label = PROJECT_STATUS_LABELS[status]
  switch (status) {
    case 'ready':
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
        >
          {label}
        </Badge>
      )
    case 'building':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/25 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
        >
          {label}
        </Badge>
      )
    case 'downloaded':
      return (
        <Badge
          variant="outline"
          className="border-sky-400/25 bg-sky-400/10 text-sky-700 hover:bg-sky-400/10 dark:text-sky-400"
        >
          {label}
        </Badge>
      )
    default:
      return <Badge variant="secondary">{label}</Badge>
  }
}

/** بطاقة مشروع — مشتركة بين الرئيسية والمشاريع (مع حذف اختياري) */
export function ProjectCard({
  project,
  allowDelete = false,
  index = 0,
}: {
  project: ProjectSummaryDTO
  allowDelete?: boolean
  index?: number
}) {
  const openProject = useAppStore((s) => s.openProject)
  const deleteProject = useAppStore((s) => s.deleteProject)
  const [opening, setOpening] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const open = async () => {
    setOpening(true)
    await openProject(project.id)
    setOpening(false)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    await deleteProject(project.id)
    setDeleting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="group h-full gap-3 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
        {/* الترويسة: أيقونة + اسم + شارات */}
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <ProtoIcon name={project.icon} className="size-5.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold leading-tight" title={project.name}>
              {project.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {PROJECT_TYPE_LABELS[project.type]}
              </Badge>
              <StatusBadge status={project.status} />
            </div>
          </div>

          {allowDelete ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={tDash.moreActions}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => void open()}>
                  <ArrowLeft />
                  {tDash.openProject}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault()
                    setConfirmOpen(true)
                  }}
                >
                  <Trash2 />
                  {tDash.deleteAction}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {/* ميتا */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {tDash.lastEdited} {timeAgo(project.updatedAt)}
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          {project.pageCount} {tDash.pagesCountShort}
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          {project.versionCount} {tDash.versionsCountShort}
        </p>

        {/* الأزرار */}
        <div className="mt-auto flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-10 flex-1"
            disabled={opening}
            onClick={() => void open()}
          >
            {tDash.previewProject}
          </Button>
          <Button className="h-10 flex-1" disabled={opening} onClick={() => void open()}>
            {opening ? <Loader2 className="size-4 animate-spin" /> : tDash.openProject}
            {!opening ? <ArrowLeft className="size-4" /> : null}
          </Button>
        </div>

        {/* تأكيد الحذف */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tDash.deleteDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>{tDash.deleteDialogBody}</AlertDialogDescription>
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
                {tDash.deleteDialogConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </motion.div>
  )
}

/** بطاقات هيكلية أثناء التحميل */
export function ProjectCardSkeleton() {
  return (
    <Card className="h-full gap-3 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-3 w-2/3" />
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </Card>
  )
}

type StatusFilter = 'all' | ProjectStatus

const STATUS_FILTERS: StatusFilter[] = ['all', 'draft', 'building', 'ready', 'downloaded']

export function ProjectsSection() {
  const projects = useAppStore((s) => s.projects)
  const projectsLoading = useAppStore((s) => s.projectsLoading)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  // كلمة البحث القادمة من ترويسة التطبيق (إن وُجدت)
  const [query, setQuery] = useState<string>(() => {
    try {
      return window.sessionStorage.getItem(SEARCH_QUERY_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [status, setStatus] = useState<StatusFilter>('all')

  // إزالة الكلمة المؤقتة بعد أخذها
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(SEARCH_QUERY_KEY)
    } catch {
      /* تجاهل */
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects
      .filter((p) => (status === 'all' ? true : p.status === status))
      .filter((p) => (q === '' ? true : p.name.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [projects, query, status])

  const hasFilters = query.trim() !== '' || status !== 'all'

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {tDash.projectsTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.length} {tDash.projectsCount}
          </p>
        </div>
        <Button className="h-11" onClick={() => setDashboardSection('new')}>
          <Plus className="size-4.5" />
          {tDash.newProjectButton}
        </Button>
      </header>

      {/* البحث + التصفية */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tDash.projectsSearchPlaceholder}
            className="ps-9"
            aria-label={tDash.projectsSearchPlaceholder}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={tDash.filterAll}>
          {STATUS_FILTERS.map((f) => {
            const active = status === f
            const label = f === 'all' ? tDash.filterAll : PROJECT_STATUS_LABELS[f]
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(f)}
                className={`h-9 min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* الشبكة */}
      {projectsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10">
            <FolderKanban className="size-9 text-primary" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-bold">{tDash.projectsEmptyTitle}</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tDash.projectsEmptySubtitle}
          </p>
          <Button className="mt-5 h-11 px-6" onClick={() => setDashboardSection('new')}>
            <Plus className="size-4.5" />
            {tDash.projectsEmptyCta}
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-muted">
            <Search className="size-9 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-bold">{tDash.noResultsTitle}</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tDash.noResultsSubtitle}
          </p>
          <Button
            variant="outline"
            className="mt-5 h-11 px-6"
            onClick={() => {
              setQuery('')
              setStatus('all')
            }}
          >
            {tDash.resetFilters}
          </Button>
        </Card>
      ) : (
        <div className="max-h-[calc(100vh-21rem)] overflow-y-auto pe-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <ProjectCard key={p.id} project={p} allowDelete index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
