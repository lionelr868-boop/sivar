'use client'

// إطار المعاينة الحيّة: متصفح وهمي + أبعاد الجهاز + وضع التحرير (أغلفة المكوّنات)
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { PrototypeRenderer } from '@/components/prototype/prototype-renderer'
import { Lock } from 'lucide-react'

const DEVICE_WIDTHS: Record<string, string> = {
  desktop: 'w-full max-w-[1180px]',
  tablet: 'w-[768px] max-w-full',
  mobile: 'w-[390px] max-w-full',
}

export function PreviewFrame() {
  const schema = useAppStore((s) => s.schema)
  const selectedPageId = useAppStore((s) => s.selectedPageId)
  const selectedBlockId = useAppStore((s) => s.selectedBlockId)
  const selectBlock = useAppStore((s) => s.selectBlock)
  const device = useAppStore((s) => s.device)

  if (!schema) return null
  const page = schema.pages.find((p) => p.id === selectedPageId) ?? schema.pages[0]
  if (!page) {
    return (
      <div className="flex h-full items-center justify-center bg-dots">
        <p className="text-sm text-muted-foreground">{t.builder.noBlocksHint}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-dots p-3 sm:p-5">
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
        {/* شريط المتصفح الوهمي */}
        <div className="flex h-9 shrink-0 items-center gap-3 rounded-t-xl border border-b-0 bg-card px-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-muted px-2.5 py-1" dir="ltr">
            <Lock className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {page.slug || 'home'}.netlify.app
            </span>
          </div>
          <span className="hidden shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground sm:inline">
            {page.name}
          </span>
        </div>

        {/* جسم المعاينة */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-b-xl border bg-card shadow-lg">
          <div className="h-full overflow-y-auto">
            <div className={cn('mx-auto transition-[width] duration-300', DEVICE_WIDTHS[device])}>
              <PrototypeRenderer
                schema={schema}
                pageId={page.id}
                selectedBlockId={selectedBlockId}
                onBlockSelect={selectBlock}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
