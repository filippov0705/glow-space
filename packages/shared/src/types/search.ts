export const SUGGESTION_LOCALES = ["en", "ru", "lt"] as const;

export type SuggestionLocale = (typeof SUGGESTION_LOCALES)[number];

export const SEARCH_CHIP_KINDS = [
  "category",
  "subcategory",
  "priceMax",
  "day",
  "area",
] as const;

export type SearchChipKind = (typeof SEARCH_CHIP_KINDS)[number];
