'use client'

// ============================================================
// SIVAR — المسار الذهبي لمشروع جديد:
// فكرة → تحليل ذكي → مراجعة/تعديل → بناء → نجاح → المحرّر
// Task 3-a
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { PAGE_TYPE_LABELS, PROJECT_STYLE_LABELS, PROJECT_TYPE_LABELS } from '@/lib/types'
import type { IdeaAnalysis, ProjectStyle, ProjectType, SuggestedPage } from '@/lib/types'
import { LANDING_VARIANTS } from '@/lib/project/landing-kit'
import type { LandingVariantId } from '@/lib/types'
import { LandingVariantThumb } from '@/components/platform/templates-library/landing-variant-thumb'
import { Progress } from '@/components/ui/progress'

const tNP = t.newProject

type Step = 'idea' | 'variant' | 'analyzing' | 'review' | 'building' | 'success'

const MIN_IDEA_LENGTH = 10

// 8 أنواع شائعة كخيارات سريعة (التلقائي = الذكاء الاصطناعي يحدد)
const QUICK_TYPES: ProjectType[] = [
  'ecommerce',
  'saas',
  'booking',
  'restaurant',
  'education',
  'health',
  'services',
  'fintech',
]

const QUICK_STYLES: ProjectStyle[] = ['modern', 'minimal', 'professional', 'luxury', 'youthful', 'tech']

const ANALYZE_STAGES = [tNP.analyzeStage1, tNP.analyzeStage2, tNP.analyzeStage3]
const BUILD_STAGES = [tNP.buildStep1, tNP.buildStep2, tNP.buildStep3, tNP.buildStep4]

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// خطوات المسار الخمس (لمؤشر التقدّم)
const FLOW_STEPS = [tNP.stepIdea, tNP.stepVariant, tNP.stepAnalyze, tNP.stepReview, tNP.stepBuild]
const STEP_INDEX: Record<Step, number> = {
  idea: 0,
  variant: 1,
  analyzing: 2,
  review: 3,
  building: 4,
  success: 5,
}

/** حاوية خطوة مع انتقال سلس (دخول من اليسار في RTL) */
function StepShell({ stepKey, children }: { stepKey: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: -28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 28 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/** عنصر قائمة تحقّق (قيد التنفيذ / منجز / معلّق) */
function ChecklistItem({
  label,
  state,
}: {
  label: string
  state: 'pending' | 'active' | 'done'
}) {
  return (
    <li
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 transition-colors duration-300 ${
        state === 'done' ? 'bg-emerald-500/10' : state === 'active' ? 'bg-secondary' : ''
      }`}
    >
      {state === 'done' ? (
        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
      ) : state === 'active' ? (
        <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />
      ) : (
        <Circle className="size-5 shrink-0 text-muted-foreground/50" aria-hidden />
      )}
      <span
        className={`text-sm font-medium ${
          state === 'done' ? 'text-foreground' : state === 'active' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
      {state === 'done' ? (
        <span className="ms-auto text-sm font-bold text-emerald-600 dark:text-emerald-400" aria-hidden>
          ✓
        </span>
      ) : null}
    </li>
  )
}

/** مؤشر تقدّم المسار — 5 خطوات بنقاط وخطوط واصلة (نمط Onboarding) */
function FlowProgress({ step }: { step: Step }) {
  const current = Math.min(STEP_INDEX[step], FLOW_STEPS.length - 1)
  const done = STEP_INDEX[step] >= FLOW_STEPS.length
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{FLOW_STEPS[current]}</span>
        <span className="text-xs font-bold text-primary" dir="ltr">
          {current + 1}/{FLOW_STEPS.length}
        </span>
      </div>
      <Progress value={(current / (FLOW_STEPS.length - 1)) * 100} aria-label={tNP.stepIndicator} />
      <div className="flex items-center justify-between" aria-hidden="true">
        {FLOW_STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold transition-colors ${
                done || i < current
                  ? 'border-primary bg-primary text-primary-foreground'
                  : i === current
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {done || i < current ? <CheckCircle2 className="size-3" strokeWidth={3} /> : i + 1}
            </span>
            {i < FLOW_STEPS.length - 1 ? (
              <span className={`h-0.5 flex-1 ${done || i < current ? 'bg-primary' : 'bg-border'}`} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export function NewProjectFlow() {
  const openProject = useAppStore((s) => s.openProject)
  const setDashboardSection = useAppStore((s) => s.setDashboardSection)

  // ---------- حالة المسار ----------
  const [step, setStep] = useState<Step>('idea')
  const [idea, setIdea] = useState('')
  const [type, setType] = useState<ProjectType | ''>('')
  const [audience, setAudience] = useState('')
  const [style, setStyle] = useState<ProjectStyle | ''>('')
  const [colorMode, setColorMode] = useState<'auto' | 'custom'>('auto')
  const [colors, setColors] = useState({ primary: '#7c3aed', secondary: '#0d9488', accent: '#d97706' })
  const [optionsOpen, setOptionsOpen] = useState(false)

  // نمط الواجهة (اختياري — افتراضي classic-split)
  const [landingVariant, setLandingVariant] = useState<LandingVariantId>('classic-split')

  const [analysis, setAnalysis] = useState<IdeaAnalysis | null>(null)
  const [projectName, setProjectName] = useState('')
  const [selectedPages, setSelectedPages] = useState<SuggestedPage[]>([])
  const [editMode, setEditMode] = useState(false)

  const [analyzeStage, setAnalyzeStage] = useState(0)
  const [buildStage, setBuildStage] = useState(0)
  const [buildError, setBuildError] = useState(false)

  // مؤقّتات المراحل — تُنظّف عند إلغاء التثبيت
  const analyzeTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const buildTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(
    () => () => {
      if (analyzeTimer.current) clearInterval(analyzeTimer.current)
      if (buildTimer.current) clearInterval(buildTimer.current)
    },
    [],
  )

  const ideaReady = idea.trim().length >= MIN_IDEA_LENGTH

  const analyzeStageState = (i: number): 'pending' | 'active' | 'done' =>
    i < analyzeStage ? 'done' : i === analyzeStage ? 'active' : 'pending'

  // ---------- الخطوة 2: التحليل ----------
  const startAnalysis = async () => {
    if (!ideaReady) return
    setStep('analyzing')
    setAnalyzeStage(0)
    if (analyzeTimer.current) clearInterval(analyzeTimer.current)
    analyzeTimer.current = setInterval(() => {
      setAnalyzeStage((s) => Math.min(s + 1, ANALYZE_STAGES.length - 1))
    }, 900)

    try {
      const [result] = await Promise.all([api.analyzeIdea(idea.trim()), delay(2400)])
      if (analyzeTimer.current) clearInterval(analyzeTimer.current)
      setAnalysis(result.analysis)
      setProjectName(result.analysis.name)
      setSelectedPages(result.analysis.suggestedPages)
      setStep('review')
    } catch {
      if (analyzeTimer.current) clearInterval(analyzeTimer.current)
      toast.error(tNP.errorAnalyze)
      setStep('idea')
    }
  }

  // ---------- الخطوة 4: البناء ----------
  const startBuilding = async () => {
    if (!analysis) return
    setStep('building')
    setBuildStage(0)
    setBuildError(false)
    if (buildTimer.current) clearInterval(buildTimer.current)
    buildTimer.current = setInterval(() => {
      setBuildStage((s) => Math.min(s + 1, BUILD_STAGES.length - 1))
    }, 700)

    const finalAnalysis: IdeaAnalysis = {
      ...analysis,
      name: projectName.trim() || analysis.name,
      audience: audience.trim() || analysis.audience,
      suggestedPages: selectedPages.length > 0 ? selectedPages : analysis.suggestedPages,
    }

    try {
      const [result] = await Promise.all([
        api.createProject({
          idea: idea.trim(),
          analysis: finalAnalysis,
          name: finalAnalysis.name,
          type: type || undefined,
          style: style || undefined,
          audience: finalAnalysis.audience,
          palette: colorMode === 'custom' ? colors : null,
          landingVariant,
        }),
        delay(2800),
      ])
      if (buildTimer.current) clearInterval(buildTimer.current)
      setStep('success')
      setTimeout(() => void openProject(result.project.id), 1200)
    } catch {
      if (buildTimer.current) clearInterval(buildTimer.current)
      setBuildError(true)
      toast.error(tNP.errorCreate)
    }
  }

  const togglePage = (page: SuggestedPage) => {
    setSelectedPages((pages) => {
      const exists = pages.some((p) => p.name === page.name && p.type === page.type)
      return exists
        ? pages.filter((p) => !(p.name === page.name && p.type === page.type))
        : [...pages, page]
    })
  }

  const stepKey = useMemo(() => `${step}${editMode ? '-edit' : ''}`, [step, editMode])

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {/* زر الرجوع الصغير */}
      <Button
        variant="ghost"
        className="h-10 px-3 text-muted-foreground"
        onClick={() => setDashboardSection('projects')}
      >
        <ArrowRight className="size-4" />
        {tNP.backToProjects}
      </Button>

      {/* مؤشر تقدّم المسار — 5 خطوات */}
      <FlowProgress step={step} />

      <StepShell stepKey={stepKey}>
        {/* ================ الخطوة 1: الفكرة ================ */}
        {step === 'idea' ? (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-7" aria-hidden />
              </span>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {tNP.ideaTitle}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">{tNP.ideaSubtitle}</p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="new-idea" className="sr-only">
                {tNP.ideaTitle}
              </Label>
              <Textarea
                id="new-idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={tNP.ideaPlaceholder}
                className="min-h-40 text-base leading-relaxed sm:text-lg"
              />
              <p
                className={`text-xs ${ideaReady ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'}`}
              >
                {tNP.ideaTooShort}
              </p>
            </div>

            {/* خيارات إضافية */}
            <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
              <CollapsibleTrigger className="group flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {tNP.moreOptions}
                <span className="text-xs font-normal text-muted-foreground">
                  ({t.common.optional})
                </span>
                <ChevronDown
                  aria-hidden
                  className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-6 rounded-xl border bg-muted/30 p-4 sm:p-5">
                  <p className="text-xs text-muted-foreground">{tNP.moreOptionsHint}</p>

                  {/* نوع المشروع */}
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold">{tNP.typeLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_TYPES.map((v) => {
                        const active = type === v
                        return (
                          <button
                            key={v}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setType((cur) => (cur === v ? '' : v))}
                            className={`h-10 min-h-10 rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                              active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                          >
                            {PROJECT_TYPE_LABELS[v]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* الجمهور */}
                  <div className="space-y-2.5">
                    <Label htmlFor="new-audience" className="text-sm font-semibold">
                      {tNP.audienceLabel}
                    </Label>
                    <Input
                      id="new-audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder={tNP.audiencePlaceholder}
                      className="bg-background"
                    />
                  </div>

                  {/* النمط */}
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold">{tNP.styleLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_STYLES.map((v) => {
                        const active = style === v
                        return (
                          <button
                            key={v}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setStyle((cur) => (cur === v ? '' : v))}
                            className={`h-10 min-h-10 rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                              active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                          >
                            {PROJECT_STYLE_LABELS[v]}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* الألوان */}
                  <div className="space-y-2.5">
                    <p className="text-sm font-semibold">{tNP.colorsLabel}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={colorMode === 'auto'}
                        onClick={() => setColorMode('auto')}
                        className={`h-10 min-h-10 rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          colorMode === 'auto'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {tNP.colorsAuto}
                      </button>
                      <button
                        type="button"
                        aria-pressed={colorMode === 'custom'}
                        onClick={() => setColorMode('custom')}
                        className={`h-10 min-h-10 rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          colorMode === 'custom'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {tNP.colorsCustom}
                      </button>
                    </div>
                    {colorMode === 'custom' ? (
                      <div className="grid grid-cols-3 gap-3">
                        {(
                          [
                            { key: 'primary', label: tNP.colorPrimary },
                            { key: 'secondary', label: tNP.colorSecondary },
                            { key: 'accent', label: tNP.colorAccent },
                          ] as const
                        ).map((c) => (
                          <div key={c.key} className="space-y-1.5">
                            <Label htmlFor={`color-${c.key}`} className="text-xs font-medium text-muted-foreground">
                              {c.label}
                            </Label>
                            <input
                              id={`color-${c.key}`}
                              type="color"
                              value={colors[c.key]}
                              onChange={(e) => setColors((prev) => ({ ...prev, [c.key]: e.target.value }))}
                              className="h-11 w-full cursor-pointer rounded-lg border bg-background p-1.5"
                              aria-label={c.label}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Button
              size="lg"
              className="h-12 w-full text-base"
              disabled={!ideaReady}
              onClick={() => setStep('variant')}
            >
              {t.common.next}
              <ArrowLeft className="size-4" />
            </Button>
          </div>
        ) : null}

        {/* ================ الخطوة 2 (اختيارية): شكل الصفحة الرئيسية ================ */}
        {step === 'variant' ? (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  {tNP.variantStepTitle}
                </h1>
                <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                  {t.common.optional}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground sm:text-base">{tNP.variantStepSubtitle}</p>
            </div>

            {/* شبكة الأنماط الـ12 */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {LANDING_VARIANTS.map((variant) => {
                const selected = landingVariant === variant.id
                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setLandingVariant(variant.id)}
                    className={`flex flex-col gap-2 rounded-xl border p-2.5 text-start transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      selected
                        ? 'border-primary bg-secondary/70 shadow-sm'
                        : 'border-border hover:border-primary/30 hover:bg-accent/40'
                    }`}
                  >
                    <span className="aspect-[4/3] w-full">
                      <LandingVariantThumb variant={variant} className="h-full w-full" />
                    </span>
                    <span className="space-y-0.5 px-0.5 pb-0.5">
                      <span className="block truncate text-xs font-semibold">{variant.name}</span>
                      <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                        {variant.tagline}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="h-12 flex-1"
                onClick={() => setStep('idea')}
              >
                {tNP.variantBackToIdea}
              </Button>
              <Button size="lg" className="h-12 flex-1" onClick={() => void startAnalysis()}>
                {tNP.submitAnalyze}
              </Button>
            </div>
          </div>
        ) : null}

        {/* ================ الخطوة 3: التحليل ================ */}
        {step === 'analyzing' ? (
          <div className="space-y-6 py-8">
            <div className="space-y-3 text-center">
              <Loader2
                className="mx-auto size-10 animate-spin text-primary"
                aria-hidden
              />
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                {tNP.analyzingTitle}
              </h1>
              <p className="text-sm text-muted-foreground">{tNP.analyzingSubtitle}</p>
            </div>
            <Card className="gap-0 p-4 sm:p-6">
              <ul className="space-y-1.5">
                {ANALYZE_STAGES.map((label, i) => (
                  <ChecklistItem key={label} label={label} state={analyzeStageState(i)} />
                ))}
              </ul>
            </Card>
          </div>
        ) : null}

        {/* ================ الخطوة 4: المراجعة / التعديل ================ */}
        {step === 'review' && analysis ? (
          editMode ? (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  {tNP.editTitle}
                </h1>
                <p className="text-sm text-muted-foreground">{tNP.editHint}</p>
              </div>

              <Card className="gap-4 p-4 sm:p-6">
                <div className="space-y-2.5">
                  <Label htmlFor="project-name">{tNP.projectNameLabel}</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={tNP.projectNamePlaceholder || analysis.name}
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{tNP.suggestedPages}</p>
                    <span className="text-xs text-muted-foreground">
                      {selectedPages.length} {tNP.pagesCountSuffix}
                    </span>
                  </div>
                  <div className="max-h-64 space-y-1.5 overflow-y-auto pe-1">
                    {analysis.suggestedPages.map((page) => {
                      const checked = selectedPages.some(
                        (p) => p.name === page.name && p.type === page.type,
                      )
                      return (
                        <label
                          key={`${page.name}-${page.type}`}
                          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 transition-colors ${
                            checked ? 'border-primary/40 bg-secondary/60' : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => togglePage(page)}
                            aria-label={page.name}
                          />
                          <span className="text-sm font-medium">{page.name}</span>
                          <Badge variant="outline" className="ms-auto text-[10px] font-normal text-muted-foreground">
                            {PAGE_TYPE_LABELS[page.type]}
                          </Badge>
                        </label>
                      )
                    })}
                  </div>
                  {selectedPages.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">{tNP.pagesRequiredHint}</p>
                  ) : null}
                </div>
              </Card>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 flex-1"
                  onClick={() => setEditMode(false)}
                >
                  {tNP.backToReview}
                </Button>
                <Button
                  size="lg"
                  className="h-12 flex-1"
                  disabled={selectedPages.length === 0}
                  onClick={() => void startBuilding()}
                >
                  {tNP.startBuilding}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1.5 text-center">
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {tNP.reviewTitle}
                </h1>
                <p className="text-sm text-muted-foreground">{tNP.reviewSubtitle}</p>
              </div>

              {/* بطاقة نتيجة التحليل */}
              <Card className="gap-4 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {tNP.analysisType}:
                  </span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {PROJECT_TYPE_LABELS[analysis.type]}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-muted-foreground">{tNP.analysisAudience}</p>
                  <p className="text-sm font-medium leading-relaxed">{analysis.audience}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-muted-foreground">{tNP.analysisDescription}</p>
                  <p className="text-sm leading-relaxed">{analysis.description}</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground">{tNP.suggestedPages}</p>
                    <span className="text-xs font-medium text-muted-foreground">
                      {selectedPages.length} {tNP.pagesCountSuffix}
                    </span>
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {(selectedPages.length > 0 ? selectedPages : analysis.suggestedPages).map((page) => (
                      <li
                        key={`${page.name}-${page.type}`}
                        className="flex min-h-11 items-center gap-2.5 rounded-lg bg-muted/50 px-3"
                      >
                        <CheckCircle2
                          className="size-4.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                          aria-hidden
                        />
                        <span className="truncate text-sm font-medium" title={page.name}>
                          {page.name}
                        </span>
                        <Badge variant="outline" className="ms-auto shrink-0 text-[10px] font-normal text-muted-foreground">
                          {PAGE_TYPE_LABELS[page.type]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <p className="text-center text-sm font-semibold">{tNP.confirmQuestion}</p>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button variant="outline" size="lg" className="h-12 flex-1" onClick={() => setEditMode(true)}>
                  {tNP.editSuggestion}
                </Button>
                <Button size="lg" className="h-12 flex-1" onClick={() => void startBuilding()}>
                  {tNP.startBuilding}
                </Button>
              </div>
            </div>
          )
        ) : null}

        {/* ================ الخطوة 5: البناء ================ */}
        {step === 'building' ? (
          <div className="space-y-6 py-8">
            <div className="space-y-3 text-center">
              <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden />
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                {tNP.buildingTitle}
              </h1>
              <p className="text-sm text-muted-foreground">{tNP.buildingSubtitle}</p>
            </div>
            <Card className="gap-0 p-4 sm:p-6">
              <ul className="space-y-1.5">
                {BUILD_STAGES.map((label, i) => (
                  <ChecklistItem
                    key={label}
                    label={label}
                    state={
                      buildError
                        ? i < buildStage
                          ? 'done'
                          : 'pending'
                        : i < buildStage
                          ? 'done'
                          : i === buildStage
                            ? 'active'
                            : 'pending'
                    }
                  />
                ))}
              </ul>
            </Card>
            {buildError ? (
              <div className="flex flex-col items-center gap-3">
                <Button variant="outline" size="lg" className="h-12" onClick={() => setStep('review')}>
                  {tNP.backToReview}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ================ النجاح ================ */}
        {step === 'success' ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="grid size-24 place-items-center rounded-full bg-emerald-500/10"
            >
              <CheckCircle2 className="size-12 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </motion.span>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                {tNP.successTitle}
              </h1>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {tNP.successSubtitle}
              </p>
            </div>
          </div>
        ) : null}
      </StepShell>
    </div>
  )
}
