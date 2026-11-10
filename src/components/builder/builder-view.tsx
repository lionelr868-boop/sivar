'use client'

// ============================================================
// SIVAR — BuilderView: مساحة بناء المشروع
// الصفحات (يمين) | معاينة حيّة (وسط) | المساعد/الخصائص (يسار)
// + وضع المعاينة + نافذة التصدير + أشرطة الجوال
// ============================================================
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Bot, FolderTree, SlidersHorizontal } from 'lucide-react'
import { BuilderHeader } from './builder-header'
import { PagesPanel } from './pages-panel'
import { PreviewFrame } from './preview-frame'
import { RightPanel } from './right-panel'
import { ExportDialog } from './export-dialog'

export function BuilderView() {
  const schemaLoading = useAppStore((s) => s.schemaLoading)
  const selectedBlockId = useAppStore((s) => s.selectedBlockId)
  const [mobileSheet, setMobileSheet] = useState<'pages' | 'agent' | 'props' | null>(null)

  if (schemaLoading) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <BuilderHeader />

      <div className="flex min-h-0 flex-1">
        {/* لوحة الصفحات — تبدأ من اليمين في RTL */}
        <aside className="hidden w-60 shrink-0 flex-col border-s bg-card/40 lg:flex" aria-label={t.builder.pagesPanel}>
          <PagesPanel />
        </aside>

        {/* المعاينة الحيّة */}
        <main className="min-w-0 flex-1">
          <PreviewFrame />
        </main>

        {/* المساعد / الخصائص / التصميم / الإصدارات */}
        <aside className="hidden w-80 shrink-0 flex-col border-e bg-card/40 xl:flex" aria-label={t.builder.agentTitle}>
          <RightPanel />
        </aside>
      </div>

      {/* شريط الجوال السفلي */}
      <nav className="flex items-stretch justify-around border-t bg-card/60 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="أدوات البناء">
        <MobileToolButton icon={FolderTree} label={t.builder.openPages} onClick={() => setMobileSheet('pages')} />
        <MobileToolButton icon={Bot} label={t.builder.openAgent} onClick={() => setMobileSheet('agent')} />
        <MobileToolButton
          icon={SlidersHorizontal}
          label={t.builder.openProps}
          onClick={() => setMobileSheet('props')}
          badge={selectedBlockId ? true : false}
        />
      </nav>

      {/* أوراق الجوال للوحات */}
      <Sheet open={mobileSheet === 'pages'} onOpenChange={(o) => setMobileSheet(o ? 'pages' : null)}>
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.builder.pagesPanel}</SheetTitle>
            <SheetDescription>{t.builder.componentsPanel}</SheetDescription>
          </SheetHeader>
          <div className="h-full overflow-y-auto">
            <PagesPanel onNavigated={() => setMobileSheet(null)} />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobileSheet === 'agent'} onOpenChange={(o) => setMobileSheet(o ? 'agent' : null)}>
        <SheetContent side="left" className="w-[22rem] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.builder.agentTitle}</SheetTitle>
            <SheetDescription>{t.builder.agentSubtitle}</SheetDescription>
          </SheetHeader>
          <div className="h-full">
            <RightPanel forceTab="agent" />
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={mobileSheet === 'props'} onOpenChange={(o) => setMobileSheet(o ? 'props' : null)}>
        <SheetContent side="left" className="w-[22rem] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t.builder.propertiesTab}</SheetTitle>
            <SheetDescription>{t.builder.themeTitle}</SheetDescription>
          </SheetHeader>
          <div className="h-full">
            <RightPanel forceTab="properties" />
          </div>
        </SheetContent>
      </Sheet>

      {/* النوافذ فوق كل شيء */}
      <ExportDialog />
    </div>
  )
}

function MobileToolButton({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  badge?: boolean
}) {
  return (
    <Button
      variant="ghost"
      className="relative h-14 flex-1 flex-col gap-1 rounded-none text-xs text-muted-foreground"
      onClick={onClick}
    >
      <Icon className="size-5" />
      {label}
      {badge ? (
        <span className="absolute end-3 top-2 size-2 rounded-full bg-primary" aria-hidden="true" />
      ) : null}
    </Button>
  )
}
