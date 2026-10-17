import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { role as ROLE, status, tagline as TAGLINE } from "@/data/profile";
import { OG, frameText, terminalFrame } from "./frame";

export default async () => {
  const hostname = new URL(SITE.website).hostname.replace(/^www\./, "");
  const frame = {
    prompt: "whoami",
    paneTitle: "whoami",
    mode: "NORMAL",
    path: `~/  ${hostname}`,
    right: status,
  };

  return satori(
    terminalFrame({
      ...frame,
      body: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "flex-end" },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 104,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: "-4px",
                    color: OG.strong,
                  },
                  children: SITE.author,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: 52,
                    height: 92,
                    marginLeft: 10,
                    marginBottom: 4,
                    backgroundColor: OG.accent,
                  },
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { marginTop: 28, fontSize: 32, color: OG.accent },
            children: ROLE,
          },
        },
        {
          type: "div",
          props: {
            style: {
              marginTop: 24,
              maxWidth: 940,
              fontSize: 30,
              lineHeight: 1.45,
              color: OG.foreground,
            },
            children: TAGLINE,
          },
        },
      ],
    }),
    {
      width: OG.width,
      height: OG.height,
      embedFont: true,
      fonts: await loadGoogleFonts(
        frameText(frame) + SITE.author + ROLE + TAGLINE
      ),
    }
  );
};
