# alpcakin.com

Personal blog by Alp Cakin — writing about macroeconomics, financial crises, market dynamics, and quantitative analysis.

**Live:** [alpcakin.com](https://www.alpcakin.com)

## Stack

- [Astro](https://astro.build) v6 — static site generator
- [Tailwind CSS](https://tailwindcss.com) v4 — styling
- [Pagefind](https://pagefind.app) — client-side search
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — editorial serif headings
- Deployed on GitHub Pages via GitHub Actions

## Development

```bash
pnpm install
pnpm dev          # localhost:4321
pnpm build        # production build + search index
pnpm preview      # preview production build
```

## Adding a post

Create a new `.md` file in `src/data/blog/` with frontmatter:

```yaml
---
title: "Post Title"
description: Short description for SEO and cards.
pubDatetime: 2026-01-01T10:00:00Z
tags:
  - economics
  - topic
featured: false
draft: false
---
```

Images go in `public/images/` and are referenced as `![Alt text](/images/filename.png)`.

## License

MIT
