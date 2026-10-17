export const SITE = {
  website: "https://www.alpcakin.com/",
  author: "Alp Çakın",
  profile: "https://github.com/alpcakin",
  desc: "Software engineer in Pécs, Hungary, building software end to end — backend services, mobile apps and command-line tools like odesh, BayerPOS and lore. Learning systems programming in Rust. Also writes about economics and technology.",
  title: "alpcakin",
  ogImage: "",
  lightAndDarkMode: false,
  postPerIndex: 6,
  postPerPage: 8,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: false,
  showGalleries: false,
  dynamicOgImage: true,
  dir: "ltr",
  lang: "en",
  timezone: "Europe/Paris",
  introAudio: {
    enabled: false,
    src: "/audio/intro-web.mp3",
    label: "INTRO.MP3",
    duration: 30,
  },
} as const;
