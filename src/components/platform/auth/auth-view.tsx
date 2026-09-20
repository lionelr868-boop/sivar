'use client'

// صفحة الدخول / التسجيل / استعادة كلمة المرور + التجربة السريعة
import { useState } from 'react'
import { ArrowRight, CircleAlert, Eye, EyeOff, Loader2, MailCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandMark } from '@/components/platform/landing/landing-navbar'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Mode = 'login' | 'signup' | 'forgot'
type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-destructive flex items-center gap-1 pt-1 text-xs" role="alert">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function AuthView() {
  const setView = useAppStore((s) => s.setView)
  const login = useAppStore((s) => s.login)
  const signup = useAppStore((s) => s.signup)
  const demoLogin = useAppStore((s) => s.demoLogin)

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const resetErrors = () => {
    setFieldErrors({})
    setError(null)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setForgotSent(false)
    resetErrors()
  }

  // ---------- validation ----------
  const validateEmail = (): string | undefined => {
    if (!email.trim()) return t.auth.errEmailRequired
    if (!EMAIL_REGEX.test(email.trim())) return t.auth.errEmailInvalid
    return undefined
  }

  const validatePassword = (): string | undefined => {
    if (!password) return t.auth.errPasswordRequired
    if (password.length < 6) return t.auth.errPasswordShort
    return undefined
  }

  const validateName = (): string | undefined => {
    if (!name.trim()) return t.auth.errNameRequired
    if (name.trim().length < 2) return t.auth.errNameShort
    return undefined
  }

  // ---------- submits ----------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    resetErrors()
    const errs: FieldErrors = { email: validateEmail(), password: validatePassword() }
    setFieldErrors(errs)
    if (errs.email || errs.password) return
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError((err as Error).message || t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    resetErrors()
    const errs: FieldErrors = {
      name: validateName(),
      email: validateEmail(),
      password: validatePassword(),
    }
    setFieldErrors(errs)
    if (errs.name || errs.email || errs.password) return
    setLoading(true)
    try {
      await signup({ name: name.trim(), email: email.trim(), password })
    } catch (err) {
      setError((err as Error).message || t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    resetErrors()
    const errs: FieldErrors = { email: validateEmail() }
    setFieldErrors(errs)
    if (errs.email) return
    setLoading(true)
    // محاكاة محلية لإرسال رابط الاستعادة
    await new Promise((r) => setTimeout(r, 700))
    setLoading(false)
    setForgotSent(true)
  }

  const handleDemo = async () => {
    resetErrors()
    setDemoLoading(true)
    try {
      await demoLogin()
    } catch (err) {
      setError((err as Error).message || t.common.error)
    } finally {
      setDemoLoading(false)
    }
  }

  const busy = loading || demoLoading

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />

      <div className="relative w-full max-w-md space-y-5">
        {/* back to landing */}
        <div className="flex">
          <Button
            variant="ghost"
            className="text-muted-foreground h-11 gap-1.5 px-3"
            onClick={() => setView('landing')}
          >
            <ArrowRight className="size-4" />
            {t.auth.backToHome}
          </Button>
        </div>

        <Card className="shadow-xl shadow-primary/5">
          <CardHeader className="items-center gap-3 text-center">
            <BrandMark size="lg" />
            <CardTitle className="font-display text-xl font-bold sm:text-2xl">
              {t.auth.welcomeTitle}
            </CardTitle>
            <CardDescription className="text-sm">{t.auth.welcomeSubtitle}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {mode === 'forgot' ? (
              /* ---------- forgot password ---------- */
              forgotSent ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid size-12 place-items-center rounded-full">
                    <MailCheck className="size-6" />
                  </span>
                  <p className="text-foreground text-sm font-semibold leading-relaxed">
                    {t.auth.forgotSuccess}
                  </p>
                  <Button
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => switchMode('login')}
                  >
                    {t.auth.forgotBack}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4" noValidate>
                  <div className="space-y-2 text-start">
                    <h2 className="text-base font-bold">{t.auth.forgotTitle}</h2>
                    <p className="text-muted-foreground text-sm">{t.auth.forgotSubtitle}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">{t.auth.emailLabel}</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      inputMode="email"
                      dir="ltr"
                      className="h-11 text-start"
                      placeholder={t.auth.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(fieldErrors.email)}
                      disabled={busy}
                      required
                    />
                    <FieldError message={fieldErrors.email} />
                  </div>
                  {error && <ErrorBanner message={error} />}
                  <Button type="submit" className="h-11 w-full" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />}
                    {t.auth.forgotSubmit}
                  </Button>
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 w-full text-center text-sm font-medium"
                    onClick={() => switchMode('login')}
                  >
                    {t.auth.forgotBack}
                  </button>
                </form>
              )
            ) : (
              /* ---------- login / signup tabs ---------- */
              <Tabs
                value={mode}
                onValueChange={(v) => switchMode(v as 'login' | 'signup')}
              >
                <TabsList className="h-11 w-full grid grid-cols-2">
                  <TabsTrigger value="login" className="h-9 text-sm">
                    {t.auth.tabLogin}
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="h-9 text-sm">
                    {t.auth.tabSignup}
                  </TabsTrigger>
                </TabsList>

                {/* login form */}
                <TabsContent value="login" className="mt-4">
                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t.auth.emailLabel}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        dir="ltr"
                        className="h-11 text-start"
                        placeholder={t.auth.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(fieldErrors.email)}
                        disabled={busy}
                        required
                      />
                      <FieldError message={fieldErrors.email} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t.auth.passwordLabel}</Label>
                        <button
                          type="button"
                          className="text-primary hover:text-primary/80 text-xs font-medium"
                          onClick={() => switchMode('forgot')}
                        >
                          {t.auth.forgotLink}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          className="h-11 pe-14"
                          placeholder={t.auth.passwordPlaceholder}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={Boolean(fieldErrors.password)}
                          disabled={busy}
                          required
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword ? t.auth.hidePassword : t.auth.showPassword
                          }
                          className="text-muted-foreground hover:text-foreground absolute end-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-md transition-colors"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4.5" />
                          ) : (
                            <Eye className="size-4.5" />
                          )}
                        </button>
                      </div>
                      <FieldError message={fieldErrors.password} />
                    </div>

                    {error && <ErrorBanner message={error} />}

                    <Button type="submit" className="h-11 w-full" disabled={loading}>
                      {loading && <Loader2 className="size-4 animate-spin" />}
                      {t.auth.loginSubmit}
                    </Button>
                  </form>
                </TabsContent>

                {/* signup form */}
                <TabsContent value="signup" className="mt-4">
                  <form onSubmit={handleSignup} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t.auth.nameLabel}</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        className="h-11"
                        placeholder={t.auth.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-invalid={Boolean(fieldErrors.name)}
                        disabled={busy}
                        required
                      />
                      <FieldError message={fieldErrors.name} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t.auth.emailLabel}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        inputMode="email"
                        dir="ltr"
                        className="h-11 text-start"
                        placeholder={t.auth.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-invalid={Boolean(fieldErrors.email)}
                        disabled={busy}
                        required
                      />
                      <FieldError message={fieldErrors.email} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t.auth.passwordLabel}</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          className="h-11 pe-14"
                          placeholder={t.auth.passwordPlaceholder}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={Boolean(fieldErrors.password)}
                          disabled={busy}
                          required
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword ? t.auth.hidePassword : t.auth.showPassword
                          }
                          className="text-muted-foreground hover:text-foreground absolute end-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-md transition-colors"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4.5" />
                          ) : (
                            <Eye className="size-4.5" />
                          )}
                        </button>
                      </div>
                      <FieldError message={fieldErrors.password} />
                    </div>

                    {error && <ErrorBanner message={error} />}

                    <Button type="submit" className="h-11 w-full" disabled={loading}>
                      {loading && <Loader2 className="size-4 animate-spin" />}
                      {t.auth.signupSubmit}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {mode !== 'forgot' && (
              <>
                {/* divider */}
                <div className="flex items-center gap-3" aria-hidden="true">
                  <Separator className="flex-1" />
                  <span className="text-muted-foreground text-xs font-medium">{t.auth.orDivider}</span>
                  <Separator className="flex-1" />
                </div>

                {/* quick demo */}
                <div className="space-y-3">
                  <Button
                    variant="secondary"
                    className="h-11 w-full gap-2 border border-primary/25"
                    onClick={handleDemo}
                    disabled={busy}
                  >
                    {demoLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Zap className="text-primary size-4" />
                    )}
                    {t.auth.demoButton}
                  </Button>
                  <p className="text-muted-foreground text-center text-xs leading-relaxed">
                    {t.auth.demoHint}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
