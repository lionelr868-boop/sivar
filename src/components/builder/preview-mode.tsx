'use client'

// وضع المعاينة: المشروع كما سيراه الزائر — بدون أدوات تحرير
// Task 8-a — زر رجوع بمكدس تاريخ داخلي + مزامنة الصفحات
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { DeviceMode } from '@/lib/types'
import { PrototypeRenderer } from '@/components/prototype/prototype-renderer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Monitor, Smartphone, Tablet, X } from 'lucide-react'

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: 'w-full max-w-[1180px]',
  tablet: 'w-[768px] max-w-full',
  mobile: 'w-[390px] max-w-full',
}

export function PreviewMode() {
  const previewOpen = useAppStore((s) => s.previewOpen)
  const setPreviewOpen = useAppStore((s) => s.setPreviewOpen)
  const schema = useAppStore((s) => s.schema)
  const selectedPageId = useAppStore((s) => s.selectedPageId)
  const selectPage = useAppStore((s) => s.selectPage)
  const device = useAppStore((s) => s.device)
  const setDevice = useAppStore((s) => s.setDevice)

  const [pageId, setPageId] = useState<string | null>(null)
  // مكدس تاريخ التنقل داخل المعاينة (لزر الرجوع)
  const [history, setHistory] = useState<string[]>([])

  if (!previewOpen || !schema) return null

  const activePageId = pageId ?? selectedPageId ?? schema.pages[0]?.id
  const page = schema.pages.find((p) => p.id === activePageId) ?? schema.pages[0]

  /** تنقل داخل المعاينة مع تسجيل السابق في المكدس */
  const navigate = (targetPageId: string) => {
    if (!schema.pages.some((p) => p.id === targetPageId)) return
    setHistory((h) => [...h.slice(-24), activePageId])
    setPageId(targetPageId)
    // مزامنة اختيار الصفحة عند العودة للمحرر
    selectPage(targetPageId)
  }

  /** رجوع خطوة في تاريخ المعاينة */
  const goBack = () => {
    setHistory((h) => {
      const prev = h[h.length - 1]
      if (prev && schema.pages.some((p) => p.id === prev)) {
        setPageId(prev)
        selectPage(prev)
        return h.slice(0, -1)
      }
      return h
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* شريط علوي */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-2 sm:px-3">
        <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={() => setPreviewOpen(false)}>
          <X className="size-4" />
          <span className="hidden sm:inline">{t.builder.exitPreview}</span>
        </Button>

        {/* زر الرجوع — يعمل داخل تاريخ المعاينة */}
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={goBack}
          disabled={history.length === 0}
          aria-label={t.builder.backBtn}
        >
          <ArrowRight className="size-4" />
          <span className="hidden sm:inline">{t.builder.backBtn}</span>
        </Button>

        <span className="hidden truncate text-sm font-semibold sm:block">{schema.metadata.name}</span>

        <div className="flex-1" />

        {/* تنقّل سريع بين الصفحات */}
        <div className="hidden max-w-96 items-center gap-1 overflow-x-auto rounded-lg bg-muted p-0.5 md:flex">
          {schema.pages.slice(0, 8).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(p.id)}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors',
                p.id === page?.id ? 'bg-background font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex-1 md:hidden" />

        {/* الأجهزة */}
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {(
            [
              { id: 'desktop' as DeviceMode, icon: Monitor, label: t.builder.desktop },
              { id: 'tablet' as DeviceMode, icon: Tablet, label: t.builder.tablet },
              { id: 'mobile' as DeviceMode, icon: Smartphone, label: t.builder.mobile },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
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
          ))}
        </div>
      </header>

      {/* المعاينة */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-dots p-3 sm:p-6">
        <div className={cn('mx-auto transition-[width] duration-300', DEVICE_WIDTHS[device])}>
          <div className="overflow-hidden rounded-xl border bg-card shadow-xl">
            <PrototypeRenderer
              schema={schema}
              pageId={page?.id ?? ''}
              interactive
              onNavigate={navigate}
            />
          </div>
        </div>
      </div>

      {/* تلميح سفلي */}
      <footer className="flex h-10 shrink-0 items-center justify-center gap-2 border-t bg-card/80 px-4 text-center text-[11px] text-muted-foreground">
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {t.common.demoDataBadge}
        </span>
        {t.builder.previewHint}
      </footer>
    </div>
  )
}
