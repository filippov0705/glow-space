import type { MasterProfileResponse } from "@glow-space/shared";

// "Anna K." → "AK": the first letter of the first two words that have one
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.match(/\p{L}/u)?.[0])
    .filter((letter): letter is string => letter !== undefined)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// "Nails · Gel polish, Extensions": categories, then the subcategories of
// active offerings. null when the master has no categories.
export function specialization(
  profile: Pick<MasterProfileResponse, "categories" | "subcategories">,
): string | null {
  if (profile.categories.length === 0) return null;
  const categories = profile.categories.map((item) => item.name).join(", ");
  if (profile.subcategories.length === 0) return categories;
  const subcategories = profile.subcategories
    .map((item) => item.name)
    .join(", ");
  return `${categories} · ${subcategories}`;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

const relativeTimeFormat = new Intl.RelativeTimeFormat("en", {
  numeric: "always",
});

// "2 weeks ago" from an ISO timestamp: the largest unit that fits at least
// once. Under a minute (or a date in the future) reads "just now". Months
// are capped at 11: 360–364 days (12 × 30) read "1 year ago".
export function relativeDate(iso: string, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - new Date(iso).getTime()) / 1000);
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (seconds >= unitSeconds) {
      const value = Math.floor(seconds / unitSeconds);
      if (unit === "month" && value >= 12) {
        return relativeTimeFormat.format(-1, "year");
      }
      return relativeTimeFormat.format(-value, unit);
    }
  }
  return "just now";
}

// "7 years of experience"; experienceYears is >= 0 (DB check)
export function experienceLabel(years: number): string {
  if (years === 0) return "Less than a year of experience";
  return `${years} ${years === 1 ? "year" : "years"} of experience`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LOCAL_ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

// "2026-10-31T14:00:00" → "Sat 14:00". startsAt is master-local wall time
// with no offset, so it is read from its parts and never parsed with
// new Date (that would apply the viewer's zone). Date.UTC only turns the
// calendar date into a weekday. null when the string is malformed.
export function formatSlot(startsAt: string): string | null {
  const match = LOCAL_ISO.exec(startsAt);
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match;
  const weekday = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  ).getUTCDay();
  return `${WEEKDAYS[weekday]} ${hours}:${minutes}`;
}

// Formatted chips for the booking card and bar, malformed starts dropped
export function slotLabels(
  nextSlots: MasterProfileResponse["nextSlots"],
): string[] {
  return nextSlots
    .map((slot) => formatSlot(slot.startsAt))
    .filter((label): label is string => label !== null);
}
