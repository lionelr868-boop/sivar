'use client'

// شريط التنقل العلوي للصفحة الرئيسية — sticky + blur + قائمة جوال
import { useSyncExternalStore, useState } from 'react'
import { useTheme } from 'next-themes'
import { Layers, Menu, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'

const NAV_LINKS = [
  { href: '#how', label: t.landing.navHow },
  { href: '#templates', label: t.landing.navTemplates },
  { href: '#faq', label: t.landing.navFaq },
]

export function BrandMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-11 rounded-xl' : 'size-8 rounded-lg'
  const icon = size === 'lg' ? 'size-6' : 'size-4.5'
  return (
    <span
      className={`${box} bg-primary text-primary-foreground grid shrink-0 place-items-center shadow-sm shadow-primary/30`}
      aria-hidden="true"
    >
      <Layers className={icon} strokeWidth={2.2} />
    </span>
  )
}

const emptySubscribe = () => () => {}

/** "هل تم الترطيب؟" بدون setState داخل effect (قاعدة react-hooks الجديدة) */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  const isDark = resolvedTheme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 rounded-lg"
      aria-label={isDark ? t.landing.themeToggleLight : t.landing.themeToggleDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      disabled={!mounted}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4.5" />
        ) : (
          <Moon className="size-4.5" />
        )
      ) : (
        <Moon className="size-4.5 opacity-0" />
      )}
    </Button>
  )
}

export function LandingNavbar() {
  const setView = useAppStore((s) => s.setView)
  const [open, setOpen] = useState(false)

  const goAuth = () => {
    setOpen(false)
    setView('auth')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* brand */}
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.common.brand}
        >
          <BrandMark />
          <span className="font-display text-xl font-bold tracking-tight">{t.common.brand}</span>
        </button>

        {/* desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button variant="ghost" className="hidden h-9 px-3 sm:inline-flex" onClick={goAuth}>
            {t.landing.navLogin}
          </Button>
          <Button className="hidden h-9 px-4 sm:inline-flex" onClick={goAuth}>
            {t.landing.navStart}
          </Button>

          {/* mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 rounded-lg md:hidden"
                aria-label={t.landing.navMenuOpen}
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <div className="flex items-center gap-2.5 pt-2">
                  <BrandMark />
                  <SheetTitle className="font-display text-lg font-bold">
                    {t.common.brand}
                  </SheetTitle>
                </div>
                <SheetDescription>{t.common.brandTagline}</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label={t.landing.navMenuOpen}>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="hover:bg-accent/60 rounded-lg px-3 py-3 text-base font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2.5 p-4 pb-8">
                <Button variant="outline" className="h-11 w-full" onClick={goAuth}>
                  {t.landing.navLogin}
                </Button>
                <Button className="h-11 w-full" onClick={goAuth}>
                  {t.landing.navStart}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
