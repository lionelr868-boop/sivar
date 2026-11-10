'use client'

// ============================================================
// SIVAR — الصدفة الرئيسية: مبدّل الواجهات على مسار واحد
// landing / auth / onboarding / app / builder / export-guide
// ============================================================
import { useEffect } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { LandingView } from '@/components/platform/landing/landing-view'
import { AuthView } from '@/components/platform/auth/auth-view'
import { OnboardingView } from '@/components/platform/onboarding/onboarding-view'
import { DashboardView } from '@/components/platform/dashboard/dashboard-view'
import { BuilderView } from '@/components/builder/builder-view'
import { PreviewMode } from '@/components/builder/preview-mode'
import { ExportGuideView } from '@/components/platform/export-guide/export-guide-view'

function SplashScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-sivar.png"
            alt=""
            width={48}
            height={48}
            aria-hidden="true"
            priority
            className="size-12 rounded-[26%] object-contain select-none"
          />
          <span className="font-display text-3xl font-bold tracking-tight">{t.common.brand}</span>
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-[splash_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
        <span className="sr-only" role="status">
          {t.common.loading}
        </span>
      </div>
    </div>
  )
}

export default function Home() {
  const hydrated = useAppStore((s) => s.hydrated)
  const view = useAppStore((s) => s.view)
  const init = useAppStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    // إعادة التمرير عند تبديل الواجهات
    window.scrollTo({ top: 0 })
  }, [view])

  return (
    <TooltipProvider delayDuration={250}>
      {(() => {
        if (!hydrated) return <SplashScreen />
        switch (view) {
          case 'landing':
            return <LandingView />
          case 'auth':
            return <AuthView />
          case 'onboarding':
            return <OnboardingView />
          case 'app':
            return <DashboardView />
          case 'builder':
            return <BuilderView />
          case 'export-guide':
            return <ExportGuideView />
          default:
            return <LandingView />
        }
      })()}
      {/* وضع المعاينة — متاح من كل الواجهات (فوق كل شيء) */}
      <PreviewMode />
      <SonnerToaster position="bottom-left" richColors closeButton />
    </TooltipProvider>
  )
}
