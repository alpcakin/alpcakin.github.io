/**
 * Site-wide terminal behaviour. Loaded once from Layout.astro; per-page parts
 * re-run on every `astro:page-load` (ClientRouter navigation) and clean up
 * after themselves through an AbortController.
 *
 *   - clock:      `[data-clock]` shows the time in Pécs
 *   - pane focus: the `[data-pane]` filling most of the viewport gets
 *                 `data-focused`; on the homepage the matching tmux window
 *                 in the top bar is marked current. Clicking a window pins
 *                 focus on its pane and flashes it — the page is often too
 *                 short to scroll there, so this is the visible response
 *   - scroll pos: `[data-scroll-pos]` shows Top / NN% / Bot / All, like vim
 *   - crt:        `[data-crt-toggle]` toggles scanlines, remembered per browser
 *   - lightbox:   `a[data-zoom]` opens its image in `dialog[data-lightbox]`
 */

const CRT_KEY = "terminal:crt";

let pageController: AbortController | null = null;
let clockTimer: ReturnType<typeof setInterval> | null = null;

/* ─── Clock ─── */

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Budapest",
  hour: "2-digit",
  minute: "2-digit",
});

function initClock() {
  if (clockTimer) clearInterval(clockTimer);
  const clocks = document.querySelectorAll<HTMLElement>("[data-clock]");
  if (!clocks.length) return;
  const tick = () => {
    const time = clockFormat.format(new Date());
    clocks.forEach(clock => (clock.textContent = time));
  };
  tick();
  clockTimer = setInterval(tick, 30_000);
}

/* ─── Pane focus + scroll position ─── */

function visibleArea(el: Element, viewportHeight: number) {
  const rect = el.getBoundingClientRect();
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, viewportHeight);
  return Math.max(0, bottom - top) * rect.width;
}

function initViewportTracking(signal: AbortSignal) {
  const panes = Array.from(
    document.querySelectorAll<HTMLElement>("[data-pane]")
  );
  const isHome = document.querySelector(".tmux[data-home]") !== null;
  const windows = new Map(
    Array.from(document.querySelectorAll<HTMLElement>("[data-window]")).map(
      el => [el.dataset.window, el] as const
    )
  );
  const positions = document.querySelectorAll<HTMLElement>("[data-scroll-pos]");

  let focused: HTMLElement | null = null;
  /** Pane chosen from the top bar; wins over the largest-visible rule until
   *  the reader scrolls themselves, or it has been on screen and left again
   *  (it usually starts off screen while the page scrolls to it). */
  let pinned: HTMLElement | null = null;
  let pinnedSeen = false;
  let frame = 0;

  const focus = (pane: HTMLElement) => {
    if (pane === focused) return;
    focused?.removeAttribute("data-focused");
    pane.setAttribute("data-focused", "");
    focused = pane;
    if (isHome) {
      windows.forEach((link, id) => {
        if (id === pane.id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  };

  const update = () => {
    frame = 0;
    const viewport = window.innerHeight;

    if (pinned) {
      const visible = visibleArea(pinned, viewport) > 0;
      if (visible) pinnedSeen = true;
      else if (pinnedSeen) pinned = null;
    }

    if (pinned) focus(pinned);
    else if (panes.length) {
      let best: HTMLElement | null = null;
      let bestArea = 0;
      for (const pane of panes) {
        const area = visibleArea(pane, viewport);
        if (area > bestArea) {
          best = pane;
          bestArea = area;
        }
      }
      if (best) focus(best);
    }

    if (positions.length) {
      const { scrollHeight } = document.documentElement;
      const y = window.scrollY;
      const max = scrollHeight - viewport;
      let label: string;
      if (max <= 2) label = "All";
      else if (y <= 24) label = "Top";
      else if (y >= max - 24) label = "Bot";
      else label = `${Math.round((y / max) * 100)}%`;
      positions.forEach(el => (el.textContent = label));
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  // Server-rendered focus is only a starting point; tracking takes over.
  panes.forEach(pane => {
    if (pane.hasAttribute("data-focused")) focused = pane;
  });

  if (isHome) {
    windows.forEach((link, id) => {
      const pane = panes.find(p => p.id === id);
      if (!pane) return;
      link.addEventListener(
        "click",
        () => {
          pinned = pane;
          pinnedSeen = false;
          focus(pane);
          flash(pane);
        },
        { signal }
      );
    });
  }

  // Scrolling by hand hands focus back to the largest-visible rule.
  const unpin = () => {
    if (!pinned) return;
    pinned = null;
    schedule();
  };
  const scrollKeys = new Set([
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
  ]);
  window.addEventListener("wheel", unpin, { passive: true, signal });
  window.addEventListener("touchmove", unpin, { passive: true, signal });
  window.addEventListener(
    "keydown",
    event => {
      if (scrollKeys.has(event.key)) unpin();
    },
    { signal }
  );

  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { passive: true, signal });
  signal.addEventListener("abort", () => cancelAnimationFrame(frame));
  update();
}

/** Briefly pulse a pane's border (skipped for reduced motion, in CSS). */
function flash(pane: HTMLElement) {
  pane.removeAttribute("data-flash");
  void pane.offsetWidth; // restart the animation on repeated clicks
  pane.setAttribute("data-flash", "");
  pane.addEventListener(
    "animationend",
    () => pane.removeAttribute("data-flash"),
    { once: true }
  );
}

/* ─── CRT scanlines ─── */

function readCrt() {
  try {
    return localStorage.getItem(CRT_KEY) === "on";
  } catch {
    return false;
  }
}

function applyCrt(on: boolean) {
  document.documentElement.toggleAttribute("data-crt", on);
  document
    .querySelectorAll("[data-crt-toggle]")
    .forEach(btn => btn.setAttribute("aria-pressed", String(on)));
}

function initCrt(signal: AbortSignal) {
  applyCrt(readCrt());
  document.querySelectorAll("[data-crt-toggle]").forEach(btn =>
    btn.addEventListener(
      "click",
      () => {
        const on = !document.documentElement.hasAttribute("data-crt");
        applyCrt(on);
        try {
          localStorage.setItem(CRT_KEY, on ? "on" : "off");
        } catch {
          /* storage unavailable: the toggle still works for this page */
        }
      },
      { signal }
    )
  );
}

/* ─── Lightbox (delegated once for the whole session) ─── */

function openLightbox(link: HTMLAnchorElement) {
  const dialog = document.querySelector<HTMLDialogElement>(
    "dialog[data-lightbox]"
  );
  const img = dialog?.querySelector<HTMLImageElement>("[data-lightbox-img]");
  const caption = dialog?.querySelector<HTMLElement>("[data-lightbox-caption]");
  if (!dialog || !img || typeof dialog.showModal !== "function") return false;

  const inner = link.querySelector("img");
  img.src = link.href;
  img.alt = inner?.alt ?? "";
  if (caption) caption.textContent = link.dataset.caption || inner?.alt || "";
  dialog.showModal();
  return true;
}

function initLightboxDelegation() {
  // Capture phase, so this runs before ClientRouter's own link handling.
  document.addEventListener(
    "click",
    event => {
      const target = event.target as Element | null;

      const link = target?.closest<HTMLAnchorElement>("a[data-zoom]");
      if (link) {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.button !== 0
        )
          return;
        if (openLightbox(link)) event.preventDefault();
        return;
      }

      const dialog = target?.closest<HTMLDialogElement>(
        "dialog[data-lightbox]"
      );
      if (!dialog) return;
      // Close on the button, or on a click outside the image (the backdrop).
      if (target?.closest("[data-lightbox-close]") || target === dialog)
        dialog.close();
    },
    true
  );

  document.addEventListener(
    "close",
    event => {
      const dialog = event.target as Element;
      if (!dialog.matches?.("dialog[data-lightbox]")) return;
      dialog
        .querySelector<HTMLImageElement>("[data-lightbox-img]")
        ?.removeAttribute("src");
    },
    true
  );
}

/* ─── Boot ─── */

function initPage() {
  pageController?.abort();
  pageController = new AbortController();
  const { signal } = pageController;

  initClock();
  initViewportTracking(signal);
  initCrt(signal);
}

initLightboxDelegation();
document.addEventListener("astro:page-load", initPage);
// Keep scanlines across navigations without a flash (html attributes are swapped).
document.addEventListener("astro:after-swap", () => applyCrt(readCrt()));
