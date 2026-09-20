# Task 7-b — Prototype Renderer Upgrades (prototype-renderer agent)

**Task ID:** 7-b
**Agent:** prototype-renderer agent
**Scope:** `src/components/prototype/blocks/hero-block.tsx` + `blocks/custom-html-block.tsx` (new) + `prototype-renderer.tsx` + `theme-provider.tsx` (keyframes only) — nothing else touched.

## Work Log

1. **hero-block.tsx** (upgraded, contract of Task 7-a honored):
   - `eyebrow` — pill badge above the h1 (`rounded-full border px-3.5 py-1.5 text-xs font-semibold`); light bg → `--pt-border/--pt-secondary/--pt-text`, dark/gradient → `border-white/25 bg-white/10 text-white`. Rendered only when non-empty.
   - `visual` — safe getter with whitelist, default `'dashboard'` (backward compatible: legacy heroes without the prop render identically):
     - `dashboard` → existing HeroVisual untouched.
     - `phone` → new `PhoneVisual`: `rounded-[28px]` frame, `aspect-[9/19]`, `max-w-[280px]` centered, top notch bar, app header (avatar dot + 2 text bars), 2 stat mini-cards, 6-bar chart (`--pt-primary`/`--pt-accent` with varying height/opacity), bottom pill button (`--pt-primary` + `--pt-primary-fg` label bar), same halo/glow treatment as HeroVisual, `role="img"` + `aria-label="رسم توضيحي لتطبيق الهاتف"`.
     - `video` → new `VideoVisual`: wide 16:9 card (`--pt-surface`, border, `--pt-shadow`), subtle `linear-gradient` wash from `--pt-secondary`, centered 64px circular play button (`--pt-primary`) with white ▶ triangle (CSS borders — `border-inline-start` on a `dir="ltr"` span so it provably points right in the RTL scope), 2 caption skeleton lines, halo circles behind, `aria-label="بطاقة فيديو توضيحية"`.
     - `form` → no side visual; `EmailCapture` inside the text column below the buttons: `flex w-full max-w-md flex-col gap-2 sm:flex-row` row with a decorative input-like div (`dir="ltr"`, `text-start`, `min-h-11`, non-focusable) + `PButton` (emailButton); below it social-proof row: 3 overlapping `PAvatar` circles (أ/س/ي, `size-8`, `-ms-2`, ring) + «انضم إلى 2,400+ مهتم». Dark-bg styling `border-white/30 bg-white/10 text-white`.
     - `none` → no visual; text column uses the centered markup `mx-auto max-w-2xl` while still honoring `align`.
   - `titleSize` — md → `text-3xl md:text-5xl` (existing), lg → `text-4xl md:text-6xl`, xl → `text-5xl md:text-7xl tracking-tight`.
   - `emailPlaceholder`/`emailButton` only for `visual==='form'`, empty-fallbacks «بريدك الإلكتروني»/«سجّلني»; email button reuses the primary-button `navigate()` (no-op in non-interactive renders).
   - Layout: side visual only in split layout for `dashboard|phone|video`; `form|none` → text-only; centered layout keeps NO side visual, EXCEPT `video`/`phone` stack below the text column (see Deviation 1).
2. **custom-html-block.tsx** (new) — same file pattern as other blocks ('use client', `S/N` readers, `ReactElement`):
   - `name`/`html`/`height` props; height clamped 100..4000 (default 560).
   - Non-interactive (mini previews, builder canvas) → lightweight dashed placeholder (`border-2 border-dashed`, `--pt-secondary` bg, same height) with `Code2` icon, «كود HTML مخصص» and `‏{html.length} حرفاً` (RLM-prefixed mono line) — zero iframes in thumbnails.
   - Interactive → `<iframe srcDoc={html} sandbox="allow-scripts allow-popups allow-forms">` (NO allow-same-origin → opaque origin, isolated from the platform page), `loading="lazy"`, `title`, inline clamped height, wrapped in a relative div.
3. **prototype-renderer.tsx**:
   - `case 'custom-html'` → `<CustomHtmlBlock key={block.id} block={block} ctx={ctx} />` in renderBlock.
   - Logo support (`ctx.schema.branding?.logo`): SiteShell header brand button → `<img h-8/h-9 max-w-[120px] object-contain loading="lazy" decoding="async">` instead of square+text (click-navigation to home preserved); footer brand row → logo img (h-7) with demo badge kept; footerNote block → tiny h-6 logo above the note; DashboardShell sidebar + mobile top bar → logo img (h-8 / h-7). AuthShell untouched (not in spec).
   - Rise animation: interactive non-outline blocks wrapped in `<div class="pt-rise" style="animation-delay:{min(index,6)*60}ms">`; outline mode untouched (selection wrappers, pointer-events-none inner, label chip all intact).
4. **theme-provider.tsx** — injected `<style>` with `@keyframes pt-rise` + `.pt-rise` (`.5s cubic-bezier(.22,.61,.36,1) both`) inside PrototypeThemeScope.

## QA

- `bunx tsc --noEmit`: 0 errors in src/** (only the 4 pre-existing examples/ + skills/ errors). My 4 files clean.
- `bun run lint`: 0 errors / 0 warnings from my files (1 pre-existing layout.tsx font warning — main agent's).
- SSR smoke (temp script, deleted after): **45/45 checks passed** — all 12 variants × interactive/static (pt-rise present/absent, stagger delays), hero kind coverage (phone frame/aria, email social proof + placeholder + button, stacked video card + play triangle, eyebrow on dark+light, titleSize md/lg/xl), `buildLandingBlocks` on a schema with auth page (primaryButtonPage wired), custom-html iframe vs placeholder vs height clamps (100/4000), branding logo in SiteShell (3 imgs, lazy/async, badge kept) + DashboardShell, outline mode intact, legacy hero (no new props) renders the dashboard visual with md title and no eyebrow/email form.
- Visual QA (agent-browser + VLM on a generated smoke page, deleted after): 7 sections all PASS — phone mockup, email capture + avatars, video card, dark eyebrow, logo header/footer/footerNote, dashed placeholder, sandboxed iframe rendering its gradient HTML. Play triangle direction verified via DOM computed styles (`dir:ltr`, `borderLeft:17px/solid`, right 0, y-borders transparent → ▶ points right); VLM misread it once — computed-style evidence is conclusive.

## Deviations / Notes

1. **centered + video/phone stack below text**: the pinned 7-a landing-kit `video-lead` variant uses `layout:'centered'` + `visual:'video'` — hiding the visual in centered layout (old behavior) would make the "video hero" variant render with NO video. So in centered layout the new `video`/`phone` visuals render stacked under the text column (in-flow, not a side visual); `dashboard` stays hidden in centered (backward compat for every pre-7-b centered hero). This is the only reading that satisfies both the 7-a contract and "no side visual in centered".
2. Play triangle = `border-inline-start` colored on a `dir="ltr"` span (uses border-s as specified AND guarantees ▶ regardless of the surrounding RTL).
3. Footer brand row also swaps square+text → logo image; demo badge («بيانات تجريبية») preserved everywhere.
4. custom-html shows the placeholder in the BUILDER canvas too (ctx.interactive=false there by design) — iframes render only in live preview (`interactive`); keeps thumbnails/outline cheap. 7-e can rely on this behavior.
5. `iframe` `bg-white` gives user HTML a clean canvas per spec; sandbox deliberately omits `allow-same-origin` (srcDoc content cannot touch platform DOM/cookies).
