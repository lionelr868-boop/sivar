'use client'

// نافذة التصدير: تجهيز → فحوصات متحركة → جاهز للتحميل / خطأ
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { downloadProjectZip } from '@/lib/api-client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Download, ExternalLink, FileCheck2, Loader2, XCircle, Wrench } from 'lucide-react'

export function ExportDialog() {
  const exportState = useAppStore((s) => s.exportState)
  const closeExport = useAppStore((s) => s.closeExport)
  const runExport = useAppStore((s) => s.runExport)
  const projectId = useAppStore((s) => s.projectId)
  const setView = useAppStore((s) => s.setView)
  const sendAgent = useAppStore((s) => s.sendAgent)
  const [downloaded, setDownloaded] = useState(false)

  const phase = exportState.phase
  if (!exportState.open) return null

  const handleDownload = () => {
    if (!projectId) return
    downloadProjectZip(projectId)
    setDownloaded(true)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && closeExport()}>
      <DialogContent className="max-w-md">
        {phase === 'preparing' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">{t.export.preparing}</DialogTitle>
              <DialogDescription className="text-center">{t.export.preparingHint}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <FileCheck2 className="size-14 text-primary/30" />
                <Loader2 className="absolute inset-0 m-auto size-6 animate-spin text-primary" />
              </div>
            </div>
          </>
        ) : null}

        {phase === 'checks' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">{t.export.checksTitle}</DialogTitle>
              <DialogDescription className="text-center">{t.export.preparingHint}</DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 py-2">
              {exportState.checks.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3.5" />
                  </span>
                  <span className="flex-1 text-sm">{c.label}</span>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">✓</span>
                </li>
              ))}
              <li className="flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2.5 text-muted-foreground">
                <Loader2 className="size-6 shrink-0 animate-spin text-primary/50" />
                <span className="flex-1 animate-pulse text-sm">{t.common.loading}</span>
              </li>
            </ul>
          </>
        ) : null}

        {phase === 'ready' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">{t.export.projectReady}</DialogTitle>
              <DialogDescription className="text-center">{t.export.projectReadyHint}</DialogDescription>
            </DialogHeader>
            <ul className="mb-2 space-y-1.5">
              {exportState.checks.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {c.label}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Button size="lg" className="h-11 gap-2" onClick={handleDownload}>
                <Download className="size-4.5" />
                {t.export.downloadZip}
              </Button>
              {downloaded ? (
                <div className="space-y-2 rounded-lg bg-secondary/60 p-3">
                  <p className="text-xs font-semibold">{t.export.whatNext}</p>
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 text-xs"
                    onClick={() => {
                      closeExport()
                      setView('export-guide')
                    }}
                  >
                    <ExternalLink className="size-3.5" />
                    {t.export.deployGuide}
                  </Button>
                  <Button variant="ghost" className="h-9 w-full justify-start gap-2 text-xs" onClick={closeExport}>
                    {t.export.backToEditor}
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {phase === 'error' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">{t.export.buildFailed}</DialogTitle>
              <DialogDescription className="text-center">{t.export.buildFailedHint}</DialogDescription>
            </DialogHeader>
            {exportState.checks.some((c) => c.status === 'error') ? (
              <ul className="space-y-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                {exportState.checks
                  .filter((c) => c.status === 'error')
                  .map((c) => (
                    <li key={c.id} className="flex items-start gap-2 text-xs text-destructive">
                      <XCircle className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {c.label}
                        {c.detail ? ` — ${c.detail}` : ''}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="h-10 gap-2" onClick={() => void runExport()}>
                <Loader2 className="size-4" />
                {t.export.retryExport}
              </Button>
              <Button
                variant="secondary"
                className="h-10 gap-2"
                onClick={() => {
                  closeExport()
                  void sendAgent('أصلح مشاكل البناء في المشروع')
                }}
              >
                <Wrench className="size-4" />
                {t.export.askAgentFix}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
