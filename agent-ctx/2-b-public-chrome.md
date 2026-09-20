# Task 2-b — Public Chrome Agent (Landing / Auth / Onboarding)

## Task
Build the public-facing chrome of "نموذج" (Namudhaj) platform:
- i18n modules: `landing.ts`, `auth.ts`, `onboarding.ts` (Arabic, simple modern tone)
- `src/components/platform/landing/landing-view.tsx` + 8 subcomponents
- `src/components/platform/auth/auth-view.tsx`
- `src/components/platform/onboarding/onboarding-view.tsx`

## Work Log
1. Read worklog.md + pinned contracts (types.ts, app-store.ts, api-client.ts, layout.tsx, globals.css, i18n/common.ts, i18n/index.ts).
2. Filled the 3 i18n stubs with complete Arabic strings (flat `as const` objects). No Arabic hardcoded in components (verified via regex audit — Arabic appears only in comments).
3. Landing (9 files): navbar (sticky/blur/Sheet/dark-mode toggle via next-themes), hero (exact required subtitle, text-gradient H1, browser-chrome BuilderMock with pages sidebar + mini landing + AI chat panel + 6s float loop), trust strip (4 chips), how-it-works (4 numbered cards + dashed connector + animated example chips with stagger), templates (grid of 8 using TEMPLATES + TemplateMiniPreview per pinned contract from 2-a), FAQ accordion (5 items — created because navbar links to #faq), gradient CTA, footer (mt-auto, no fake socials).
4. Auth: max-w-md card on bg-dots; Tabs login/signup; forgot-password mode swap with local success message; prominent Zap demo button → store.demoLogin(); full validation (required + email regex + min lengths); error banner; loading spinners; 44px touch targets; password eye toggle.
5. Onboarding: 4-step wizard (name / 8 type cards / idea textarea (optional, skippable) / 6 style cards with color dots), Progress bar + step indicators with check marks, AnimatePresence directional transitions, finish → store.completeOnboarding({name, projectType, idea, style}) with optimistic success card (no confetti).
6. Store wiring: setView('auth') for all CTAs; template/help links → user ? setDashboardSection(...) : setView('auth'); login/signup/demoLogin/completeOnboarding with try/catch error display.
7. Fixed lint error: replaced `useEffect+setState` mounted-hack in ThemeToggle with `useSyncExternalStore` hydration check (react-hooks/set-state-in-effect rule).
8. Verified: `bun run lint` → 0 errors (1 pre-existing warning in layout.tsx, main agent's file); `bunx tsc --noEmit` → only the 2 EXPECTED unresolved imports to 2-a's not-yet-created files; SSR smoke test of all 9 non-templates views → all render clean (test deleted after).

## Stage Summary
- Files created: 12 (3 i18n + 9 components). All within scope; no files outside scope touched.
- Known pending: `templates-section.tsx` imports `@/lib/project/templates` + `@/components/prototype/template-mini-preview` (2-a, in parallel) — compile resolves once 2-a lands them. Left exactly as pinned contract requires.
- Dev log: no compile errors from my files.
- Work record appended to `/home/z/my-project/worklog.md`.
- NOTE: system `/agent-ctx` was not writable → record kept at `/home/z/my-project/agent-ctx/2-b-public-chrome.md`.
