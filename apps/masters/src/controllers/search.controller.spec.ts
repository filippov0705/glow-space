import SearchController from './search.controller';
import SearchService from '../services/search.service';
import SearchResponder from '../responders/search.responder';
import CategoryResponder from '../responders/category.responder';
import MasterResponder from '../responders/master.responder';
import { Category, SearchSuggestion } from 'src/generated/prisma';

const responder = () =>
  new SearchResponder(new CategoryResponder(new MasterResponder()));

describe('SearchController', () => {
  it('returns suggestions as id and text in service order', async () => {
    const searchService = {
      getSuggestions: jest.fn().mockResolvedValue([
        {
          id: 'b',
          text: 'Manicure in Old Town tomorrow morning',
          locale: 'en',
          citySlug: 'vilnius',
          sortOrder: 15,
          isActive: true,
        },
        {
          id: 'a',
          text: 'Gel manicure under €30',
          locale: 'en',
          citySlug: null,
          sortOrder: 20,
          isActive: true,
        },
      ] as SearchSuggestion[]),
    };
    const controller = new SearchController(
      searchService as unknown as SearchService,
      responder(),
    );

    await expect(
      controller.getSuggestions({ locale: 'en', city: 'vilnius' }),
    ).resolves.toEqual([
      { id: 'b', text: 'Manicure in Old Town tomorrow morning' },
      { id: 'a', text: 'Gel manicure under €30' },
    ]);
    expect(searchService.getSuggestions).toHaveBeenCalledWith('en', 'vilnius');
  });

  it('passes an omitted city as undefined', async () => {
    const searchService = { getSuggestions: jest.fn().mockResolvedValue([]) };
    const controller = new SearchController(
      searchService as unknown as SearchService,
      responder(),
    );

    await expect(controller.getSuggestions({ locale: 'lt' })).resolves.toEqual(
      [],
    );
    expect(searchService.getSuggestions).toHaveBeenCalledWith('lt', undefined);
  });

  describe('parse', () => {
    const nails = {
      id: 1,
      slug: 'nails',
      name: 'Nails',
      imageUrl: 'https://img/nails',
      sortOrder: 1,
    } as Category;
    const hair = {
      id: 2,
      slug: 'hair',
      name: 'Hair',
      imageUrl: null,
      sortOrder: 2,
    } as Category;

    it('returns filters and chips in a fixed order', async () => {
      const searchService = {
        parse: jest.fn().mockResolvedValue({
          status: 'ok',
          category: nails,
          subcategory: {
            id: 10,
            categoryId: 1,
            slug: 'manicure',
            name: 'Manicure',
            sortOrder: 1,
          },
          priceMax: 3500,
          day: 'Saturday',
          dateFrom: '2026-10-24',
          dateTo: '2026-10-24',
          area: 'Near Panerių g. 45',
          origin: { lat: 54.668, lng: 25.263 },
          geocoded: true,
        }),
      };
      const controller = new SearchController(
        searchService as unknown as SearchService,
        responder(),
      );
      const query = { q: 'Gel manicure', city: 'vilnius' };

      await expect(controller.parse(query)).resolves.toEqual({
        status: 'ok',
        filters: {
          category: 'nails',
          subcategory: 'manicure',
          priceMax: 3500,
          dateFrom: '2026-10-24',
          dateTo: '2026-10-24',
          origin: { lat: 54.668, lng: 25.263 },
        },
        chips: [
          { kind: 'category', label: 'Nails' },
          { kind: 'subcategory', label: 'Manicure' },
          { kind: 'priceMax', label: 'Up to €35' },
          { kind: 'day', label: 'Saturday' },
          { kind: 'area', label: 'Near Panerių g. 45' },
        ],
        geocoded: true,
      });
      expect(searchService.parse).toHaveBeenCalledWith(query);
    });

    it('omits filters and chips that were not found', async () => {
      const searchService = {
        parse: jest.fn().mockResolvedValue({
          status: 'ok',
          category: nails,
          subcategory: null,
          priceMax: 2550,
          day: null,
          dateFrom: null,
          dateTo: null,
          area: null,
          origin: null,
          geocoded: false,
        }),
      };
      const controller = new SearchController(
        searchService as unknown as SearchService,
        responder(),
      );

      await expect(
        controller.parse({ q: 'nails', city: 'vilnius' }),
      ).resolves.toEqual({
        status: 'ok',
        filters: { category: 'nails', priceMax: 2550 },
        chips: [
          { kind: 'category', label: 'Nails' },
          { kind: 'priceMax', label: 'Up to €25.50' },
        ],
        geocoded: false,
      });
    });

    it('returns the clarify categories as slug, name and imageUrl', async () => {
      const searchService = {
        parse: jest.fn().mockResolvedValue({
          status: 'clarify',
          categories: [nails, hair],
          priceMax: null,
          day: null,
          dateFrom: null,
          dateTo: null,
          area: null,
          origin: null,
          geocoded: false,
        }),
      };
      const controller = new SearchController(
        searchService as unknown as SearchService,
        responder(),
      );

      await expect(
        controller.parse({ q: 'something', city: 'vilnius' }),
      ).resolves.toEqual({
        status: 'clarify',
        categories: [
          { slug: 'nails', name: 'Nails', imageUrl: 'https://img/nails' },
          { slug: 'hair', name: 'Hair', imageUrl: null },
        ],
        filters: {},
        chips: [],
        geocoded: false,
      });
    });

    it('returns the price, day and area filters and chips with clarify', async () => {
      const searchService = {
        parse: jest.fn().mockResolvedValue({
          status: 'clarify',
          categories: [nails],
          priceMax: 3000,
          day: 'Saturday',
          dateFrom: '2026-10-24',
          dateTo: '2026-10-24',
          area: 'Near center',
          origin: { lat: 54.6872, lng: 25.2797 },
          geocoded: false,
        }),
      };
      const controller = new SearchController(
        searchService as unknown as SearchService,
        responder(),
      );

      await expect(
        controller.parse({ q: 'something', city: 'vilnius' }),
      ).resolves.toEqual({
        status: 'clarify',
        categories: [
          { slug: 'nails', name: 'Nails', imageUrl: 'https://img/nails' },
        ],
        filters: {
          priceMax: 3000,
          dateFrom: '2026-10-24',
          dateTo: '2026-10-24',
          origin: { lat: 54.6872, lng: 25.2797 },
        },
        chips: [
          { kind: 'priceMax', label: 'Up to €30' },
          { kind: 'day', label: 'Saturday' },
          { kind: 'area', label: 'Near center' },
        ],
        geocoded: false,
      });
    });
  });
});
