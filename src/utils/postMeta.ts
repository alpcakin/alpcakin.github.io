import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";

dayjs.extend(utc);
dayjs.extend(timezone);

const WORDS_PER_MINUTE = 230;

/** Estimated reading time in whole minutes (at least 1). */
export function readingMinutes(post: CollectionEntry<"blog">): number {
  const text = (post.body ?? "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/[#>*_`~-]+/g, " "); // markdown punctuation
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** ISO-style calendar date (`2026-04-15`) in the post's timezone. */
export function isoDate(date: Date, tz?: string): string {
  return dayjs(date)
    .tz(tz || SITE.timezone)
    .format("YYYY-MM-DD");
}

/** Publication and (if later) modification dates of a post. */
export function postDates(post: CollectionEntry<"blog">) {
  const { pubDatetime, modDatetime, timezone: tz } = post.data;
  const updated = modDatetime && modDatetime > pubDatetime ? modDatetime : null;
  return {
    published: isoDate(pubDatetime, tz),
    publishedISO: pubDatetime.toISOString(),
    updated: updated ? isoDate(updated, tz) : null,
    updatedISO: updated ? updated.toISOString() : null,
  };
}
