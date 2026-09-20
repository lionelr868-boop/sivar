'use client'

// تذييل الصفحة الرئيسية — يلتصق بأسفل الشاشة عبر mt-auto
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { BrandMark } from './landing-navbar'

const PRODUCT_LINKS = [
  { href: '#how', label: t.landing.navHow },
  { href: '#templates', label: t.landing.navTemplates },
  { href: '#faq', label: t.landing.navFaq },
]

export function LandingFooter() {
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  const openHelp = () => {
    if (user) setDashboardSection('help')
    else setView('auth')
  }

  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/25">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-12">
          {/* brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <BrandMark />
              <span className="font-display text-xl font-bold">{t.common.brand}</span>
            </div>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {t.common.brandTagline}
            </p>
          </div>

          {/* product column */}
          <nav aria-label={t.landing.footerProduct} className="space-y-3">
            <h3 className="text-foreground text-sm font-bold">{t.landing.footerProduct}</h3>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* support column */}
          <nav aria-label={t.landing.footerSupport} className="space-y-3">
            <h3 className="text-foreground text-sm font-bold">{t.landing.footerSupport}</h3>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={openHelp}
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  {t.landing.footerHelp}
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* bottom row */}
        <div className="border-border/60 mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-center sm:flex-row sm:text-start">
          <p className="text-muted-foreground text-xs sm:text-sm">{t.landing.footerMadeIn}</p>
          <p className="text-muted-foreground text-xs sm:text-sm" dir="ltr">
            © {year} {t.common.brand} — {t.landing.footerRights}
          </p>
        </div>
      </div>
    </footer>
  )
}
