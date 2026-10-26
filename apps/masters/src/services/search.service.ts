import { Injectable, NotFoundException } from '@nestjs/common';
import { CITIES, CitySeed, SuggestionLocale } from '@glow-space/shared';
import { Category, SearchSuggestion, Subcategory } from 'src/generated/prisma';
import SearchSuggestionRepository from '../repository/search-suggestion.repository';
import CategoryRepository from '../repository/category.repository';
import { SearchParseQueryDTO } from 'src/dto/search-parse-query.dto';
import GeocodingService from './geocoding.service';
import { Coordinates } from '../utils/haversine';
import { addDays, LocalNow, localNow } from '../utils/local-time';

export const SUGGESTIONS_LIMIT = 6;
const FALLBACK_LOCALE: SuggestionLocale = 'en';

// What is understood besides the category, in both outcomes. `day` and `area`
// are chip labels; the dates and the origin are what filters by them.
export type SearchExtras = {
  priceMax: number | null; // in cents
  day: string | null;
  dateFrom: string | null; // local YYYY-MM-DD, inclusive
  dateTo: string | null;
  area: string | null;
  // Null when the place was not found: the area chip is then display-only.
  origin: Coordinates | null;
  // The origin came from Geoapify, whose attribution must be shown.
  geocoded: boolean;
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

type DayWord = {
  word: string;
  label: string;
  // First and last day, as offsets from today, inclusive.
  offsets: (now: LocalNow) => [number, number];
};

// The next such weekday, today included.
const nextWeekday =
  (weekday: number) =>
  (now: LocalNow): [number, number] => {
    const offset = (weekday - now.weekday + 7) % 7;
    return [offset, offset];
  };

const DAYS: DayWord[] = [
  { word: 'today', label: 'Today', offsets: () => [0, 0] },
  { word: 'tomorrow', label: 'Tomorrow', offsets: () => [1, 1] },
  { word: 'monday', label: 'Monday', offsets: nextWeekday(1) },
  { word: 'tuesday', label: 'Tuesday', offsets: nextWeekday(2) },
  { word: 'wednesday', label: 'Wednesday', offsets: nextWeekday(3) },
  { word: 'thursday', label: 'Thursday', offsets: nextWeekday(4) },
  { word: 'friday', label: 'Friday', offsets: nextWeekday(5) },
  { word: 'saturday', label: 'Saturday', offsets: nextWeekday(6) },
  { word: 'sunday', label: 'Sunday', offsets: nextWeekday(7) },
  // The next Saturday and Sunday; on Sunday only Sunday is left.
  {
    word: 'weekend',
    label: 'Weekend',
    offsets: (now) =>
      now.weekday === 7 ? [0, 0] : [6 - now.weekday, 7 - now.weekday],
  },
];

// Fixed areas, measured from the city's coordinates (its centre, the old town
// in the seeded cities). No geocoder call.
const AREAS: { word: string; label: string }[] = [
  { word: 'center', label: 'Near center' },
  { word: 'centre', label: 'Near center' },
  { word: 'центр', label: 'Near center' },
  { word: 'центре', label: 'Near center' },
  { word: 'центра', label: 'Near center' },
  { word: 'центру', label: 'Near center' },
  { word: 'центром', label: 'Near center' },
  { word: 'old town', label: 'Near Old Town' },
];

// Any other place: the text after one of these, up to a comma or semicolon.
// A dot doesn't end it, since addresses have them ("Panerių g. 45").
const NEAR = new RegExp(
  `${NOT_WORD_BEFORE}(?:near|close to|next to|рядом с|возле|около|недалеко от)\\s+([^,;]+)`,
  'iu',
);
// Where the place ends inside its clause: "near Paneriu 45 on saturday".
const PLACE_END = new RegExp(
  `\\s+(?:on|for|under|below|up to|max|до|${DAYS.map(({ word }) => word).join('|')})${NOT_WORD_AFTER}`,
  'iu',
);
// The user's own location is the browser's job, not the geocoder's.
const NOT_PLACES = ['me', 'here', 'you'];

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

// The entry whose word occurs first in `text`.
const firstMatch = <T extends { word: string }>(
  text: string,
  words: T[],
): T | null => {
  let best: { index: number; entry: T } | null = null;
  for (const entry of words) {
    const index = wordIndex(text, entry.word);
    if (index >= 0 && (!best || index < best.index)) {
      best = { index, entry };
    }
  }

  return best?.entry ?? null;
};

// The place after "near" and the like, in the query's own case, or null.
const parsePlace = (query: string): string | null => {
  const match = NEAR.exec(query);
  if (!match) {
    return null;
  }

  const clause = match[1];
  const end = clause.search(PLACE_END);
  const place = (end >= 0 ? clause.slice(0, end) : clause)
    .trim()
    .replace(/^the\s+/i, '');
  if (
    !/[\p{L}\p{N}]/u.test(place) ||
    NOT_PLACES.includes(place.toLowerCase())
  ) {
    return null;
  }

  return place;
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
    private readonly geocodingService: GeocodingService,
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

  // Mock: replaced by an LLM later. The city gives the timezone for day words
  // and the point a place is looked up around.
  async parse(query: SearchParseQueryDTO): Promise<SearchParseResult> {
    const city = CITIES.find((candidate) => candidate.slug === query.city);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const text = query.q.toLowerCase();
    const [categories, subcategories, area] = await Promise.all([
      this.categoryRepository.findAll(),
      this.categoryRepository.findAllSubcategories(),
      this.parseArea(query.q, city),
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
      ...this.parseDay(text, localNow(city.timezone)),
      ...area,
    };
    if (!match) {
      return { status: 'clarify', categories, ...extras };
    }

    const { category, subcategory } = match;
    return { status: 'ok', category, subcategory, ...extras };
  }

  private parseDay(
    text: string,
    now: LocalNow,
  ): Pick<SearchExtras, 'day' | 'dateFrom' | 'dateTo'> {
    const day = firstMatch(text, DAYS);
    if (!day) {
      return { day: null, dateFrom: null, dateTo: null };
    }

    const [from, to] = day.offsets(now);
    return {
      day: day.label,
      dateFrom: addDays(now.date, from),
      dateTo: addDays(now.date, to),
    };
  }

  // A fixed area beats a place, so "near the center" never reaches the geocoder.
  private async parseArea(
    query: string,
    city: CitySeed,
  ): Promise<Pick<SearchExtras, 'area' | 'origin' | 'geocoded'>> {
    const fixed = firstMatch(query.toLowerCase(), AREAS);
    if (fixed) {
      return {
        area: fixed.label,
        origin: { lat: city.lat, lng: city.lng },
        geocoded: false,
      };
    }

    const place = parsePlace(query);
    if (!place) {
      return { area: null, origin: null, geocoded: false };
    }

    const found = await this.geocodingService.geocode(place, city);
    if (!found) {
      return { area: `Near ${place}`, origin: null, geocoded: false };
    }

    return {
      area: `Near ${found.label}`,
      origin: { lat: found.lat, lng: found.lng },
      geocoded: true,
    };
  }
}

export default SearchService;
