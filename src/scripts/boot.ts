/**
 * Boot sequence: the page types itself out, as if someone were at the other
 * end of a remote shell writing it right now.
 *
 * Gated by `html[data-booting]`, set before first paint by the inline script
 * in Layout.astro (and by the after-swap hook below on navigations):
 *   - "home": first homepage view of a session. A black title screen
 *     (BootIntro.astro) blinks a cursor, types the name and a mission-intro
 *     caption, then collapses; after it each `[data-boot-root]` pane prints
 *     its `[data-boot]` parts in order once on screen, the status line shows
 *     INSERT and the tmux windows being written get the `#` activity flag.
 *   - "page": any other page. Only the breadcrumb command is typed.
 * Never for prefers-reduced-motion, automated browsers or deep links. Any key
 * or click skips to the end (on the title screen, scrolling too). The content
 * is in the HTML all along: effects only hide and reveal it, and each one
 * undoes its DOM changes when it ends.
 *
 * Effects (`data-boot` values):
 *   cmd     a command typed by hand, then Enter (types `.prompt-cmd` if present)
 *   type    fast typing of a text-only element
 *   human   typing at human pace, with one typo that gets corrected
 *   decode  characters scramble, then settle left to right
 *   print   output flushed line by line
 *   lines   children appear one after another
 *   scan    an image drawn top to bottom
 *   tv      a CRT powering on
 */

type Kind = "home" | "page";
type Pace = readonly [min: number, max: number];
type Effect = (el: HTMLElement, signal: AbortSignal) => Promise<void>;

const SEEN_KEY = "terminal:booted";
/** Delay between panes starting, in DOM order. */
const STAGGER = 250;
const GLYPHS = "ABCDEFGHJKLMNPRSTUVXYZ0123456789#$%&*+<>/=?@";

const html = document.documentElement;
let kind: Kind = "page";
let controller: AbortController | null = null;
/** When the boot was requested (first paint, or the swap), for the intro. */
let requestedAt = 0;
let active = 0;
let statusBar: ReturnType<typeof statusLine> | null = null;

/* ─── Timing ─── */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Runs a Web Animation; cancelled (back to the final state) on abort. */
function animate(
  el: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  signal: AbortSignal
) {
  const animation = el.animate(keyframes, options);
  const stop = () => animation.cancel();
  signal.addEventListener("abort", stop, { once: true });
  return animation.finished
    .then(
      () => {},
      () => {}
    )
    .finally(() => {
      signal.removeEventListener("abort", stop);
      if (signal.aborted) throw signal.reason;
    });
}

const reveal = (el: HTMLElement) => el.setAttribute("data-boot-live", "");

/* ─── Typing ─── */

/**
 * Splits `el`'s text into the typed part, a block caret on the next character
 * and the untyped rest, which stays in place but transparent — so lines wrap
 * exactly as they will once typing is done and nothing below moves.
 */
function typewriter(el: HTMLElement) {
  const full = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const saved = Array.from(el.childNodes);
  const make = (className = "") => {
    const span = document.createElement("span");
    if (className) span.className = className;
    return span;
  };

  const sr = make("boot-sr");
  sr.textContent = full;
  const typed = make();
  const caret = make("boot-caret");
  const ghost = make("boot-ghost");
  const visual = make();
  visual.setAttribute("aria-hidden", "true");
  visual.append(typed, caret, ghost);
  el.replaceChildren(sr, visual);

  return {
    full,
    show(text: string) {
      const rest = full.slice(text.length);
      typed.textContent = text;
      caret.textContent = rest.charAt(0);
      ghost.textContent = rest.slice(1);
    },
    restore: () => el.replaceChildren(...saved),
  };
}

/**
 * Successive screen states while typing `full`. With `typo`, two letters of
 * the first long word come out swapped, a pause (`null`), two backspaces and
 * the right letters — the same length throughout, so the layout holds.
 */
function keystrokes(full: string, typo: boolean) {
  const frames: (string | null)[] = [];
  let at = -1;
  if (typo) {
    const word = /\p{L}{7,}/u.exec(full.slice(6));
    if (word) at = 6 + word.index + 3;
  }
  for (let i = 0; i < full.length; i++) {
    if (i === at) {
      const head = full.slice(0, at);
      const swapped = head + full[at + 1];
      frames.push(swapped, swapped + full[at], null, swapped, head);
    }
    frames.push(full.slice(0, i + 1));
  }
  return frames;
}

function keyDelay(frame: string, previous: string, [min, max]: Pace) {
  if (frame.length < previous.length) return 120; // backspace
  const char = frame.at(-1) ?? "";
  if (",.;:—".includes(char)) return rand(min, max) + rand(90, 170);
  if (char === " ") return rand(min, max) + rand(5, 30);
  return rand(min, max);
}

async function typeOut(
  el: HTMLElement,
  signal: AbortSignal,
  pace: Pace,
  typo = false
) {
  const writer = typewriter(el);
  writer.show("");
  try {
    let previous = "";
    for (const frame of keystrokes(writer.full, typo)) {
      if (frame === null) {
        await sleep(420, signal); // "…wait, that's wrong"
        continue;
      }
      writer.show(frame);
      await sleep(keyDelay(frame, previous, pace), signal);
      previous = frame;
    }
  } finally {
    writer.restore();
  }
}

/* ─── Effects ─── */

function firstText(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: node =>
      node.nodeValue?.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP,
  });
  return walker.nextNode() as Text | null;
}

function scramble(text: string, settled: number) {
  return Array.from(text, (char, i) =>
    i < settled || /\s/.test(char)
      ? char
      : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
  ).join("");
}

function lineCount(el: HTMLElement) {
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
  return Math.max(
    1,
    Math.round(el.getBoundingClientRect().height / lineHeight)
  );
}

const effects: Record<string, Effect> = {
  async cmd(el, signal) {
    const target = el.querySelector<HTMLElement>(".prompt-cmd") ?? el;
    const home = kind === "home";
    const typing = typeOut(target, signal, home ? [28, 62] : [14, 30]);
    reveal(el);
    await typing;
    if (home) await sleep(180, signal); // Enter
  },

  async type(el, signal) {
    const typing = typeOut(el, signal, [4, 10]);
    reveal(el);
    await typing;
  },

  async human(el, signal) {
    const typing = typeOut(el, signal, [6, 18], true);
    reveal(el);
    await typing;
  },

  async decode(el, signal) {
    const node = firstText(el);
    reveal(el);
    if (!node) return;
    const original = node.data;
    const steps = 12;
    try {
      for (let step = 0; step <= steps; step++) {
        node.data = scramble(
          original,
          Math.floor((original.length * step) / steps)
        );
        await sleep(40, signal);
      }
    } finally {
      node.data = original;
    }
  },

  async print(el, signal) {
    const lines = lineCount(el);
    reveal(el);
    await animate(
      el,
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
      { duration: lines * 45, easing: `steps(${lines}, jump-start)` },
      signal
    );
  },

  async lines(el, signal) {
    const children = Array.from(el.children) as HTMLElement[];
    children.forEach(child => child.setAttribute("data-boot-hide", ""));
    reveal(el);
    try {
      for (const child of children) {
        await sleep(70, signal);
        child.removeAttribute("data-boot-hide");
      }
    } finally {
      children.forEach(child => child.removeAttribute("data-boot-hide"));
    }
  },

  async scan(el, signal) {
    reveal(el);
    await animate(
      el,
      [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
      { duration: 560, easing: "steps(12, jump-start)" },
      signal
    );
  },

  async tv(el, signal) {
    el.setAttribute("data-boot-tv", "");
    reveal(el);
    try {
      await sleep(720, signal);
    } finally {
      el.removeAttribute("data-boot-tv");
    }
  },
};

/* ─── Chrome: status line + tmux activity ─── */

function statusLine() {
  const mode = document.querySelector<HTMLElement>("[data-status-mode]");
  const hint = document.querySelector<HTMLElement>("[data-status-hint]");
  const saved = [mode?.textContent ?? "", hint?.textContent ?? ""];
  const set = (typing: boolean) => {
    if (mode) mode.textContent = typing ? "INSERT" : saved[0];
    if (hint)
      hint.textContent = typing
        ? "recording @a · press any key to skip"
        : saved[1];
  };
  return { set, restore: () => set(false) };
}

function setActivity(root: HTMLElement, on: boolean) {
  if (!root.id) return;
  document
    .querySelector(`[data-window="${root.id}"]`)
    ?.toggleAttribute("data-activity", on);
}

/* ─── Mission caption (homepage) ─── */

function missionTime() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Budapest",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map(part => [part.type, part.value])
  );
  const year = Number(parts.year);
  const day =
    (Date.UTC(year, Number(parts.month) - 1, Number(parts.day)) -
      Date.UTC(year, 0, 1)) /
      86_400_000 +
    1;
  return `Day ${day} – ${parts.hour}:${parts.minute}:${parts.second}`;
}

/**
 * The title screen: the cursor blinks twice, the name is typed, then the
 * caption lines; the screen collapses into a line and the page is revealed.
 * Resolves when the screen is gone (rejects when skipped, after hiding it).
 */
async function intro(signal: AbortSignal) {
  const screen = document.querySelector<HTMLElement>("[data-intro]");
  const typed = screen?.querySelector<HTMLElement>("[data-intro-typed]");
  const ghost = screen?.querySelector<HTMLElement>("[data-intro-ghost]");
  const cursor = screen?.querySelector<HTMLElement>("[data-intro-cursor]");
  if (!screen || !typed || !ghost || !cursor) return;

  const name = ghost.textContent ?? "";
  const time = screen.querySelector<HTMLElement>("[data-mission-time]");
  if (time) time.textContent = missionTime();
  // Lines start hidden (no space taken), so the caption grows line by line.
  const lines = Array.from(screen.querySelectorAll<HTMLElement>("[data-line]"));

  try {
    // The cursor has blinked since the screen was first painted.
    await sleep(Math.max(300, requestedAt + 1700 - performance.now()), signal);

    cursor.setAttribute("data-typing", "");
    for (let i = 1; i <= name.length; i++) {
      typed.textContent = name.slice(0, i);
      ghost.textContent = name.slice(i);
      await sleep(name[i - 1] === " " ? rand(140, 220) : rand(70, 150), signal);
    }
    cursor.removeAttribute("data-typing");
    await sleep(800, signal);

    cursor.setAttribute("data-off", ""); // one cursor at a time: on to the caption
    for (const line of lines) {
      line.hidden = false;
      await typeOut(line, signal, [14, 30]);
      await sleep(120, signal);
    }
    await sleep(1000, signal);

    await animate(
      screen,
      [{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(50% 0 50% 0)" }],
      { duration: 420, easing: "cubic-bezier(0.7, 0, 0.9, 0.4)" },
      signal
    );
  } finally {
    screen.hidden = true;
  }
}

/* ─── Orchestration ─── */

async function runRoot(root: HTMLElement, signal: AbortSignal) {
  // Parts inside an inactive tab (display: none) are simply shown at the end.
  const parts = Array.from(
    root.querySelectorAll<HTMLElement>("[data-boot]")
  ).filter(el => el.getClientRects().length > 0);

  root.setAttribute("data-boot-on", "");
  setActivity(root, true);
  statusBar?.set(++active > 0);
  try {
    for (const part of parts) {
      await (effects[part.dataset.boot!] ?? effects.print)(part, signal);
      await sleep(70, signal);
    }
  } finally {
    setActivity(root, false);
    statusBar?.set(--active > 0);
  }
}

function start(bootKind: Kind) {
  kind = bootKind;
  controller = new AbortController();
  const { signal } = controller;
  html.setAttribute("data-boot-started", "");

  const roots = Array.from(
    document.querySelectorAll<HTMLElement>("[data-boot-root]")
  );
  if (!roots.length) return end();

  const skip = () => end();
  window.addEventListener("keydown", skip, { signal });
  window.addEventListener("pointerdown", skip, { signal });

  if (kind !== "home") return writePage(roots, signal);

  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage unavailable: it just plays again next time */
  }
  // On the title screen, scrolling also means "show me the page".
  const onIntro = new AbortController();
  signal.addEventListener("abort", () => onIntro.abort());
  window.addEventListener("wheel", skip, { signal: onIntro.signal });
  window.addEventListener("touchmove", skip, { signal: onIntro.signal });

  intro(signal)
    .then(() => {
      onIntro.abort();
      statusBar = statusLine();
      writePage(roots, signal);
    })
    .catch(() => {});
}

/** Each root writes itself once on screen, never before its turn. */
function writePage(roots: HTMLElement[], signal: AbortSignal) {
  const startedAt = performance.now();
  let remaining = roots.length;
  const settle = () => {
    if (--remaining === 0) end();
  };

  const observer = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const root = entry.target as HTMLElement;
        observer.unobserve(root);
        const turn = roots.indexOf(root) * STAGGER;
        sleep(Math.max(0, turn - (performance.now() - startedAt)), signal)
          .then(() => runRoot(root, signal))
          .catch(() => {})
          .finally(settle);
      }
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  roots.forEach(root => observer.observe(root));
  signal.addEventListener("abort", () => observer.disconnect());
}

/** Stops everything; effects restore their DOM as their promises settle. */
function end() {
  if (!controller) return;
  controller.abort();
  controller = null;

  html.removeAttribute("data-booting");
  html.removeAttribute("data-boot-started");
  document.querySelectorAll("[data-boot-on], [data-boot-live]").forEach(el => {
    el.removeAttribute("data-boot-on");
    el.removeAttribute("data-boot-live");
  });
  document
    .querySelectorAll("[data-activity]")
    .forEach(el => el.removeAttribute("data-activity"));
  statusBar?.restore();
  statusBar = null;
  active = 0;
}

/** Mirrors the inline gate in Layout.astro, for ClientRouter navigations. */
function gate(): Kind | null {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    navigator.webdriver
  )
    return null;
  if (location.pathname !== "/") return "page";
  if (location.hash) return null;
  try {
    return sessionStorage.getItem(SEEN_KEY) ? null : "home";
  } catch {
    return null;
  }
}

document.addEventListener("astro:before-swap", () => {
  end();
});

// Before the new page is painted: hide what is about to be typed.
document.addEventListener("astro:after-swap", () => {
  const next = gate();
  if (!next) return;
  html.setAttribute("data-booting", next);
  requestedAt = performance.now();
  setTimeout(() => {
    if (!html.hasAttribute("data-boot-started"))
      html.removeAttribute("data-booting");
  }, 2500);
});

document.addEventListener("astro:page-load", () => {
  const requested = html.getAttribute("data-booting");
  if (requested !== "home" && requested !== "page") return;
  try {
    start(requested);
  } catch {
    end();
  }
});
