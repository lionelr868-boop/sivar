'use client'

// ============================================================
// SIVAR — تبويب «صفحات الهبوط»: 12 نمطاً جاهزاً
// بطاقة لكل نمط (مخطط مصغّر + معاينة حيّة + إنشاء مشروع)
// Task 7-d
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { Eye, Loader2, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { LANDING_VARIANTS, buildVariantDemoSchema } from '@/lib/project/landing-kit'
import type { LandingVariantMeta } from '@/lib/project/landing-kit'
import type { LandingVariantId, ProjectSchema } from '@/lib/types'
import { PrototypeRenderer } from '@/components/prototype/prototype-renderer'
import { LandingVariantThumb } from './landing-variant-thumb'

const tTpl = t.templates

const PREVIEW_WIDTH = 1100

// ============================================================
// معاينة حيّة مقياسها قابل للتحجيم — نفس أسلوب TemplateMiniPreview
// لكن بـ schema عرض النمط (buildVariantDemoSchema) وبتمرير كامل
// ============================================================
function VariantLivePreview({ variantId }: { variantId: LandingVariantId }): ReactElement {
  const schema = useMemo<ProjectSchema>(() => buildVariantDemoSchema(variantId), [variantId])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(0.75)
  const [contentHeight, setContentHeight] = useState(0)

  // قياس عرض الحاوية → مقياس العرض
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width
        if (typeof w === 'number' && w > 40) {
          setScale(Math.min(1, Math.max(0.3, w / PREVIEW_WIDTH)))
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // قياس ارتفاع المحتوى غير المُحوّل → ارتفاع الغلاف المرئي
  useEffect(() => {
    const el = contentRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect?.height
        if (typeof h === 'number' && h > 0) setContentHeight(h)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border bg-white"
      style={{ height: contentHeight > 0 ? Math.ceil(contentHeight * scale) : 640 }}
      aria-hidden
    >
      <div
        ref={contentRef}
        className="pointer-events-none absolute top-0 right-0 select-none"
        style={{ width: PREVIEW_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top right' }}
      >
        <PrototypeRenderer schema={schema} pageId="demo_page" interactive={false} />
      </div>
    </div>
  )
}

// ============================================================
// بطاقة نمط واحد
// ============================================================
function VariantCard({
  variant,
  index,
  creating,
  onPreview,
  onCreate,
}: {
  variant: LandingVariantMeta
  index: number
  creating: boolean
  onPreview: () => void
  onCreate: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="flex h-full flex-col gap-0 overflow-hidden py-0 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        {/* المخطط المصغّر */}
        <div className="border-b bg-muted/30 p-3 pb-0">
          <div className="aspect-[4/3] w-full">
            <LandingVariantThumb variant={variant} className="h-full w-full" />
          </div>
        </div>

        {/* المعلومات */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-tight">{variant.name}</h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {variant.tagline}
            </p>
          </div>

          {/* يناسب */}
          <div className="flex flex-wrap items-center gap-1.5">
            {variant.bestFor.slice(0, 3).map((b) => (
              <Badge key={b} variant="outline" className="text-[10px] font-normal text-muted-foreground">
                {b}
              </Badge>
            ))}
          </div>

          {/* الأزرار */}
          <div className="mt-auto flex items-center gap-2">
            <Button
              variant="secondary"
              className="h-11 flex-1"
              disabled={creating}
              onClick={onPreview}
            >
              <Eye className="size-4" />
              {tTpl.variantPreview}
            </Button>
            <Button
              className="h-11 flex-1"
              disabled={creating}
              onClick={onCreate}
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              {creating ? tTpl.variantCreating : tTpl.variantCreateProject}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ============================================================
// التبويب
// ============================================================
export function LandingVariantsTab() {
  const openProject = useAppStore((s) => s.openProject)
  const [previewId, setPreviewId] = useState<LandingVariantId | null>(null)
  const [creatingId, setCreatingId] = useState<LandingVariantId | null>(null)

  const previewVariant = useMemo(
    () => LANDING_VARIANTS.find((v) => v.id === previewId) ?? null,
    [previewId],
  )

  // نفس نمط templates-view: إنشاء مشروع من القالب → فتح المحرّر
  const createFromVariant = async (variant: LandingVariantMeta) => {
    setCreatingId(variant.id)
    try {
      const { project } = await api.createProject({
        idea: `${tTpl.variantIdeaPrefix} ${variant.name}`,
        templateId: 'saas-suite',
        landingVariant: variant.id,
        analysis: null,
      })
      await openProject(project.id)
    } catch {
      toast.error(tTpl.createErrorToast)
    } finally {
      setCreatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* نص تمهيدي */}
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {tTpl.variantsIntro}
      </p>

      {/* الشبكة */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_VARIANTS.map((variant, i) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            index={i}
            creating={creatingId === variant.id}
            onPreview={() => setPreviewId(variant.id)}
            onCreate={() => void createFromVariant(variant)}
          />
        ))}
      </div>

      {/* نافذة المعاينة الحيّة */}
      <Dialog open={previewId !== null} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent className="flex h-[80vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          {previewVariant ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b p-4">
                <div className="min-w-0 space-y-1">
                  <DialogTitle className="leading-tight">{previewVariant.name}</DialogTitle>
                  <DialogDescription className="line-clamp-2">
                    {previewVariant.tagline}
                  </DialogDescription>
                </div>
                <div className="hidden shrink-0 flex-wrap items-center gap-1.5 pt-0.5 sm:flex">
                  {previewVariant.bestFor.slice(0, 3).map((b) => (
                    <Badge key={b} variant="outline" className="text-[10px] font-normal text-muted-foreground">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <VariantLivePreview variantId={previewVariant.id} />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
