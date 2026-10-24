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
};

export type SearchParseResponse =
  | {
      status: "ok";
      filters: SearchFiltersResponse;
      chips: SearchChipResponse[];
    }
  // No category found. The rest of what was understood (price, day, area) is
  // kept, so it still applies once the user picks a category.
  | {
      status: "clarify";
      categories: CategoryResponse[];
      filters: Pick<SearchFiltersResponse, "priceMax">;
      chips: SearchChipResponse[];
    };
