import { SITE } from "@/config";

/**
 * tmux-style windows shown in the top bar. Each one maps to a pane on the
 * homepage (`id` = the pane's element id); on other pages the bar links to
 * `href` instead. `match` marks the window as current on matching paths.
 * Numbering starts at 1 (tmux `base-index 1`); the pane `index` props match.
 */
export interface TmuxWindow {
  id: string;
  label: string;
  href: string;
  match?: string[];
}

export const WINDOWS: TmuxWindow[] = [
  { id: "about", label: "about", href: "/#about" },
  { id: "work", label: "work", href: "/#work" },
  {
    id: "writing",
    label: "writing",
    href: "/posts/",
    match: ["/posts", "/tags"],
  },
  { id: "contact", label: "contact", href: "/#contact" },
];

export interface Social {
  name: string;
  handle: string;
  href: string;
  linkTitle: string;
}

export const SOCIALS: Social[] = [
  {
    name: "github",
    handle: "github.com/alpcakin",
    href: "https://github.com/alpcakin",
    linkTitle: `${SITE.author} on GitHub`,
  },
  {
    name: "linkedin",
    handle: "in/alp-cakin",
    href: "https://www.linkedin.com/in/alp-cakin",
    linkTitle: `${SITE.author} on LinkedIn`,
  },
  {
    name: "substack",
    handle: "@alpcakin",
    href: "https://substack.com/@alpcakin",
    linkTitle: `${SITE.author} on Substack`,
  },
  {
    name: "instagram",
    handle: "@alp.cakin",
    href: "https://www.instagram.com/alp.cakin/",
    linkTitle: `${SITE.author} on Instagram`,
  },
];

export const EMAIL = "alpcakin16@gmail.com";

/** Share targets for posts; the post URL is appended to `href`. */
export const SHARE_LINKS = [
  {
    name: "x",
    href: "https://x.com/intent/post?url=",
    linkTitle: "Share this post on X",
  },
  {
    name: "linkedin",
    href: "https://www.linkedin.com/sharing/share-offsite/?url=",
    linkTitle: "Share this post on LinkedIn",
  },
] as const;
