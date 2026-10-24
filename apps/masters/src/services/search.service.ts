import { Injectable } from '@nestjs/common';
import { SuggestionLocale } from '@glow-space/shared';
import { Category, SearchSuggestion, Subcategory } from 'src/generated/prisma';
import SearchSuggestionRepository from '../repository/search-suggestion.repository';
import CategoryRepository from '../repository/category.repository';
import { SearchParseQueryDTO } from 'src/dto/search-parse-query.dto';

export const SUGGESTIONS_LIMIT = 6;
const FALLBACK_LOCALE: SuggestionLocale = 'en';

// What is understood besides the category, in both outcomes. `day` and `area`
// are display labels only: there is no data to filter by.
export type SearchExtras = {
  priceMax: number | null; // in cents
  day: string | null;
  area: string | null;
};

export type SearchParseResult = SearchExtras &
  (
    | { status: 'ok'; category: Category; subcategory: Subcategory | null }
    | { status: 'clarify'; categories: Category[] }
  );

type TermCandidate = {
  term: string;
  category: Category;
  subcategory: Subcategory | null;
};

const NOT_WORD_BEFORE = '(?<![\\p{L}\\p{N}])';
const NOT_WORD_AFTER = '(?![\\p{L}\\p{N}])';

// An amount like `35`, `25.50`, `25,50` or `1,000` (a comma before three
// digits is a thousands separator). Groups: integer part, decimal part.
const AMOUNT = '(\\d{1,3}(?:,\\d{3})+|\\d+)(?:[.,](\\d{1,2}))?(?!\\d)';
const CURRENCY_AFTER = `\\s*(?:€|eur${NOT_WORD_AFTER})`;

// "up to" and "max" need a currency, so "up to 10 nails" is not a price.
const PRICE_PATTERNS = [
  new RegExp(`${NOT_WORD_BEFORE}(?:under|below|до)\\s*€?\\s*${AMOUNT}`, 'u'),
  new RegExp(
    `${NOT_WORD_BEFORE}(?:up to|max)\\s*(?:€\\s*${AMOUNT}|${AMOUNT}${CURRENCY_AFTER})`,
    'u',
  ),
];

const DAYS: { word: string; label: string }[] = [
  { word: 'today', label: 'Today' },
  { word: 'tomorrow', label: 'Tomorrow' },
  { word: 'monday', label: 'Monday' },
  { word: 'tuesday', label: 'Tuesday' },
  { word: 'wednesday', label: 'Wednesday' },
  { word: 'thursday', label: 'Thursday' },
  { word: 'friday', label: 'Friday' },
  { word: 'saturday', label: 'Saturday' },
  { word: 'sunday', label: 'Sunday' },
  { word: 'weekend', label: 'Weekend' },
];

const AREAS: { word: string; label: string }[] = [
  { word: 'center', label: 'Near center' },
  { word: 'centre', label: 'Near center' },
  { word: 'old town', label: 'Near Old Town' },
];

// Mock: words that point to a subcategory without naming it, by category and
// subcategory slug from the seed. An alias match beats any plain name match.
const SUBCATEGORY_ALIASES: {
  word: string;
  category: string;
  subcategory: string;
}[] = [{ word: 'gel', category: 'nails', subcategory: 'gel-polish' }];

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Position of `term` in `text` as a whole word or phrase, or -1.
const wordIndex = (text: string, term: string): number =>
  text.search(
    new RegExp(
      `${NOT_WORD_BEFORE}${escapeRegExp(term.toLowerCase())}${NOT_WORD_AFTER}`,
      'u',
    ),
  );

// The label of the word that occurs first in `text`.
const firstLabel = (
  text: string,
  words: { word: string; label: string }[],
): string | null => {
  let best: { index: number; label: string } | null = null;
  for (const { word, label } of words) {
    const index = wordIndex(text, word);
    if (index >= 0 && (!best || index < best.index)) {
      best = { index, label };
    }
  }

  return best?.label ?? null;
};

const parsePriceMax = (text: string): number | null => {
  let earliest: RegExpExecArray | null = null;
  for (const pattern of PRICE_PATTERNS) {
    const match = pattern.exec(text);
    if (match && (!earliest || match.index < earliest.index)) {
      earliest = match;
    }
  }
  if (!earliest) {
    return null;
  }

  // Only one alternative of a pattern matches, so take its pair of groups.
  const groups = earliest.slice(1);
  const pairStart = groups.findIndex((group) => group !== undefined);
  const integer = groups[pairStart].replace(/,/g, '');
  const decimal = groups[pairStart + 1] ?? '0';
  const cents = Math.round(Number(`${integer}.${decimal}`) * 100);
  return cents >= 1 ? cents : null;
};

// The longest matched term wins. On a tie the earlier candidate stays.
const longestMatch = (
  text: string,
  candidates: TermCandidate[],
): TermCandidate | null => {
  let match: TermCandidate | null = null;
  for (const candidate of candidates) {
    if (
      (!match || candidate.term.length > match.term.length) &&
      wordIndex(text, candidate.term) >= 0
    ) {
      match = candidate;
    }
  }

  return match;
};

@Injectable()
class SearchService {
  constructor(
    private readonly searchSuggestionRepository: SearchSuggestionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  // An unknown city is not an error: it matches only global suggestions.
  async getSuggestions(
    locale: SuggestionLocale,
    citySlug?: string,
  ): Promise<SearchSuggestion[]> {
    const suggestions = await this.searchSuggestionRepository.findActive(
      locale,
      citySlug,
      SUGGESTIONS_LIMIT,
    );
    if (suggestions.length > 0 || locale === FALLBACK_LOCALE) {
      return suggestions;
    }

    return await this.searchSuggestionRepository.findActive(
      FALLBACK_LOCALE,
      citySlug,
      SUGGESTIONS_LIMIT,
    );
  }

  // Mock: replaced by an LLM later. `query.city` is unused here, the LLM
  // version will need it.
  async parse(query: SearchParseQueryDTO): Promise<SearchParseResult> {
    const text = query.q.toLowerCase();
    const [categories, subcategories] = await Promise.all([
      this.categoryRepository.findAll(),
      this.categoryRepository.findAllSubcategories(),
    ]);

    const categoryCandidates: TermCandidate[] = categories.flatMap(
      (category) => [
        { term: category.name, category, subcategory: null },
        { term: category.slug, category, subcategory: null },
      ],
    );
    const subcategoryCandidates: TermCandidate[] = [];
    const aliasCandidates: TermCandidate[] = [];
    for (const subcategory of subcategories) {
      const category = categories.find(
        (candidate) => candidate.id === subcategory.categoryId,
      );
      if (!category) {
        continue;
      }
      subcategoryCandidates.push({
        term: subcategory.name,
        category,
        subcategory,
      });
      for (const alias of SUBCATEGORY_ALIASES) {
        if (
          alias.category === category.slug &&
          alias.subcategory === subcategory.slug
        ) {
          aliasCandidates.push({ term: alias.word, category, subcategory });
        }
      }
    }

    // Categories go first, so a category beats a subcategory of the same name
    // in another category ("bridal" is a category and a makeup subcategory).
    let match =
      longestMatch(text, aliasCandidates) ??
      longestMatch(text, [...categoryCandidates, ...subcategoryCandidates]);

    // A subcategory of the matched category is more specific than it.
    if (match && !match.subcategory) {
      const matchedCategory = match.category;
      match =
        longestMatch(
          text,
          subcategoryCandidates.filter(
            (candidate) => candidate.category.id === matchedCategory.id,
          ),
        ) ?? match;
    }

    // Kept on clarify too, so they apply once the user picks a category.
    const extras: SearchExtras = {
      priceMax: parsePriceMax(text),
      day: firstLabel(text, DAYS),
      area: firstLabel(text, AREAS),
    };
    if (!match) {
      return { status: 'clarify', categories, ...extras };
    }

    const { category, subcategory } = match;
    return { status: 'ok', category, subcategory, ...extras };
  }
}

export default SearchService;
