/**
 * Shared terminal frame for Open Graph images (satori element trees).
 * Mirrors the site: a prompt line, one focused pane with its title on the
 * border, and a vim-style status line.
 */

export const OG = {
  width: 1200,
  height: 630,
  background: "#0a0e0b",
  foreground: "#d2e3d5",
  strong: "#ecf6ee",
  soft: "#b9ccbc",
  muted: "#7f9684",
  border: "#26352a",
  statusBg: "#121a14",
  accent: "#7ee787",
  font: "IBM Plex Mono",
};

const el = (type, style, children) => ({ type, props: { style, children } });

/**
 * @param {object} o
 * @param {string} [o.cwd]      working directory in the prompt (default `~`)
 * @param {string} o.prompt      text after `$ ` above the pane
 * @param {string} o.paneTitle   label on the pane's top border
 * @param {object[]} o.body      satori children inside the pane
 * @param {string} o.mode        status line mode, e.g. NORMAL
 * @param {string} o.path        status line path
 * @param {string} o.right       status line right-hand text
 */
export function terminalFrame({
  cwd = "~",
  prompt,
  paneTitle,
  body,
  mode,
  path,
  right,
}) {
  return el(
    "div",
    {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: OG.background,
      color: OG.foreground,
      fontFamily: OG.font,
    },
    [
      // Prompt line
      el(
        "div",
        {
          display: "flex",
          padding: "40px 56px 0",
          fontSize: 26,
          color: OG.muted,
        },
        [
          el("span", { color: OG.accent }, "alp@pécs"),
          el("span", {}, `:${cwd}$ ${prompt}`),
        ]
      ),
      // Pane
      el(
        "div",
        {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flexGrow: 1,
          margin: "36px 56px 40px",
          padding: "40px 48px",
          border: `2px solid ${OG.accent}`,
        },
        [
          el(
            "div",
            {
              position: "absolute",
              top: -18,
              left: 24,
              display: "flex",
              padding: "0 12px",
              backgroundColor: OG.background,
              color: OG.accent,
              fontSize: 24,
              fontWeight: 700,
            },
            paneTitle
          ),
          ...body,
        ]
      ),
      // Status line
      el(
        "div",
        {
          display: "flex",
          alignItems: "center",
          height: 56,
          backgroundColor: OG.statusBg,
          borderTop: `2px solid ${OG.border}`,
          fontSize: 22,
        },
        [
          el(
            "div",
            {
              display: "flex",
              alignItems: "center",
              height: "100%",
              padding: "0 22px",
              backgroundColor: OG.accent,
              color: OG.background,
              fontWeight: 700,
            },
            mode
          ),
          el("div", { display: "flex", padding: "0 22px", flexGrow: 1 }, path),
          el(
            "div",
            { display: "flex", padding: "0 22px", color: OG.muted },
            right
          ),
        ]
      ),
    ]
  );
}

/** Every string a frame renders, for font subsetting. */
export const frameText = ({
  cwd = "~",
  prompt,
  paneTitle,
  mode,
  path,
  right,
}) => `alp@pécs:${cwd}$ ${prompt}${paneTitle}${mode}${path}${right}`;
