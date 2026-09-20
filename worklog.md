# نموذج (Namudhaj) — AI Prototype Builder for Algeria

منصة عربية RTL لرواد الأعمال لبناء نماذج تصورية (Prototypes) بالذكاء الاصطناعي، ثم تحميلها كـ ZIP جاهز للنشر على Netlify.

## Golden Path
فكرة → تحليل AI → مشروع (schema) → Builder (تحرير بصري + Agent) → معاينة → تحقق Build → ZIP → دليل النشر.

## Architecture (Modular)

```
src/
  app/
    layout.tsx            — RTL, lang=ar, Google Fonts (IBM Plex Sans Arabic / Tajawal / Cairo), ThemeProvider (next-themes, class)
    page.tsx              — *** ME ONLY *** App shell: view switcher (landing/auth/onboarding/app/builder/preview/export)
    globals.css           — platform theme (violet primary, hex vars), custom scrollbar, RTL fixes
    api/
      auth/{login,signup,logout,me,complete-onboarding}/route.ts
      analyze/route.ts                     — LLM idea analysis (+ heuristic fallback)
      projects/route.ts                    — GET list / POST create
      projects/[id]/route.ts               — GET / PATCH / DELETE
      projects/[id]/versions/route.ts      — GET list / POST restore
      projects/[id]/agent/route.ts         — Agent chat (LLM tools + heuristic fallback + validate + autofix)
      projects/[id]/export/route.ts        — GET → ZIP download (JSZip, netlify.toml)
  lib/
    types.ts             — ALL shared types (ProjectSchema, Block, Theme, AgentAction...)  [Task 1 — DO NOT REWRITE]
    i18n/                — ar strings ONLY here (index.ts merges modules; never hardcode Arabic in components)
    api-client.ts        — typed fetch wrappers [Task 1 — DO NOT REWRITE]
    registry/blocks.ts   — Block registry (label, category, icon, defaults, fields for editor)
    content/mock-data.ts — Algerian mock data (أسماء عربية، مدن جزائرية، دج) + entities + charts
    project/templates.ts — 14 templates (SaaS, AI, متجر, Marketplace, تعليم, صحة, عقارات, حجوزات, خدمات, مطعم, وكالة, تطبيق, FinTech, إدارية) → buildTemplateSchema()
    project/factory.ts   — createProjectFromAnalysis(analysis, opts)
    project/tools.ts     — PURE agent tools/reducers (isomorphic: used by API + client store)
    agent/               — system prompt + LLM parsing + heuristic fallback (server-only)
    export/              — static HTML/CSS/JS generator + zip (server-only)
  store/app-store.ts     — zustand store (view, user, projects, builder state, agent chat, undo/redo)
  components/
    platform/            — platform views (landing/, auth/, onboarding/, dashboard/, templates-library/, components-library/, help/, settings/, new-project/)
    builder/             — builder UI (pages panel, preview frame, properties, agent panel, versions, export dialog, theme editor)
    prototype/           — renders ProjectSchema (theme-provider, page shells, blocks/*, ui primitives, mini-preview)
```

## Types contract (src/lib/types.ts) — SUMMARY
- `ProjectType` = 'saas'|'ai'|'ecommerce'|'marketplace'|'education'|'health'|'realestate'|'booking'|'services'|'restaurant'|'agency'|'app'|'fintech'|'admin'|'delivery'|'other'
- `ProjectStyle` = 'modern'|'minimal'|'professional'|'luxury'|'youthful'|'tech'
- `ProjectStatus` = 'draft'|'building'|'ready'|'downloaded'
- `PageType` = 'landing'|'auth'|'dashboard'|'pricing'|'table'|'form'|'settings'|'profile'|'faq'|'custom'
- `BlockType` = 'hero'|'features'|'stats'|'steps'|'pricing'|'testimonials'|'faq'|'cta'|'contact-form'|'gallery'|'banner'|'list'|'team'|'auth-card'|'dashboard-header'|'stats-row'|'chart'|'data-table'|'form-fields'|'settings-form'|'profile-card'|'empty-state'|'loading-state'|'error-state'|'calendar'
- `ProjectPage { id, name, slug, type, authVariant?, entity?, title?, subtitle?, blocks: Block[] }`
- `Block { id, type: BlockType, props: Record<string, unknown> }`
- `ProjectTheme { primary, primaryForeground, secondary, accent, background, surface, text, mutedText, border, radius: number(px), shadow, fontFamily, mode }`
- `ProjectSchema { version, metadata{name,description,type,style,audience,icon,createdAt}, theme, navigation{brand,items[{label,pageId}],cta,footerNote}, dashboardNav{items[{label,pageId,icon}]}, pages, mockData{currency, stats, entities, charts}, settings{dir:'rtl',lang:'ar',currency,projectName} }`
- `IdeaAnalysis { name, type, audience, description, suggestedPages[{name,type,entity?}], templateId }`
- `AgentAction` union: create_page/delete_page/update_page/add_block/update_block/delete_block/move_block/update_theme/update_navigation/update_dashboard_nav/rename_project/generate_mock_data/update_content

## Store contract (src/store/app-store.ts)
- view: 'landing'|'auth'|'onboarding'|'app'|'builder'|'export-guide' ; dashboardSection: 'home'|'projects'|'templates'|'components'|'new'|'help'|'settings'
- init() / login / signup / demoLogin / logout / setView / setDashboardSection / refreshProjects
- openProject(id) → builder ; closeBuilder() ; mutateSchema(fn) [undo/redo] ; undo() / redo() ; saveProject(label?)
- selectPage / selectBlock / setDevice('desktop'|'tablet'|'mobile') / setRightPanel('agent'|'properties'|'history'|'theme')
- addPage / deletePage / addBlock / updateBlockProps / deleteBlock / moveBlock / updateTheme / sendAgent(text) / restoreVersion
- exportState: { open, phase: 'idle'|'preparing'|'checks'|'ready'|'error', checks, error } ; startExport() ; downloadZip()

## View components contract (mounted by MY app-shell)
- `LandingView` → `src/components/platform/landing/landing-view.tsx` (props: none; uses store: setView)
- `AuthView` → `src/components/platform/auth/auth-view.tsx` (onSuccess via store.login/signup)
- `OnboardingView` → `src/components/platform/onboarding/onboarding-view.tsx`
- `DashboardView` → `src/components/platform/dashboard/dashboard-view.tsx` (renders section by store.dashboardSection; includes AppSidebar + header: search/notifications/avatar)
- `NewProjectFlow` → `src/components/platform/new-project/new-project-flow.tsx` (idea form → POST /api/analyze → analysis screen → confirm → create → openProject)
- `TemplatesView` → `src/components/platform/templates-library/templates-view.tsx` (grid, category filter, use-template → create project from template)
- `ComponentsView` → `src/components/platform/components-library/components-view.tsx`
- `HelpView` → `src/components/platform/help/help-view.tsx`
- `SettingsView` → `src/components/platform/settings/settings-view.tsx`
- `BuilderView` → `src/components/builder/builder-view.tsx` [Task 4 — ME]
- `ExportGuideView` → `src/components/platform/export-guide/export-guide-view.tsx` [Task 4 — ME]

## i18n ownership (src/lib/i18n/, Arabic ONLY, flat objects, export const X = { ... } as const)
- common.ts [Task 1 me] ; landing.ts+auth.ts+onboarding.ts [2-b] ; dashboard.ts+templates.ts+help.ts+settings.ts+components.ts+new-project.ts [3-a] ; builder.ts+export.ts [Task 4 me]
- index.ts imports all (stubs created in Task 1; each agent fills ONLY its own files)

## Hard rules for ALL agents
1. NEVER edit: src/app/page.tsx, src/app/layout.tsx, src/store/app-store.ts, src/lib/types.ts, src/lib/api-client.ts, src/lib/i18n/index.ts (owned by main agent). Read them, don't write them.
2. NO emojis in UI except where spec requires (👋 🚀 🎉 ✓ ✗ only).
3. RTL everywhere: html dir=rtl already set; use Tailwind logical props (ps-/pe-/ms-/me-/text-start/text-end/rounded-s/rounded-e). NO left/right classes.
4. All UI text in Arabic via i18n modules (t.xxx). Simple modern Arabic (لهجة بسيطة قريبة).
5. Use existing shadcn/ui components in src/components/ui. Lucide icons.
6. Platform palette = violet primary (vars in globals.css): bg-primary, text-primary-foreground, etc. NO blue/indigo defaults. DZD currency "دج". Algerian mock names (أحمد بن علي، محمد قادري، سارة بوزيد، ياسين مراد) + cities (الجزائر، وهران، قسنطينة، سطيف، عنابة، البليدة).
7. 'use client' on all interactive components. z-ai-web-dev-sdk SERVER ONLY.
8. Dev server already running on :3000 (bun run dev, auto-reload). Do NOT restart it, do NOT run `bun run build`. Check `/home/z/my-project/dev.log` tail for errors.
9. Responsive: mobile-first, sm/md/lg breakpoints. Long lists: max-h + overflow-y-auto.
10. Run `bun run lint` at the end; fix YOUR files' errors only.
11. After finishing: APPEND your section to this worklog (do not overwrite).

## Status
- Task 1 (foundation) — DONE by main agent (types, i18n core+stubs, api-client, store incl. auth actions, RTL layout + Arabic fonts, violet globals.css, prisma schema pushed, jszip installed, temp page.tsx).

---

## PINNED EXPORT CONTRACTS (all agents MUST match these exactly)

### From `src/lib/project/templates.ts` [2-a creates]
```ts
export interface TemplateMeta { id: string; category: ProjectType; name: string; tagline: string; description: string; icon: string; pageCount: number }
export const TEMPLATES: TemplateMeta[]            // 14 templates
export function getTemplateMeta(id: string): TemplateMeta | undefined
export function buildTemplateSchema(templateId: string): ProjectSchema
```

### From `src/components/prototype/template-mini-preview.tsx` [2-a creates]
```tsx
export function TemplateMiniPreview({ templateId, className }: { templateId: string; className?: string }): JSX.Element
```
Scaled-down live preview (transform scale, pointer-events-none) showing landing page of the template.

### From `src/components/prototype/prototype-renderer.tsx` [2-a creates]
```tsx
export function PrototypeRenderer({ schema, pageId, selectedBlockId, onBlockSelect, onNavigate, interactive }: {
  schema: ProjectSchema; pageId: string; selectedBlockId?: string | null;
  onBlockSelect?: (blockId: string | null) => void;   // builder outline mode when provided
  onNavigate?: (pageId: string) => void;              // nav links between prototype pages
  interactive?: boolean                                // preview mode: true
}): JSX.Element
```

### From `src/components/prototype/icon-map.tsx` [2-a creates]
```tsx
export function ProtoIcon({ name, className }: { name: string; className?: string }): JSX.Element  // lucide by name, fallback Sparkles
export const AVAILABLE_ICONS: string[]
```

### From `src/lib/registry/blocks.ts` [2-a creates]
```ts
export type FieldDefinition =
  | { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'color' | 'switch' | 'select'; options?: { value: string; label: string }[] }
  | { key: string; label: string; type: 'list'; itemFields: FieldDefinition[]; itemLabel?: string }
export interface BlockDefinition { type: BlockType; label: string; category: 'marketing' | 'dashboard' | 'auth' | 'states'; description: string; icon: string; defaults: () => Record<string, unknown>; fields: FieldDefinition[] }
export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition>
export function getBlockDefinition(type: BlockType): BlockDefinition | undefined
```

### From `src/lib/project/tools.ts` [2-a creates — PURE/isomorphic]
```ts
export function applyActions(schema: ProjectSchema, actions: AgentAction[]): { schema: ProjectSchema; applied: string[]; errors: string[] }
// + granular exported helpers used by store/UI:
export function addPageToSchema(schema, opts: { name: string; type: PageType; entity?: string; authVariant?: AuthVariant }): { schema: ProjectSchema; pageId: string }
export function deletePageFromSchema(schema, pageId): ProjectSchema
export function addBlockToPage(schema, pageId, blockType: BlockType, position?: number): { schema: ProjectSchema; blockId: string }
export function updateBlockPropsInSchema(schema, pageId, blockId, patch: Record<string, unknown>): ProjectSchema
export function deleteBlockFromSchema(schema, pageId, blockId): ProjectSchema
export function moveBlockInSchema(schema, pageId, blockId, position: number): ProjectSchema
export function updateThemeInSchema(schema, patch: Partial<ProjectTheme>): ProjectSchema
export function updateNavigationInSchema(schema, patch: Partial<ProjectNavigation>): ProjectSchema
export function updateDashboardNavInSchema(schema, items: DashboardNavItem[]): ProjectSchema
export function renameProjectInSchema(schema, name: string): ProjectSchema
```

### From `src/lib/project/validate.ts` [2-a creates — PURE/isomorphic]
```ts
export function validateSchema(schema: ProjectSchema): ValidateResult  // checks: pages, blocks known, nav refs, theme hex, entities exist, dashboardNav refs
```

### From `src/lib/project/factory.ts` [2-a creates]
```ts
export function createProjectFromAnalysis(analysis: IdeaAnalysis, opts?: { style?: ProjectStyle; palette?: { primary: string; secondary: string; accent: string } }): ProjectSchema
```

## Block Props Contract (canonical props keys — renderer [2-a] AND static HTML generator [3-b] MUST agree)

- hero: { title, subtitle, primaryButton, primaryButtonPage?, secondaryButton?, layout: 'centered'|'split', background: 'default'|'muted'|'dark'|'gradient', align: 'start'|'center' }
- features: { title, subtitle?, columns: 2|3|4, items: [{ icon, title, description }] }
- stats: { title?, items: [{ label, value, change? }] }
- steps: { title, subtitle?, steps: [{ title, description }] }
- pricing: { title, subtitle?, currency: 'دج', plans: [{ name, price, period, features: string /* سطر لكل ميزة */, highlighted: boolean, buttonText }] }
- testimonials: { title, items: [{ name, role, text, rating: number }] }
- faq: { title, subtitle?, items: [{ q, a }] }
- cta: { title, subtitle, buttonText?, style: 'default'|'gradient'|'dark' }
- contact-form: { title, subtitle?, buttonText, successText }
- gallery: { title, subtitle?, variant: 'products'|'services'|'properties'|'menu'|'courses', items: [{ title, description?, price?, badge? }] }
- banner: { title, subtitle, buttonText?, style: 'gradient'|'dark' }
- list: { title, items: [{ title, subtitle?, meta? }] }
- team: { title, items: [{ name, role }] }
- auth-card: { variant: 'login'|'signup'|'forgot', title, subtitle, buttonText, demoHint }
- dashboard-header: { title, subtitle?, actions?: string /* مفصولة بفواصل */ }
- stats-row: { items: [{ label, value, change?, icon? }] }
- chart: { title, chartType: 'bar'|'line'|'donut', dataKey?: string /* mockData.charts */, data?: [{ label, value }] }
- data-table: { entity: string, title?, pageSize?: number }
- form-fields: { title, subtitle?, fields: [{ label, type: 'text'|'email'|'password'|'number'|'select'|'textarea'|'checkbox', options?, required?, placeholder? }], submitText, successText }
- settings-form: { title, sections: [{ title, fields: [{ label, type: 'text'|'switch'|'select'|'password', value?, hint?, options? }] }] }
- profile-card: { name, role, email, phone?, bio? }
- empty-state: { title, subtitle?, actionText? }
- loading-state: { label }
- error-state: { title, subtitle?, actionText? }
- calendar: { title, month: string, events: [{ day: number, label }] }

## Mock Data entity keys (Algerian names/cities/DZD): customers, orders, products, bookings, invoices, services, users, clients, tasks, teamMembers, courses, students, properties, appointments, menuItems, transactions, subscriptions
## Chart keys: revenueMonthly (bar/12), ordersWeekly (line/7), salesByCategory (donut), usersGrowth (line/12)

---

---

## Task ID: 2-b — Public Chrome Agent (Landing / Auth / Onboarding)

**Agent:** 2-b (public chrome builder)

**Task:** Build the platform's public storefront: landing page, auth view, onboarding wizard + their i18n Arabic string modules.

**Work Log:**
1. Read all pinned contracts (types.ts, app-store.ts, api-client.ts, layout.tsx, globals.css, i18n core). Verified lucide icon availability + shadcn component APIs before coding.
2. **i18n** — filled stubs (Arabic only, flat `as const`): `src/lib/i18n/landing.ts` (~90 strings incl. FAQ + builder-mock copy), `src/lib/i18n/auth.ts`, `src/lib/i18n/onboarding.ts`. Zero hardcoded Arabic in components (regex-audited).
3. **Landing** — `src/components/platform/landing/`: `landing-view.tsx` (root: `min-h-screen flex flex-col`, footer `mt-auto`), `landing-navbar.tsx` (sticky blur, BrandMark export, dark-mode toggle via next-themes, mobile Sheet), `hero-section.tsx` (badge pill, H1 with `.text-gradient` on "نموذج أولي", EXACT required subtitle, dual CTAs), `builder-mock.tsx` (browser-chrome frame: pages sidebar يمين / mini landing center / AI chat panel يسار with ✓ bubble + tool chips, framer-motion 6s float loop), `trust-strip.tsx` (4 chips), `how-it-works.tsx` (4 numbered cards + desktop dashed connector + animated example chips stagger), `templates-section.tsx` (8 cards via pinned contract `TEMPLATES` + `TemplateMiniPreview`, category badge from `PROJECT_TYPE_LABELS`, "استخدم هذا القالب" → user ? `setDashboardSection('templates')` : `setView('auth')`), `faq-section.tsx` (5-item accordion — added as target for navbar/footer "الأسئلة" link), `cta-section.tsx` (violet gradient card), `landing-footer.tsx` (product/support columns, "صُنع بحب في الجزائر", no fake socials). whileInView reveals (24px y) throughout; RTL logical classes only.
4. **Auth** — `src/components/platform/auth/auth-view.tsx`: max-w-md card on bg-dots (masked), Tabs تسجيل الدخول/إنشاء حساب, forgot-password swap with local success state, prominent Zap "تجربة سريعة بدون تسجيل" → `store.demoLogin()`, demo auth note, per-field validation (required/email regex/min lengths), error banner, loading spinners, password eye toggle, 44px touch targets, back-to-landing link.
5. **Onboarding** — `src/components/platform/onboarding/onboarding-view.tsx`: "مرحبًا بك 👋" header, 4 steps (name prefilled from `user.name` / 8 type cards with icons / optional idea textarea with skip link / 6 style cards with color-dot previews from `PROJECT_STYLE_LABELS`), Progress bar + numbered step indicators, directional AnimatePresence transitions, رجوع/التالي, finish → `store.completeOnboarding({name, projectType, idea, style})` with optimistic success card (no confetti).
6. **Fixes during QA:** replaced `useEffect`+`setState` mounted-hack with `useSyncExternalStore` (new react-hooks lint rule), restored missing `useState` import, bumped icon buttons to 44px touch targets, fixed bg-dots masking pattern on auth/onboarding.

**Stage Summary:**
- 12 files created (3 i18n + 9 components), all inside scope; nothing outside scope modified (page.tsx/layout/store/types/api-client/i18n-index untouched; prototype/** and lib/project/** left to 2-a).
- Pinned-contract imports in `templates-section.tsx` (`@/lib/project/templates`, `@/components/prototype/template-mini-preview`) intentionally left unresolved until 2-a lands them — EXPECTED, do not "fix".
- `bun run lint`: 0 errors (1 pre-existing layout.tsx font warning — main agent's). `bunx tsc --noEmit`: only the 2 expected 2-a module errors. SSR smoke-render of all 9 self-contained views: PASS.
- Work record also at `agent-ctx/2-b-public-chrome.md` (system `/agent-ctx` not writable in this sandbox).

---

## Task ID: 2-a-cont — Prototype Renderer Agent (continuation)

**Agent:** 2-a-continuation (renderer only — previous 2-a agent built all lib files)

**Task:** React renderer for ProjectSchema under `src/components/prototype/**`: theme scope, icon map, UI primitives, hand-rolled SVG charts, 25 block components, page shells (site/auth/dashboard), builder outline mode, template mini preview.

**Work Log:**
1. Read all pinned contracts + existing libs (types.ts, registry/blocks.ts, content/mock-data.ts, project/templates.ts, project/tools.ts). Verified lucide 0.525 icon exports (85 names) + Arabic Google Fonts before coding.
2. **theme-provider.tsx** — `PrototypeThemeScope` (dir=rtl, inline `--pt-*` vars) + `ptVars()` + hex mix utils + dark-mode derivation (bg −72%, surface +9%, text +88%, translucent borders) + shadow map (none/sm/md/lg).
3. **icon-map.tsx** — `ProtoIcon` + `AVAILABLE_ICONS`, 65 names (spec's 45 + all names used by registry/stats/templates nav so previews never fall back), fallback Sparkles.
4. **ui/** (10 primitives, --pt-* vars only, color-mix tints): PButton/PCard/PBadge(6 tones)/PAvatar(name-hash initials)/PAlert/PTabs(+PTabsAuto)/PDropdown(native details)/PBreadcrumb/PPagination(السابق/التالي)/PStates(Empty/Loading/Error with hand-drawn SVG illustrations).
5. **charts/** (zero deps, viewBox 600x260, RTL-reversed): BarChart (top-rounded gradient bars, gridlines, compact axis م/ألف, <title> tooltips, label skip >8), LineChart (Catmull-Rom smooth + area gradient + dots), DonutChart (dasharray segments computed purely via reduce, center total, 6-color legend, max 6 slices + «أخرى»), ChartFrame + CHART_PALETTE (primary + #0d9488/#d97706/#db2777/#2563eb/#64748b).
6. **blocks/** (24 files, all 25 BlockTypes per Block Props Contract, safe getters S/N/B/L): hero (4 bgs, split abstract dashboard visual from divs, primary→primaryButtonPage), features/stats/steps/pricing (highlighted: border-2 + scale-1.02 + «الأكثر شيوعاً»)/testimonials/faq/cta/contact-form/gallery (5 variants, gradient letter thumbs + دج)/banner/list/team + auth-card (login interactive → first dashboard page; signup/forgot success states; demoHint PAlert + «بيانات تجريبية») + dashboard-header/stats-row/chart (dataKey→mockData.charts)/data-table (typed column renderers: avatar/badge/currency-num()/date/progress/email-phone dir=ltr; pinned status map + extensions; client search + PPagination 5/page; mobile overflow-x)/form-fields (7 types)/settings-form (role=switch toggles + save PAlert)/profile-card/state-blocks/calendar (ARABIC_DAYS من الأحد, ARABIC_MONTHS cycling, 30 cells, event dots, ring يوم 15).
7. **prototype-renderer.tsx** — pinned contract; SiteShell (sticky header + brand→home + mobile hamburger + footer mt-auto + demo badge) / AuthShell (centered) / DashboardShell (w-60 sidebar + ProtoIcon nav + active --pt-secondary/--pt-primary + demo user card؛ mobile: horizontal pills); renderBlock switch ×25; outline mode: click/keyboard select + pointer-events-none inner + selection border + registry label chip + dimmed others.
8. **template-mini-preview.tsx** — pinned contract; 1100px inner, scale via ResizeObserver (fallback 0.28), origin top-right, useMemo schema, non-interactive, top gradient overlay, placeholder for unknown ids.
9. **Fixes:** React 19 types removed global JSX → replaced all `JSX.Element` with `ReactElement` in 41 files; react-hooks/immutability error in DonutChart → pure reduce; a11y bumps (min-h-10 touch targets on buttons/pagination/calendar nav/dropdown items).
10. **QA:** SSR smoke-render via react-dom/server of ALL 14 templates × all pages + outline + minis — no crashes; agent-browser screenshots + VLM visual review of landing/dashboards/charts(bar+line+donut)/tables/auth/settings/calendar/states/dark-mode/outline/minis — clean (RTL correct, no overlap, contrast OK). Temp artifacts removed.

**Stage Summary:**
- 42 files, ~4,035 lines, all inside `src/components/prototype/`. No file outside scope touched (lib files read-only).
- `bun run lint`: 0 errors (1 pre-existing layout.tsx font warning — main agent's). `bunx tsc --noEmit`: 0 prototype errors; 2-b's expected unresolved import (templates-section → template-mini-preview) now resolved.
- Dev server auto-reload clean, GET / 200. Work record also at `agent-ctx/2-a-cont-prototype-renderer.md`.
- Unblocked: Task 4 Builder (PrototypeRenderer ready: outline mode + onNavigate + interactive) and 3-b static generator (follow same Block Props Contract).

---

## Task ID: 2-a + 2-a-cont — Prototype Engine (libs + renderer)

**Agent:** full-stack-developer subagents (main agent verified & recorded — subagent hit context deadline after completing files)

**Task:** Build the complete prototype engine: blocks registry, Algerian mock data, 14 templates, factory, pure agent tools, validate + full React renderer.

**Work Log:**
- `src/lib/registry/blocks.ts` — BLOCK_REGISTRY (25 BlockTypes, Arabic labels, defaults with Arabic content, editor fields) + ICON_FIELD_OPTIONS + getBlockDefinition
- `src/lib/content/mock-data.ts` — 17 Algerian entities + 4 charts + stats presets + ARABIC_MONTHS/DAYS + num() formatter + defaultEntityFor/defaultStatsPreset + refreshEntityRows
- `src/lib/project/templates.ts` — TEMPLATES (14: saas-suite, ai-studio, ecommerce-store, marketplace-hub, edu-platform, health-clinic, real-estate, booking-pro, services-hub, restaurant-menu, agency-pro, web-app-starter, fintech-wallet, admin-console) + buildTemplateSchema + getTemplateMeta
- `src/lib/project/factory.ts` — createProjectFromAnalysis (template reconciliation + palette/style application)
- `src/lib/project/tools.ts` — applyActions + all granular isomorphic reducers + starterBlocksFor
- `src/lib/project/validate.ts` — validateSchema (6 Arabic-labeled checks)
- `src/components/prototype/` — theme-provider (ptVars CSS vars + dark mode), icon-map (ProtoIcon), prototype-renderer (SiteShell/AuthShell/DashboardShell + block outline mode), template-mini-preview, charts/ (bar/line/donut SVG), ui/ (11 P-primitives), blocks/ (25 block components)
- tsc --noEmit: clean for src/**; lint: clean. GET / renders with template previews.

**Stage Summary:**
- All pinned contracts honored exactly. Prototype engine complete and compiling.

---

## Task ID: 3-a — Dashboard Views Agent (لوحة التحكم)

**Agent:** 3-a (dashboard views: shell + home/projects/templates/components/new-project/help/settings + i18n)

**Files (14):** i18n stubs filled — `src/lib/i18n/{dashboard,templates,help,settings,components,new-project}.ts` (Arabic flat `as const`, zero hardcoded Arabic in components — regex-audited). Components — `src/components/platform/dashboard/dashboard-view.tsx` (app shell: right AppSidebar w-64 border-s with BrandMark + nav + primary "+ مشروع جديد" CTA + user card + logout AlertDialog; sticky h-14 header with mobile Sheet, w-64 search → Enter → projects, ThemeToggle, notifications Popover (3 platform tips), avatar DropdownMenu; mobile fixed bottom 5-tab bar with safe-area + "المزيد" full-menu Sheet; AnimatePresence section switcher + spinner gate when !user), `dashboard/home-section.tsx` (welcome 👋 + question + CTA; 4 tinted stat cards; last-6 projects; Rocket empty state; skeletons), `dashboard/projects-section.tsx` (search + status chips + scrollable grid + per-card delete DropdownMenu→AlertDialog→store.deleteProject; **exports shared ProjectCard/ProjectCardSkeleton/SEARCH_QUERY_KEY** reused by home + header search handoff via sessionStorage), `templates-library/templates-view.tsx` (14 categories chips + search; TemplateMiniPreview cards + Collapsible pages chips via memoized buildTemplateSchema; "استخدم هذا القالب" per-card loading → api.createProject({idea:"قالب …", templateId, analysis:null}) → openProject; toast on error), `components-library/components-view.tsx` (playground: 4 palettes + font Select + radius Slider → live ProjectTheme wrapped in PrototypeThemeScope; sections: widgets (PButton/PBadge/PAvatar/PAlert/PTabs/PDropdown/PBreadcrumb/PPagination live), states (PEmpty/PLoading/PError), data (DataTableBlock 'customers' + buildMockData('services') ctx; 3 ChartBlocks), page sections (Hero/Features/Pricing/Faq/AuthCard with BLOCK_REGISTRY defaults())), `new-project/new-project-flow.tsx` (golden flow with directional AnimatePresence: idea big textarea + collapsible extras (8 type chips/audience/6 style chips/auto-custom colors) → analyzing staged @900ms + api.analyzeIdea (min 2.4s) → review card + suggested-pages checklist + ابدأ البناء/تعديل الاقتراح (edit: name + page checkboxes ≥1 + back) → building staggered @700ms + api.createProject({idea, analysis, style, palette}) (min 2.8s; error = frozen checklist + recovery) → success flash → openProject; timer refs + unmount cleanup), `help/help-view.tsx` (3 quick cards scroll+open controlled Accordion; 9 simple Arabic FAQs mentioning دج/ZIP/Netlify; "لم تجد إجابتك؟" upcoming-feature card — no fake form), `settings/settings-view.tsx` (profile save → api.updateProfile → toast + store.init() silent refresh; light/dark preview cards via next-themes; العربية active + Français/English "قريبًا"; دج/Europe-Paris info; logout confirm).

**Deviations:** shared ProjectCard exported from projects-section (no extra files beyond spec list); header→projects search term via sessionStorage (store has no search state); building-error stays on step + recovery button (spec: "toast + stay"); min durations so staged animations are visible; edit mode also has direct "ابدأ البناء".

**QA:** SSR smoke render of all 7 sections + full shell × 7 sections + gate + empty variants — PASS (zustand SSR snapshot patched to live state). Live curl API test: demo login, /api/analyze, POST /api/projects (template + analysis paths), list, DELETE, PATCH /api/auth/me — all 200 with my payload shapes (test data cleaned). tsc scoped grep: 0 errors (pre-existing errors only in api/projects/route.ts + server/agent.ts — other agents'). `bun run lint`: 0 errors (fixed own rules-of-hooks by renaming useTemplate→createFromTemplate; 1 pre-existing layout.tsx warning is main agent's). dev.log clean. Work record: `agent-ctx/3-a-dashboard-views.md`.

---

## Task ID: 3-b — Backend APIs + Export System

**Agent:** full-stack-developer subagent (main agent verified via smoke tests & recorded — subagent hit context deadline after completing files)

**Task:** All API routes: mock auth (session cookie), analyze (LLM+heuristic), projects CRUD, versions, AI agent (LLM tools + heuristic fallback + validate + autofix), build validation, ZIP export with netlify.toml.

**Work Log:**
- `src/lib/server/session.ts` — session helpers (cookie namudhaj_session, sha256 hashing)
- `src/app/api/auth/{me,login,signup,demo,logout,complete-onboarding}/route.ts` — me has PATCH for profile; demo seeds 3 template projects (حجزتي/متجرتي/منصتي)
- `src/lib/server/analyze.ts` + `src/app/api/analyze/route.ts` — LLM analysis (25s timeout) with full sanitization + Arabic keyword heuristic fallback
- `src/app/api/projects/route.ts` (GET list/POST create via factory) + `[id]/route.ts` (GET/PATCH with versions cap 50/DELETE) + `[id]/versions` (GET/POST restore) + `[id]/validate` (validateSchema)
- `src/lib/server/agent.ts` + `[id]/agent/route.ts` — 13 tools, LLM with project context + strict JSON output, heuristic fallback (Arabic regex commands), applyActions → validate → autofix → version save
- `src/lib/export/generate.ts` — full static site generator: styles.css (RTL, --pt-* theme vars), script.js (nav/forms/auth-redirect/table search), netlify.toml, README.md (Arabic Netlify guide), index.html + 404.html + /slug/index.html per page, all 25 block types rendered incl. SVG charts, demo badge
- `src/app/api/projects/[id]/export/route.ts` — JSZip streaming, validation gate (503 if invalid), status→downloaded

**Stage Summary (verified by main agent smoke tests):**
- demo login 200 ✓; analyze "منصة لحجز مواعيد صالونات التجميل في وهران" → booking type + rich suggested pages ✓
- create project 200 ✓; agent "أضف صفحة للتسعير" → created pricing page with explanation + Arabic action summary + version ✓
- validate: all 6 checks ok ✓; export: 34-file ZIP (43KB) with RTL index.html, dashboard with Algerian mock data/charts/tables, 404.html, netlify.toml ✓
- tsc --noEmit clean; relative links between pages work on Netlify + locally

---

## Task ID: 4 — Builder UI (main agent)

**Task:** واجهة البناء الكاملة: لوحات الصفحات/المكونات، المعاينة الحية بأجهزة، لوحة الخصائص (محرر بصري من registry)، المساعد الذكي، نظام التصميم، سجل الإصدارات، نافذة التصدير، وضع المعاينة، دليل النشر.

**Work Log:**
- `src/lib/i18n/builder.ts` + `export.ts` — كل نصوص البناء والتصدير
- `builder-view.tsx` — تخطيط ثلاثي اللوحات + أشرطة/أوراق الجوال + حاويات النوافذ
- `builder-header.tsx` — اسم قابل للتحرير + حفظ (Ctrl+S) + تراجع/إعادة (Ctrl+Z) + أجهزة + معاينة + تحميل + تأكيد الخروج مع تغييرات
- `pages-panel.tsx` — قائمة الصفحات (تحديد/تسمية/حذف) + مكونات الصفحة (ترتيب/حذف) + قائمة إضافة مكوّن مصنّفة + نافذة إضافة صفحة (11 نوعًا + اختيار الكيان)
- `preview-frame.tsx` — متصفح وهمي + عرض حسب الجهاز + أغلفة تحديد المكوّنات
- `right-panel.tsx` — تبويبات (مساعد/خصائص/تصميم/إصدارات)
- `agent-panel.tsx` — محادثة + اقتراحات سريعة + مؤشر تنفيذ + ملخص التغييرات ✓ + حفظ سريع
- `properties-panel.tsx` — محرر حقول عام (نص/رقم/لون/تبديل/اختيار/قوائم متداخلة) بتجميع محتوى/تخطيط/مظهر + إعدادات الصفحة
- `theme-panel.tsx` — 6 أنماط جاهزة + 8 ألوان + خط/زوايا/ظلال + وضع ليلي للمشروع
- `history-panel.tsx` — سجل الإصدارات + استعادة بتأكيد
- `export-dialog.tsx` — تجهيز→فحوصات متحركة→جاهز/خطأ + تحميل ZIP + دليل النشر
- `preview-mode.tsx` — معاينة تفاعلية كاملة الشاشة + تنقل بين صفحات النموذج
- `export-guide-view.tsx` — أحسنت 🎉 + 6 خطوات Netlify + دليل مفصل + ملاحظات ملكية/مجانية
- store: إضافة `applySchemaFn` للتكامل مع أدوات tools الـ immutable

## Task ID: 5 — Integration (main agent)

**Work Log:**
- `src/app/page.tsx` — الصدفة الرئيسية: splash → مبدّل الواجهات (landing/auth/onboarding/app/builder/export-guide) + TooltipProvider + SonnerToaster
- globals.css: splash keyframes
- إصلاح أخطاء JSX/أنواع/قواعد hooks في properties-panel (نمط المزامنة أثناء العرض)
- tsc --noEmit نظيف، bun run lint نظيف (تحذير خطوط واحد قديم في layout)

---

## Task ID: 6 — Browser E2E Verification (main agent)

**Task:** تحقق شامل بالنقر الفعلي عبر agent-browser للمسار الذهبي كاملًا + فحوصات بصرية عبر VLM.

**Verified flows (all PASS):**
- Landing: hero بنصوص المواصفة حرفيًا + معاينة بانية تفاعلية + 4 خطوات + 8 قوالب + FAQ + CTA — VLM 9/10، RTL صحيح
- Auth: تبويبات دخول/إنشاء حساب + نسيان كلمة المرور + زر تجربة سريعة
- Signup جديد (سارة بوزيد) → Onboarding 4 خطوات → إكمال → توجه تلقائي لتدفق إنشاء مشروع
- Dashboard: إحصائيات + بطاقات مشاريع + شريط جوال سفلي — VLM 9/10
- مكتبة القوالب (14 قالبًا مع معاينات حية) — 9/10، مكتبة المكونات (playground بسمة حية) — 9/10، المساعدة — 10/10، الإعدادات — 9/10
- تدفق مشروع جديد: فكرة "توصيل طعام" → تحليل LLM → اقتراح صفحات سياقية (لوحة المطعم/الطلبات/قائمة المطاعم) → بناء → فتح Builder تلقائيًا
- Builder: تخطيط 3 لوحات RTL صحيح — VLM 9/10 + مبدّل أجهزة + تراجع/إعادة + لوحات الصفحات والمكونات
- **AI Agent حقيقي**: أمر "غيّر اللون للأخضر وأضف FAQ" → غيّر الثيم فعليًا (تحقق بصريًا: Green) + رفض ذكي لتكرار قسم موجود — مع شرح عربي وملخص تغييرات
- التصدير: فحوصات متحركة → "المشروع جاهز للتحميل" → تحميل ZIP (HTTP 200، 34 ملفًا: index.html + netlify.toml + 404 + صفحات RTL ببيانات جزائرية) → دليل النشر
- وضع المعاينة: ملء الشاشة تفاعلي + تنقل بين الصفحات + مبدّل أجهزة — VLM 10/10
- الجوال 390px: لا فائض أفقي، بطاقات متراصة، شريط سفلي — VLM 9/10
- تذييل رئيسي لاصق: على إطار 4200px التذييل عند 4200 تمامًا (فجوة 0)؛ وعلى 900px يُدفع طبيعيًا بالمحتوى
- إصلاح أثناء التحقق: نقل PreviewMode إلى الصدفة الرئيسية (page.tsx) ليكون متاحًا من كل الواجهات وليس من داخل Builder فقط

**Final state:** 0 browser errors، 0 console errors، lint 0 errors (تحذير خطوط واحد قديم غير مؤثر)، tsc نظيف، GET / و /api/* تعمل 200.

**Stage Summary:** المنصة مكتملة الوظائف من الفكرة إلى ملف ZIP جاهز للنشر على Netlify.

---

## Task ID: 7-a — New Features Contracts (main agent)

**Task:** عقود الميزات الجديدة الخمس: مكتبة أنماط صفحات الهبوط (12)، رفع الشعار، القوالب المحفوظة من المشاريع، مكتبة HTML المخصصة، وتحسينات جودة التصدير.

**Work Log:**
1. `src/lib/types.ts` — إضافة: `LandingVariantId` (12 قيمة)، `ProjectBranding` + `branding?` في ProjectSchema (توافق خلفي)، `'custom-html'` في BlockType، `change_landing_variant` في AgentToolName، `HtmlSnippetKind` + `HTML_SNIPPET_KIND_LABELS`، `SavedTemplateDTO`، `HtmlSnippetDTO`.
2. `src/lib/api-client.ts` — إضافة: createProject يقبل `landingVariant`، listSavedTemplates / saveProjectAsTemplate / deleteSavedTemplate / useSavedTemplate، listSnippets / createSnippet / deleteSnippet / useSnippet.
3. `src/lib/registry/blocks.ts` — نوع حقل جديد `'code'`؛ hero: حقول جديدة eyebrow/visual/titleSize/emailPlaceholder/emailButton + خيارات HERO_VISUAL_OPTIONS (dashboard/phone/video/form/none) وHERO_TITLE_SIZE_OPTIONS (md/lg/xl)؛ مكوّن جديد `custom-html` (label «HTML مخصص»، فئة marketing، icon code، defaults تحوي مثال HTML متدرّج + height 560، حقول name/height/html).
4. `src/lib/project/landing-kit.ts` (جديد ~380 سطر) — LANDING_VARIANTS (12 نمطاً بـ meta كاملة: name/tagline/bestFor/thumb) + getLandingVariant + buildLandingBlocks (بطل مخصص بالكامل لكل نمط + أقسام داعمة بنسخ عربية مصقولة مع interpolation لاسم العلامة) + changeLandingVariant (إعادة بناء كتل صفحة هبوط قائمة) + buildVariantDemoSchema (schema عرض للمعاينة في المكتبة).
5. `src/lib/project/tools.ts` — starterBlocksFor('landing') يستعمل buildLandingBlocks (بـ opts.landingVariant)؛ addPageToSchema يقبل landingVariant؛ دالة جديدة `addHtmlPageToSchema` (صفحة بنوع landing/dashboard حسب placement بكتلة custom-html واحدة)؛ applyActions: create_page يمرّر landingVariant، حالة جديدة `change_landing_variant` (variant|landingVariant|variantId + pageId|page|name، افتراضياً أول صفحة هبوط).
6. `src/lib/project/factory.ts` — createProjectFromAnalysis يقبل opts.landingVariant ويعيد بناء أول صفحة هبوط به.
7. `prisma/schema.prisma` — نموذجان جديدان: `SavedTemplate` (userId/name/description/icon/type/schemaJson/sourceProjectId) و`HtmlSnippet` (userId/name/kind/html) + علاقات في User. `bun run db:push` ✅.
8. `src/components/platform/templates-library/landing-variant-thumb.tsx` (جديد) — مخططات مصغّرة CSS خالصة لكل نمط من الـ12 (split/centered/gradient/dark/phone/form/video/store/agency/event/minimal/stats) — مشترك بين Builder ومكتبة القوالب.

**Stage Summary:**
- tsc نظيف لـ src/** (أخطاء قديمة فقط في examples/ + skills/). العقود جاهزة للوكلاء المتوازيين 7-b..7-f.
- عقد بطل Hero الموسّع (للعارض والمولّد): eyebrow (نص)، visual (dashboard|phone|video|form|none — افتراضي dashboard)، titleSize (md|lg|xl)، emailPlaceholder/emailButton عند visual=form. كلها اختيارية للتوافق الخلفي.
- schema.branding = { logo?: dataURL, logoName? } — يُكتب من الواجهة (تصغير canvas بحد 512px) ويُصدَّر إلى assets/logo.png + favicon.

---
Task ID: 7-d
Agent: dashboard-views agent
Task: مكتبة القوالب بأربعة تبويبات (قوالب/صفحات هبوط/قوالبي/مكتبة HTML) + «حفظ كقالب» من بطاقة المشروع + خطوة «نمط الواجهة» الاختيارية في مسار مشروع جديد.

Work Log:
- قراءة العقود المثبتة كاملة (types/api-client/landing-kit/landing-variant-thumb/template-mini-preview/prototype-renderer/templates-view/projects-section/new-project-flow/app-store) قبل أي كود.
- i18n: +~74 مفتاحاً عربياً في templates.ts (تبويبات + أنماط + قوالبي + مكتبة HTML) وdashboard.ts (حفظ كقالب) وnew-project.ts (خطوة النمط + خطوات المؤشر) — صفر عربية hardcoded في المكونات.
- templates-view.tsx: إعادة هيكلة إلى 4 تبويبات shadcn Tabs (RTL، h-11، grid-cols-2 sm:grid-cols-4) مع الاحتفاظ بالترويسة؛ الشبكة الـ14 الأصلية (بحث/فئات/استخدام قالب) انتقلت كما هي إلى ProjectTemplatesGrid داخلي؛ TabsContent lazy-mount → تحميل بيانات كل تبويب عند تفعيله فقط.
- landing-variants-tab.tsx (جديد): 12 بطاقة (LandingVariantThumb + name + tagline + bestFor chips أول 3) + «معاينة» تفتح Dialog max-w-4xl h-[80vh] بمعاينة حيّة كاملة الصفحة قابلة للتمرير (VariantLivePreview: buildVariantDemoSchema + PrototypeRenderer pageId='demo_page' + مقياس ResizeObserver 1100px مع قياس ارتفاع المحتوى — TemplateMiniPreview يقبل templateId فقط لذا استُخدم العارض مباشرة) + «إنشاء مشروع» (loading → createProject بـ templateId:'saas-suite' + landingVariant → openProject + toast خطأ بنمط templates-view).
- saved-templates-tab.tsx (جديد): listSavedTemplates عند التثبيت + هياكل + حالة فارغة (Bookmark + «تصفح مشاريعك»)؛ بطاقة أيقونة ملونة + ميتا (صفحات/نوع/نسبة زمنية)؛ «إنشاء مشروع» Dialog باسم مُعبأ `${name} (نسخة)` → useSavedTemplate → openProject؛ حذف AlertDialog → deleteSavedTemplate → تحديث + toast؛ قائمة max-h-[70vh] overflow-y-auto.
- html-library-tab.tsx (جديد): «إضافة كود» Dialog (اسم + Select نوع + Textarea dir=ltr font-mono + رفع ملف .html مخفي ≤500KB يملأ الكود/الاسم) بتحقق (اسم + html يحوي '<')؛ بطاقات (Badge نوع بألوان مختلفة + عدد أحرف + مقتطف 120 حرفاً ltr)؛ «معاينة» iframe sandbox srcDoc h-[60vh]؛ «استخدام في مشروع» Dialog (listProjects عند الفتح + حالة فارغة CTA + اختيار مشروع radio-like + موضع site/dashboard بطاقتان + pageName اختياري → useSnippet → toast + openProject)؛ حذف AlertDialog؛ حالة فارغة Code2.
- projects-section.tsx (إضافة فقط): عنصر «حفظ كقالب» (Bookmark) قبل الحذف في قائمة ProjectCard + Dialog (اسم مُعبأ + وصف اختياري) → saveProjectAsTemplate → toast نجاح/خطأ.
- new-project-flow.tsx: خطوة 'variant' اختيارية بين الفكرة والتحليل (شبكة 12 بطاقة مصغرة + افتراضي classic-split محدد مسبقاً + رجوع/متابعة، انتقالات StepShell كما هي)؛ مؤشر FlowProgress جديد (Progress + 5 نقاط + n/5 — المسار لم يكن لديه مؤشر)؛ landingVariant يُمرر إلى createProject في خطوة البناء؛ زر الفكرة أصبح «التالي».
- QA: tsc صفر أخطاء في ملفاتي؛ lint صفر من ملفاتي (3 أخطاء pages-panel.tsx للوكيل الموازي 7-b/c)؛ SSR smoke-render للمكونات الستة PASS؛ تحقق نقري بالمتصفح: التبويبات/المعاينة الحية (486×1165px بمقياس 0.44 قابل للتمرير)/تحقق نموذج الإضافة/قائمة «حفظ كقالب»/خطوة النمط 2/5 — كلها سليمة. سجل العمل أيضاً في agent-ctx/7-d-dashboard-views.md.

Stage Summary:
- 7 ملفات ضمن الملكية فقط (3 جديدة + 4 معدلة) + سجل agent-ctx. جميع العقود محترمة وZero ملفات خارج النطاق.
- ملاحظة للوكيل الرئيسي (E2E بعد الهبوط المزدوج): /api/templates يرجع 500 حالياً و/api/snippets 404 (مسارات 7-e الموازي قيد الكتابة — Prisma/model سليم: findMany على savedTemplate يعمل من node، db push متزامن؛ الخلل داخل معالج مسارهم). واجهات التبويبين تعرض حالة خطأ آمنة مع إعادة المحاولة إلى أن يكتمل 7-e. خادم dev انقطع عن شبكتي نهاية التحقق (نشاط موازٍ) ولم أُعِد تشغيله.

---

## Task ID: 7-b

**Agent:** prototype-renderer agent
**Task:** ترقية عارض النموذج الأولي — بطل موسّع (eyebrow/visual/titleSize/نموذج بريد) + مكوّن HTML مخصص + دعم الشعار + حركة دخول خفيفة.

**Work Log:**
- `blocks/hero-block.tsx`: قراءة الخصائص الجديدة بقُرّاء آمنين مع توافق خلفي كامل — `eyebrow` (شارة حبة فوق العنوان بتلوين فاتح/داكن)، `visual` (dashboard افتراضي؛ phone = إطار هاتف 9:19 بنوتش وبطاقات وأعمدة وزر سفلي؛ video = بطاقة 16:9 بزر تشغيل دائري ومثلث أبيض ▶ عبر border-inline-start على عنصر dir="ltr" + أسطر تعليق هيكلية + غسلة تدرّج؛ form = التقاط بريد داخل عمود النص: صف حقل زخرفي dir=ltr + PButton + ثلاث صور رمزية متداخلة أ/س/ي مع «انضم إلى 2,400+ مهتم»؛ none = عمود نص فقط بترميز mx-auto max-w-2xl مع احترام align)، `titleSize` (md/lg/xl)، و`emailPlaceholder`/`emailButton` بديلاطين «بريدك الإلكتروني»/«سجّلني». الرسم الجانبي في التخطيط المقسّم لـ dashboard/phone/video فقط؛ form/none نص فقط؛ الموسّط بلا رسم جانبي عدا video/phone تُكوَّم تحت النص (عقد video-lead من 7-a: layout centered + visual video).
- `blocks/custom-html-block.tsx` (جديد): name/html/height (تثبيت 100..4000)؛ غير تفاعلي → بديل خفيف بلا إطارات (إطار متقطع + Code2 + «كود HTML مخصص» + ‏N حرفاً بـ RLM)؛ تفاعلي → iframe بـ srcDoc وsandbox="allow-scripts allow-popups allow-forms" (بلا allow-same-origin — عزل كامل عن صفحة المنصة) مع loading=lazy وbg-white.
- `prototype-renderer.tsx`: حالة `custom-html` في renderBlock؛ دعم `branding.logo` — صورة الشعار بدل المربع+النص في ترويسة SiteShell (h-8/h-9، التنقل للرئيسية محفوظ) وصف التذييل (مع إبقاء شارة «بيانات تجريبية») وشعار صغير h-6 فوق footerNote، وفي جانب DashboardShell وشريطه المحمول (h-8/h-7) — الكل loading="lazy" decoding="async"؛ تغليف الكتل بـ `pt-rise` مع تأخير متدرّج (index×60ms بحد 6) في المسار التفاعلي غير التحريري فقط — وضع outline كما هو بلا تغيير.
- `theme-provider.tsx`: حقن `<style>` يعرّف `@keyframes pt-rise` + `.pt-rise` (.5s cubic-bezier(.22,.61,.36,1) both) داخل PrototypeThemeScope.

**Stage Summary:**
- tsc: صفر أخطاء في src/** (4 أخطاء قديمة في examples/ وskills/ فقط)؛ lint: صفر أخطاء/تحذيرات من ملفاتي (تحذير layout.tsx القديم فقط).
- اختبار SSR (سكربت مؤقت حُذف): 45/45 فحصاً ناجحاً — 12 نمطاً × تفاعلي/ساكن (pt-rise موجود/غائب + التأخيرات)، تغطية أنواع البطل (هاتف/بريد/فيديو مكوّم/eyebrow فاتح وداكن/titleSize الثلاثة)، buildLandingBlocks مع صفحة دخول (ربط primaryButtonPage)، custom-html (iframe مقابل البديل مقابل تثبيت الارتفاع 100/4000)، الشعار في القشرتين (3 صور + lazy/async + الشارة)، وضع outline سليم، وبطل قديم بلا خصائص جديدة يتصرف كالسابق تماماً.
- مراجعة بصرية (agent-browser + VLM لصفحة دخان حُذفت): 7 أقسام كلها PASS؛ اتجاه مثلث التشغيل مثبت بـ computed styles (borderLeft 17px solid + شفاف علوي/سفلي داخل dir=ltr → ▶ يشير يميناً).
- انحراف واحد موثّق: في التخطيط الموسّط تُكوَّم رسوم video/phone تحت النص (يشترطه عقد نمط video-lead المثبّت من 7-a)؛ يبقى dashboard مخفياً في الموسّط حفاظاً على مشاريع ما قبل 7-b.

---

## Task ID: 7-c — Builder UI Features (subagent, completed + verified by main agent)

**Agent:** full-stack-developer (context deadline after finishing code; main agent verified & recorded)

**Files:** `src/components/builder/{pages-panel,theme-panel,properties-panel,builder-header}.tsx` + `save-template-dialog.tsx` (جديد) + `src/lib/i18n/builder.ts`.

**Delivered:**
- AddPageDialog: عند اختيار Landing تظهر شبكة الأنماط الـ12 (LandingVariantThumb + اسم + وصف) وتمرّر landingVariant إلى addPageToSchema.
- خيار صفحة جديدة «HTML»: تبويبات لصق الكود / رفع ملف (.html ≤500KB عبر FileReader) / من مكتبتي (قائمة snippets المستخدم) + اختيار الموضع (داخل الموقع / داخل لوحة التحكم) + حفظ اختياري في المكتبة → addHtmlPageToSchema + createSnippet.
- زر «تغيير النمط» عند تحديد صفحة هبوط → نافذة معرض الأنماط → changeLandingVariant فوري.
- لوحة التصميم: قسم «الشعار» — رفع صورة (تصغير canvas بحد 512px → dataURL → schema.branding.logo، SVG مباشرة) + معاينة + إزالة/استبدال.
- لوحة الخصائص: نوع حقل 'code' جديد (textarea أحادي الاتجاه LTR mono + عدّاد أحرف) لمكوّن HTML المخصص.
- رأس البناء: زر «حفظ كقالب» → نافذة (اسم/وصف) → حفظ المشروع أولاً ثم saveProjectAsTemplate + توست.

**QA (main agent):** tsc نظيف، lint نظيف، تحقق فعلي بالمتصفح: رفع شعار حقيقي (input file) → ظهر في رأس الموقع 90×36 + الشريط الجانبي + التذييل؛ إنشاء صفحة HTML بلصق الكود + حفظها في المكتبة ثم إعادة استخدامها من تبويب «من مكتبتي»؛ تغيير نمط صفحة هبوط قائمة (gradient)؛ حفظ كقالب من الرأس.

---

## Task ID: 7-e — Backend APIs (subagent partial + main agent completion)

**Agent:** full-stack-developer (context deadline mid-task) + main agent

**Work Log:**
- (subagent) `GET/POST /api/templates` + `DELETE /api/templates/[id]` كاملة مع templateToDTO وfindOwnedProject.
- (main) `POST /api/templates/[id]/use` — استنساخ schema بإعادة تسمية «(نسخة)» + مشروع جديد + إصدار 1.
- (main) `GET/POST /api/snippets` + `DELETE /api/snippets/[id]` + `POST /api/snippets/[id]/use` (addHtmlPageToSchema + إصدار «إضافة صفحة HTML: …»).
- (main) `/api/projects` POST يقبل landingVariant (تحقق من LANDING_VARIANTS) → createProjectFromAnalysis.
- (main) agent.ts: أداة #14 change_landing_variant في موجه LLM مع قائمة الأنماط + sanitize (variant/pageId) + create_page يقبل landingVariant + استدلال عربي: «أضف صفحة هبوط بنمط X» و«غيّر نمط الصفحة الرئيسية…» مع detectLandingVariant (مطابقة بالاسم/المعرف + كلمات مفتاحية: داكن/تدرج/تطبيق/فيديو/بريد/متجر/بسيط/أرقام/وكالة/فعالية/موسّط).
- (main) validate.ts: فحص سابع «أقسام HTML المخصصة» + autoFixSchema يستبدل HTML الفارغ بالافتراضي.

**QA:** اختبار curl حي كامل: إنشاء مشروع بـ landingVariant=app-showcase (hero visual=phone ✓) → حفظ كقالب → استخدام القالب (مشروع جديد بنفس schema) → إنشاء snippet → إضافته لمشروع (صفحة custom-html) → وكيل «غيّر نمط الصفحة الرئيسية إلى الداكن الفاخر» (bg=dark ✓ عبر LLM) → validate: 7/7 فحوصات ok.

---

## Task ID: 7-f — Export Generator Upgrades (subagent, completed + verified by main agent)

**Agent:** full-stack-developer (context deadline after finishing code; main agent verified & recorded)

**Delivered in src/lib/export/generate.ts:**
- بطل Hero الموسّع: eyebrow (فاتح/داكن)، visual=phone (.pt-phone بنوك+إحصائيات+أعمدة)، visual=video (.pt-play بزر تشغيل)، visual=form (.pt-lead-form بنموذج بريد + صفوف أفاتار + نجاح عند الإرسال من script.js)، titleSize lg/xl.
- مكوّن custom-html → iframe sandboxed srcdoc مهرّب.
- الشعار: assets/logo.{ext} في ZIP + favicon + <img class=pt-logo> في الرأس/الشريط الجانبي/التذييل بمسارات نسبية (root و../).
- SEO: meta description + og:title/description + <title> صفحة|مشروع + favicon حرفي احتياطي بلون الثيم.
- حركات: .pt-reveal + IntersectionObserver بتتابع + prefers-reduced-motion.
- زر العودة للأعلى (44px) + skip-link «تخطَّ إلى المحتوى» + focus-visible/selection/smooth-scroll/تمرير مخصص.

**QA (main agent):** تصدير حي: ZIP 50KB يحوي pt-reveal/pt-top/pt-skip/meta/og ✓؛ صفحة HTML تصدَّرت بـ iframe srcdoc ✓؛ مع branding.logo: assets/logo.png + favicon + مسارات نسبية صحيحة في الصفحات الفرعية ✓؛ تحميل ZIP من نافذة التصدير بالمتصفح ✓.

---

## Task ID: 7-g — Integration & E2E Verification (main agent)

**Task:** تحقق شامل نهاي-إلى-نهاية لكل الميزات الجديدة + إصلاح تكامل واحد + تنظيف.

**Work Log:**
1. إصلاح تكامل حرج: مكوّن HTML المخصص كان يظهر بديلاً نصياً داخل الباني (interactive=false) — أضفت علم `mini` إلى BlockCtx/PrototypeRenderer وحددت الشرط على `ctx.mini` فقط (المصغّرات)؛ الباني ووضع المعاينة يعرضان الإطار الحقيقي الآن. TemplateMiniPreview يمرر mini.
2. E2E بالمتصفح (agent-browser) + مراجعات VLM:
   - مكتبة القوالب بأربعة تبويبات ✓؛ معرض «صفحات الهبوط» 12 نمطاً بمعاينة حية حوارية (9.2/10) و«إنشاء مشروع» يفتح الباني بنمط مطبق ✓
   - تدفق مشروع جديد بخطوة «شكل الصفحة الرئيسية» (12 بطاقة) → بناء بنمط الداكن الفاخر (9/10) ✓
   - الباني: تغيير نمط صفحة هبوط فورياً (غلاف متدرج ✓ 9/10)، رفع شعار فعلي → ظهر في الرأس/الشريط/التذييل (90×36 DOM) ✓، صفحة HTML بلصق كود + حفظ بالمكتبة + إعادة استخدام من «من مكتبتي» → إطار يعرض المحتوى فعلاً ✓، حفظ كقالب من الرأس ✓
   - الوكيل الذكي: «غيّر نمط الصفحة الرئيسية إلى عرض التطبيق» → هاتف في البطل (9/10) + «تغييرات غير محفوظة» + حفظ ✓
   - «قوالبي»: إنشاء مشروع من قالب محفوظ فتح الباني بنسخة ✓؛ «مكتبة HTML»: إضافة الكود بنافذة + استخدام كود في مشروع قائم (متجرتي) → صفحة عرض رمضان ✓
   - التصدير من الواجهة: فحوصات → جاهز → تحميل ZIP ✓ (تأجير-سيارات-الجزائر.zip)
   - الجوال 390px: معرض الأنماط عمود واحد بلا فائض أفقي (390=390) — 9/10 ✓
   - التذييل: لاصق عند 8200px (bottom=8200) ومدفوع طبيعياً عند 900px ✓
   - 0 أخطاء متصفح، 0 أخطاء console، dev.log نظيف
3. tsc --noEmit: نظيف. bun run lint: 0 أخطاء (تحذير الخطوط القديم وحده).
4. تنظيف كل بيانات الاختبار (مشاريع/قوالب/أكواد) — بقيت بذور العرض الثلاثة فقط.

**Stage Summary:**
الميزات الخمس تعمل من طرف إلى طرف: (1) 12 نمط صفحة هبوط قابلة للاختيار من تدفق الإنشاء ومكتبة القوالب ولوحة الصفحات والوكيل الذكي، (2) رفع الشعار ودمجه في المعاينة والتصدير (favicon/assets)، (3) حفظ المشاريع كقوالب شخصية وإعادة استخدامها، (4) مكتبة HTML (رفع/لصق/استخدام في مشاريع) بمكوّن custom-html معزول، (5) تحسينات جودة التصدير (SEO/OG/حركات/زر أعلى/skip-link/شعار). إعادة تشغيل خادم التطوير بعد توقفه أثناء عمل الوكلاء المتوازيين.
