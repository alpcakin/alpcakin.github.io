# Portfolio Redesign — Requirements Interview

> Full record of the Q&A session that produced [`portfolio-redesign-plan.md`](./portfolio-redesign-plan.md). Kept verbatim-in-substance so a future session doesn't have to re-derive these calls or re-ask Alp the same questions.

## Starting Request

Turn the economics blog at alpcakin.com into a personal portfolio site — needs to look and animate like a real brand, good enough that both recruiters and non-technical people who want to pay for dev work come away thinking "this person can build it." The economics blog should remain, but as a tab/section rather than the homepage. Turkish version should be dropped — English only, no auto-translate based on visitor location (e.g. visiting from Turkey).

## Decisions (Q → A)

1. **Ana pozisyon (primary identity):** Full-Stack / Web & App Developer — not Data Analyst/Engineer, not an even split. Hero and the whole site are built around this.
2. **Trading/data identity:** Not deleted. Kept as a clearly separate, visible section — "also a funded forex trader, writes about macro" — consistent with the Blog tab, not folded into the developer pitch.
3. **Showcase projects (locked to exactly 4, in this order):**
   - **This site** (alpcakin.com) — portfolio + blog.
   - **Veresiye** (mobile app) — stack: **React Native + Supabase (RPC functions)**. Legal/app-link infra already lives on this domain.
   - **Bayerpos** — bayerpos.com. Offline-first POS system for small Turkish retail shops ("tekel"), ₺400/mo, credit-account ("veresiye defteri") feature, invoice OCR listed as "coming soon" on the live site. Alp is a **cofounder**. His part: OCR/AI implementation for invoice reading, database, backend. Stack he worked in: **TypeScript, PostgreSQL, Gemini 2.5 Flash** (OCR/AI), has **pgvector** experience (not in the current implementation — mention as experience only, not as something Bayerpos currently uses).
   - **Thesis project** — "AI-Powered Financial Insights & Alert System," ongoing, full-stack fintech app with real-time market data processing and automated alerts. Stack: **FastAPI + Flutter + Supabase**.
   - No images exist yet for any of these — design must degrade gracefully without them (not literally broken image tags), images to be added later.
   - Three smaller CV data-analysis projects (Global Demographic Trends Analysis, Netflix Content Analysis, ClassicModels BI) were explicitly **excluded** — only the 4 above appear.
4. **Services section:** No separate "Services" section — the sell is carried implicitly by the projects and hero, not an explicit sales page.
5. **Contact method:** Simple mailto + social links. No contact form, no backend/third-party form service, no hosting migration — stays static on GitHub Pages.
6. **Visual direction:** Dark, minimal, premium — Linear.app / Vercel.com / Stripe.com register. (Alp also likes turbolaw.ai's general direction, but no visual detail could be scraped from it — treated as a soft confirmation of the same direction, not a separate spec.) Big headings, restrained/elegant scroll-reveal motion, generous whitespace, minimal color.
7. **Theme:** Dark-only. No light/dark toggle.
8. **Page structure:** Single-page scroll for the portfolio (Hero/Projects/About/Contact in one page, nav uses anchor/smooth-scroll).
9. **Brand identity:** No separate logo or brand name — "Alp Çakın" the name itself is the brand/wordmark. (Already matches the existing `.header-brand`/`.footer-brand` styling in Playfair Display.)
10. **CV/Resume:** No downloadable PDF — the site itself functions as the CV.
11. **About/Experience format:** Flowing prose, not a structured CV-style timeline — matches the tone of the current `about.md`.
12. **Tech stack display:** Yes, wants a dedicated "Tech Stack" section/strip.
13. **Small CV projects:** Confirmed excluded (see #3).
14. **Veresiye stack:** Confirmed — React Native + Supabase (RPC).
15. **Bayerpos stack:** Confirmed — TypeScript, PostgreSQL, Gemini 2.5 Flash, pgvector (experience, not in current implementation).
16. **Veresiye legal pages** (`aydinlatma-metni.html`, `kullanim-kosullari.html`, `veri-silme.html`, `public/.well-known/*`): Leave completely untouched — required for Veresiye's Google Play/App Store compliance, independent of the main site's language/positioning. They just won't be linked from the new nav.
17. **Blog visual identity:** Keep the editorial serif feel (Playfair Display), carried into the dark palette — the blog should read as its own "chapter"/section, distinct in feel from the more "product/dev" rest of the site, while sharing the same color tokens for overall cohesion.
18. **CTA/Hero tone:** Calm and indirect. No "Available for work" badge — strong project work should do the convincing on its own. Contact info still easy to find, just not pushed as a sales badge.
19. **Turkish blog post fate:** The single post under `blog-tr` is deleted outright, not translated/migrated to English.
20. **Project presentation:** No per-project case-study pages (e.g. `/work/bayerpos`) — each project is a strong card on the single homepage, structured so it can be expanded into a full case study later if desired.
21. **Design references:** Linear, Vercel, Stripe, turbolaw.ai (general direction only, see #6).
22. **Animation/interaction specifics:** None requested — Alp explicitly left animation and interaction detail to Claude's judgment, given the "dark, minimal, premium" direction is already established.

## Facts Pulled From Research (not asked, verified directly)

### From the existing codebase
- Stack: Astro v6, Tailwind CSS v4, Pagefind search, GitHub Pages + GitHub Actions deploy.
- The site already implements a cohesive premium-dark visual language: aurora-orb radial-gradient decorations, a global cursor-follow glow, gradient "glow-text" headline treatment, glassmorphic pill/badge components, all built on CSS custom properties + `color-mix()`, with `prefers-reduced-motion` handled consistently. The redesign plan leans on reusing this rather than inventing a new visual system.
- The dark theme's existing palette (`--background:#0E0D0B`, `--foreground:#EAE5DC`, `--accent:#D4A843` warm gold, `--muted:#1A1815`, `--border:#2E2924`) was judged (by Claude, not asked) to already fit the "premium dark" brief well and was kept as-is rather than inventing a new palette.
- `theme.ts`/`SITE.lightAndDarkMode` already default to dark; only the toggle/light-theme machinery needs removing, not the base palette.
- Old `about.md`: Alp Çakın, CS Engineering student at University of Pécs (Hungary), graduating January 2027; funded forex trader with The5ers; leaning toward data analysis/engineering career at the time it was written. Socials: GitHub (`alpcakin`), Substack (`@alpcakin`), LinkedIn (`alp-cakin`), `alpcakin16@gmail.com`.
- Blog: 5 English posts (Iran-USA War, BIST analysis, Japan's debt crisis, Turkey stagflation analysis, demographic/fertility piece), 1 Turkish post under `blog-tr` (deleted per #19).
- The `/posts/` archive already has a fairly premium build (aurora hero, inline Pagefind search, glassmorphic empty state) — this was reused as a pattern reference for the new homepage rather than redesigned from scratch.

### From `Alp_CAKIN_CV.pdf`
- Title on CV: Computer Science Engineering Student.
- Technical skills listed: SQL (PostgreSQL, Oracle PL/SQL — CTEs, window functions, joins), Python (Pandas, NumPy, Matplotlib), Power BI, Tableau, Excel, Git/GitHub, API integration, **FastAPI, Supabase**.
- Thesis project confirmed on CV as "AI-Powered Financial Insights & Alert System," stack FastAPI/Flutter/Supabase, ongoing.
- Other CV projects (excluded from the site per #3/#13): Global Demographic Trends Analysis (Python/Pandas/Matplotlib/PostgreSQL, World Bank API, 195+ countries), Netflix Content Analysis (Excel/PostgreSQL/Power BI, 8000+ titles), ClassicModels BI (SQL/Excel).
- Trading: passed The5ers funded trader challenge (certificate, 2025).
- Certifications: Python – Kaggle (2025), Pandas – Kaggle (2026), Data Fundamentals – IBM (2026), Funded Trader Certificate – The5ers (2025).
- Note: neither Veresiye nor Bayerpos appear on the CV at all — likely too recent, or simply out of scope for a data-analyst-flavored CV. Their tech stacks came directly from Alp in this conversation, not the CV.

### From bayerpos.com (live fetch)
- Bayer POS: point-of-sale system for small retail shops ("tekel") in Turkey. Consolidates sales, inventory, credit accounts, shifts, loyalty programs. Offline-first ("sales continue even if internet cuts out"). ₺400/month, 14-day free trial, single-plan pricing. Positions itself as Turkey's #1 POS system for small retailers. Invoice OCR listed as "coming soon" at the time of this research — this is the feature Alp is building.

## Open Items for a Future Session
None outstanding — Alp confirmed no further additions when asked directly (see decision #22). If new questions come up mid-implementation that only Alp can answer (copy tone calls, real project links/screenshots, etc.), ask directly rather than guessing.
