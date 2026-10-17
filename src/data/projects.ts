import type { ImageMetadata } from "astro";
import odeshHome from "@/assets/images/odesh/01-ana-sayfa.png";
import odeshExpense from "@/assets/images/odesh/02-harcama.png";
import odeshGroup from "@/assets/images/odesh/04-grup.png";
import odeshLedger from "@/assets/images/odesh/05-defter.png";
import { ODESH_APP_STORE } from "@/data/profile";

/*
 * Projects shown in the homepage `work` pane, in tab order.
 *
 * Keep each one short: a line of context, two sentences, three or four tools. The
 * preview (`media`) does the showing; it is optional and picks how the
 * preview well renders:
 *   - "video":   a looping screen recording (put files under public/media/<slug>/)
 *   - "gallery": a row of screenshots (import them from src/assets so Astro optimises them)
 *   - "flow":    a pipeline diagram drawn from `steps`, for work without screenshots
 */

export interface ProjectLink {
  label: string;
  href: string;
}

export interface FlowStep {
  label: string;
  detail?: string;
  /** Things that happen side by side within this step. */
  parallel?: string[];
}

export interface GalleryShot {
  image: ImageMetadata;
  caption: string;
  alt: string;
}

export type ProjectMedia = {
  /** Shown in the preview well's title bar, e.g. a file path. */
  title: string;
} & (
  | {
      type: "video";
      sources: { src: string; type: string }[];
      poster: string;
      width: number;
      height: number;
      /** Describes what the recording shows, for screen readers. */
      label: string;
    }
  | { type: "gallery"; shots: GalleryShot[] }
  | { type: "flow"; steps: FlowStep[] }
);

export interface Project {
  /** URL-safe id; the tab is deep-linkable as `/#work-<slug>`. */
  slug: string;
  title: string;
  /** Tab label when `title` is too long for a tab. */
  short?: string;
  /** One line next to the title, e.g. "open source · Rust CLI". */
  meta: string;
  description: string;
  /** A handful of tools, not the full stack. */
  tags: string[];
  links: ProjectLink[];
  media?: ProjectMedia;
}

export const projects: Project[] = [
  {
    slug: "lore",
    title: "lore",
    meta: "open source · Rust CLI / TUI",
    description:
      "A command palette for your shell. Press ctrl+g, type a few words of what you're trying to do, and the finished command lands on your prompt. Published on crates.io as cmdlore.",
    tags: ["Rust", "ratatui", "SQLite"],
    links: [
      { label: "github", href: "https://github.com/alpcakin/lore" },
      { label: "docs", href: "https://lore.alpcakin.com" },
      { label: "crates.io", href: "https://crates.io/crates/cmdlore" },
    ],
    media: {
      type: "video",
      title: "lore/docs/demo.tape",
      sources: [
        { src: "/media/lore/demo.webm", type: "video/webm" },
        { src: "/media/lore/demo.mp4", type: "video/mp4" },
      ],
      poster: "/media/lore/poster.webp",
      width: 1200,
      height: 720,
      label:
        "lore demo: ctrl+g opens the picker under the prompt, searching “deleted” finds git log -S, and the command lands on the prompt with its placeholder ready to fill in.",
    },
  },
  {
    slug: "odesh",
    title: "odesh",
    meta: "mobile app · live on the App Store",
    description:
      "Tracks shared debts and expenses between friends and groups, and suggests how to settle up. I designed the PostgreSQL schema, the settlement logic and the Supabase backend; it now runs with real users.",
    tags: ["Supabase", "PostgreSQL", "React Native"],
    links: [
      { label: "app store", href: ODESH_APP_STORE },
      { label: "odesh.app", href: "https://odesh.app" },
    ],
    media: {
      type: "gallery",
      title: "odesh/screens",
      shots: [
        {
          image: odeshHome,
          caption: "who owes whom",
          alt: "odesh home screen showing what friends owe you and what you owe them",
        },
        {
          image: odeshExpense,
          caption: "adding an expense",
          alt: "odesh screen for entering a new expense amount",
        },
        {
          image: odeshGroup,
          caption: "group expenses",
          alt: "odesh group screen listing shared expenses and your share of each",
        },
        {
          image: odeshLedger,
          caption: "friends without the app",
          alt: "odesh ledger for a friend who does not use the app, with open debts and a settle-up button",
        },
      ],
    },
  },
  {
    slug: "bayerpos",
    title: "BayerPOS",
    meta: "co-founder · 2026",
    description:
      "Offline-first POS and inventory software for retail shops in Turkey. I owned the database layer and an AI-assisted invoice OCR pipeline that updates stock automatically.",
    tags: ["PostgreSQL", "Supabase", "SvelteKit", "Tauri"],
    links: [],
    media: {
      type: "flow",
      title: "bayerpos/invoice-ocr",
      steps: [
        { label: "Supplier invoice", detail: "OCR into line items" },
        {
          label: "Candidate match",
          parallel: ["text similarity", "alias table"],
        },
        { label: "LLM", detail: "makes the final call" },
        { label: "Stock update", detail: "applied automatically" },
      ],
    },
  },
  {
    slug: "fin-insights",
    title: "AI Financial Insights System",
    short: "fin-insights",
    meta: "bachelor's thesis · 2026 – 2027",
    description:
      "A FastAPI backend that ingests real-time market data and sends AI insights and alerts to a Flutter app. I built the AI analysis pipeline, from LLM API integration to system prompt design.",
    tags: ["FastAPI", "Supabase", "Flutter"],
    links: [],
    media: {
      type: "flow",
      title: "fin-insights/architecture",
      steps: [
        { label: "Ingest", detail: "real-time market data" },
        {
          label: "Analyse",
          parallel: ["OpenAI", "Gemini", "Grok"],
        },
        { label: "Validate", detail: "one JSON schema" },
        { label: "Alert", detail: "push to the app" },
      ],
    },
  },
];
