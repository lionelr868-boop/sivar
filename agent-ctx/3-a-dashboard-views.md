# Task 3-a — Dashboard Views Agent (لوحة التحكم ومسار المشروع الجديد)

**Task ID:** 3-a
**Scope:** App shell + dashboard sections + templates library + components library + new-project golden flow + help + settings + their i18n modules.

## Files Created (14)

### i18n (Arabic only, flat `as const`)
- `src/lib/i18n/dashboard.ts` — shell nav/search/notifications/logout + home stats/empty + projects filters/delete
- `src/lib/i18n/templates.ts` — library title/filters/use-template + `ideaPrefix` ("قالب")
- `src/lib/i18n/help.ts` — 9 FAQ q/a (simple non-technical Arabic, mentions دج/ZIP/Netlify) + quick cards + no-answer
- `src/lib/i18n/settings.ts` — profile/appearance/language/data/account strings
- `src/lib/i18n/components.ts` — playground + widget demo strings + 4 Algerian demo names
- `src/lib/i18n/new-project.ts` — all 5 steps strings (idea/analyzing/review-edit/building/success)

### Components
- `src/components/platform/dashboard/dashboard-view.tsx` — App shell: right sidebar (BrandMark reuse + nav + primary CTA + user card + logout AlertDialog), sticky header (hamburger Sheet + w-64 search → Enter jumps to projects, ThemeToggle reuse, notifications Popover with 3 platform tips, avatar DropdownMenu w/ logout confirm), mobile bottom tab bar (5 tabs incl. accent "جديد" + "المزيد" full-menu Sheet with safe-area padding), section switcher via `store.dashboardSection` with AnimatePresence fade, scroll-to-top on section change, spinner gate when `!user`.
- `src/components/platform/dashboard/home-section.tsx` — "مرحبًا بك 👋 {name}" + question + primary CTA → 'new'; 4 stat cards (total / ready / draft+building / last project + timeAgo) with tinted icon squares (violet/emerald/amber/teal); last-6 projects grid; Rocket empty state; skeleton grid while loading.
- `src/components/platform/dashboard/projects-section.tsx` — header + count + create button, search input, status filter chips (الكل + 4 statuses), scrollable grid (`max-h-[calc(100vh-21rem)] overflow-y-auto`), per-card DropdownMenu → AlertDialog permanent-delete confirm → `store.deleteProject`. **Exports** `ProjectCard` (status badge tones: draft→secondary, building→amber, ready→emerald, downloaded→sky-400; icon via ProtoIcon; type badge; "آخر تعديل {timeAgo}"; pages/versions meta; معاينة ghost + فتح المشروع primary → `openProject`) and `ProjectCardSkeleton`, plus `SEARCH_QUERY_KEY` (sessionStorage handoff from header search; read once on mount then removed).
- `src/components/platform/templates-library/templates-view.tsx` — header + search + category chips (الكل + 14 actual categories from TEMPLATES); grid sm:2 lg:3 of cards: `TemplateMiniPreview` (aspect-4/3) + name/tagline/category Badge/pageCount + Collapsible "الصفحات" chips (names via one-time `buildTemplateSchema` map, memoized) + "استخدم هذا القالب" with per-card Loader2 loading → `api.createProject({ idea: "قالب {name}", templateId, name, type, analysis: null })` → `store.openProject`; try/catch + sonner error toast; empty state.
- `src/components/platform/components-library/components-view.tsx` — playground header (4 palettes بنفسجي/تركواز/كهرماني/وردي, font Select 3 Arabic fonts, radius Slider 0–24) building a live `ProjectTheme` → whole showcase wrapped in `PrototypeThemeScope`. Sections (pt-styled cards): **عناصر الواجهة** (PButton 4 variants × 3 sizes, PBadge 6 tones, PAvatar × 4 Algerian names, PAlert 4 tones, PTabsAuto live with content swap, PDropdown, PBreadcrumb, PPagination live page state) · **الحالات** (PEmptyState/PLoadingState/PErrorState side by side) · **الجداول والرسوم** (DataTableBlock entity `customers` with ctx built from `buildMockData('services')`, ChartBlock bar/line/donut from mock charts) · **أقسام الصفحات** (HeroBlock/FeaturesBlock/PricingBlock/FaqBlock/AuthCardBlock with `BLOCK_REGISTRY[type].defaults()` props). Note "هذه معاينة حية — نفس المكونات تُستخدم داخل مشاريعك".
- `src/components/platform/new-project/new-project-flow.tsx` — golden flow state machine with directional AnimatePresence: **idea** (big textarea min-h-40 text-lg, 10-char min hint, Collapsible extras: 8 toggleable type chips, audience input, 6 style chips, auto/custom colors with 3 color inputs) → **analyzing** (Loader2 + 3 staged texts @900ms, `api.analyzeIdea` parallel with min 2.4s) → **review** (analysis card: type Badge/audience/description + suggested-pages checklist with green CheckCircle2 + "هل تريد إنشاء هذا النموذج؟" + ابدأ البناء/تعديل الاقتراح; edit mode: name input + page checkboxes (≥1 enforced) + back) → **building** (4 staggered checklist items @700ms + `api.createProject({ idea, analysis(final), style, palette })` min 2.8s; on error frozen checklist + recovery button back to review) → **success** (spring check flash → `store.openProject` after 1.2s). Timers in refs + unmount cleanup. Back link "رجوع إلى المشاريع".
- `src/components/platform/help/help-view.tsx` — 3 quick cards (scroll+open the matching FAQ item via controlled Accordion + scrollIntoView), 9-FAQ Accordion (controlled, scroll-mt), bottom "لم تجد إجابتك؟" card with upcoming-feature hint + Badge "قريبًا" (no fake form).
- `src/components/platform/settings/settings-view.tsx` — profile card (name input + readonly email + idea textarea + save → `api.updateProfile` → toast + `store.init()` silent user refresh + success note), appearance card (light/dark selectable cards with static mini previews + next-themes setTheme + mounted guard via useSyncExternalStore), language card (العربية active chip; Français/English disabled chips + "قريبًا"), data card (دج currency + Europe/Paris timezone info), account card (logout AlertDialog).

## Deviations (documented)
1. `ProjectCard`/`ProjectCardSkeleton`/`SEARCH_QUERY_KEY` exported from `projects-section.tsx` and reused by `home-section.tsx` + `dashboard-view.tsx` — avoids creating files outside the spec'd list (identical card in both grids; delete menu only in projects).
2. Header search → projects section carries the query through sessionStorage (read once on mount, then cleared) since the store has no search field.
3. Building-step error: stays on the step (per spec) with frozen checklist + "رجوع للاقتراح" recovery button (avoids a dead-end screen).
4. Analyzing/building enforce minimum durations (2.4s/2.8s) so staged animations are visible even when API is fast.
5. Edit mode also offers "ابدأ البناء" directly (natural shortcut); review falls back to full suggestion if 0 pages selected.
6. Both mobile paths (hamburger + "المزيد" tab) open the same full sidebar Sheet.

## QA
- **SSR smoke render** (react-dom/server + zustand live-snapshot patch): all 7 sections, full shell × all 7 sections, loading gate, empty/loading variants — PASS (templates ≈ 748KB SSR due to 14 live mini previews — same technique as landing's 8).
- **Live API integration** (curl against dev :3000): demo login, POST /api/analyze, POST /api/projects (template path AND analysis path), GET list, DELETE, PATCH /api/auth/me — all 200 with the exact payload shapes used by my views; test projects deleted afterward.
- `bunx tsc --noEmit` scoped grep → 0 errors in my folders (pre-existing errors remain in `src/app/api/projects/route.ts` + `src/lib/server/agent.ts` — other agents').
- `bun run lint` → 0 errors (1 pre-existing layout.tsx font warning — main agent's). Fixed one react-hooks/rules-of-hooks error by renaming `useTemplate` → `createFromTemplate`.
- i18n cross-check script: every `t.*` reference resolves; zero hardcoded Arabic outside comments (regex-audited).
- `dev.log` tail: clean compiles, GET / 200, no errors from my files.
