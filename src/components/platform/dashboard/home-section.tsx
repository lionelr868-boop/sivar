'use client'

// ============================================================
// SIVAR — قسم "الرئيسية": ترحيب + إحصائيات + آخر المشاريع
// Task 3-a
// ============================================================
import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, BadgeCheck, Clock3, FolderKanban, Hammer, Plus, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { timeAgo } from '@/lib/i18n/common'
import { ProjectCard, ProjectCardSkeleton } from './projects-section'

const tDash = t.dashboard

const TONE_CLASSES = {
  violet: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  tone: keyof typeof TONE_CLASSES
}) {
  return (
    <Card className="gap-0 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-lg ${TONE_CLASSES[tone]}`}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold leading-snug" title={value}>
            {value}
          </p>
          {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
        </div>
      </div>
    </Card>
  )
}

export function HomeSection() {
  const user = useAppStore((s) => s.user)
  const projects = useAppStore((s) => s.projects)
  const projectsLoading = useAppStore((s) => s.projectsLoading)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  const sorted = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [projects],
  )
  const recent = sorted.slice(0, 6)
  const readyCount = projects.filter((p) => p.status === 'ready').length
  const inProgressCount = projects.filter(
    (p) => p.status === 'draft' || p.status === 'building',
  ).length
  const last = sorted[0]

  return (
    <div className="space-y-8">
      {/* الترحيب */}
      <section className="space-y-2.5">
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          {tDash.welcomeGreeting} <span aria-hidden>👋</span>{' '}
          <span className="text-gradient">{user?.name}</span>
        </h1>
        <p className="text-muted-foreground sm:text-lg">{tDash.welcomeQuestion}</p>
        <Button size="lg" className="mt-2 h-12 px-6" onClick={() => setDashboardSection('new')}>
          <Plus className="size-5" />
          {tDash.newProjectButton}
        </Button>
      </section>

      {/* الإحصائيات */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label={tDash.statProjects}>
        <StatCard
          icon={FolderKanban}
          label={tDash.statProjects}
          value={String(projects.length)}
          tone="violet"
        />
        <StatCard
          icon={BadgeCheck}
          label={tDash.statReady}
          value={String(readyCount)}
          tone="emerald"
        />
        <StatCard
          icon={Hammer}
          label={tDash.statInProgress}
          value={String(inProgressCount)}
          tone="amber"
        />
        <StatCard
          icon={Clock3}
          label={tDash.statLastProject}
          value={last ? last.name : tDash.statNoProjectYet}
          sub={last ? timeAgo(last.updatedAt) : undefined}
          tone="teal"
        />
      </section>

      {/* آخر المشاريع */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight">{tDash.recentProjects}</h2>
          {projects.length > 6 ? (
            <Button
              variant="ghost"
              className="h-10 px-3"
              onClick={() => setDashboardSection('projects')}
            >
              {tDash.viewAllProjects}
              <ArrowLeft className="size-4" />
            </Button>
          ) : null}
        </div>

        {projectsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto grid size-24 place-items-center rounded-full bg-primary/10">
              <Rocket className="size-10 text-primary" aria-hidden />
            </div>
            <h3 className="mt-5 text-lg font-bold">{tDash.emptyTitle}</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {tDash.emptySubtitle}
            </p>
            <Button
              size="lg"
              className="mt-6 h-12 px-7"
              onClick={() => setDashboardSection('new')}
            >
              <Plus className="size-5" />
              {tDash.emptyCta}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
