'use client'

// سجل إصدارات المشروع: عرض + استعادة
import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { listVersions } from '@/lib/api-client'
import { timeAgo } from '@/lib/i18n/common'
import type { VersionDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
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
import { History, Loader2, RotateCcw } from 'lucide-react'

export function HistoryPanel() {
  const projectId = useAppStore((s) => s.projectId)
  const schema = useAppStore((s) => s.schema)
  const restoreVersion = useAppStore((s) => s.restoreVersion)
  const dirty = useAppStore((s) => s.dirty)
  const [versions, setVersions] = useState<VersionDTO[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<VersionDTO | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const { versions: v } = await listVersions(projectId)
      setVersions(v)
    } catch {
      setVersions([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load, schema])

  if (!projectId) return null

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <History className="size-5" />
        </span>
        <div>
          <h4 className="text-sm font-semibold">{t.builder.historyTitle}</h4>
          <p className="text-[11px] text-muted-foreground">{t.builder.historySubtitle}</p>
        </div>
      </div>

      {dirty ? (
        <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          {t.builder.unsavedChanges} — {t.common.save}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-xs">{t.common.loading}</span>
        </div>
      ) : versions && versions.length > 0 ? (
        <ol className="relative space-y-2 border-s ps-4">
          {versions.map((v, i) => (
            <li key={v.id} className="relative">
              <span
                className="absolute -start-[21px] top-3 size-2.5 rounded-full border-2 border-background bg-primary"
                aria-hidden="true"
              />
              <div className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    {t.builder.versionLabel} {v.number}
                    {i === 0 ? (
                      <span className="ms-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {t.builder.currentVersion}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(v.createdAt)}</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{v.label}</p>
                {i !== 0 ? (
                  <Button variant="outline" size="sm" className="mt-2 h-7 gap-1.5 px-2 text-[11px]" onClick={() => setRestoreTarget(v)}>
                    <RotateCcw className="size-3" />
                    {t.builder.restore}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-8 text-center text-xs text-muted-foreground">{t.common.loading}</p>
      )}

      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.builder.restoreConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.builder.restoreConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreTarget) void restoreVersion(restoreTarget.id).then(load)
                setRestoreTarget(null)
              }}
            >
              {t.builder.restore}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
