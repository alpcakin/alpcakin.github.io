# alpcakin.com: Economy Blog → Developer Portfolio (with Blog as a Section)

> Status: implemented (2026-07-20). Companion doc: [`portfolio-redesign-qa.md`](./portfolio-redesign-qa.md) has the full requirements interview this plan was built from. See `CLAUDE.md` → "Issues encountered" for what changed after this plan was written (light-theme repaint, site search removal).

## Context

alpcakin.com is currently a personal economics blog (Astro v6 + Tailwind v4) that also quietly hosts the legal/deep-link infrastructure for a separate mobile app, Veresiye. Alp wants to repurpose it into a **developer portfolio** that reads as a premium, professionally-branded site — strong enough to convince both recruiters (full-time hiring) and non-technical prospects (freelance/contract work) that "this person builds real products." The economics/macro writing stays, but demoted to a secondary "Blog" section rather than the homepage.

This plan was produced after an extensive requirements interview (see [`portfolio-redesign-qa.md`](./portfolio-redesign-qa.md)). All content/scope decisions below come directly from that interview or from Alp's CV and a live look at bayerpos.com — not invented.

**Key finding from codebase exploration:** the site already has a well-built premium dark aesthetic (aurora-orb glows, cursor-follow radial gradient, gradient "glow-text" headlines, glassmorphic pill badges, color-mix-based theming, `prefers-reduced-motion` handling throughout). The redesign should **extend this existing visual language**, not replace it — this drastically reduces risk/scope versus a ground-up redesign, and keeps a consistent codebase style.

## Decisions Locked In (from the interview)

- **Positioning:** Full-Stack / Web & App Developer is the primary identity (hero, nav, framing). Trading/macro-data background stays as a distinct, clearly-labeled secondary thread (About section + the Blog tab) — not deleted, not headline.
- **Projects (4, in this order of prominence):** this site, **Veresiye** (React Native + Supabase RPC), **Bayerpos** (TypeScript backend, PostgreSQL, Gemini 2.5 Flash for invoice OCR/AI, pgvector experience — Alp is a cofounder, POS system for Turkish tekel shops, bayerpos.com), **thesis project** "AI-Powered Financial Insights & Alert System" (FastAPI + Flutter + Supabase, ongoing). No images available yet — build image slots that degrade gracefully (icon/gradient placeholder), not broken `<img>` tags. The 3 small CV data-analysis projects are explicitly excluded.
- **No separate "Services" section** — the pitch is carried by the projects + hero, not a sales page.
- **Contact:** mailto + socials only. No form, no backend, no hosting migration — GitHub Pages stays.
- **Visual direction (superseded 2026-07-20):** originally "dark, minimal, premium" (Linear/Vercel/Stripe-adjacent). This was implemented, then replaced site-wide with a light "warm paper" editorial direction from a Claude Design handoff (Instrument Serif/Space Grotesk/Space Mono, electric-blue accent) — see the "Issues encountered" note in `CLAUDE.md` for the full pivot. Quiet-confidence tone still holds — no "Available for hire" badge; the work should do the convincing.
- **Light-only.** No theme toggle. (This reverses the original "dark-only" call below, which is left here for history — the site now defaults to the paper/ink palette in `src/styles/global.css`.)
- **Single-page portfolio** (Hero → Work → About → Tech Stack → Contact, anchor-based), with **Blog remaining a separate, multi-page section** (existing `/posts/` archive, post pages, tags, search, RSS — unchanged in mechanics).
- **Brand = the name "Alp Çakın"** typographically (already implemented via `.header-brand` / `.footer-brand` in Playfair Display) — no logo needed.
- **No downloadable CV/PDF** — the site itself is the CV.
- **About copy is prose**, not a timeline.
- **Tech Stack section**: yes, a dedicated visual list/grid of skills.
- **Turkish removal:** delete `blog-tr` collection, `/tr/` routes, and the header/mobile-menu language toggle. **Do not touch** `aydinlatma-metni.html`, `kullanim-kosullari.html`, `veri-silme.html`, or `public/.well-known/*` — these are required for the Veresiye app's store compliance and are independent of site language. They simply won't be linked from the new nav.
- **No case-study sub-pages** — each project is a strong self-contained card on the homepage.
- **Design references:** Linear, Vercel, Stripe (turbolaw.ai mentioned approvingly but no visual detail could be pulled from it — treated as directional confirmation only, not a spec).
- **Animation/interaction polish is left to Claude's judgment** — extend the existing hand-rolled aurora/glow/scroll-reveal style already in the codebase; no new dependency (no GSAP/Framer Motion) since the current code proves this team is comfortable doing tasteful vanilla-JS/CSS motion, and adding a library for what IntersectionObserver + CSS transitions already cover would be unjustified weight for a static portfolio.

## Site Map After the Change

```
/                    → NEW single-page portfolio (Hero, Work, About, Tech Stack, Contact)
/posts/, /posts/N/   → unchanged blog archive (existing pagination; Pagefind search removed 2026-07-20, see CLAUDE.md)
/posts/[...slug]/    → unchanged individual post pages
/tags/, /tags/[tag]/ → unchanged
/search/             → unchanged
/rss.xml, /og.png, /robots.txt, sitemap → unchanged
/about                              → REMOVED (folded into `/#about`)
/tr/*, blog-tr content              → REMOVED
/aydinlatma-metni.html, /kullanim-kosullari.html, /veri-silme.html,
/.well-known/*                      → UNTOUCHED (Veresiye legal/app-link infra)
```

## Implementation Plan

### 1. Content collections & data (`src/content.config.ts`, `src/data/blog-tr/`)
- Remove the `blogTr` collection, `BLOG_TR_PATH`, and its export from `collections`.
- Delete `src/data/blog-tr/` entirely (the single TR post is dropped per Alp's decision, not translated).

### 2. Remove Turkish routes & about page
- Delete `src/pages/tr/` (the `[...slug]/index.astro` that renders `blogTr` via `PostDetails`).
- Delete `src/pages/about.md` and `src/layouts/AboutLayout.astro` (no longer used once About is a homepage section). Confirm nothing else imports `AboutLayout` before deleting (already checked — only `about.md` uses it).

### 3. Header / MobileMenu cleanup (`src/components/Header.astro`, `src/components/MobileMenu.astro`)
- Remove the language toggle block (desktop `#lang-toggle-desktop` and mobile `#lang-toggle-mobile`) and the `setupLangToggle()` script in `Header.astro`.
- Remove the light/dark `#theme-btn` / `#theme-btn-mobile` buttons and `IconMoon`/`IconSunHigh` imports (gated by `SITE.lightAndDarkMode`, which will be `false`).
- Replace the nav link list with anchor-based nav for the single page: **Work · About · Blog · Contact**, where Work/About/Contact are `/#work`, `/#about`, `/#contact` (resolving correctly from any page since they're absolute paths), and Blog points to `/posts/`. Keep the existing `nav-link` / `nav-active` visual treatment; active-state logic can stay pathname-based for Blog (`isActive("/posts")`) and simply not attempt scroll-spy for the anchor links (acceptable scope — no need for IntersectionObserver-based scroll-spy unless it's cheap to add, in which case add it as a nice-to-have, not a blocker).
- `header-brand` already renders `{SITE.author}` in Playfair Display — no change needed, this already satisfies the "name as brand" decision.

### 4. Kill the light theme / toggle mechanism
- `src/scripts/theme.ts`: delete the toggle machinery (`toggleTheme`, `setThemeFeature`, `#theme-btn` listeners, `matchMedia("prefers-color-scheme")` sync). Keep only what's needed to set `data-theme="dark"` once (or remove the data-theme attribute concept entirely and just hardcode dark tokens — see below).
- `src/styles/global.css`: collapse the `:root, html[data-theme="light"]` / `html[data-theme="dark"]` split into a single `:root` block using the current dark values (`--background:#0E0D0B`, `--foreground:#EAE5DC`, `--accent:#D4A843`, `--muted:#1A1815`, `--border:#2E2924`, `--muted-foreground:#9A9088`). Remove the `@custom-variant dark (...)` line since there's no more theme switching. **Reuse the existing dark palette as-is** — it already reads as premium/warm-gold-on-near-black, which fits the Linear/Vercel/Stripe direction while giving a distinctive accent color instead of a generic blue.
- `src/layouts/Layout.astro`: remove the inline FOUC-prevention theme script's light/dark branching (just needs `data-theme="dark"` set once, or nothing at all if CSS no longer branches on it) and drop `<script src="../scripts/theme.ts">` if nothing meaningful remains in it. Update the hardcoded `<meta name="theme-color" content="#A67C3A">` to the dark accent `#D4A843` (or the dark background color, matching what `reflectPreference` used to compute).
- `src/config.ts`: set `lightAndDarkMode: false`.
- Delete now-unused `IconMoon.svg` / `IconSunHigh.svg` if no longer referenced anywhere after the above (grep before deleting).

### 5. New homepage (`src/pages/index.astro`)
Rebuild as a single-page portfolio, reusing existing primitives (`Header`, `Footer`, `Socials`, `LinkButton`, the `app-layout`/`max-w-app` utilities, `.section-label`, `.glow-text`, badge/pill styles from `posts/[...page].astro`, aurora-orb decorative pattern) rather than inventing a new visual system:

- **`#hero`** — name + role headline ("Full-Stack Developer" framing per the locked positioning), one quiet supporting line, social icons (existing `Socials` component). No availability badge (per decision on tone). Subtle aurora/cursor-glow treatment consistent with the rest of the site.
- **`#work`** — 4 project cards (this site, Veresiye, Bayerpos, thesis project) as a new `ProjectCard.astro` component: title, one/two-line description, stack pills (reuse the `hero-badge`/tag-pill pattern), external link(s) where they exist (bayerpos.com; GitHub for this site's repo if public; no links yet for Veresiye/thesis — omit rather than dead-link), and an image slot that falls back to a gradient/icon treatment when no image is set (since Alp will add screenshots later — build the slot now, don't block on assets).
- **`#about`** — prose paragraph(s) migrated from the current `about.md` copy, rewritten to lead with the developer identity, and a clearly separated closing block introducing the trading/macro-writing side and linking to the Blog. Reuse the circular photo treatment from the old `AboutLayout.astro` (`/images/alp-cakin.jpeg`).
- **`#tech-stack`** — pill/grid list of technologies pulled from confirmed sources only: TypeScript, React Native, FastAPI, Flutter, Supabase, PostgreSQL, Python (Pandas/NumPy), SQL (PostgreSQL/PL-SQL, CTEs/window functions), Gemini 2.5 Flash / applied AI (OCR), pgvector, Git/GitHub, Astro/Tailwind (this site itself is proof). Grouped loosely (e.g. "Product & Backend" / "Data & AI") rather than a flat unlabeled wall.
- **`#contact`** — mailto (`alpcakin16@gmail.com`) + `Socials` again or a repeat of the social row, quiet framing consistent with the "let the work speak" tone.

Motion: add a small reusable scroll-reveal utility (IntersectionObserver toggling a `.is-visible` class that CSS transitions fade/translate on) applied to each section and project card, following the same cleanup-on-`astro:page-load`/`astro:after-swap` pattern already used in `Header.astro` and `posts/[...page].astro`. Respect `prefers-reduced-motion` (skip the observer, show content immediately) — matching the existing convention in `Layout.astro`'s cursor glow.

### 6. Site metadata (`src/config.ts`, `src/constants.ts`)
- Update `SITE.desc` to a developer-first description (currently purely economics-focused) — keep it accurate to the dual positioning (mentions building products; can reference the writing as secondary).
- `SITE.title` can stay `"alpcakin"`.
- No changes needed to `SOCIALS`/`SHARE_LINKS` in `constants.ts`.

### 7. Persist the plan + Q&A into the repo (done first, before any code changes)
- `docs/portfolio-redesign-plan.md` (this file).
- `docs/portfolio-redesign-qa.md` (the full requirements interview).
- Root `CLAUDE.md` referencing both, plus the Veresiye legal-page exception, the dark-only decision, the design-system-reuse note, and a seeded "issues encountered" log.

### 8. `.gitignore`
No new entries required — no new tooling/build output is being introduced (still Astro + GitHub Pages, no new package with its own artifact directory). Double-check after implementation in case a chosen approach needs one (e.g. if screenshots get an optimization step later).

## Explicitly Out of Scope Here
- Any project screenshots/images (Alp will add later; UI must degrade gracefully without them).
- Any content for a real "hire me" form or third-party service.
- Any change to the Veresiye legal pages or `.well-known` files.
- Any change to hosting/deployment (stays on GitHub Pages/Actions).

## Verification
- `pnpm dev` and manually walk the new homepage: hero → work → about → tech stack → contact, check anchor nav links from both `/` and from a `/posts/...` page.
- `pnpm build` (runs `astro check` first) to confirm the removed collection/routes don't break the build (watch for lingering references to `blogTr`, `/tr`, `/about`, `AboutLayout`).
- Confirm `/posts/`, a sample post, `/tags/`, and search still render correctly with the simplified single-theme CSS (no light-mode leftovers, no FOUC).
- Confirm `aydinlatma-metni.html`, `kullanim-kosullari.html`, `veri-silme.html`, and `.well-known/*` are byte-for-byte untouched and still reachable at their original URLs.
- Check `prefers-reduced-motion` behavior (DevTools emulation) disables the new scroll-reveal transitions.
- Run `pnpm lint` / `pnpm format:check`.
