'use client'

// معالج التهيئة الأولى — 4 خطوات (الاسم، نوع المشروع، الفكرة، النمط)
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarCheck,
  Check,
  CircleAlert,
  Loader2,
  Server,
  Shapes,
  ShoppingCart,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  PROJECT_STYLE_LABELS,
  PROJECT_TYPE_LABELS,
  type ProjectStyle,
  type ProjectType,
} from '@/lib/types'
import { useAppStore } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 4

const TYPE_OPTIONS: { value: ProjectType; icon: typeof Server }[] = [
  { value: 'saas', icon: Server },
  { value: 'ecommerce', icon: ShoppingCart },
  { value: 'marketplace', icon: Store },
  { value: 'services', icon: Briefcase },
  { value: 'booking', icon: CalendarCheck },
  { value: 'app', icon: AppWindow },
  { value: 'agency', icon: Building2 },
  { value: 'other', icon: Shapes },
]

const STYLE_OPTIONS: { value: ProjectStyle; dots: string[]; desc: string }[] = [
  { value: 'modern', dots: ['#7c3aed', '#a78bfa', '#ede9fe'], desc: t.onboarding.styleModernDesc },
  { value: 'minimal', dots: ['#4b5563', '#9ca3af', '#e5e7eb'], desc: t.onboarding.styleMinimalDesc },
  { value: 'professional', dots: ['#111827', '#374151', '#6b7280'], desc: t.onboarding.styleProfessionalDesc },
  { value: 'luxury', dots: ['#d97706', '#f59e0b', '#fde68a'], desc: t.onboarding.styleLuxuryDesc },
  { value: 'youthful', dots: ['#db2777', '#f472b6', '#fce7f3'], desc: t.onboarding.styleYouthfulDesc },
  { value: 'tech', dots: ['#0d9488', '#2dd4bf', '#ccfbf1'], desc: t.onboarding.styleTechDesc },
]

export function OnboardingView() {
  const user = useAppStore((s) => s.user)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState(user?.name ?? '')
  const [projectType, setProjectType] = useState<ProjectType | null>(null)
  const [idea, setIdea] = useState('')
  const [style, setStyle] = useState<ProjectStyle | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const stepLabel = useMemo(
    () => t.onboarding.stepOf.replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS)),
    [step]
  )

  const goNext = () => {
    setFieldError(null)
    if (step === 0) {
      if (name.trim().length < 2) {
        setFieldError(name.trim() ? t.onboarding.errNameShort : t.onboarding.errNameRequired)
        return
      }
    }
    if (step === 1 && !projectType) {
      setFieldError(t.onboarding.errTypeRequired)
      return
    }
    if (step === 3 && !style) {
      setFieldError(t.onboarding.errStyleRequired)
      return
    }
    setDirection(1)
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  const goBack = () => {
    setFieldError(null)
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleFinish = async () => {
    setFieldError(null)
    if (!style) {
      setFieldError(t.onboarding.errStyleRequired)
      return
    }
    setSubmitting(true)
    setDone(true)
    try {
      await completeOnboarding({
        name: name.trim(),
        projectType: projectType ?? 'other',
        idea: idea.trim() || undefined,
        style,
      })
      // المتجر ينقل المستخدم تلقائيًا إلى مساحة العمل
    } catch {
      setDone(false)
      setSubmitting(false)
      setFieldError(t.onboarding.errSubmit)
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  if (done) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div
          aria-hidden="true"
          className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border bg-card p-10 text-center shadow-xl"
        >
          <span className="bg-primary/10 text-primary grid size-16 place-items-center rounded-full">
            <Check className="size-8" strokeWidth={2.5} />
          </span>
          <h1 className="font-display text-xl font-bold sm:text-2xl">
            {t.onboarding.successTitle}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t.onboarding.successSubtitle}
          </p>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {t.onboarding.finishing}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />

      <div className="relative w-full max-w-xl">
        <Card className="shadow-xl shadow-primary/5">
          {/* header */}
          <CardHeader className="gap-2 text-center">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
              {t.onboarding.greeting}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">{t.onboarding.lead}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-semibold">{stepLabel}</span>
                <span className="text-primary text-xs font-bold" dir="ltr">
                  {step + 1}/{TOTAL_STEPS}
                </span>
              </div>
              <Progress value={progress} aria-label={t.onboarding.stepIndicator} />
              {/* step indicators */}
              <div className="flex items-center justify-between" aria-hidden="true">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <div key={i} className="flex flex-1 items-center">
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors',
                        i < step && 'bg-primary border-primary text-primary-foreground',
                        i === step && 'border-primary text-primary bg-primary/10',
                        i > step && 'border-border text-muted-foreground bg-muted'
                      )}
                    >
                      {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    {i < TOTAL_STEPS - 1 && (
                      <span
                        className={cn(
                          'h-0.5 flex-1',
                          i < step ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* steps */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -28 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="min-h-[260px]"
              >
                {/* step 1 — name */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h2 className="text-lg font-bold sm:text-xl">{t.onboarding.step1Title}</h2>
                      <p className="text-muted-foreground text-sm">
                        {t.onboarding.step1Subtitle}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ob-name">{t.onboarding.step1Label}</Label>
                      <Input
                        id="ob-name"
                        className="h-11"
                        placeholder={t.onboarding.step1Placeholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        aria-invalid={Boolean(fieldError)}
                      />
                      {fieldError && (
                        <p className="text-destructive flex items-center gap-1 text-xs" role="alert">
                          <CircleAlert className="size-3.5" />
                          {fieldError}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* step 2 — project type */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h2 className="text-lg font-bold sm:text-xl">{t.onboarding.step2Title}</h2>
                      <p className="text-muted-foreground text-sm">
                        {t.onboarding.step2Subtitle}
                      </p>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={t.onboarding.step2Title}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                    >
                      {TYPE_OPTIONS.map((opt) => {
                        const selected = projectType === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setProjectType(opt.value)
                              setFieldError(null)
                            }}
                            className={cn(
                              'flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition-all hover:border-primary/50 hover:bg-accent/40',
                              selected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/25'
                                : 'border-border bg-card'
                            )}
                          >
                            <span
                              className={cn(
                                'grid size-10 place-items-center rounded-lg transition-colors',
                                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                              )}
                            >
                              <opt.icon className="size-5" strokeWidth={2} />
                            </span>
                            <span className="text-sm font-semibold">
                              {PROJECT_TYPE_LABELS[opt.value]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {fieldError && (
                      <p className="text-destructive flex items-center gap-1 text-xs" role="alert">
                        <CircleAlert className="size-3.5" />
                        {fieldError}
                      </p>
                    )}
                  </div>
                )}

                {/* step 3 — idea */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h2 className="text-lg font-bold sm:text-xl">{t.onboarding.step3Title}</h2>
                      <p className="text-muted-foreground text-sm">
                        {t.onboarding.step3Subtitle}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ob-idea">{t.onboarding.step3Label}</Label>
                      <Textarea
                        id="ob-idea"
                        className="min-h-36 text-base leading-relaxed"
                        placeholder={t.onboarding.step3Placeholder}
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-primary text-xs font-medium underline-offset-4 hover:underline"
                      onClick={() => {
                        setIdea('')
                        setDirection(1)
                        setStep(3)
                      }}
                    >
                      {t.onboarding.step3Skip}
                    </button>
                  </div>
                )}

                {/* step 4 — style */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <h2 className="text-lg font-bold sm:text-xl">{t.onboarding.step4Title}</h2>
                      <p className="text-muted-foreground text-sm">
                        {t.onboarding.step4Subtitle}
                      </p>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label={t.onboarding.step4Title}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                    >
                      {STYLE_OPTIONS.map((opt) => {
                        const selected = style === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setStyle(opt.value)
                              setFieldError(null)
                            }}
                            className={cn(
                              'flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all hover:border-primary/50 hover:bg-accent/40',
                              selected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/25'
                                : 'border-border bg-card'
                            )}
                          >
                            <span className="flex items-center gap-1.5" aria-hidden="true">
                              {opt.dots.map((dot) => (
                                <span
                                  key={dot}
                                  className="size-4 rounded-full border border-black/5 shadow-sm"
                                  style={{ backgroundColor: dot }}
                                />
                              ))}
                            </span>
                            <span className="text-sm font-bold">
                              {PROJECT_STYLE_LABELS[opt.value]}
                            </span>
                            <span className="text-muted-foreground text-xs leading-relaxed">
                              {opt.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    {fieldError && (
                      <p className="text-destructive flex items-center gap-1 text-xs" role="alert">
                        <CircleAlert className="size-3.5" />
                        {fieldError}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* nav buttons */}
            <div className="flex items-center justify-between gap-3 border-t pt-5">
              {step > 0 ? (
                <Button variant="outline" className="h-11 gap-1.5" onClick={goBack}>
                  <ArrowRight className="size-4" />
                  {t.onboarding.back}
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}

              {step < TOTAL_STEPS - 1 ? (
                <Button className="h-11 gap-1.5 px-6" onClick={goNext}>
                  {t.onboarding.next}
                  <ArrowLeft className="size-4" />
                </Button>
              ) : (
                <Button className="h-11 gap-2 px-6" onClick={handleFinish} disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {t.onboarding.finish}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
