import { BadRequestException, NotFoundException } from '@nestjs/common';
import MasterService, { MastersListQuery } from './master.service';
import CityService from './city.service';
import CategoryService from './category.service';
import CityRepository from '../repository/city.repository';
import CategoryRepository from '../repository/category.repository';
import MasterRepository, { MasterCard } from '../repository/master.repository';
import { Category, City, Subcategory } from 'src/generated/prisma';

const card = (id: number) => ({ id }) as MasterCard;

describe('MasterService', () => {
  const city = {
    id: 1,
    slug: 'vilnius',
    lat: 54.6872,
    lng: 25.2797,
  } as City;
  const category = { id: 5, slug: 'nails' } as Category;
  const subcategory = { id: 10, slug: 'gel' } as Subcategory;
  let cityRepository: { findBySlug: jest.Mock };
  let categoryRepository: {
    findBySlug: jest.Mock;
    findSubcategoryBySlug: jest.Mock;
  };
  let masterRepository: {
    findTopRatedCards: jest.Mock;
    findRandomUnratedIds: jest.Mock;
    findCardsByIds: jest.Mock;
    findCategoryCardsByIds: jest.Mock;
    findActiveCardsByCity: jest.Mock;
    findPage: jest.Mock;
  };
  let service: MasterService;

  beforeEach(() => {
    cityRepository = { findBySlug: jest.fn().mockResolvedValue(city) };
    categoryRepository = {
      findBySlug: jest.fn().mockResolvedValue(category),
      findSubcategoryBySlug: jest.fn().mockResolvedValue(subcategory),
    };
    masterRepository = {
      findTopRatedCards: jest.fn(),
      findRandomUnratedIds: jest.fn(),
      findCardsByIds: jest.fn(),
      findCategoryCardsByIds: jest.fn(),
      findActiveCardsByCity: jest.fn(),
      findPage: jest.fn(),
    };
    const cityService = new CityService(
      cityRepository as unknown as CityRepository,
    );
    service = new MasterService(
      cityService,
      new CategoryService(
        categoryRepository as unknown as CategoryRepository,
        cityService,
        masterRepository as unknown as MasterRepository,
      ),
      masterRepository as unknown as MasterRepository,
    );
  });

  describe('getTop', () => {
    it('returns only rated masters when there are enough of them', async () => {
      masterRepository.findTopRatedCards.mockResolvedValue([card(1), card(2)]);

      await expect(service.getTop('vilnius', 2)).resolves.toEqual([
        card(1),
        card(2),
      ]);
      expect(masterRepository.findTopRatedCards).toHaveBeenCalledWith(1, 2);
      expect(masterRepository.findRandomUnratedIds).not.toHaveBeenCalled();
    });

    it('fills free places with random unrated masters in random order', async () => {
      masterRepository.findTopRatedCards.mockResolvedValue([card(1)]);
      masterRepository.findRandomUnratedIds.mockResolvedValue([7, 5, 6]);
      masterRepository.findCardsByIds.mockResolvedValue([
        card(5),
        card(6),
        card(7),
      ]);

      await expect(service.getTop('vilnius', 4)).resolves.toEqual([
        card(1),
        card(7),
        card(5),
        card(6),
      ]);
      expect(masterRepository.findRandomUnratedIds).toHaveBeenCalledWith(1, 3);
    });

    it('returns rated masters when there are no unrated ones', async () => {
      masterRepository.findTopRatedCards.mockResolvedValue([card(1)]);
      masterRepository.findRandomUnratedIds.mockResolvedValue([]);

      await expect(service.getTop('vilnius', 4)).resolves.toEqual([card(1)]);
      expect(masterRepository.findCardsByIds).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getTop('atlantis', 4)).rejects.toThrow(
        NotFoundException,
      );
      expect(masterRepository.findTopRatedCards).not.toHaveBeenCalled();
    });
  });

  describe('getMapPoints', () => {
    it('returns active master cards of the city', async () => {
      const masters = [card(1)];
      masterRepository.findActiveCardsByCity.mockResolvedValue(masters);

      await expect(service.getMapPoints('vilnius')).resolves.toBe(masters);
      expect(masterRepository.findActiveCardsByCity).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getMapPoints('atlantis')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getList', () => {
    const query: MastersListQuery = {
      city: 'vilnius',
      sort: 'top_rated',
      offset: 0,
      limit: 12,
    };

    it('loads a page of all categories from the city centre, in the sorted order', async () => {
      masterRepository.findPage.mockResolvedValue({
        total: 30,
        rows: [
          { id: 7, minPrice: 2500, currency: 'EUR', nextSlot: null },
          { id: 3, minPrice: 4000, currency: 'EUR', nextSlot: null },
        ],
      });
      masterRepository.findCategoryCardsByIds.mockResolvedValue([
        card(3),
        card(7),
      ]);

      await expect(service.getList(query)).resolves.toEqual({
        total: 30,
        masters: [
          { id: 7, minPrice: 2500, currency: 'EUR', nextSlot: null },
          { id: 3, minPrice: 4000, currency: 'EUR', nextSlot: null },
        ],
      });
      expect(categoryRepository.findBySlug).not.toHaveBeenCalled();
      expect(masterRepository.findPage).toHaveBeenCalledWith({
        cityId: 1,
        categoryId: null,
        subcategoryId: null,
        priceMax: null,
        origin: { lat: 54.6872, lng: 25.2797 },
        slots: null,
        sort: 'top_rated',
        offset: 0,
        limit: 12,
      });
      expect(masterRepository.findCategoryCardsByIds).toHaveBeenCalledWith(
        [7, 3],
        null,
      );
    });

    it('filters by category and measures from the given location', async () => {
      masterRepository.findPage.mockResolvedValue({ total: 0, rows: [] });

      await service.getList({
        ...query,
        category: 'nails',
        sort: 'nearest',
        offset: 12,
        lat: 54.7,
        lng: 25.3,
      });

      expect(categoryRepository.findBySlug).toHaveBeenCalledWith('nails');
      expect(masterRepository.findPage).toHaveBeenCalledWith({
        cityId: 1,
        categoryId: 5,
        subcategoryId: null,
        priceMax: null,
        origin: { lat: 54.7, lng: 25.3 },
        slots: null,
        sort: 'nearest',
        offset: 12,
        limit: 12,
      });
    });

    it('filters by subcategory and price and loads cards of the category', async () => {
      masterRepository.findPage.mockResolvedValue({
        total: 1,
        rows: [{ id: 7, minPrice: 2500, currency: 'EUR', nextSlot: null }],
      });
      masterRepository.findCategoryCardsByIds.mockResolvedValue([card(7)]);

      await service.getList({
        ...query,
        category: 'nails',
        subcategory: 'gel',
        priceMax: 3500,
      });

      expect(categoryRepository.findSubcategoryBySlug).toHaveBeenCalledWith(
        5,
        'gel',
      );
      expect(masterRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 5,
          subcategoryId: 10,
          priceMax: 3500,
        }),
      );
      expect(masterRepository.findCategoryCardsByIds).toHaveBeenCalledWith(
        [7],
        5,
      );
    });

    it('throws NotFoundException for an unknown subcategory', async () => {
      categoryRepository.findSubcategoryBySlug.mockResolvedValue(null);

      await expect(
        service.getList({
          ...query,
          category: 'nails',
          subcategory: 'unknown',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(masterRepository.findPage).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a subcategory without a category', async () => {
      await expect(
        service.getList({ ...query, subcategory: 'gel' }),
      ).rejects.toThrow(BadRequestException);
      expect(categoryRepository.findSubcategoryBySlug).not.toHaveBeenCalled();
      expect(masterRepository.findPage).not.toHaveBeenCalled();
    });

    it('returns the total and no masters for an empty page without loading cards', async () => {
      masterRepository.findPage.mockResolvedValue({ total: 5, rows: [] });

      await expect(service.getList({ ...query, offset: 24 })).resolves.toEqual({
        total: 5,
        masters: [],
      });
      expect(masterRepository.findCategoryCardsByIds).not.toHaveBeenCalled();
    });

    it('skips a master whose card is gone', async () => {
      masterRepository.findPage.mockResolvedValue({
        total: 2,
        rows: [
          { id: 1, minPrice: 1000, currency: 'EUR', nextSlot: null },
          { id: 2, minPrice: 2000, currency: 'EUR', nextSlot: null },
        ],
      });
      masterRepository.findCategoryCardsByIds.mockResolvedValue([card(2)]);

      await expect(service.getList(query)).resolves.toEqual({
        total: 2,
        masters: [{ id: 2, minPrice: 2000, currency: 'EUR', nextSlot: null }],
      });
    });

    it('throws NotFoundException for an unknown category', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.getList({ ...query, category: 'unknown' }),
      ).rejects.toThrow(NotFoundException);
      expect(masterRepository.findPage).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.getList({ ...query, city: 'atlantis' }),
      ).rejects.toThrow(NotFoundException);
      expect(masterRepository.findPage).not.toHaveBeenCalled();
    });

    describe('free slot dates', () => {
      beforeEach(() => {
        // Wednesday 2026-10-21, 12:00 in Vilnius.
        jest.useFakeTimers({ now: new Date('2026-10-21T09:00:00Z') });
        masterRepository.findPage.mockResolvedValue({ total: 0, rows: [] });
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it("passes the dates with the city's local now", async () => {
        await service.getList({
          ...query,
          dateFrom: '2026-10-24',
          dateTo: '2026-10-25',
        });

        expect(masterRepository.findPage).toHaveBeenCalledWith(
          expect.objectContaining({
            slots: {
              dateFrom: '2026-10-24',
              dateTo: '2026-10-25',
              now: '2026-10-21T12:00',
            },
          }),
        );
      });

      it('accepts today and a range of 7 days', async () => {
        await service.getList({
          ...query,
          dateFrom: '2026-10-21',
          dateTo: '2026-10-27',
        });

        expect(masterRepository.findPage).toHaveBeenCalled();
      });

      it("takes today in the city's timezone, not the server's", async () => {
        // Tuesday 22:30 UTC is already Wednesday in Vilnius.
        jest.setSystemTime(new Date('2026-10-20T22:30:00Z'));

        await expect(
          service.getList({
            ...query,
            dateFrom: '2026-10-20',
            dateTo: '2026-10-20',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it.each([
        ['in the past', '2026-10-20', '2026-10-21'],
        ['ending before it starts', '2026-10-24', '2026-10-23'],
        ['longer than 7 days', '2026-10-21', '2026-10-28'],
      ])(
        'throws BadRequestException for a range %s',
        async (_, dateFrom, dateTo) => {
          await expect(
            service.getList({ ...query, dateFrom, dateTo }),
          ).rejects.toThrow(BadRequestException);
          expect(masterRepository.findPage).not.toHaveBeenCalled();
        },
      );
    });
  });
});
