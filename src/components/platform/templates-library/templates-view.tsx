'use client'

// ============================================================
// نموذج — مكتبة القوالب: 4 تبويبات
// قوالب المشاريع (14) | صفحات الهبوط (12 نمطاً) | قوالبي | مكتبة HTML
// كل تبويب يُحمّل بياناته فقط عند تفعيله (Radix Tabs lazy mount)
// Task 3-a → أعيدت هيكلته في Task 7-d
// ============================================================
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bookmark,
  ChevronDown,
  Code2,
  LayoutTemplate,
  Loader2,
  MonitorSmartphone,
  Plus,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import * as api from '@/lib/api-client'
import { t } from '@/lib/i18n'
import { PROJECT_TYPE_LABELS } from '@/lib/types'
import type { ProjectType } from '@/lib/types'
import { TEMPLATES, buildTemplateSchema } from '@/lib/project/templates'
import type { TemplateMeta } from '@/lib/project/templates'
import { TemplateMiniPreview } from '@/components/prototype/template-mini-preview'
import { LandingVariantsTab } from './landing-variants-tab'
import { SavedTemplatesTab } from './saved-templates-tab'
import { HtmlLibraryTab } from './html-library-tab'

const tTpl = t.templates

type CategoryFilter = 'all' | ProjectType
type LibraryTab = 'templates' | 'variants' | 'saved' | 'html'

function TemplateCard({
  meta,
  pageNames,
  creating,
  onUse,
  index,
}: {
  meta: TemplateMeta
  pageNames: string[]
  creating: boolean
  onUse: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="flex h-full flex-col gap-0 overflow-hidden py-0 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        {/* معاينة حية مصغّرة */}
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b bg-muted/30">
          <TemplateMiniPreview templateId={meta.id} className="absolute inset-0 h-full w-full" />
        </div>

        {/* المعلومات */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold leading-tight">{meta.name}</h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {meta.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {PROJECT_TYPE_LABELS[meta.category]}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">
              {meta.pageCount} {tTpl.pagesLabel}
            </span>
          </div>

          {/* الصفحات */}
          <Collapsible>
            <CollapsibleTrigger className="group flex min-h-9 items-center gap-1 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {tTpl.pagesSection}
              <ChevronDown
                aria-hidden
                className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {pageNames.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="text-[10px] font-normal text-muted-foreground"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button
            className="mt-auto h-11 w-full"
            disabled={creating}
            onClick={onUse}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4.5" />
            )}
            {creating ? tTpl.usingTemplate : tTpl.useTemplate}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

/** محتوى تبويب «قوالب المشاريع» — الشبكة الـ14 (سلوك Task 3-a كما هو) */
function ProjectTemplatesGrid() {
  const openProject = useAppStore((s) => s.openProject)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')
  const [creatingId, setCreatingId] = useState<string | null>(null)

  // فئات القوالب الفعلية (من TEMPLATES)
  const categories = useMemo(
    () => Array.from(new Set(TEMPLATES.map((tp) => tp.category))),
    [],
  )

  // أسماء صفحات كل قالب — تُبنى مرة واحدة عند التحميل
  const pageNamesByTemplate = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const tp of TEMPLATES) {
      map.set(tp.id, buildTemplateSchema(tp.id).pages.map((p) => p.name))
    }
    return map
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TEMPLATES.filter((tp) => (category === 'all' ? true : tp.category === category)).filter(
      (tp) => (q === '' ? true : tp.name.toLowerCase().includes(q) || tp.tagline.toLowerCase().includes(q)),
    )
  }, [category, query])

  const createFromTemplate = async (meta: TemplateMeta) => {
    setCreatingId(meta.id)
    try {
      const { project } = await api.createProject({
        idea: `${tTpl.ideaPrefix} ${meta.name}`,
        templateId: meta.id,
        name: meta.name,
        type: meta.category,
        analysis: null,
      })
      await openProject(project.id)
    } catch {
      toast.error(tTpl.createErrorToast)
    } finally {
      setCreatingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* البحث + الفئات */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tTpl.searchPlaceholder}
            className="ps-9"
            aria-label={tTpl.searchPlaceholder}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group">
          <button
            type="button"
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
            className={`h-9 min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              category === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {tTpl.categoryAll}
          </button>
          {categories.map((cat) => {
            const active = category === cat
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(cat)}
                className={`h-9 min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {PROJECT_TYPE_LABELS[cat]}
              </button>
            )
          })}
        </div>
      </div>

      {/* الشبكة */}
      {filtered.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-muted">
            <Search className="size-9 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-bold">{tTpl.emptyTitle}</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tTpl.emptySubtitle}
          </p>
          <Button
            variant="outline"
            className="mt-5 h-11 px-6"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
          >
            {tTpl.categoryAll}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((meta, i) => (
            <TemplateCard
              key={meta.id}
              meta={meta}
              index={i}
              pageNames={pageNamesByTemplate.get(meta.id) ?? []}
              creating={creatingId === meta.id}
              onUse={() => void createFromTemplate(meta)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TemplatesView() {
  const [tab, setTab] = useState<LibraryTab>('templates')

  return (
    <div className="space-y-6">
      {/* الترويسة */}
      <header className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <LayoutTemplate className="size-5" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{tTpl.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">{tTpl.subtitle}</p>
      </header>

      {/* التبويبات */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as LibraryTab)}>
        <TabsList className="grid h-11 w-full max-w-2xl grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="templates" className="h-9 gap-1.5 text-xs sm:text-sm">
            <LayoutTemplate aria-hidden />
            {tTpl.tabTemplates}
          </TabsTrigger>
          <TabsTrigger value="variants" className="h-9 gap-1.5 text-xs sm:text-sm">
            <MonitorSmartphone aria-hidden />
            {tTpl.tabLandingVariants}
          </TabsTrigger>
          <TabsTrigger value="saved" className="h-9 gap-1.5 text-xs sm:text-sm">
            <Bookmark aria-hidden />
            {tTpl.tabSaved}
          </TabsTrigger>
          <TabsTrigger value="html" className="h-9 gap-1.5 text-xs sm:text-sm">
            <Code2 aria-hidden />
            {tTpl.tabHtmlLibrary}
          </TabsTrigger>
        </TabsList>

        {/* قوالب المشاريع — الشبكة الـ14 الأصلية */}
        <TabsContent value="templates" className="mt-4">
          <ProjectTemplatesGrid />
        </TabsContent>

        {/* صفحات الهبوط — 12 نمطاً */}
        <TabsContent value="variants" className="mt-4">
          <LandingVariantsTab />
        </TabsContent>

        {/* قوالبي — المحفوظة من المشاريع */}
        <TabsContent value="saved" className="mt-4">
          <SavedTemplatesTab />
        </TabsContent>

        {/* مكتبة HTML */}
        <TabsContent value="html" className="mt-4">
          <HtmlLibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
