'use client'

// ============================================================
// SIVAR — صفحة الإعدادات: الملف الشخصي / المظهر / اللغة /
// البيانات / الحساب
// Task 3-a
// ============================================================
import { useSyncExternalStore, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  CheckCircle2,
  Coins,
  Globe2,
  Languages,
  Loader2,
  LogOut,
  Moon,
  Palette,
  Save,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const tSet = t.settings

const emptySubscribe = () => () => {}

/** هل تم الترطيب؟ (بدون setState داخل effect) */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
}

/** معاينة مصغّرة لمظهر المنصة (فاتح / داكن) */
function ThemePreview({ mode }: { mode: 'light' | 'dark' }) {
  const light = mode === 'light'
  return (
    <div
      aria-hidden
      className={cn(
        'h-28 w-full overflow-hidden rounded-lg border p-2.5',
        light ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-950',
      )}
    >
      <div className={cn('flex items-center gap-1.5 border-b pb-2', light ? 'border-zinc-200' : 'border-zinc-800')}>
        <span className="size-2 rounded-full bg-primary" />
        <span className="size-2 rounded-full bg-primary/40" />
        <span className={cn('ms-1 h-1.5 w-10 rounded-full', light ? 'bg-zinc-300' : 'bg-zinc-700')} />
      </div>
      <div className="mt-2.5 space-y-1.5">
        <span className={cn('block h-2 w-2/3 rounded-full', light ? 'bg-zinc-300' : 'bg-zinc-700')} />
        <span className={cn('block h-2 w-1/2 rounded-full', light ? 'bg-zinc-200' : 'bg-zinc-800')} />
        <div className="flex gap-1.5 pt-1">
          <span className="h-4 w-9 rounded-md bg-primary/80" />
          <span className={cn('h-4 w-9 rounded-md border', light ? 'border-zinc-300' : 'border-zinc-700')} />
        </div>
      </div>
    </div>
  )
}

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const init = useAppStore((s) => s.init)

  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = resolvedTheme === 'dark'

  // ---------- الملف الشخصي ----------
  const [name, setName] = useState(user?.name ?? '')
  const [ideaText, setIdeaText] = useState(user?.idea ?? '')
  const [saving, setSaving] = useState(false)
  const [savedNote, setSavedNote] = useState(false)

  const saveProfile = async () => {
    if (!user || name.trim() === '') return
    setSaving(true)
    try {
      await api.updateProfile({ name: name.trim(), idea: ideaText.trim() })
      toast.success(tSet.profileSavedToast)
      setSavedNote(true)
      // تحديث بيانات المستخدم في المتجر بصمت (لا يغيّر القسم الحالي)
      await init()
    } catch {
      toast.error(t.common.error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* الترويسة */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Settings className="size-5" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{tSet.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">{tSet.subtitle}</p>
      </header>

      {/* الملف الشخصي */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <User className="size-5 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-bold">{tSet.profileTitle}</h2>
            <p className="text-xs text-muted-foreground">{tSet.profileDesc}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-name">{tSet.nameLabel}</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSavedNote(false)
              }}
              placeholder={tSet.namePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">{tSet.emailLabel}</Label>
            <Input id="settings-email" value={user?.email ?? ''} readOnly disabled dir="ltr" className="text-start" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-idea">{tSet.ideaLabel}</Label>
          <Textarea
            id="settings-idea"
            value={ideaText}
            onChange={(e) => {
              setIdeaText(e.target.value)
              setSavedNote(false)
            }}
            placeholder={tSet.ideaPlaceholder}
            className="min-h-24"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-11 px-6"
            disabled={saving || name.trim() === ''}
            onClick={() => void saveProfile()}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? tSet.saving : tSet.saveProfile}
          </Button>
          {savedNote ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {tSet.profileSavedNote}
            </p>
          ) : null}
        </div>
      </Card>

      {/* مظهر المنصة */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Palette className="size-5 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-bold">{tSet.appearanceTitle}</h2>
            <p className="text-xs text-muted-foreground">{tSet.appearanceDesc}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(['light', 'dark'] as const).map((mode) => {
            const active = mounted && (mode === 'dark') === isDark
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setTheme(mode)}
                className={cn(
                  'min-h-11 rounded-xl border-2 p-2.5 text-start transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  active ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-primary/40',
                )}
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    {mode === 'light' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    {mode === 'light' ? tSet.themeLight : tSet.themeDark}
                  </span>
                  {active ? <Badge className="bg-primary hover:bg-primary">{tSet.themeActive}</Badge> : null}
                </div>
                <ThemePreview mode={mode} />
              </button>
            )
          })}
        </div>
      </Card>

      {/* اللغة */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Languages className="size-5 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-bold">{tSet.languageTitle}</h2>
            <p className="text-xs text-muted-foreground">{tSet.languageDesc}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="flex min-h-11 items-center gap-2 rounded-full border-2 border-primary bg-secondary px-4 text-sm font-bold text-secondary-foreground">
            {tSet.arabic}
            <Badge className="bg-primary hover:bg-primary">{tSet.active}</Badge>
          </span>
          <span className="flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full border px-4 text-sm font-medium text-muted-foreground opacity-70" aria-disabled="true">
            {tSet.french}
            <Badge variant="outline">{tSet.comingSoon}</Badge>
          </span>
          <span className="flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full border px-4 text-sm font-medium text-muted-foreground opacity-70" aria-disabled="true">
            {tSet.english}
            <Badge variant="outline">{tSet.comingSoon}</Badge>
          </span>
        </div>
      </Card>

      {/* البيانات */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Coins className="size-5 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-bold">{tSet.dataTitle}</h2>
            <p className="text-xs text-muted-foreground">{tSet.dataDesc}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Coins className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{tSet.currencyLabel}</p>
              <p className="truncate text-sm font-bold">{tSet.currencyValue}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Globe2 className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{tSet.timezoneLabel}</p>
              <p className="truncate text-sm font-bold" dir="ltr" style={{ textAlign: 'start' }}>
                {tSet.timezoneValue}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* الحساب */}
      <Card className="gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-2.5">
          <LogOut className="size-5 text-primary" aria-hidden />
          <div>
            <h2 className="text-base font-bold">{tSet.accountTitle}</h2>
            <p className="text-xs text-muted-foreground">{tSet.accountDesc}</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="h-11 border-destructive/40 px-6 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="size-4" />
              {tSet.logoutButton}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tSet.logoutDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>{tSet.logoutDialogBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => void logout()}
              >
                {tSet.logoutDialogConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  )
}
