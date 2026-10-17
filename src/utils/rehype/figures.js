/**
 * Rehype plugin that turns stand-alone markdown images into numbered figures.
 *
 * A paragraph whose only content is a single image (`![Alt](/images/x.png)`)
 * becomes:
 *
 *   <figure class="post-figure">
 *     <figcaption class="post-figure-bar">fig.01 · Alt</figcaption>
 *     <a class="post-figure-link" href="/images/x.png" data-zoom>
 *       <img ... loading="lazy" decoding="async">
 *     </a>
 *   </figure>
 *
 * The link opens the full-size image without JavaScript; with JavaScript the
 * site-wide lightbox (`Lightbox.astro`) intercepts `[data-zoom]` clicks.
 * Inline images inside running text are left untouched.
 */
export function rehypeFigures() {
  return tree => {
    let count = 0;

    const walk = node => {
      if (!Array.isArray(node.children)) return;
      node.children = node.children.map(child => {
        const img = standaloneImage(child);
        if (!img) {
          walk(child);
          return child;
        }
        count += 1;
        return toFigure(img, count);
      });
    };

    walk(tree);
  };
}

/** Returns the `img` element if `node` is a paragraph holding only that image. */
function standaloneImage(node) {
  if (node.type !== "element" || node.tagName !== "p") return null;
  const meaningful = node.children.filter(
    child => !(child.type === "text" && child.value.trim() === "")
  );
  if (meaningful.length !== 1) return null;
  const [only] = meaningful;
  return only.type === "element" && only.tagName === "img" ? only : null;
}

function toFigure(img, index) {
  const alt = typeof img.properties.alt === "string" ? img.properties.alt : "";
  const src = img.properties.src;
  const label = `fig.${String(index).padStart(2, "0")}`;

  img.properties.loading = "lazy";
  img.properties.decoding = "async";

  const caption = [
    {
      type: "element",
      tagName: "span",
      properties: { className: ["post-figure-index"] },
      children: [{ type: "text", value: label }],
    },
  ];
  if (alt) {
    caption.push({
      type: "element",
      tagName: "span",
      properties: { className: ["post-figure-title"] },
      children: [{ type: "text", value: alt }],
    });
  }

  return {
    type: "element",
    tagName: "figure",
    properties: { className: ["post-figure"] },
    children: [
      {
        type: "element",
        tagName: "figcaption",
        properties: { className: ["post-figure-bar"] },
        children: caption,
      },
      {
        type: "element",
        tagName: "a",
        properties: {
          className: ["post-figure-link"],
          href: src,
          dataZoom: "",
          dataAstroReload: "", // an image file, never a ClientRouter navigation
          dataCaption: alt ? `${label} · ${alt}` : label,
          ariaLabel: alt ? `Enlarge ${label}: ${alt}` : `Enlarge ${label}`,
        },
        children: [img],
      },
    ],
  };
}
