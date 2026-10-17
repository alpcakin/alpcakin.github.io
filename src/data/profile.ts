/*
 * Profile facts for the homepage and the site OG image. Keep it short — the
 * site is not the CV. The about paragraphs live in src/pages/index.astro.
 */

/* Türkiye storefront on purpose: the id-only link opens the US storefront on
   desktop, where odesh isn't sold, and 404s. (Same choice as odesh-web.) */
export const ODESH_APP_STORE =
  "https://apps.apple.com/tr/app/odesh/id6802964428";

export const role = "software engineer · Pécs, Hungary";

export const tagline =
  "I build software end to end — from backend services to mobile apps and command-line tools.";

/** Shown under the tagline with the accent status dot. */
export const status = "open to software engineering roles";

export interface LogEntry {
  org: string;
  role: string;
  /** Makes `org` a link, e.g. to a store listing. */
  href?: string;
}

/** Newest first, like `git log`; no dates — it all fits in the last two years. */
export const experience: LogEntry[] = [
  {
    org: "odesh",
    role: "shipped to the App Store",
    href: ODESH_APP_STORE,
  },
  { org: "Doğuş Teknoloji", role: "software engineering intern" },
  { org: "BayerPOS", role: "co-founder" },
  {
    org: "University of Pécs",
    role: "B.Sc. Computer Science Engineering",
  },
];
