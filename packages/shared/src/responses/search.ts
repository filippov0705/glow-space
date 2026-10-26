import type { SearchChipKind } from "../types/search.js";
import type { CategoryResponse } from "./masters.js";

export type SearchSuggestionResponse = {
  id: string;
  text: string;
};

export type SearchChipResponse = {
  kind: SearchChipKind;
  label: string;
};

export type SearchFiltersResponse = {
  category?: string;
  subcategory?: string;
  priceMax?: number; // in cents
  // Point of the area chip, for the nearest sort
  origin?: { lat: number; lng: number };
  // Local dates of the day chip, YYYY-MM-DD, inclusive
  dateFrom?: string;
  dateTo?: string;
};

export type SearchParseResponse =
  | {
      status: "ok";
      filters: SearchFiltersResponse;
      chips: SearchChipResponse[];
      // The origin came from Geoapify, so its attribution must be shown
      geocoded: boolean;
    }
  // No category found. The rest of what was understood (price, day, area) is
  // kept, so it still applies once the user picks a category.
  | {
      status: "clarify";
      categories: CategoryResponse[];
      filters: Pick<SearchFiltersResponse, "priceMax" | "origin" | "dateFrom" | "dateTo">;
      chips: SearchChipResponse[];
      geocoded: boolean;
    };
