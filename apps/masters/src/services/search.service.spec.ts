import { NotFoundException } from '@nestjs/common';
import SearchService from './search.service';
import SearchSuggestionRepository from '../repository/search-suggestion.repository';
import CategoryRepository from '../repository/category.repository';
import GeocodingService from './geocoding.service';
import { Category, SearchSuggestion, Subcategory } from 'src/generated/prisma';

describe('SearchService', () => {
  const ruRows = [{ id: 'ru-1', text: 'Маникюр' }] as SearchSuggestion[];
  const enRows = [{ id: 'en-1', text: 'Gel manicure' }] as SearchSuggestion[];
  let searchSuggestionRepository: { findActive: jest.Mock };
  let categoryRepository: {
    findAll: jest.Mock;
    findAllSubcategories: jest.Mock;
  };
  let geocodingService: { geocode: jest.Mock };
  let service: SearchService;

  beforeEach(() => {
    searchSuggestionRepository = { findActive: jest.fn() };
    categoryRepository = {
      findAll: jest.fn(),
      findAllSubcategories: jest.fn(),
    };
    geocodingService = { geocode: jest.fn().mockResolvedValue(null) };
    service = new SearchService(
      searchSuggestionRepository as unknown as SearchSuggestionRepository,
      categoryRepository as unknown as CategoryRepository,
      geocodingService as unknown as GeocodingService,
    );
  });

  describe('getSuggestions', () => {
    it('returns suggestions for the locale and city, up to 6', async () => {
      searchSuggestionRepository.findActive.mockResolvedValue(ruRows);

      await expect(service.getSuggestions('ru', 'vilnius')).resolves.toBe(
        ruRows,
      );
      expect(searchSuggestionRepository.findActive).toHaveBeenCalledTimes(1);
      expect(searchSuggestionRepository.findActive).toHaveBeenCalledWith(
        'ru',
        'vilnius',
        6,
      );
    });

    it('falls back to en when the locale has no suggestions', async () => {
      searchSuggestionRepository.findActive
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(enRows);

      await expect(service.getSuggestions('lt', 'vilnius')).resolves.toBe(
        enRows,
      );
      expect(searchSuggestionRepository.findActive).toHaveBeenNthCalledWith(
        2,
        'en',
        'vilnius',
        6,
      );
    });

    it('does not query again when en itself is empty', async () => {
      searchSuggestionRepository.findActive.mockResolvedValue([]);

      await expect(service.getSuggestions('en')).resolves.toEqual([]);
      expect(searchSuggestionRepository.findActive).toHaveBeenCalledTimes(1);
      expect(searchSuggestionRepository.findActive).toHaveBeenCalledWith(
        'en',
        undefined,
        6,
      );
    });
  });

  describe('parse', () => {
    const nails = { id: 1, slug: 'nails', name: 'Nails' } as Category;
    const makeup = { id: 4, slug: 'makeup', name: 'Makeup' } as Category;
    const bridal = { id: 11, slug: 'bridal', name: 'Bridal' } as Category;
    const massage = { id: 6, slug: 'massage', name: 'Massage' } as Category;
    const categories = [nails, makeup, massage, bridal];
    const manicure = {
      id: 10,
      categoryId: 1,
      slug: 'manicure',
      name: 'Manicure',
    } as Subcategory;
    const nailArt = {
      id: 11,
      categoryId: 1,
      slug: 'nail-art',
      name: 'Nail art',
    } as Subcategory;
    const bridalMakeup = {
      id: 20,
      categoryId: 4,
      slug: 'bridal',
      name: 'Bridal',
    } as Subcategory;
    const sports = {
      id: 30,
      categoryId: 6,
      slug: 'sports',
      name: 'Sports',
    } as Subcategory;
    const eveningMakeup = {
      id: 21,
      categoryId: 4,
      slug: 'evening-makeup',
      name: 'Evening makeup',
    } as Subcategory;

    // From the CITIES seed.
    const vilniusCentre = { lat: 54.6872, lng: 25.2797 };
    const noArea = { area: null, origin: null, geocoded: false };
    const noDay = { day: null, dateFrom: null, dateTo: null };

    beforeEach(() => {
      // Wednesday 2026-10-21, 12:00 in Vilnius.
      jest.useFakeTimers({ now: new Date('2026-10-21T09:00:00Z') });
      categoryRepository.findAll.mockResolvedValue(categories);
      categoryRepository.findAllSubcategories.mockResolvedValue([
        manicure,
        nailArt,
        bridalMakeup,
        eveningMakeup,
        sports,
      ]);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const parse = (q: string) => service.parse({ q, city: 'vilnius' });

    it('parses the mockup query with the seeded nails subcategories', async () => {
      const seededNails = [
        'Manicure',
        'Pedicure',
        'Gel polish',
        'Extensions',
        'Nail art',
        'Nail repair',
      ].map((name, index) => ({
        id: 100 + index,
        categoryId: nails.id,
        slug: name.toLowerCase().replace(/ /g, '-'),
        name,
        sortOrder: index + 1,
      }));
      categoryRepository.findAllSubcategories.mockResolvedValue(seededNails);

      await expect(
        parse('Gel manicure with glitter, under €35, Saturday near the center'),
      ).resolves.toEqual({
        status: 'ok',
        category: nails,
        subcategory: seededNails[2],
        priceMax: 3500,
        day: 'Saturday',
        dateFrom: '2026-10-24',
        dateTo: '2026-10-24',
        area: 'Near center',
        origin: vilniusCentre,
        geocoded: false,
      });
      expect(geocodingService.geocode).not.toHaveBeenCalled();
    });

    it('asks to clarify with all categories when nothing matches', async () => {
      await expect(parse('Something beautiful for tomorrow')).resolves.toEqual({
        status: 'clarify',
        categories,
        priceMax: null,
        day: 'Tomorrow',
        dateFrom: '2026-10-22',
        dateTo: '2026-10-22',
        ...noArea,
      });
    });

    it('keeps the price, day and area when asking to clarify', async () => {
      await expect(
        parse('something nice under €30 on saturday in the centre'),
      ).resolves.toEqual({
        status: 'clarify',
        categories,
        priceMax: 3000,
        day: 'Saturday',
        dateFrom: '2026-10-24',
        dateTo: '2026-10-24',
        area: 'Near center',
        origin: vilniusCentre,
        geocoded: false,
      });
    });

    it('matches a category by name or slug without a subcategory', async () => {
      await expect(parse('NAILS please')).resolves.toMatchObject({
        status: 'ok',
        category: nails,
        subcategory: null,
        priceMax: null,
        ...noDay,
        ...noArea,
      });
    });

    it('prefers the longest match, and a subcategory sets its category', async () => {
      await expect(
        parse('nails: evening makeup or nail art'),
      ).resolves.toMatchObject({
        category: makeup,
        subcategory: eveningMakeup,
      });
    });

    it('prefers a subcategory of the matched category over the category', async () => {
      await expect(parse('massage sports')).resolves.toMatchObject({
        category: massage,
        subcategory: sports,
      });
    });

    it('prefers a category over a subcategory of the same name', async () => {
      await expect(parse('bridal look')).resolves.toMatchObject({
        category: bridal,
        subcategory: null,
      });
    });

    it('matches whole words only', async () => {
      await expect(parse('fingernails tomorrow')).resolves.toMatchObject({
        status: 'clarify',
        categories,
      });
    });

    it.each([
      ['manicure under €35', 3500],
      ['manicure under 35€', 3500],
      ['manicure up to 35 eur', 3500],
      ['manicure below 40', 4000],
      ['manicure max €25.50', 2550],
      ['manicure max 25,50 eur', 2550],
      ['manicure under €1,000', 100000],
      ['manicure up to €1,000.50', 100050],
      ['маникюр manicure до 30€', 3000],
    ])('parses the price in "%s"', async (q, priceMax) => {
      await expect(parse(q)).resolves.toMatchObject({ priceMax });
    });

    it.each([
      'manicure for €35',
      'manicure under €0',
      'nail art up to 10 nails',
      'manicure max 2 hours',
    ])('ignores the price in "%s"', async (q) => {
      await expect(parse(q)).resolves.toMatchObject({ priceMax: null });
    });

    it('returns the first day word and the old town area', async () => {
      await expect(
        parse('manicure this weekend or tomorrow in the old town'),
      ).resolves.toMatchObject({
        day: 'Weekend',
        area: 'Near Old Town',
        origin: vilniusCentre,
      });
    });

    it('throws NotFoundException for an unknown city', async () => {
      await expect(
        service.parse({ q: 'manicure', city: 'atlantis' }),
      ).rejects.toThrow(NotFoundException);
    });

    describe('day', () => {
      it.each([
        ['today', '2026-10-21', '2026-10-21'],
        ['tomorrow', '2026-10-22', '2026-10-22'],
        ['wednesday', '2026-10-21', '2026-10-21'],
        ['monday', '2026-10-26', '2026-10-26'],
        ['sunday', '2026-10-25', '2026-10-25'],
        ['weekend', '2026-10-24', '2026-10-25'],
      ])('turns "%s" into %s..%s', async (word, dateFrom, dateTo) => {
        await expect(parse(`manicure ${word}`)).resolves.toMatchObject({
          dateFrom,
          dateTo,
        });
      });

      it('leaves only Sunday of the weekend on a Sunday', async () => {
        jest.setSystemTime(new Date('2026-10-25T09:00:00Z'));

        await expect(parse('manicure weekend')).resolves.toMatchObject({
          dateFrom: '2026-10-25',
          dateTo: '2026-10-25',
        });
      });

      it("takes today in the city's timezone, not the server's", async () => {
        // Tuesday 22:30 UTC is already Wednesday 01:30 in Vilnius.
        jest.setSystemTime(new Date('2026-10-20T22:30:00Z'));

        await expect(parse('manicure today')).resolves.toMatchObject({
          dateFrom: '2026-10-21',
        });
      });
    });

    describe('place', () => {
      const panerių = {
        lat: 54.6683162,
        lng: 25.2634164,
        label: 'Panerių g. 45',
      };

      it('geocodes the place around the city and uses it as the origin', async () => {
        geocodingService.geocode.mockResolvedValue(panerių);

        await expect(
          parse('Gel manicure near Paneriu 45, under €35, Saturday'),
        ).resolves.toMatchObject({
          priceMax: 3500,
          day: 'Saturday',
          area: 'Near Panerių g. 45',
          origin: { lat: 54.6683162, lng: 25.2634164 },
          geocoded: true,
        });
        expect(geocodingService.geocode).toHaveBeenCalledWith(
          'Paneriu 45',
          expect.objectContaining(vilniusCentre),
        );
      });

      it.each([
        ['manicure near Paneriu 45 on saturday', 'Paneriu 45'],
        ['manicure close to Panerių g. 45', 'Panerių g. 45'],
        ['manicure near the Akropolis tomorrow', 'Akropolis'],
        ['маникюр недалеко от Вокзальной 5, до 30€', 'Вокзальной 5'],
        ['маникюр рядом с Акрополисом', 'Акрополисом'],
      ])('extracts the place from "%s"', async (q, place) => {
        await parse(q);

        expect(geocodingService.geocode).toHaveBeenCalledWith(
          place,
          expect.anything(),
        );
      });

      it('keeps a display-only chip when the place is not found', async () => {
        await expect(parse('manicure near Nowhere 1')).resolves.toMatchObject({
          area: 'Near Nowhere 1',
          origin: null,
          geocoded: false,
        });
      });

      it('uses the city centre for "центр" without the geocoder', async () => {
        await expect(parse('маникюр рядом с центром')).resolves.toMatchObject({
          area: 'Near center',
          origin: vilniusCentre,
        });
        expect(geocodingService.geocode).not.toHaveBeenCalled();
      });

      it('leaves "near me" to the browser location', async () => {
        await expect(parse('manicure near me')).resolves.toMatchObject(noArea);
        expect(geocodingService.geocode).not.toHaveBeenCalled();
      });
    });
  });
});
