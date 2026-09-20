'use client'

// ============================================================
// نموذج — صدفة التطبيق (لوحة التحكم): الشريط الجانبي + الترويسة
// + شريط جوال سفلي + مبدّل الأقسام حسب store.dashboardSection
// Task 3-a
// ============================================================
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  CircleHelp,
  FolderKanban,
  Home,
  LayoutTemplate,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Settings,
  Shapes,
  Sparkles,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import type { DashboardSection } from '@/lib/types'
import { initialsOf } from '@/components/prototype/ui/p-avatar'
import { BrandMark, ThemeToggle } from '@/components/platform/landing/landing-navbar'
import { HomeSection } from './home-section'
import { ProjectsSection, SEARCH_QUERY_KEY } from './projects-section'
import { TemplatesView } from '@/components/platform/templates-library/templates-view'
import { ComponentsView } from '@/components/platform/components-library/components-view'
import { NewProjectFlow } from '@/components/platform/new-project/new-project-flow'
import { HelpView } from '@/components/platform/help/help-view'
import { SettingsView } from '@/components/platform/settings/settings-view'

const NAV_ITEMS: { id: DashboardSection; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: t.dashboard.navHome, icon: Home },
  { id: 'projects', label: t.dashboard.navProjects, icon: FolderKanban },
  { id: 'templates', label: t.dashboard.navTemplates, icon: LayoutTemplate },
  { id: 'components', label: t.dashboard.navComponents, icon: Shapes },
]

const SECONDARY_ITEMS: { id: DashboardSection; label: string; icon: LucideIcon }[] = [
  { id: 'help', label: t.dashboard.navHelp, icon: CircleHelp },
  { id: 'settings', label: t.dashboard.navSettings, icon: Settings },
]

const NOTIFICATIONS = [
  { icon: Sparkles, title: t.dashboard.notifWelcomeTitle, body: t.dashboard.notifWelcomeBody },
  { icon: LayoutTemplate, title: t.dashboard.notifTemplatesTitle, body: t.dashboard.notifTemplatesBody },
  { icon: Rocket, title: t.dashboard.notifGuideTitle, body: t.dashboard.notifGuideBody },
]

/** حوار تأكيد تسجيل الخروج (مشترك بين الشريط الجانبي وقائمة الجوال) */
function LogoutConfirm({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{t.dashboard.logoutDialogTitle}</AlertDialogTitle>
        <AlertDialogDescription>{t.dashboard.logoutDialogBody}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-white hover:bg-destructive/90"
          onClick={onConfirm}
        >
          {t.dashboard.logoutDialogConfirm}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

/** عنصر تنقل واحد بحالة نشطة (خلفية ثانوية + مؤشر جانبي) */
function SidebarNavItem({
  item,
  active,
  onClick,
}: {
  item: { id: DashboardSection; label: string; icon: LucideIcon }
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        active
          ? 'bg-secondary font-medium text-secondary-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      }`}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute start-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary"
        />
      ) : null}
      <Icon className="size-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  )
}

/** محتوى الشريط الجانبي — يُستعمل في العمود الثابت وفي قائمة الجوال (Sheet) */
function SidebarContent({ onNavigate, sheet = false }: { onNavigate?: () => void; sheet?: boolean }) {
  const user = useAppStore((s) => s.user)
  const section = useAppStore((s) => s.dashboardSection)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)
  const logout = useAppStore((s) => s.logout)

  if (!user) return null

  const go = (id: DashboardSection) => {
    setDashboardSection(id)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* العلامة (إزاحة إضافية داخل الـ Sheet لتجنّب زر الإغلاق) */}
      <div className={`flex min-h-14 shrink-0 items-center border-b px-4 ${sheet ? 'pt-2 ps-14' : ''}`}>
        <button
          type="button"
          onClick={() => go('home')}
          className="flex min-h-11 items-center gap-2.5 rounded-lg px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label={t.common.brand}
        >
          <BrandMark />
          <span className="font-display text-lg font-bold tracking-tight">{t.common.brand}</span>
        </button>
      </div>

      {/* التنقل */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t.dashboard.mainNavLabel}>
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={section === item.id}
            onClick={() => go(item.id)}
          />
        ))}

        {/* دعوة إنشاء مشروع */}
        <Button className="mt-3 h-11 w-full" onClick={() => go('new')}>
          <Plus className="size-4.5" />
          {t.dashboard.navNewProject}
        </Button>

        <Separator className="my-3" />

        {SECONDARY_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={section === item.id}
            onClick={() => go(item.id)}
          />
        ))}
      </nav>

      {/* بطاقة المستخدم */}
      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-1.5">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={t.common.logout}
              >
                <LogOut className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <LogoutConfirm onConfirm={() => void logout()} />
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

/** الشريط الجانبي الثابت (سطح المكتب) — على اليمين في RTL */
function AppSidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-s bg-background md:flex md:flex-col">
      <SidebarContent />
    </aside>
  )
}

/** ترويسة التطبيق: قائمة جوال + بحث + مظهر + إشعارات + حساب */
function AppHeader() {
  const user = useAppStore((s) => s.user)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)
  const logout = useAppStore((s) => s.logout)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const submitSearch = () => {
    if (query.trim() !== '') {
      try {
        window.sessionStorage.setItem(SEARCH_QUERY_KEY, query.trim())
      } catch {
        /* تجاهل */
      }
    }
    setDashboardSection('projects')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        {/* قائمة الجوال */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-lg md:hidden"
              aria-label={t.dashboard.menuLabel}
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t.dashboard.moreMenuTitle}</SheetTitle>
              <SheetDescription>{t.dashboard.moreMenuDesc}</SheetDescription>
            </SheetHeader>
            <div className="h-full pb-6">
              <SidebarContent sheet onNavigate={() => setMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* البحث */}
        <div className="hidden sm:block">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch()
              }}
              placeholder={t.dashboard.searchPlaceholder}
              className="w-64 ps-9"
              aria-label={t.dashboard.searchPlaceholder}
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* المظهر */}
        <ThemeToggle />

        {/* الإشعارات */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-11 rounded-lg"
              aria-label={t.dashboard.notificationsLabel}
            >
              <Bell className="size-4.5" />
              <span
                aria-hidden
                className="absolute end-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b p-3">
              <p className="text-sm font-bold">{t.dashboard.notificationsTitle}</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {NOTIFICATIONS.map((n) => {
                const Icon = n.icon
                return (
                  <div key={n.title} className="flex gap-3 border-b p-3 last:border-b-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* حساب المستخدم */}
        {user ? (
          <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  aria-label={t.common.myAccount}
                >
                  <Avatar className="size-9 border">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {initialsOf(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDashboardSection('settings')}>
                  <User />
                  {t.dashboard.accountProfile}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDashboardSection('settings')}>
                  <Settings />
                  {t.dashboard.accountSettings}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault()
                    setLogoutOpen(true)
                  }}
                >
                  <LogOut />
                  {t.dashboard.accountLogout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <LogoutConfirm onConfirm={() => void logout()} />
          </AlertDialog>
        ) : null}
      </div>
    </header>
  )
}

/** شريط التنقل السفلي (جوال) — 5 أيقونات + قائمة كاملة عبر "المزيد" */
function MobileTabBar() {
  const section = useAppStore((s) => s.dashboardSection)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)
  const [moreOpen, setMoreOpen] = useState(false)

  const tabs: { id: DashboardSection; label: string; icon: LucideIcon; accent?: boolean }[] = [
    { id: 'home', label: t.dashboard.navHome, icon: Home },
    { id: 'projects', label: t.dashboard.navProjects, icon: FolderKanban },
    { id: 'templates', label: t.dashboard.navTemplates, icon: LayoutTemplate },
    { id: 'new', label: t.dashboard.navNewProject, icon: Plus, accent: true },
  ]

  return (
    <nav
      aria-label={t.dashboard.mainNavLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = section === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDashboardSection(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className={`grid size-9 place-items-center rounded-full transition-transform ${
                  tab.accent ? 'bg-primary/10' : ''
                } ${active && tab.accent ? 'scale-110' : ''}`}
              >
                <Icon className={tab.accent ? 'size-6' : 'size-5.5'} />
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
        {/* المزيد: قائمة كاملة + تسجيل خروج */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t.dashboard.navMore}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${
                moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="grid size-9 place-items-center">
                <MoreHorizontal className="size-5.5" />
              </span>
              <span className="truncate">{t.dashboard.navMore}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t.dashboard.moreMenuTitle}</SheetTitle>
              <SheetDescription>{t.dashboard.moreMenuDesc}</SheetDescription>
            </SheetHeader>
            <div className="h-full pb-6">
              <SidebarContent sheet onNavigate={() => setMoreOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

/** مبدّل الأقسام حسب حالة المتجر */
function SectionSwitcher({ section }: { section: DashboardSection }) {
  switch (section) {
    case 'home':
      return <HomeSection />
    case 'projects':
      return <ProjectsSection />
    case 'templates':
      return <TemplatesView />
    case 'components':
      return <ComponentsView />
    case 'new':
      return <NewProjectFlow />
    case 'help':
      return <HelpView />
    case 'settings':
      return <SettingsView />
  }
}

export function DashboardView() {
  const user = useAppStore((s) => s.user)
  const section = useAppStore((s) => s.dashboardSection)

  // إعادة التمرير للأعلى عند تغيير القسم
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section])

  // بوابة التحميل — التوجيه مسؤولية الوكيل الرئيسي
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">{t.dashboard.appPreparing}</p>
          <Skeleton className="h-1 w-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 md:pb-10 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <SectionSwitcher section={section} />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
