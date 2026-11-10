'use client'

// صفحة ما بعد التحميل: "أحسنت! 🎉" + أزرار الإجراءات + دليل النشر على Netlify
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { downloadProjectZip } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/platform/landing/landing-navbar'
import {
  ArrowRight,
  Download,
  ExternalLink,
  Eye,
  FolderUp,
  Globe,
  PencilLine,
  PartyPopper,
  Rocket,
  Upload,
  UserPlus,
  Link2,
  Timer,
} from 'lucide-react'

const STEP_ICONS = [Download, UserPlus, FolderUp, Upload, Timer, Link2]

export function ExportGuideView() {
  const projectId = useAppStore((s) => s.projectId)
  const schema = useAppStore((s) => s.schema)
  const openProject = useAppStore((s) => s.openProject)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)
  const setPreviewOpen = useAppStore((s) => s.setPreviewOpen)

  const projectName = schema?.metadata.name ?? t.common.brand

  const openInBuilder = async (preview: boolean) => {
    if (!projectId) return
    if (preview) {
      // إن كان المشروع مفتوحًا في المحرر حاليًا نكتفي بفتح المعاينة
      if (schema) {
        setPreviewOpen(true)
        return
      }
    }
    if (projectId) {
      await openProject(projectId)
      if (preview) setPreviewOpen(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* شريط علوي */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={() => setDashboardSection('home')}>
          <ArrowRight className="size-4" />
          <span className="hidden sm:inline">{t.export.guideBack}</span>
        </Button>
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="font-display text-lg font-bold">{t.common.brand}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        {/* تهنئة */}
        <section className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <PartyPopper className="size-8" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{t.export.guideCongrats}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t.export.guideCongratsSub}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.export.guideOwnership}</p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <Button size="lg" className="h-11 gap-2" onClick={() => projectId && downloadProjectZip(projectId)}>
              <Download className="size-4.5" />
              {t.export.guideDownload}
            </Button>
            <Button size="lg" variant="outline" className="h-11 gap-2" onClick={() => void openInBuilder(true)}>
              <Eye className="size-4.5" />
              {t.export.guidePreview}
            </Button>
            <Button size="lg" variant="outline" className="h-11 gap-2" onClick={() => document.getElementById('deploy-guide')?.scrollIntoView({ behavior: 'smooth' })}>
              <Rocket className="size-4.5" />
              {t.export.guideCta}
            </Button>
            <Button size="lg" variant="ghost" className="h-11 gap-2" onClick={() => void openInBuilder(false)}>
              <PencilLine className="size-4.5" />
              {t.export.guideEdit}
            </Button>
          </div>
        </section>

        {/* دليل النشر */}
        <section id="deploy-guide" className="mt-14 scroll-mt-20">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">{t.export.guideHowTitle}</h2>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>

          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {t.export.guideSteps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? Globe
              return (
                <li key={i} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary font-display text-sm font-bold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">{step}</p>
                  </div>
                  <Icon className="size-4.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                </li>
              )
            })}
          </ol>

          {/* دليل مفصّل */}
          <div className="mt-6 rounded-xl border bg-secondary/40 p-4 sm:p-5">
            <p className="text-sm font-semibold">{t.export.guideManual}</p>
            <ul className="mt-3 space-y-2">
              {t.export.guideManualSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => window.open('https://app.netlify.com/signup', '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="size-3.5" />
                {t.export.guideOpenNetlify}
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => projectId && downloadProjectZip(projectId)}>
                <Download className="size-3.5" />
                {t.export.guideDownload}
              </Button>
            </div>
          </div>

          {/* ملاحظات */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <p className="text-sm font-medium">{t.export.guideNote}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <p className="text-sm font-medium">{t.export.guideFree}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
