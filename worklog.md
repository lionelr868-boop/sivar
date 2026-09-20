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
