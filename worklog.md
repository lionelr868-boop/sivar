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

---

## Task ID: 8-a (foundation — main agent)

**Agent:** main agent
**Task:** أساس الجولة 8: أنواع الكتل الجديدة + عقد التنقل الذكي + إصلاح أزرار React + زر العودة + تروستة لوحة التحكم + خلفية صور البطل (React) + حذف الصور بعد التحميل (خادم).

**Work Log:**
- `agent-ctx/8-spec.md` (جديد): العقد الملزم الكامل للجولة 8 (ملكية الملفات + عقود nav-targets والكتل الجديدة وخلفية الصورة وزر العودة والتروستة وقواعد الجمالية).
- `src/lib/types.ts`: BlockType += 'activity-feed' | 'tasks-list' | 'quick-actions'.
- `src/lib/project/nav-targets.ts` (جديد): دوال نقية مشتركة (findHomePage/AuthPage/PricingPage/DashboardPage/FormPage/TablePage + heroPrimaryTarget/heroSecondaryTarget/pricingButtonTarget/ctaButtonTarget/bannerButtonTarget/stateActionTarget/dashboardActionTarget).
- `src/lib/project/tools.ts`: + stripTransientImages (يزيل bgImage/bgImageName من كتل البطل).
- `src/app/api/projects/[id]/export/route.ts`: بعد توليد ZIP → stripTransientImages → حفظ project.schemaJson + الإصدار بالمخطط المنقّى (مطلب: الصور لا تبقى في DB بعد التحميل).
- `src/app/api/projects/[id]/route.ts`: نسخ الإصدارات التاريخية تُنقّى من الصور المؤقتة أيضاً.
- `src/components/builder/export-dialog.tsx`: بعد الضغط على التحميل → مزامنة الحالة المحلية (strip) + toast يشرح الحذف (مفتاح heroImageCleared).
- React blocks — أزرار عاملة: hero (أساسي→هدف ذكي، ثانوي→مرساة/صفحة، بريد→هدف، فيديو→زر تشغيل حقيقي يتبدّل)، pricing (ctx + planGo)، cta (ctx + ctaGo + توهج داخلي)، banner (ctx + bannerGo + توهج)، state-blocks (onAction → dashboard/home)، dashboard-header (أزرار→form/table)، auth-card (login + signup كلاهما → لوحة التحكم).
- hero-block: خلفية صورة (bgImage/bgOverlay dark|medium|light|none + نص أبيض/داكن + textShadow عند none) + خلفيتا gradient-soft وmesh + pt-wave في theme-provider.
- جمالية: features (بلاطة أيقونة بتدرج + حدّ hover primary)، stats (قيم بتدرج نصي)، testimonials (علامة اقتباس متدرجة + حلقة أفاتار) + SectionShell ids: features/pricing/testimonials.
- `prototype-renderer.tsx`: FloatingBackButton عائم (غير الرئيسية، تفاعلي فقط) + SiteShell/AuthShell/DashboardShell محدثة + AuthShell (توهجات + رابط عودة + شعار) + DashboardTopbar (بحث يفلتر الجداول عبر ctx.tableSearch + جرس إشعارات بقائمة تعمل + قائمة مستخدم بروابط حقيقية profile/settings/logout) + رابط «العودة إلى الموقع» في الشريط الجانبي والجوال + data-table يدمج بحث التروستة.
- `preview-mode.tsx`: زر «رجوع» بمكدس تاريخ + selectPage متزامن.
- i18n/builder.ts: مفاتيح 8-a (backBtn/backToHome/topbarSearch/notifications/userMenu/imageField*/heroImageCleared...).
- tsc: يتبقى خطأ registry وحده (مسؤولية 8-c) — dev server 200.

**Stage Summary:**
- الأساس المشترك جاهز: nav-targets يعمل React-side وسيستورده 8-b للتصدير (نفس القواعد).
- الصور المؤقتة: تدخل ZIP ثم تُحذف من كل مستويات DB (صفحة المشروع + الإصدارات) وتُزامن محلياً مع toast.
- في انتظار 8-b (generate.ts) و8-c (كتل جديدة + registry + محرر الصور + إثراء القوالب).

---

## Task ID: 8-c — كتل لوحة التحكم الجديدة + حقول الصفحة/الصورة + إثراء القوالب

**Agent:** full-stack-developer (subagent — owns blocks components, registry, properties-panel, templates, i18n tail)

**Files (ملكية صارمة — لم يُلمس ملف خارجها):**
- `src/components/prototype/blocks/activity-feed-block.tsx` (جديد)
- `src/components/prototype/blocks/tasks-list-block.tsx` (جديد)
- `src/components/prototype/blocks/quick-actions-block.tsx` (جديد)
- `src/lib/registry/blocks.ts` — `src/components/builder/properties-panel.tsx` — `src/lib/project/templates.ts` — `src/lib/i18n/builder.ts` (إلحاق فقط في النهاية) — worklog.

**Work Log:**
1. **activity-feed** (سجل النشاطات): بطاقة --pt-* بترويسة bold text-sm + قائمة عمودية بحد أقصى 6 عناصر — كل صف: نقطة primary (خط زمني) + PAvatar (حرفا الاسم) + سطر «{user} {action} {target}» (المستخدم font-semibold 13px، الهدف muted) + وقت 11px muted تحت السطر، divide-y بين الصفوف + hover secondary. قُرّاء آمنون S/L/iS. items فارغة → الترويسة فقط.
2. **tasks-list** (المهام): بطاقة بترويسة (عنوان + subtitle اختياري) + شريط تقدّم h-1.5 (bg secondary، المfüllعرض % بلون primary مع transition-all) + عدّاد «X من Y منجزة» + قائمة مهام: زر checkbox حقيقي (role="checkbox" + aria-checked + focus-visible) حجم size-5 عند done يتحول primary مع أيقونة Check بيضاء strokeWidth 3، label يُخطّ (line-through + muted) عند done + meta 11px. **التبديل محلي (useState يبدأ من props) ويحدّث الشريط والعدّاد لحظياً** — مفعّل دائماً حتى في وضع الباني (عرض توضيحي).
3. **quick-actions** (إجراءات سريعة): section بعنوان text-sm font-bold mb-3 + شبكة متجاوبة حسب العدد (2 / md:3 / lg:4 أعمدة) من أزرار-بطاقات min-h-[76px]: بلاطة أيقونة size-10 بتدرج `color-mix(primary 14%, accent 18%, transparent)` + ProtoIcon بلون primary + label + سهم ArrowLeft (للأمام RTL) muted يتحرك hover. **النقر → ctx.onNavigate(pageId) فقط إذا كان pageId صفحة حقيقية في ctx.schema.pages ووُجد onNavigate — وإلا زر معطّل (opacity-50 + cursor-not-allowed)**.
4. **registry/blocks.ts**: نوعا حقل جديدان في FieldDefinition — `'page'` و`'image'` (مع accept?) — + HERO_BG_OPTIONS += «تدرّج ناعم» (gradient-soft) و«شبكية توهج» (mesh) + HERO_OVERLAY_OPTIONS (dark/medium/light/none) + hero: افتراضي bgOverlay='dark' وحقول primaryButtonPage (page) وbgImage (image) وbgOverlay (select) + ICON_FIELD_OPTIONS += plus/file-text/settings/user (لضمان ظهور منتقي الأيقونات لكل قيمة نستعملها) + تعريفات الكتل الثلاث (فئة dashboard، أيقونات bell/check/zap، defaults جزائرية واقعية: أحمد بن علي/سارة بوزيد/محمد قادري/ياسين مراد/ليلى مزيان + مهام اليوم 2 منجزة/3 معلّقة + 4 إجراءات pageId فارغ يملؤه المستخدم من اللوحة). إصلاح خطأ tsc الوحيد المتبقي (Record<BlockType, BlockDefinition> ناقص الكتل الثلاث).
5. **properties-panel.tsx**: PageField — Select من صفحات المخطط + أول خيار «تلقائي (ذكي)» (حارس `__auto__` لأن Radix لا يقبل قيمة فارغة)، يعرض اسم الصفحة الحالية، بدون schema → null. ImageField — زر رفع outline h-11 (ImagePlus) + إدخال ملف مخفي (png/jpeg/webp) + تحقق ≤5MB (toast imageFieldTooLarge) + **تصغير canvas بحد 1600px** (ملء أبيض خلف الشفافية) + تصدير **JPEG جودة 0.82** + commit dataURL وbgImageName (نفس الباتش عند bgImage) + معاينة h-28 bg-cover + استبدال/إزالة (destructive ghost → undefined) + تلميح + Loader2 أثناء المعالجة. توصيل النوعين في SimpleField (قبل فرع النص الافتراضي) فيعملان حتى داخل عناصر القوائم (pageId في quick-actions). 'bgOverlay' أُضيف إلى APPEARANCE_KEYS.
6. **templates.ts — إثراء لوحات التحكم للقوالب الـ14 كلها** (buildDashboardBlocks): الترتيب النهائي dashboard-header(0), stats-row(1), chart(2), chart(3), **quick-actions(4), data-table(5), tasks-list(6), activity-feed(7)**. الإجراءات السريعة تُبنى بمعرفات صفحات حقيقية (`${p.id}-${key}`): «إضافة {مفرد كيان أول صفحة جدول}» → أول table، «تقرير الأداء» → اللوحة نفسها، «الإعدادات» → settings، «الملف الشخصي» → profile (كل هدف بشرط توفر specه — خرائط ENTITY_SINGULAR جديدة). المهام: 5 (أولاها «مراجعة أحدث {الكيان}») + سجل النشاطات من p.activity (title→action, subtitle→target, meta→time) مع تدوير 6 أسماء جزائرية، بحد 5.
7. **i18n/builder.ts** (إلحاق في نهاية الكائن): tasksProgressOf/pageFieldAuto/imageFieldInvalid/imageFieldUploaded فقط — بقية النصوص حرفية عربية في السجل والمكوّنات (نمط الكتل القائمة).

**Verification:**
- `npx tsc --noEmit`: **صفر أخطاء في src/** (خطأ registry الوحيد المتبقي من 8-a أُصلح). `bun run lint`: 0 أخطاء (تحذير الخطوط القديم وحده). dev.log نظيف (Compiles بلا أخطاء).
- سكربت bun مؤقت (حُذف): 48/48 فحصاً — saas-suite يحوي الكتل الثلاث بالترتيب المطلوب، pageIds الإجراءات كلها تُحل لصفحات موجودة، 5 مهام (2 منجزة)، نشاطات بصيغة العقد، **والقوالب الـ14 كلها مُثراة** بأهداف صالحة + السجل (الكتل الثلاث + hero bgImage/bgOverlay/primaryButtonPage + 6 خلفيات + نوعا الحقلين). + اختبار SSR مؤقت (renderToString): 12/12 — أفاتار/نقطة زمنية/وقت، role=checkbox + aria-checked + line-through + width:40%، الشبكة 2/3/4، الأزرار مفعّلة عند onNavigate ومعطّلة عند pageId فاسد أو بلا onNavigate.
- أيقونات: bell/check/zap/plus/file-text/settings/user/package/users/trending-up كلها في icon-map (ProtoIcon) — الأربع الأخيرة أُضيفت أيضاً إلى ICON_FIELD_OPTIONS.

**Stage Summary — مطلوب من الوكيل الرئيسي (وصل جاهزاً للدمج الفوري):**
- ⚠️ **prototype-renderer.tsx (ملف الرئيسي — لم ألمسه): حالة switch الكتل الثلاث غير موجودة بعد** (قرأت الملف: 26 حالة بلا activity-feed/tasks-list/quick-actions → تسقط في default `''`). المطلوب إضافته: 3 استيرادات + `case 'activity-feed': return <ActivityFeedBlock block={block} ctx={ctx} />` ومثلها للاثنين (المكوّنان الأولان يقبلان ctx اختيارياً وquick-actions يطلبه — توقيع الجميع متوافق مع تمرير ctx دائماً). بدونها تُضاف الكتل من «+ مكوّن» وتحرَّر خصائصها لكنها لا تظهر في العرض.
- 8-b (generate.ts): لا مرجع للكتل الثلاث بعد — التصدير بانتظاره (نفس الخصائص في 8-spec: items[{user,action,target,time}] / items[{label,done,meta}] / actions[{icon,label,pageId}] — إجراءات pageId الفارغة تُخفى والفاسدة تُخفى/تعطَّل).
- ملاحظة تصميم واحدة: ملصق «إضافة …» في الإجراءات السريعة يستعمل مفرد كيان **صفحة الجدول الهدف** (لا كيان اللوحة) حتى يتطابق النص مع الوجهة (مثال saas-suite: «إضافة عميل» → صفحة العملاء).

## Task ID: 8-b — Export Generator (subagent)

**Agent:** 8-b (export generator — `src/lib/export/generate.ts` فقط)

**Work Log:**
- **أزرار عاملة (عقد nav-targets المشترك):** استيراد `heroPrimaryTarget/heroSecondaryTarget/pricingButtonTarget/ctaButtonTarget/bannerButtonTarget/stateActionTarget/dashboardActionTarget` من `src/lib/project/nav-targets` — نفس قواعد عارض React حرفياً: بطل أساسي/ثانوي (الثانوي ← مرساة `#features/#pricing/#testimonials/#faq` أو صفحة)، أزرار كل خطط التسعير، CTA، الشريط الإعلاني، أزرار الحالات (فارغ/خطأ) كروابط `<a>` (dashboard داخل صفحات اللوحات)، وأزرار ترويسة اللوحة كروابط `<a class="pt-btn">` مع أيقونة Plus للأول (تقسيم على الفاصلة العربية أيضاً).
- **مراسي الأقسام:** `sectionWrap(id?)` — features/pricing/testimonials/faq تحمل `id` + `scroll-margin-top:76px` (smooth-scroll موجود مسبقاً خلف prefers-reduced-motion).
- **مصادقة:** login **و signup** كلاهما يحمل `data-redirect` إلى لوحة التحكم (findDashboardPage)؛ forgot يبقى برسالة نجاح.
- **زر العودة للخلف:** `backButtonHtml` عائم ثابت (bottom:20px / inset-inline-start:20px / 44px دائري primary) بسهم SVG يشير يميناً (RTL) + تسمية «عودة» تتمدد عند hover/focus — في كل قشور غير الرئيسية (site/auth/dashboard) بلا 404 ولا الرئيسية؛ `data-home` + معالج script.js (history.back إن كان المُحيل نفس الأصل وإلا الرئيسية). إخفاء شارة البيانات التجريبية الثابتة على تلك الصفحات عبر `.pt-back~.pt-demo-badge` (تتجنب التزاحم؛ الشارة باقية في التذييل/الشريط الجانبي/بطاقة الدخول).
- **تروستة لوحة التحكم (desktop+mobile):** `.pt-topbar` لاصقة أعلى العمود الرئيسي (تحت صفحة الجوال العلوية): بحث `data-topbar-search` «ابحث في الصفحة...» بأيقونة + جرس بنقطة حمراء وقائمة منسدلة (3 إشعارات جزائرية + «تحديد الكل كمقروء» يعمل) + قائمة مستخدم (أفاتار «م» + demo@namudhaj.dz + الملف الشخصي/الإعدادات/تسجيل الخروج روابط حقيقية تُخفى عند غياب الصفحات) — فتح/إغلاق عبر `[data-menu-toggle]` + إغلاق عند النقر خارجها. + رابط «العودة إلى الموقع» (أيقونة globe) أسفل بطاقة المستخدم في الشريط الجانبي.
- **الجداول:** بحث الجدول + بحث التروستة مدمجان (AND) في `refreshTable` واحدة + **ترقيم صفحات** خفيف: `[data-pager]` مع `data-page-size="5"` وأزرار سابق/تالي (أسهم RTL: السابق →، التالي ←) وعداد «صفحة X من Y» — يُخفى كلياً حين ≤ 5 صفوف، ويُعاد الضبط عند البحث.
- **خلفية صورة البطل:** `findHeroImage` (أول بطل بصورة صالحة) → `dataUrlToAsset` → `assets/hero-bg.{ext}` ثنائي داخل الحزمة (مثل الشعار، عبر `RenderCtx.heroBg` الجديد) — الجذر `assets/...` والمجلدات `../assets/...`؛ الأقسمة inline-style: `background-image:{overlay},url(...)` مع أغطية dark/medium/light/none حرفياً من العقد، نص أبيض إلا light، وظل نص عند none. لا data URL في HTML إطلاقاً. + خلفيتا hero الجديدتان `gradient-soft` و`mesh` (نفس قيم عارض React).
- **تشغيل الفيديو:** الزر يتبدّل فعلياً: مثلث ↔ أيقونة إيقاف (شريطان) + موجة صوت متحركة `pt-wave` (5 أعمدة scaleY keyframes متدرجة التأخير) تحترم prefers-reduced-motion (aria-pressed/aria-label يتحدثان).
- **الكتل الجديدة (عقود 8-spec حرفياً):** activity-feed (بطاقة + ≤6 عناصر: نقطة primary + أفاتار ملوّن + نص بهدف غامق + وقت + فواصل)، tasks-list (شريط تقدّم متحرك + مربعات `data-task` role=checkbox مخصصة + شطب عند الإنجاز + تحديث فوري للتقدّم والعداد «X من Y منجزة» داخل نفس البطاقة)، quick-actions (شبكة 2→auto-fill 150px من بطاقات روابط بأيقونة SVG بتدرج primary→accent وسهم ‹ — الإجراءات ذات pageId غير الصالح تُهمل كلياً). + خريطة `ICON_SVG` (26 أيقونة بنمط lucide مضمّنة بلا مكتبات).
- **تحسينات جمالية (مطابقة React):** pt-btn--primary بتوهج `0 4px 14px color-mix(primary 35%)` + hover -1px؛ بلاطة أيقونة features بتدرج + hover بطاقة -2px وحد primary 35%؛ قيم stats بتدرج نصي clipped؛ شهادات: علامة اقتباس ” متدرجة شفافة + حلقة أفاتار + «...» حول النص؛ CTA/Banner: توهج داخلي علوي (radial أبيض 16-18%) خلف المحتوى + تدرجات primary→accent؛ صفحة الدخول: توهجان ضبابيان (primary 14% / accent 10%) + رابط «العودة إلى الرئيسية» أسفل البطاقة + إصلاح التداخل المزدوج لـ blk-auth (min-height:auto للمتداخلة).
- **README:** صف assets/hero-bg عند وجود الصورة + تحديث وصف script.js (ترقيم/تروستة/مهام/زر عودة).

**QA (سكربت تحقق مؤقت بـ bun على مخطط وهمي كامل — 49/49 ✓):**
1. index.html: hero أساسي → `signup/`، ثانوي → `#features`، أزرار الخطط وCTA → `signup/` (4 روابط) ✓
2. كل الصفحات غير الرئيسية فيها `pt-back` مع `data-home` والرئيسية بدونها ✓
3. dashboard: pt-topbar + بحث التروستة + جرس/قائمة إشعارات وهران + قائمة مستخدم بروابط profile/settings/logout حقيقية ✓
4. `assets/hero-bg.png` ثنائي داخل الحزمة + `url('assets/hero-bg.png')` في الجذر + `../assets` في المجلد + الأغطية dark/medium ✓
5. tasks بمربعات data-task حقيقية، quick-actions برابط صالح واحد (غير الصالح مهمل)، activity-feed بثلاثة عناصر ✓
6. script.js يحوي كل المعالجات (back/topbar/tasks/pager/menus/read-all/play) وصالح نحوياً، styles.css أقواسها متوازنة (501/501) ✓
7. signup + login يحملان `data-redirect="../dashboard/"`، empty-state زر رابط للوحة ✓
8. كل الميزات القديمة باقية (reveal/top/skip/SEO/404/netlify.toml/nav toggle/نماذج/مفاتيح) ✓
- `npx tsc --noEmit`: صفر أخطاء في generate.ts (خطأ registry اختفى — أنجزه 8-c بالتوازي)؛ `bun run lint`: 0 أخطاء (تحذير الخطوط القديم فقط)؛ dev.log نظيف. السكربت المؤقت حُذف بعد التشغيل.

**Stage Summary:**
التصدير الآن يعكس كل عقود الجولة 8 حرفياً: كل زر في الموقع الثابت يعمل بهدف ذكي مطابق للمعاينة الحية (nav-targets مشترك بلا ازدواج منطق)، كل صفحة غير رئيسية فيها زر عودة خلف عائم RTL + مسارات عودة نصية في الدخول واللوحات، لوحات التحكم اكتسبت تروستة حقيقية (بحث يفلتر الجداول فعلياً + إشعارات + قائمة مستخدم بروابط حقيقية) وجداول مرقّمة، وصورة البطل تُحزم كملف binary وتُحذف خصائصها من HTML، مع الكتل الثلاث الجديدة عاملة بالكامل في JS خالص صالح لـ Netlify مباشرة.

---

## Task ID: 8-d (تكامل وتحقق نهائي — main agent)

**Agent:** main agent
**Task:** ربط كتل 8-c في العارض + تعليم الوكيل الذكي + إصلاحا خللين في التصدير + تحقق E2E شامل بالمتصفح.

**Work Log:**
- prototype-renderer.tsx: استيراد + حالات renderBlock للكتل الثلاث الجديدة (activity-feed / tasks-list / quick-actions) بتمرير ctx.
- agent.ts: موجه النظام يشرح الكتل الجديدة + خصائص hero الموسعة (background الجديدة وbgOverlay مع منع صريح لوضع bgImage) + قواعد الأزرار الذكية + استدلال عربي مباشر: «أضف سجل النشاطات/المهام/إجراءات سريعة».
- إصلاحان في generate.ts (اكتشفا في E2E):
  1. `.pt-demo-badge` كان يغطي زر العودة في صفحات الدخول (القشرة متداخلة فأخفق المحدد الأخوي) → أضيف `body:has(.pt-back) .pt-demo-badge{display:none}`.
  2. بحث الجداول في التصدير: فرع «النتائج ≤ حجم الصفحة» كان يُظهر المتطابق فقط دون إخفاء البقية (سارة → 5 ظاهرة والعداد يقول 1) → الآن `rows.forEach` يخفي غير المتطابق.
  3. فائض أفقي في لوحات التحكم المصدَّرة على الجوال (390px): `grid-template-columns:1fr` في الميديا كويري يسمح بامتداد المحتوى (pills بـ 870px) → `minmax(0,1fr)`.
- E2E كامل (agent-browser على المنصة + على موقع مصدَّر يُخدم عبر خادم محلي):
  - إنشاء مشروع «متجر الأناقة» بنمط الداكن الفاخر → الباني → لوحة التاجر تحوي إجراءات سريعة + مهام (2 من 5) + سجل نشاطات + تروستة (بحث/جرس/مستخدم).
  - المعاينة: زر البطل الأساسي → إنشاء حساب، النموذج submit → لوحة التاجر، زر «عودة» العائم → الرئيسية، «العودة إلى الموقع» → الرئيسية، بحث التروستة يفلتر الجدول (سارة→1 ثم تفريغ→5)، الجرس (3 إشعارات + تحديد الكل كمقروء يزيل النقطة)، قائمة المستخدم (الملف/الإعدادات/تسجيل الخروج → صفحات حقيقية)، مهام checkbox (2→1 من 5 مع تحديث التقدّم).
  - رفع صورة خلفية للبطل (16KB→57KB dataURL بعد تصغير canvas) → ظهرت فوراً بالتدرج الداكن فوقها في المحرر (VLM: blobs بنفسجية/قرمزية ونص أبيض مقروء).
  - الحفظ → التصدير: ZIP يحوي assets/hero-bg.jpg + url('assets/hero-bg.jpg') في الجذر و'../assets/' في المجلدات + التراكب 0.62/0.78 ✓؛ أزرار البطل/التسعير/CTA → signup/ والثانوي → #pricing ✓؛ pt-back في login/dashboard لا في الرئيسية ✓؛ التروستة + data-task + blk-quick/blk-activity ✓؛ روابط ../profile/ و../settings/ و../login/ ✓.
  - **بعد التحميل: bgImage/bgImageName حُذفا من قاعدة البيانات والحالة صارت downloaded ✓** (والمزامنة المحلية + toast جاهزان في نافذة التصدير).
  - الموقع المصدَّر (HTTP حقيقي): زر البطل → /signup/، زر العودة → history.back() → /، تسجيل الحساب → /dashboard/ (data-redirect)، بحث التروستة سارة→1 صف ثم تفريغ→5، مهام 2→1 مع تحديث العداد، إجراء سريع → ../products/، كشف الأقسام عند التمرير يعمل (IO).
  - الجوال 390px: الرئيسية 390=390، اللوحة 390=390 بعد الإصلاح، products/settings/login كلها 390=390؛ لقطة اللوحة (VLM): تروستة بحث+جرس+أفاتار، بطاقات إحصائية، تخطيط نظيف.
  - توافق خلفي: تصدير مشروع بذري قديم (متجرتي) يعمل بكل الميزات الجديدة.
- tsc --noEmit: صفر أخطاء src. lint: صفر أخطاء (تحذير الخطوط القديم وحده). dev.log نظيف. حذف مشروع الاختبار وتنظيف الملفات المؤقتة.

**Stage Summary:**
- الخطوات الثلاث مكتملة ومتحقق منها طرفا-إلى-طرف: (1) كل الأزرار تعمل في المعاينة والتصدير + زر عودة عائم في كل صفحة غير رئيسية + رجوع بمكدس في شريط المعاينة، (2) رفع صورة خلفية البطل مع تراكب قابل للاختيار وحذف من DB بعد التحميل حرفياً، (3) جودة مرفوعة: خلفيتا تدرّج جديدتان، توهجات، تدرّج أرقام وأيقونات، اقتباسات آراء، تروستة لوحة حقيقية (بحث/إشعارات/مستخدم) + 3 كتل غنية (سجل/مهام/إجراءات) مدمجة في كل قوالب المشاريع الجديدة + ترقيم صفحات الجداول المصدَّرة.
- إصلاحات جودة أثناء التحقق: تغطية زر العودة بالشارة، فلترة الجداول، الفائض الأفقي للجوال.

---

Task ID: 9-a
Agent: full-stack-developer (React side)
Task: رسوم البطل الواقعية (7 بطاقات) + 5 خيارات رسم جديدة + خلفيات صور لكل أقسام الصفحة + خلفية مشروع كاملة برفع من لوحة الهوية + ترقية الرسوم البيانية (تدرّج/حركة/تحويم).

Work Log:
- ملف جديد `src/components/prototype/blocks/hero-visuals.tsx`: سبع بطاقات واقعية بمحتوى العقد حرفياً — لوحة تحكم (تروستة نقاط+app.example.dz+جرس بنقطة، شريط جانبي «لوحتي» بـ4 صفوف والنشط بشريط primary-start، 3 KPI بشارات خضراء، منحنى 260x90 بسبع نقاط 32→82 Catmull-Rom + تدرّج 26%→2% + شبكة + نقاط بيضاء + جانفي/مارس/ماي RTL، قائمة 3 طلبات بشارات، شارة عائمة «طلب جديد من وهران») + هاتف (9:41 + رموز حالة SVG + نوتش + «صباح الخير، سارة» + بطاقة رصيد متدرّجة 248,500 دج + 4 إجراءات + أعمدة «آخر 7 أيام» آخرها accent + معاملتان + تبويب سفلي + home indicator) + تحليلات (منحنى 520x180 بعشر نقاط + توهج drop-shadow + رقائق KPI) + طلبات (5 صفوف بمدن وشارات وملغى danger + تذييل) + محادثات (فقاعتان + مؤشر كتابة pt-typing + شريط إدخال بزر إرسال) + تقويم (ديسمبر 2024 يبدأ الأحد، اليوم 12 primary، نقاط 3/18/25 بثلاثة ألوان، تذييل «3 مواعيد») + رأي عميل (اقتباس 15% + 5 نجوم + «عميل موثّق»). كلها role=img والداخل aria-hidden وكل الألوان var(--pt-*).
- `hero-block.tsx`: HeroVisualKind += analytics/orders/chat/calendar/testimonial (10 قيم) + اختيار الرسم من hero-visuals + hasSideVisual لكل الأنواع البصرية في المقسّم (الموسّط: هاتف/فيديو يُكوَّم كما كان والجديدة لا تُعرض كـ dashboard).
- `charts/`: line-chart (تدرّج خط رأسي primary→color-mix 55% أبيض، strokeWidth 3، توهج filter، pathLength=1 + strokeDasharray:1 + صنف pt-draw 1.1s، مساحة pt-fade-in، تحويم: خط تسديد متقطع + نقطة r=6 fill primary + تلميح مقيَّد بالحواف بأرقام ar-DZ مع fallback en-US، touch مدعوم، smoothPath مُصدَّر) — bar-chart (صنف pt-anim-bar بتدرّج 60ms، العمود الأعلى بتدرّج accent، تحويم بتلميح + خفوت البقية 0.55) — donut-chart (حالة تحويم موحّدة: سماكة 20→23 والبقية 0.55، مزامنة صفوف المفتاح مع الشرائح) — chart-frame (بلاطة أيقونة رسم صاعد primary في الترويسة).
- `theme-provider.tsx`: PT CSS += pt-typing/pt-draw/pt-fade-in/pt-bar + حارس prefers-reduced-motion للثلاثة + PrototypeThemeScope يقبل bgImage/bgOverlay: مع صورة النطاق relative+isolate بخلفية شفافة وطبقة z-index:-1 (صورة cover + غسلة var(--pt-bg) بشفافية .9/.74/.55/0 حسب strong/medium/soft/none) تغطي كامل ارتفاع المحتوى.
- `shared.tsx`: sectionImageStyle (bgImage+bgOverlay بقيم أغطية البطل حرفياً → {style, dark}) + isImageNoOverlay + SectionHeading(dark,textShadow) + SectionShell(style).
- الكتل التسع (cta/banner/features/testimonials/stats/steps/gallery/team/faq): تطبيق الخلفية على جذر القسم (الجذر البصري للبطاقة في cta/banner) + انقلاب نبرة النص + ظل نص عند none — بلا صورة: نفس السلوك القديم بالبايت. المعرض: صورة عنصر حقيقية (img cover + hover scale) مكان الرمزية؛ الفريق: صورة دائرية مكان أفاتار الحروف.
- `types.ts`: ProjectBranding += bgImage?/bgImageName?/bgOverlay? ('none'|'strong'|'medium'|'soft').
- `registry/blocks.ts`: HERO_VISUAL_OPTIONS = 10 (بترتيب العقد) + حقول bgImage/bgOverlay آخر ترتيب للكتل التسع + حقل image أول itemFields للمعرض والفريق — defaults القائمة لم تُمس.
- `landing-kit.ts`: store-promo→orders، agency-bold→analytics (split/start/lg)، event-announce→calendar (split/start/lg)، minimal-startup→testimonial (split/start/md)، stats-lead→analytics.
- `theme-panel.tsx`: قسم «خلفية المشروع» بعد الشعار (رفع ImagePlus/معاينة h-28/استبدال/إزالة/Select قوة الظهور strong→medium→soft→none بتسميات العقد) عبر `src/lib/client-image.ts` الجديد (5MB/1600px/JPEG .82) — properties-panel لم يُمسّ.
- `prototype-renderer.tsx`: تمرير branding.bgImage/bgOverlay للنطاق + جذور القشور الثلاث (وdiv «لا صفحات») bg-transparent عند وجود صورة — البطاقات والتروستات تحتفظ بألوانها.
- i18n (إلحاق فقط): 13 مفتاح projectBg* (العقد + تسميات خيارات الأربع).

Stage Summary:
- تحقق كامل: tsc صفر أخطاء في ملفاتي (الوحيد الظاهر الآن داخل generate.ts لخطأ heroBg/RenderCtx — ملف 9-b قيد التحرير المتوازي، ليست مسؤوليتي ولم ألمسه)؛ lint صفر أخطاء؛ سكربت bun مؤقت 60/60 (حُذف)؛ سكربت SSR مؤقت (حُذف) يثبت إخراج كل الرسوم الجديدة + أصناف الحركات + keyframes + طبقة خلفية المشروع؛ curl / = 200 وdev.log نظيف.
- عقد مطابق 100%: visual kinds العشرة، الكتل التسع بخلفيات الصور، مفاتيح branding الثلاثة، قيم overlay (قسم: dark/medium/light/none — مشروع: strong/medium/soft/none بشفافيات .9/.74/.55/0).
- لـ 9-b: انعكاس الرسوم السبعة بنفس المحتوى في HTML + نفس sectionImageStyle + صور عناصر المعرض/الفريق + طبقة خلفية المشروع + توسيع stripTransientImages ليشمل bgImage/bgImageName للكتل التسع وbranding.bgImage/bgImageName بعد التحميل (تبقى في ZIP).
- لـ 9-c: كل الحالات في renderBlock جاهزة — تحقق بصري فقط (تبديل الرسم الجانبي، رفع خلفية CTA، رفع خلفية المشروع وتبديل قوتها، تحويم الرسوم).

---
Task ID: 9-b
Agent: full-stack-developer (export side — interrupted by context timeout, verified & completed by main agent 9-c)

Task: تصدير الجولة 9 — رسوم جانبية حقيقية (analytics/orders/chat/calendar/testimonial + إعادة رسم dashboard/phone)، رسوم بيانية متحركة بتلميحات، صور لكل الأقسام + خلفية مشروع ثابتة (assets/img-{n} + assets/bg)، وتوسيع حذف الصور المؤقتة.

Work Log:
- generate.ts (2841→3485 سطراً): HERO_VISUAL_MAP بعشرة أنواع (dashboard|phone|video|form|analytics|orders|chat|calendar|testimonial|none) — دوال heroDashboardVisualHtml/heroPhoneVisualHtml أُعيد رسمها بواقعية كاملة (تروستة app.example.dz + جرس بنقطة، شريط جانبي مصغر مع عنصر نشط، بطاقات KPI بأرقام حقيقية 3.4م دج + شارات خضراء، منحنى Catmull-Rom ناعم بتدرّج مساحة، قائمة طلبات بأفاتار وشارات ومبالغ، شريط إشعار عائم «طلب جديد من وهران»؛ هاتف: 9:41 + نوتش + بطاقة رصيد متدرجة 248,500 دج + إجراءات سريعة + أعمدة «آخر 7 أيام» + معاملات + شريط تبويبات) + خمس بطاقات جديدة (تقرير الأداء بمنحنى كبير وتوهج، أحدث الطلبات بمدن جزائرية، محادثة دعم بفقاعة وإشارة كتابة pt-typing، تقويم ديسمبر بحدث اليوم، رأي عميل بنجوم واقتباس) عبر CSS جديد ‎.pt-mock*‎.
- خط أنابيب الصور: collectBlockImages يمشي على كل الكتل (bgImage للبطل والأقسام + image لعناصر المعرض/الفريق) بإزالة تكرار حرفية → assets/img-{n}.{ext} ثنائي؛ branding.bgImage → assets/bg.{ext}؛ RenderCtx.imgSrc() لمسار نسبي لكل صفحة؛ أُزيلت آلية hero-bg الأحادية القديمة؛ README يوثق img-*/bg/logo.
- الأقسام بصور: readSectionBg يقرأ bgImage/bgOverlay (dark|medium|light|none) → صنف blk-section--onimage[/-light/-none] + نمط inline بتدرّج الغطاء — بلا صورة: خرج مطابق حرفياً للقديم؛ صور عناصر المعرض/الفريق كملفات.
- خلفية المشروع: body.pt-hasbg--{strong|medium|soft} + div.pt-pagebg ثابت z-index:-1 + غسلة بلون خلفية السمة (.9/.74/.55/لا شيء) + تحييد خلفيات القشور عند وجودها.
- الرسوم: lineChartSvg بتدرّج خط عمودي + pathLength=1 + pt-anim-line/pt-area + مناطق تلميح r=14 بـ data-tip؛ barChartSvg بأعمدة pt-anim-bar متدرجة التأخير وأعلى عمود بلون accent؛ donut بحوم تلميحي؛ script.js معالج مفوَّض واحد لـ [data-tip] مع div.pt-tip يتبع المؤشر؛ حماية prefers-reduced-motion تعيد الحالة النهائية.
- tools.ts: stripTransientImages الآن تنزع bgImage/bgImageName من كل الكتل، image/imageName من عناصر أي مصفوفة، وbgImage/bgImageName/bgOverlay من branding (الشعار يبقى).
- agent.ts: يوجّه الوكيل للأنواع العشرة للرسم الجانبي + أقسام الصور + خلفية المشروع (رفع المستخدم فقط).

Verification (by 9-c main agent):
- سكربت مؤقت (.zscripts/qa9.ts — سيُحذف): 40/40 ✓ (ملفات ثنائية، لا data URLs نقطية في HTML، pt-hasbg في الجذر والمجلدات مع ../assets، أقسام onimage بروابط img-1/img-2، صور عناصر المعرض، pt-mock + تقرير الأداء، معالج التلميح + pt-draw/pt-grow + حماية الحركة، التوافق الخلفي لمشروع بلا صور، الأقواس متوازنة، strip ينزع كل الصور ويبقي الشعار).
- npx tsc --noEmit: صفر أخطاء في src. bun run lint: صفر أخطاء (تحذير الخطوط القديم وحده).

Stage Summary:
- التصدير يعكس عقد الجولة 9 كاملاً ومتحققاً آلياً؛ كل ميزات الجولات السابقة (أزرار، عودة، تروستة، ترقيم) باقية.

---
Task ID: 9-c (تكامل وتحقق نهائي — main agent)

Task: تحقق E2E شامل بمتصفح حقيقي من ميزات الجولة 9 (الرسوم الجانبية الواقعية + الخيارات العشرة + المنحنى الجميل المتحرك بتلميح + صور كل الأقسام وخلفية المشروع + الحذف من DB بعد التحميل) وإغلاق الجودة.

Work Log:
- تابع 9-b (الذي انقطع بمهلة السياق قبل تحققه) عوّضَ تحققه الكامل بالوكيل الرئيسي: سكربت QA مؤقت 40/40 ✓ (أصول ثنائية img-1/img-2/bg، لا data URLs نقطية، pt-hasbg في كل الصفحات، أقسام onimage بتدرّجات، صور عناصر المعرض، pt-mock، معالج التلميح + pt-draw/pt-grow/pt-typing + حماية prefers-reduced-motion، التوافق الخلفي، توازن الأقواس، strip ينزع كل الصور ويبقي الشعار) — حُذف السكربت.
- tsc --noEmit: صفر أخطاء في src. lint: صفر أخطاء (تحذير الخطوط القديم). dev.log نظيف.
- E2E على المنصة (agent-browser + دخول تجريبي): إنشاء مشروع «موضة الجزائر» (نمط عرض المتجر) → الباني:
  - الرسم الجانبي «طلبات المتجر» ظهر افتراضياً من القالب (VLM: واقعية 9/10 — أفاتار وشارات ومبالغ وطوابع زمنية).
  - قائمة الخيارات العشرة كلها تعمل: تحقق DOM كامل لكل نوع — dashboard (تروستة app.example.dz + لوحتي + تنقل نشط + KPIs 3.4م دج/1,248/5,880 + منحنى جانفي-جويلية + طلبات بأفاتار وشارات + شارة وهران العائمة في DOM)، phone (248,500 دج + صباح الخير سارة + معاملات + تبويبات)، analytics (VLM جمال 8/10)، chat، calendar، testimonial.
  - رفع صورة لقسم CTA («صورة الخلفية» + منتقي «تعتيم») → خلفية مطبقة فوراً (VLM 9/10، نص أبيض مقروء) — عبر dispatch ملف برمجي بعد أن أخفق upload المباشر مع React.
  - المعرض: حقل «صورة العنصر» لكل عنصر → رفع صورة منتج → بطاقة بصورة حقيقية.
  - لوحة التصميم: قسم «خلفية المشروع» + رفع + منتقي «قوة ظهور الخلفية» (تعتيم قوي/متوازن/ظهور واضح/كما هي) — الغسلة تغيّرت فعلياً 0.74→0.55، الطبقة isolate+z-(-1) تعمل، VLM: خلفية بنفسجية داكنة ظاهرة خلف المحتوى (8/10 فخامة).
  - المعاينة التفاعلية: تلميح الرسم بالأعمدة عند التحويم («جويلية: 2.780.000») يعمل.
- حفظ → تحميل المشروع: ZIP 125KB يحوي assets/bg.jpg + img-1.jpg (منتج) + img-2.jpg (CTA) + مراجع صحيحة في الجذر والمجلدات (../assets) + blk-section--onimage بتدرّج داكن + pt-hasbg في 12 صفحة + netlify.toml.
- بعد التحميل: فحص قاعدة البيانات مباشرة — صفر bgImage في كل الكتل، صفر image في عناصر القوائم، branding.bgImage محذوف (الشعار محفوظ)، الحالة downloaded ✓ (الصور تبقى داخل ZIP فقط).
- الموقع المصدَّر عبر HTTP حقيقي: الصور الثلاث تُحمّل (naturalWidth>0)، تلميح الرسم يعمل («أوت: 3,150,000» مع pt-tip show)، زر البطل → signup/ مع data-redirect، الجوال 390px بلا فائض أفقي (الرئيسية واللوحة)، لا أخطاء console، لوحة مكتب (VLM: شريط جانبي + تروستة + بطاقات أرقام — تبدو منتج SaaS حقيقي).
- توافق خلفي: تصدير مشروع قديم «حجزتي» (مخطط ما قبل الجولة 9) HTTP 200 (62KB).
- تنظيف: حذف السكربتات/المستخرجات/الخادم المؤقت 4173، إغلاق المتصفح.

Stage Summary:
- الجولة 9 مكتملة طرفا-إلى-طرف: (1) رسم لوحة التحكم والهاتف في البطل واقعيان وجميلان + 10 خيارات للرسم الجانبي (5 جديدة: تحليلات/طلبات/محادثات/تقويم/رأي عميل)، (2) المنحنى البياني ناعم متدرّج متحرك بتلميح تحويم في المعاينة والتصدير، (3) صور لكل أقسام صفحة الهبوط + خلفية ثابتة للمشروع كله من لوحة التصميم — تُصدَّر كملفات وتُحذف من DB بعد التحميل حرفياً، (4) مشاريع قالب المتجر/الوكالية/الفعالية/البداية/الأرقام تعرض الرسوم الجديدة افتراضياً.
- مشروع «موضة الجزائر» التجريبي أُبقي عمداً في حساب المستخدم التجريبي كعرض حي للميزات الجديدة (حالته downloaded وصوره مُنقّاة توثيقاً لسلوك الحذف).

---
Task ID: 10
Agent: main agent (Z.ai Code)

Task: إعادة تسمية المنصة من «نموذج» إلى SIVAR + كتابة سطر تطوير ذهبي مضيء أسفل صفحة الهبوط + اعتماد شعار SIVAR المرفوع من المستخدم.

Work Log:
- فحص الشعار المرفوع (upload/pasted_image_1789942711890.png — 1254×1254 RGBA بخلفية شفافة): شريط «S» معدني ذهبي ثلاثي الأبعاد مع قمم جبلية وكرة ذهبية — مثالي لاسم SIVAR.
- توليد أصول محسّنة بـ PIL: public/logo-sivar.png (512px) + public/favicon-sivar.png (192px) وحذف logo.svg القديم.
- إعادة التسمية الشاملة إلى SIVAR: common.brand، auth.welcomeTitle، dashboard.notifWelcomeTitle، export.guideNote، landing.faq1Q، help.a8، برومبتات LLM في agent.ts وanalyze.ts، عنوان/كلمات مفتاحية/أيقونة layout.tsx، تعليقات رؤوس ~189 ملفاً (sed موحّد)، netlify.toml وREADME وscript.js داخل التصدير، تراجعات letterFavicon/404 إلى metadata.name، وكل معرفات namudhaj (كوكي sivar_session، ملح كلمة المرور ::sivar، demo@sivar.dz، slug sivar-project، مفتاح بحث sivar:project-search).
- BrandMark المركزي في landing-navbar: استبدال أيقونة Layers بشعار SIVAR الحقيقي (next/image، حواف دائرية rounded-[26%]) — ينتشر تلقائياً في: ترويسة الهبوط، قائمة الجوال، تذييل الهبوط، بطاقة الدخول (lg)، الشريط الجانبي للوحة، دليل التصدير؛ وشاشة البداية SplashScreen في page.tsx.
- سطر التطوير الذهبي المضيء أسفل تذييل صفحة الهبوط: footerDevCredit «المنصة من تطوير: يجي مسعود طالب دكتوراه بجامعة الجزائر 3» بفئة .sivar-credit في globals.css — تدرّج ذهبي (background-clip:text) + توهّج drop-shadow ذهبي ثلاثي الطبقات + لمعة متحركة sivar-credit-shine (5.5s) + نسخة داكنة أفتح + احترام prefers-reduced-motion.
- ترحيل قاعدة البيانات: تحديث بريد المستخدم التجريبي إلى demo@sivar.dz (بحفظ مشاريعه الخمسة بما فيها عرض «موضة الجزائر») وإعادة تجزئة كلمات مرور كل المستخدمين بالملح الجديد.
- تحقق آلي: tsc --noEmit صفر أخطاء في src، lint صفر أخطاء (تحذير الخطوط وحده)، dev.log نظيف.
- تحقق E2E بمتصفح حقيقي: العنوان «SIVAR — حوّل فكرتك...»، الشعار يُحمّل (naturalWidth>0) في كل المواضع، النص الذهبي ظاهر بنصّه الحرفي مع clip:text وdrop-shadow والأنميشن، الفافيكون favicon-sivar.png، الدخول التجريبي بالكوكي الجديد يفتح لوحة بخمسة مشاريع محفوظة، تصدير ZIP جديد يحوي صفر «namudhaj» وSIVAR في netlify.toml/README/script.js وdemo@sivar.dz في القوائم المنسدلة، الجوال 390px بلا فائض أفقي والسطر الذهبي داخل الشاشة (358×52px).
- تقييم VLM: السطر الذهبي فاتح 8/10 ودافئ 8.5/10 (واضح مضيء فاخر)، تكامل الشعار في الترويسة ممتاز (ذهبي ثلاثي الأبعاد مع كرة وقمم)، تذييل الجوال نظيف بلا كسور.

Stage Summary:
- المنصة أصبحت SIVAR بالكامل: الواجهة، الوكيل الذكي، التصدير، الكوكي، البريد التجريبي، والفافيكون — مع الشعار الذهبي الحقيقي في كل موضع علامة، وسطر تطوير ذهبي مضيء متحرك أسفل صفحة الهبوط (فاتح/داكن/جوال) باسم «يجي مسعود طالب دكتوراه بجامعة الجزائر 3».

---
Task ID: 11
Agent: main agent (Z.ai Code)

Task: تصحيح سطر التطوير أسفل صفحة الهبوط — «يحي» بدل «يجي» + «في جامعة الجزائر 3» — ونزع الإضاءة/التوهّج من الخط الذهبي ليظهر نظيفاً واضحاً.

Work Log:
- تحديث footerDevCredit في landing.ts إلى «المنصة من تطوير يحي مسعود طالب دكتوراه في جامعة الجزائر 3» (تصحيح الاسم + الصياغة).
- إعادة كتابة .sivar-credit في globals.css: نزع كل التوهّج (drop-shadows الثلاثية) ولمعة الأنميشن sivar-credit-shine وقاعدة prefers-reduced-motion المرتبطة بها — بقي تدرّج ذهبي صافٍ فقط (فاتح: 8a6508→dfb754، داكن: e3bd52→ffe9a8) بخط 800.
- تحقق E2E بمتصفح حقيقي: النص الحرفي الجديد ظاهر، filter:none وanimation:none وclip:text سليمة، الوضع الداكن والجوال 390px (بلا فائض أفقي، داخل الشاشة).
- VLM أكّد في الفاتح والداكن: النص يقرأ حرفياً «يحي مسعود… في جامعة الجزائر 3»، تدرّج ذهبي نظيف بلا أي هالة/إضاءة، مقروء تماماً.
- lint: صفر أخطاء (تحذير الخطوط وحده). dev.log نظيف.

Stage Summary:
- سطر التطوير أصبح: «المنصة من تطوير يحي مسعود طالب دكتوراه في جامعة الجزائر 3» بخط ذهبي متدرّج صافٍ بلا توهّج ولا أنميشن — واضح ومقروء في الوضع الفاتح والداكن والجوال.

---
Task ID: 12-a
Agent: full-stack-developer
Task: ألوان الخطوط العامة (theme.text/mutedText في اللوحة والوكيل) + ألوان كل قسم من أقسام صفحة الهبوط (bgColor/textColor اختيارية) في العارض والتصدير مع نص تلقائي ذكي يحل مشكلة وضوح قسم الإعلانات.

Work Log:
- قراءة worklog.md (جولات 7-11) والمواصفة الكاملة agent-ctx/12-spec.md ثم كل ملف قبل تعديله (generate.ts عبر أقسامه، prototype-renderer.tsx، agent.ts كاملين).
- i18n/builder.ts: +8 مفاتيح فقط (fontColorsTitle…removeColor) — صفر عربية hardcoded في المكونات.
- registry/blocks.ts: optional?: boolean لحقل color + حقلا bgColor/textColor (اختياريان) لكل الكتل التسويقية الـ12 (hero/features/stats/steps/pricing/testimonials/faq/cta/contact-form/gallery/banner/team) — تسميات مباشرة كالنمط السائد في الملف.
- properties-panel.tsx: bgColor/textColor في مجموعة «المظهر» + OptionalColorField (حبيكة «افتراضي (من الهوية)» بحدود متقطعة عند الفراغ + زر X «إزالة اللون المخصص» يلتزم ''، مع منتقي وإدخال hex).
- theme-panel.tsx: قسم «ألوان الخطوط» جديد بعد الألوان — fontColorText (إعادة ضبط #1c1726) وfontColorMuted (#6e6880) عبر updateThemeInSchema الموجود (بلا تكرار لأي منطق سمة).
- blocks/shared.tsx: مساعدات مشتركة sectionHexColor/hexLuminance (WCAG)/sectionBgGradient.
- prototype-renderer.tsx: sectionVars(bgColor,textColor) + غلاف div واحد داخل renderBlock() (الswitch نُقل إلى renderBlockInner) يستفيده مسارات BlockList الثلاثة: bgColor → background + --pt-bg + --pt-surface/--pt-border مشتقان (0.42/0.18 حسب السطوع 0.55)؛ textColor → --pt-text + --pt-muted=mix(نص، خلفية||أبيض، 0.38)؛ **نص تلقائي ذكي**: bgColor بلا textColor → سطوع > 0.5 نص #17151f وإلا #ffffff — بلا ألوان: null (التوافق الخلفي بالبايت).
- hero/cta/banner (العارض): عند bgColor صالح وبلا صورة — الخلفية تدرّج linear-gradient(180deg, اللون, hexDarken 0.14) بدل الافتراضي + العنوان/النص يتبعان var(--pt-text)/var(--pt-muted) + dark/الزر مشتقان من سطوع اللون (الشريط: دائرة الأيقونة color-mix من نص القسم).
- generate.ts (التصدير): relativeLuminance + sectionHex + sectionBgGradient + sectionVarsStyle/wrapSectionVars — renderBlock الجديدة تغلّف كل كتلة ذات ألوان بـ <div class="pt-secvars" style="--pt-text:…;--pt-muted:…;--pt-bg:…;--pt-surface:…;--pt-border:…;color;background"> في نقطة واحدة تستفيدها القشور الثلاث؛ hero/cta/banner: صنف blk-hero--secvar/blk-cta__card--secvar/blk-banner--secvar + تدرّج inline من bgColor + زر حسب السطوع؛ 6 قواعد CSS secvar بعد قواعد البطل/الدفعة/الشريط عمداً؛ جذر :root{--pt-text:theme.text} لم يُمس.
- agent.ts: برومبت LLM — أداة 9 توثّق text/mutedText + سطرا ألوان الخطوط وألوان الأقسام مع مثال update_block بـ bgColor؛ الاستدلال — EXTRA_COLOR_NAMES (سوداء/بيضاء/خضراء داكنة/أبيض...) في ALL_COLOR_NAMES + detectAllColors (ألوان بترتيب المواضع بلا تداخل أسماء) + mixHexLocal/deriveMuted (أبيض 0.35 فاتح / أسود 0.25 داكن) + SECTION_KEYWORDS (12 قسماً) + فرعان قبل فرع اللون العام: خلفية/لون قسم → update_block {bgColor (+textColor عند لون ثانٍ مع ذكر نص)}، ولون خط عام → update_theme {text, mutedText مشتق}، مع حارس أفعال الإضافة (أضف/أنشئ) كي لا تُبتلع طلبات الإضافة.
- قرارات موثّقة: أسبقية صورة القسم (جولة 9) على bgColor؛ bgIntent يفهم «لون قسم» بلا «خلفية» كخلفية؛ --pt-border بنفس اتجاه السطح بنسبة أخف 0.18؛ sectionVars بلا معامل theme (معادلات المواصفة لا تحتاجه).

Stage Summary:
- الميزتان تعملان طرفاً-إلى-طرف: لوحة التصميم تحرر ألوان الخطوط (أساسي/ثانوي + إعادة ضبط) وتنعكس فوراً في المعاينة والتصدير (جذر CSS موجود أصلاً)، وكل قسم تسويقي يقبل لون خلفية/خط اختياريين من لوحة الخصائص أو من الوكيل الذكي (LLM أو الاستدلال) — مع نص تلقائي ذكي يجعل قسم دعوة الإجراء/الشريط واضحين دائماً (أبيض على الداكن وداكن على الفاتح).
- أمثلة إلزامية مثبتة: «اجعل خلفية قسم دعوة الإجراء سوداء» → cta.bgColor=#111827، «اجعل خلفية الشريط الإعلاني خضراء داكنة» → banner.bgColor=#065f46، «غيّر لون الخط إلى الأزرق» → update_theme text=#2563eb + mutedText مشتق.
- التوافق الخلفي محفوظ: مشاريع بلا bgColor/textColor تُعرض وتُصدَّر كما هي حرفياً (كل شيء اختياري)، صور الأقسام وخلفية المشروع والرسوم وZIP وحذف الصور بعد التحميل لم تُمس (bgColor/textColor نصيان لا يstripهما منطق الصور فيبقيان في DB عن قصد).
- تحقق: tsc صفر أخطاء في src/، lint صفر أخطاء (تحذير الخطوط القديم وحده)، dev.log نظيف (GET / وagent وexport تجمّع كلها بلا أخطاء)، تحقق bun مباشر للتصدير والإجراءات ومنطق الاستدلال (سجل كامل في agent-ctx/12-a-full-stack-developer.md).

---
Task ID: 12-b
Agent: general-purpose (E2E verifier)
Task: تحقق E2E بمتصفح حقيقي من ميزات الجولة 12

Work Log:
- دخول كامل عبر الواجهة: فتح / → «تسجيل الدخول» → «تجربة سريعة بدون تسجيل» → لوحة المستخدم التجريبي بستة مشاريع (PASS) — r12-01/02.png.
- فتح «موضة الجزائر» في الباني وانتظار تحميله (PASS) — r12-03.png.
- لوحة «التصميم»: قسم «ألوان الخطوط» موجود («لون الخط الأساسي» + «لون الخط الثانوي» + زرا «إعادة الضبط»). تعيين الأساسي #b91c1c عبر native setter + أحداث input/change (منتقي اللون لا يقبل fill مباشراً مع React) → تغيير فوري في المعاينة: H1 = rgb(185,28,28) والمشتق بقي كما هو (PASS) — r12-04/05.png. الثانوي #9a86b8 → rgb(154,134,184) فوري، و«إعادة الضبط — الثانوي» أعاده #6e6880 في اللوحة والمعاينة rgb(110,104,128) (PASS).
- كتلة CTA («دعوة للإجراء») في «الخصائص» → «المظهر»: «لون خلفية القسم» تبدأ فارغة (حبيكة «افتراضي (من الهوية)»). تعيين #065f46 → بطاقة CTA صارت linear-gradient(rgb(6,95,70), rgb(5,82,60)) والعنوان أبيض تلقائياً rgb(255,255,255) والثانوي rgb(160,194,185) — إصلاح «البانر غير الواضح» مثبت بالأنماط المحسوبة (PASS) — r12-06.png.
- زر X «إزالة اللون المخصص»: عاد تدرّج rose الافتراضي 135deg و نص أبيض وحبيكتا «افتراضي (من الهوية)» (PASS) — r12-07.png.
- البطل كذلك: bgColor #065f46 → تدرّج أخضر مخصص + H1 أبيض تلقائي + الزر الأساسي rose مقروء، ثم X أعاده لخلفيته الافتراضية (PASS — بلا حفظ).
- المساعد الذكي: «اجعل خلفية قسم دعوة الإجراء سوداء» → رد: «قمت بتغيير خلفية قسم دعوة الإجراء (cta) إلى الأسود (#111827)» والمعاينة linear-gradient(#111827,#0f1522) (PASS)؛ «غيّر لون الخط إلى الأزرق» → H1/H2 = rgb(59,130,246) = #3b82f6 والمشتق #6b7280 ولوحة التصميم عكست القيمتين (PASS) — r12-08/09.png (POST /agent 200×2 في dev.log، ثانيتان لكل أمر).
- التصدير (curl بالكوكي sivar_session → /api/projects/cmuabygx80023ixmm2oftk17p/export، HTTP 200، ZIP 61KB): index.html و home/index.html يحويان <div class="pt-reveal pt-secvars" style="--pt-bg:#111827;--pt-surface:#0a0e17;--pt-border:#0e1420;--pt-text:#ffffff;--pt-muted:#a5a7ad;color:var(--pt-text);background:#111827">؛ بطاقة CTA blk-cta__card--secvar بخلفية linear-gradient(180deg,#111827,#0f1522) بدل تدرّج rose الافتراضي؛ جذر styles.css: --pt-text:#3b82f6 و--pt-muted:#6b7280 (PASS).
- استجابة 390×844: documentElement.scrollWidth = clientWidth = 390 ولحاوية المعاينة كذلك — لا فائض أفقي (PASS) — r12-10.png.
- agent-browser errors: فارغ (صفر أخطاء صفحة)؛ console: رسائل HMR/DevTools التطويرية فقط؛ dev.log نظيف خلال الجلسة (كل الطلبات 200؛ الخطأ الوحيد EADDRINUSE قديم لمحاولة تشغيل خادم ثانٍ على 3000 قبل جلستي).
- خللان مكتشفان (موثقان بدقة — لم يُلمس أي مصدر):
  1) المعاينة فقط: زر بطاقة CTA عند bgColor داكن = bg-white مع نص أبيض غير مرئي — صنف text-[#16121f] في src/components/prototype/blocks/cta-block.tsx (سطر ~95) يخسر تتالي Tailwind لصالح text-[var(--pt-text)] من variant الثانوي في src/components/prototype/ui/p-button.tsx، وغلاف secvars يضبط --pt-text:#ffffff. المتوقع rgb(22,18,31)، الفعلي rgb(255,255,255) على أبيض. (التصدير غير متأثر: pt-btn--on-dark شفاف بنص أبيض مقروء.)
  2) src/lib/export/generate.ts: وسم pt-secvars يحمل سمتَي style مكررتين (متغيرات secvars ثم transition-delay:120ms) — HTML غير صالح؛ المتصفح يُبقي الأولى فيضيع تأخير الظهور فقط (تجميلي، الألوان تعمل).
- حالة المشروع: حُفظ عمداً (خط أزرق #3b82f6 + CTA أسود #111827) كعرض حي للجولة 12؛ تجربتا البطل/الثانوي اللاحقة غير محفوظتين فقاعدة البيانات مطابقة للتصدير المتحقق منه.

Stage Summary:
- ألوان الخطوط في لوحة التصميم + عكس فوري + إعادة الضبط: PASS.
- لون خلفية القسم على CTA/البطل + نص أبيض تلقائي (إصلاح وضوح البانر): PASS.
- زر X «إزالة اللون المخصص»: PASS.
- أمر الوكيل 1 (خلفية CTA سوداء #111827): PASS.
- أمر الوكيل 2 (لون الخط أزرق #3b82f6 + مشتق): PASS.
- التصدير بألوان (pt-secvars + تدرّج مخصص بدل الافتراضي + --pt-text جذر): PASS.
- الاستجابة 390px بلا فائض أفقي: PASS. الكونسول/dev.log نظيفان: PASS.
- ملاحظتان للجولات القادمة: نص زر CTA أبيض-على-أبيض في المعاينة مع bgColor داكن (يستحق إصلاحاً)، وسمة style مكررة في غلاف secvars المُصدَّر (تجميلي).

---
Task ID: 12-c
Agent: full-stack-developer
Task: إصلاح خللين اكتشفهما تحقق E2E للجولة 12: (1) نص زر بطاقة CTA أبيض-على-أبيض في المعاينة عند bgColor داكن، (2) سمتا style مكررتان في HTML المُصدَّر من غلاف secvars+reveal.

Work Log:
- قراءة worklog (12-a/12-b) والمواصفة وكل ملف قبل تعديله: cta-block, banner-block, hero-block, p-button, shared, prototype-renderer, generate.ts (applyReveal/wrapSectionVars/sectionVarsStyle/siteShell/renderCta/renderBanner/sectionWrap).
- تحديد السبب الجذري بالإزاحات من CSS المُجمَّع: `text-[#16121f]` (بايت 93081) يسبقه `text-[var(--pt-primary-fg)]` (93263) و`text-[var(--pt-text)]` (93338) فيتلقّى الزر الأبيض نصاً من var(--pt-*)، بينما `bg-white` (74807) يغلب خلفيات var (60xxx) — و`text-white` (97979) يغلب الجميع (البطل سليم لذلك).
- اكتشاف أن banner-block يحمل النمط المطابق حرفياً: زر الشريط الأبيض بمتغير primary افتراضي → نصه كان var(--pt-primary-fg)=#ffffff على أبيض **في الحالة الافتراضية أصلاً** (كل المشاريع) — أُصلح مع CTA.
- cta-block.tsx + banner-block.tsx: حذف صنف text-[#16121f] الخاسر وتمرير `style={{ color: '#16121f' }}` للزر الأبيض عند textDark (inline يغلب التتالي دائماً) — bg-white/hover كما هما. تعليق تفسيري عربي في كل موضع.
- hero-block.tsx: فُحص ولم يُمس (text-white يفوز التتالي على bg-white/10 شفاف — لا نص غير مرئي ممكن). مسح كل blocks: لا صراع bg-white+var آخر يمكن أن يخفي نصاً (الباقي زخرفي أو تبديل شرطي كامل).
- generate.ts — applyReveal فقط: عند delay>0 يدمج `transition-delay:…ms;` في مقدمة سمة style موجودة في رأس الوسم الأول (غلاف pt-secvars أو خلفية صورة القسم) بدل إضافة سمة ثانية؛ بلا style موجودة يضيف سمة كما كان؛ delay=0 بلا سمة. يشفي أيضاً أقسام صور الجولة 9 التي كانت تُصدَّر بسمتين عند delay>0.
- التصدير لم يُمس غير applyReveal: زرّا CTA/Banner المُصدَّران (pt-btn--on-dark) وبطاقة blk-cta__card--secvar بتدرّجها كما هما حرفياً.

Verification:
- tsc --noEmit: صفر أخطاء في src/ (أخطاء examples/+skills/ الموجودة أصلاً فقط). lint: صفر أخطاء (تحذير الخطوط وحده).
- متصفح حقيقي (دخول تجريبي → «موضة الجزائر»): غلاف secvars --pt-text:#ffffff وخلفية rgb(17,24,39) قائمة، وزر CTA «إنشاء حساب مجاني» computed color = rgb(22,18,31) على rgb(255,255,255) — tool-results/r12-fix-cta.png (+تحقق بكسلي للتسمية الداكنة).
- «متجرتي»: زر الشريط «تسوّق الآن» أبيض بنص rgb(22,18,31) inline — tool-results/r12-fix-banner.png؛ زر البطل الأخضر primary لم يتغير.
- التصدير (curl بالكوكي → ZIP 61KB): صفر وسوم بسمتَي style؛ الغلاف المدمج `<div class="pt-reveal pt-secvars" style="transition-delay:120ms;--pt-bg:#111827;…;background:#111827">` سمة واحدة تجمع المتغيرات والتأخير؛ أغلفة 60ms/120ms الأخرى سليمة.
- dev.log نظيف (كل الطلبات 200)، agent-browser errors فارغ.

Stage Summary:
- زر CTA/الشريط الأبيض في المعاينة مقروء دائماً (نص داكن #16121f inline) مهما كانت --pt-text/--pt-primary-fg — إصلاح يتالي Tailwind جذري وليس ترقيعاً.
- HTML المُصدَّر صالح: لا سمة style مكررة، وتأخير الظهور محفوظ داخل سمة secvars نفسها (وأقسام الصور شُفيت ضمناً).
- لا انحدارات: images/wash/export ZIP/strip-after-download/الأنماط الأصلية كلها كما في الجولات 7-12.


---
Task ID: 12-d
Agent: main agent (Z.ai Code) — إغلاق الجولة

Task: إغلاق جودة الجولة 12 (ألوان الخطوط + ألوان الأقسام) بعد التنفيذ (12-a) والتحقق (12-b) وإصلاح خللين (12-c).

Work Log:
- مسح ذهبي كامل بمتصفح حقيقي (agent-browser، 1440×900): فتح / → «تسجيل الدخول» → «تجربة سريعة بدون تسجيل» → لوحة المستخدم التجريبي → فتح مشروع «موضة الجزائر» في الباني (تحمّل كامل بالصفحات الثماني ومكوناتها).
- (a) الباني والمعاينة: غلاف القسم div.pt-secvars يحمل ‎--pt-bg:#111827‎ وخلفية rgb(17,24,39) وبطاقة CTA بتدرّج linear-gradient(#111827,#0f1522)؛ زر «إنشاء حساب مجاني» أبيض rgb(255,255,255) بتسمية داكنة rgb(22,18,31) inline — إصلاح 12-c قائم والنص مقروء بوضوح — r12-final-01/02.png.
- (b) لوحة «التصميم»: قسم «ألوان الخطوط» حاضر بلون الخط الأساسي #3b82f6 والثانوي #6b7280 مع زرَي «إعادة الضبط»؛ عناوين المعاينة زرقاء: 16 عنواناً rgb(59,130,246) وH1 كذلك، وعنوان CTA أبيض تلقائي على الأسود — r12-final-03.png.
- (c) وضع «معاينة» التفاعلي (طبقة fixed inset-0): H1 أزرق rgb(59,130,246)، CTA أسود بعنوان أبيض وزر أبيض بتسمية داكنة؛ نقر زر CTA داخل المعاينة تنقّل فعلياً إلى صفحة «إنشاء حساب» بعنوان أزرق — التفاعلية مؤكدة — ثم «خروج من المعاينة» — r12-final-04/05.png.
- (d) العودة لهبوط المنصة عبر قائمة المستخدم («حسابي» → «تسجيل الخروج» → حوار «هل تريد تسجيل الخروج؟» → «تسجيل الخروج»): حالة زائر سليمة؛ سطر التطوير «المنصة من تطوير يحي مسعود طالب دكتوراه في جامعة الجزائر 3» بالنص الحرفي مع filter:none وanimation:none وتدرّج ذهبي صافٍ بـ clip:text (بلا توهّج)؛ شعار SIVAR محمّل في الشريط (naturalWidth>0) — r12-final-06/07.png.
- بوابات الجودة: npx tsc --noEmit صفر أخطاء في src/ (أخطاء examples/+skills/ الموجودة أصلاً فقط)؛ bun run lint صفر أخطاء (تحذير الخطوط القديم وحده)؛ ذيل dev.log نظيف — كل الطلبات 200 بما فيها POST /api/auth/logout، لا أخطاء؛ agent-browser errors فارغ والكونسول بلا أخطاء.
- التنظيف: فحص جذر المشروع — لا ملفات tmp-*.ts ولا ZIP خارج tool-results (r10-export2.zip موضعه الصحيح)، وسكربت الجولة 9 المؤقت محذوف أصلاً (.zscripts فيها سكربتات البنية وdev.pid للخادم العامل — لم تُمس)، والوحيد tsconfig.tsbuildinfo (ذاكرة tsc المتجاهَلة في gitignore، تتجدد آلياً) — لا شيء يستحق الحذف؛ db/ وupload/ وagent-ctx/ وtool-results/ وworklog.md لم تُمس.
- لم يُعدَّل أي ملف مصدر في هذه المهمة (فحص وتوثيق فقط).

Stage Summary:
- الجولة 12 مغلقة بنجاح كاملاً: ألوان الخطوط (لوحة التصميم + الوكيل الذكي + التصدير) وألوان كل قسم مع نص تلقائي مقروء بالسطوع تعمل طرفا-إلى-طرف، وإصلاحا 12-c (تسمية زر CTA/الشريط الأبيض + سمة style المكررة) قائمان في المسح النهائي.
- المسح الذهبي (a-d) ناجح بالكامل، البوابات الثلاث خضراء، الجذر نظيف بلا مخلفات — لا انحدارات على جولات 7-11 (الشعار، السطر الذهبي النظيف، الأزرار، الصور، التصدير).
- مشروع «موضة الجزائر» التجريبي أُبقي كعرض حي للجولة 12 (خط أزرق #3b82f6 + CTA أسود #111827 محفوظان).

---
Task ID: 13
Agent: main-agent (Z.ai Code)
Task: الجولة 13 — إدراج الصفحات الجديدة تلقائياً في الشريط الجانبي للوحة التحكم عند التعديل عليها (طلب المستخدم: «مثلا عند اضافة صفحة هي لا تظاف في الشريط الجانبي للوحة التحكم مثلا اضافة أعظاء الفريق للوحة التحكم، هذه نقطة يجب اضافتها عند التعديل على لوحة التحكم، احرص على أن يكون هذا الجزء دقيقا حتى لا يحدث خلط بين العناصر»)

Work Log:
- تشخيص الجذر: addPageToSchema (المسار المشترك للوكيل والمحرر) يضيف الصفحة دون لمس dashboardNav — فتبقى صفحات منطقة اللوحة (dashboard/table/form/settings/profile) بلا مدخل في الشريطها الجانبي؛ وبugs دقة مصاحبة: sanitize لـ update_dashboard_nav كان يسطّح كل الأيقونات إلى file-text، وإعادة تسمية الصفحة لا تزامن عنوان الشريط.
- src/lib/project/tools.ts (المحرك الدقيق): DASHBOARD_AREA_TYPES + isDashboardAreaPage + ENTITY_NAV_ICON + dashboardNavIconFor (أيقونة لكل نوع/كيان مطابقة لاصطلاح القوالب) + insertDashboardNavItem (لا تكرار؛ صفحات dashboard تُدرج بعد آخر عنصر لوحة؛ البقية في النهاية) — يُستدعى من addPageToSchema و addHtmlPageToSchema(placement=dashboard)؛ + ensurePageInDashboardNav + syncPageNavigation (تصدير) و syncPageInDashboardNav (خاص).
- applyActions: رسالة create_page تذكر الإدراج في الشريط («تمت إضافة صفحة «X» وإدراجها في الشريط الجانبي للوحة التحكم»)؛ update_page يزامن عنوان عنصر الشريط + أيقونته وعناصر قائمة الموقع لنفس الصفحة فقط؛ updateDashboardNavInSchema: حذف تكرار pageId + احتياط أيقونة (المعطاة ← أيقونة العنصر القائم ← المشتقة من نوع الصفحة).
- src/lib/project/factory.ts: الصفحات المقترحة من التحليل تُدرج في الشريط (schema.dashboardNav = next.dashboardNav) + تنظيف مراجع التنقل بعد إزالة تكرار الكيانات.
- src/lib/server/agent.ts: موجّه النظام — قاعدة الأنواع الخمسة للإدراج التلقائي + مثال «أعضاء الفريق» → table/teamMembers + تحذير update_dashboard_nav (يستبدل القائمة كاملة) + قاعدة ذكر الإدراج في الشرح؛ sanitizeDashboardNavItems جديد بقائمة أيقونات مقبولة (NAV_ICON_WHITELIST) بلا سطّح؛ البديل الاستدلالي: فروع جديدة (إزالة من الشريط/إضافة صفحة قائمة إلى الشريط/إنشاء صفحة كيان بلا كلمة «صفحة») + pageIntentFromText بكيانات جديدة (أعضاء الفريق/المستخدمون/الخدمات/الدورات/الطلاب/العقارات/المواعيد/الاشتراكات/المعاملات) + إصلاح اشتراك(?!ات) + توسيع extractAfterPageKeyword.
- src/app/api/projects/[id]/agent/route.ts (autoFix): إعادة ملء الشريط عند فراغه بأنواع منطقة اللوحة كاملة (شاملة form) بأيقونات dashboardNavIconFor بدل file-text الموحّدة.
- src/lib/export/generate.ts: أيقونات SVG جديدة (layout-dashboard/shopping-cart/calendar-days/graduation-cap/building/utensils/clipboard-list) + الشريط الجانبي المُصدَّر يعرض أيقونة كل عنصر (16px سطح مكتب / 15px شريط الجوال) بدل النقاط — تطابق تام مع عارض React.
- src/components/builder/pages-panel.tsx: toast الشرطي (pageAddedSidebarToast) للصفحات المُدرجة في الشريط + إعادة تسمية المحرر تمر عبر syncPageNavigation (مزامنة الشريط وقائمة الموقع)؛ i18n/builder.ts: مفتاح جديد.
- E2E (agent-browser، 1440×900): دخول تجريبي → «موضة الجزائر» → الوكيل: «أضف صفحة أعضاء الفريق للوحة التحكم» → الصفحة table/teamMembers أُنشئت وأُدرجت آخر الشريط (لوحة التاجر | المنتجات | الطلبات | العملاء | الإعدادات | الملف الشخصي | أعضاء الفريق) بأيقونة Users في DOM والخادم (navCount=7, icon=users)؛ تصدير ZIP → مجلد أعضاء-الفريق + الشريط بكل العناصر بأيقونات SVG (لوحة التاجر=layout-dashboard، أعضاء الفريق=Users) + pills الجوال؛ حذف الوكيل → الشريط عاد 6 عناصر بلا يتامى؛ إعادة تسمية «العملاء→زبائن المتجر→العملاء» تزامنت في موضعها دون مساس بالجيران؛ مسار المحرر (إضافة صفحة Table/teamMembers من نافذة إضافة صفحة → الشريط؛ حذف من لوحة الصفحات → الشريط نظيف)؛ الجوال 390×844: pills الستة ظاهرة والشريط الجانبي مخفي؛ لقطات r13-sidebar.png و r13-mobile.png و r13-export.zip في tool-results.
- البوابات: npx tsc --noEmit صفر أخطاء في src/؛ bun run lint صفر أخطاء (تحذير الخطوط القديم وحده)؛ ذيل dev.log نظيف — كل الطلبات 200 (agent ×7, export, versions)؛ agent-browser errors فارغ. المشروع التجريبي أُعيد لحالته الأصلية (11 صفحات، 6 عناصر شريط بأيقوناتها الدقيقة).

Stage Summary:
- الصفحات الجديدة من أنواع منطقة لوحة التحكم (dashboard/table/form/settings/profile) تظهر الآن في الشريط الجانبي فور إنشائها — من الوكيل الذكي أو المحرر أو مشروع جديد من التحليل — بعنوان مطابق وأيقونة دقيقة، بلا تكرار ولا خلط مع العناصر القائمة.
- دقة العناصر صارت محفوظة عبر الدورة الكاملة: إنشاء (إدراج) ← إعادة تسمية (مزامنة العنوان والأيقونة في موضعها) ← تغيير كيان (أيقونة تتبع الكيان) ← حذف (تنظيف فوري)؛ وupdate_dashboard_nav لم يعد يسطّح الأيقونات ويمنع تكرار الصفحات.
- التصدير مطابق للمعاينة: أيقونات SVG لكل عنصر في الشريط الجانبي وأشرطة الجوال، وكيان teamMembers («أعضاء الفريق») مثال مرجعي يعمل طرفا-إلى-طرف.
