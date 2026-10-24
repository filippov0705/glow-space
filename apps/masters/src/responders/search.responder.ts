import { Injectable } from '@nestjs/common';
import {
  SearchChipResponse,
  SearchFiltersResponse,
  SearchParseResponse,
  SearchSuggestionResponse,
} from '@glow-space/shared';
import { SearchSuggestion } from 'src/generated/prisma';
import { SearchExtras, SearchParseResult } from '../services/search.service';
import CategoryResponder from './category.responder';

const euros = (cents: number): string =>
  `€${Number.isInteger(cents / 100) ? cents / 100 : (cents / 100).toFixed(2)}`;

@Injectable()
class SearchResponder {
  constructor(private readonly categoryResponder: CategoryResponder) {}

  suggestionResponse(suggestion: SearchSuggestion): SearchSuggestionResponse {
    return {
      id: suggestion.id,
      text: suggestion.text,
    };
  }

  // Chips go in a fixed order: category, subcategory, priceMax, day, area.
  parseResponse(result: SearchParseResult): SearchParseResponse {
    const extras = this.extrasResponse(result);

    if (result.status === 'clarify') {
      return {
        status: 'clarify',
        categories: result.categories.map((category) =>
          this.categoryResponder.categoryResponse(category),
        ),
        ...extras,
      };
    }

    const filters: SearchFiltersResponse = { category: result.category.slug };
    const chips: SearchChipResponse[] = [
      { kind: 'category', label: result.category.name },
    ];
    if (result.subcategory) {
      filters.subcategory = result.subcategory.slug;
      chips.push({ kind: 'subcategory', label: result.subcategory.name });
    }

    return {
      status: 'ok',
      filters: { ...filters, ...extras.filters },
      chips: [...chips, ...extras.chips],
    };
  }

  // Filters and chips for the price, day and area, shared by both outcomes.
  private extrasResponse(extras: SearchExtras): {
    filters: Pick<SearchFiltersResponse, 'priceMax'>;
    chips: SearchChipResponse[];
  } {
    const filters: Pick<SearchFiltersResponse, 'priceMax'> = {};
    const chips: SearchChipResponse[] = [];
    if (extras.priceMax !== null) {
      filters.priceMax = extras.priceMax;
      chips.push({
        kind: 'priceMax',
        label: `Up to ${euros(extras.priceMax)}`,
      });
    }
    if (extras.day) {
      chips.push({ kind: 'day', label: extras.day });
    }
    if (extras.area) {
      chips.push({ kind: 'area', label: extras.area });
    }

    return { filters, chips };
  }
}

export default SearchResponder;
