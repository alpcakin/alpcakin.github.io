import satori from "satori";
import { SITE } from "@/config";
import { getPath } from "@/utils/getPath";
import { isoDate, readingMinutes } from "@/utils/postMeta";
import loadGoogleFonts from "../loadGoogleFont";
import { OG, frameText, terminalFrame } from "./frame";

export default async post => {
  const slug = getPath(post.id, post.filePath, false).split("/").pop();
  const file = `${slug}.md`;
  const meta = `${post.data.author} · ${isoDate(post.data.pubDatetime, post.data.timezone)}`;
  const frame = {
    cwd: "~/posts",
    prompt: `cat ${file}`,
    paneTitle: file,
    mode: "READ",
    path: `~/posts/${slug}`,
    right: `${readingMinutes(post)} min read`,
  };

  return satori(
    terminalFrame({
      ...frame,
      body: [
        {
          type: "div",
          props: {
            style: {
              display: "-webkit-box",
              overflow: "hidden",
              lineClamp: 3,
              boxOrient: "vertical",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-2px",
              color: OG.strong,
            },
            children: post.data.title,
          },
        },
        {
          type: "div",
          props: {
            style: { marginTop: 32, fontSize: 28, color: OG.accent },
            children: meta,
          },
        },
      ],
    }),
    {
      width: OG.width,
      height: OG.height,
      embedFont: true,
      fonts: await loadGoogleFonts(
        frameText(frame) + post.data.title + meta + SITE.title
      ),
    }
  );
};
