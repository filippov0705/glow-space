import { NotFoundException } from '@nestjs/common';
import CategoryService, { CategoryMastersQuery } from './category.service';
import CityService from './city.service';
import CategoryRepository, {
  CategoryWithMastersCount,
  CityWithMastersCount,
} from '../repository/category.repository';
import CityRepository from '../repository/city.repository';
import MasterRepository, {
  CategoryMasterCard,
} from '../repository/master.repository';
import { Category, City, Subcategory } from 'src/generated/prisma';

describe('CategoryService', () => {
  const city = { id: 1, slug: 'vilnius' } as City;
  const category = { id: 5, slug: 'nails' } as Category;
  let categoryRepository: {
    findAll: jest.Mock;
    findAllWithMastersCount: jest.Mock;
    findBySlug: jest.Mock;
    findSubcategoryBySlug: jest.Mock;
    findSubcategoriesWithMasters: jest.Mock;
    findCitiesWithMasters: jest.Mock;
  };
  let cityRepository: { findBySlug: jest.Mock };
  let masterRepository: {
    countActiveByCity: jest.Mock;
    findCategoryPage: jest.Mock;
    findCategoryCardsByIds: jest.Mock;
  };
  let service: CategoryService;

  beforeEach(() => {
    categoryRepository = {
      findAll: jest.fn(),
      findAllWithMastersCount: jest.fn(),
      findBySlug: jest.fn().mockResolvedValue(category),
      findSubcategoryBySlug: jest.fn(),
      findSubcategoriesWithMasters: jest.fn(),
      findCitiesWithMasters: jest.fn(),
    };
    cityRepository = { findBySlug: jest.fn().mockResolvedValue(city) };
    masterRepository = {
      countActiveByCity: jest.fn(),
      findCategoryPage: jest.fn(),
      findCategoryCardsByIds: jest.fn(),
    };
    service = new CategoryService(
      categoryRepository as unknown as CategoryRepository,
      new CityService(cityRepository as unknown as CityRepository),
      masterRepository as unknown as MasterRepository,
    );
  });

  describe('getOverview', () => {
    it('returns categories with counts and the distinct total of the city', async () => {
      const categories = [
        { id: 1, slug: 'nails', _count: { masters: 2 } },
        { id: 2, slug: 'hair', _count: { masters: 2 } },
        { id: 3, slug: 'makeup', _count: { masters: 0 } },
      ] as CategoryWithMastersCount[];
      categoryRepository.findAllWithMastersCount.mockResolvedValue(categories);
      // One master is in two categories, so the total is less than the sum of counts.
      masterRepository.countActiveByCity.mockResolvedValue(3);

      await expect(service.getOverview('vilnius')).resolves.toEqual({
        totalMasters: 3,
        categories,
      });
      expect(cityRepository.findBySlug).toHaveBeenCalledWith('vilnius');
      expect(categoryRepository.findAllWithMastersCount).toHaveBeenCalledWith(
        1,
      );
      expect(masterRepository.countActiveByCity).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getOverview('atlantis')).rejects.toThrow(
        NotFoundException,
      );
      expect(categoryRepository.findAllWithMastersCount).not.toHaveBeenCalled();
      expect(masterRepository.countActiveByCity).not.toHaveBeenCalled();
    });
  });

  describe('getPage', () => {
    it('returns the category with subcategories that have masters in the city', async () => {
      const subcategories = [
        { id: 10, categoryId: 5, slug: 'manicure' },
        { id: 11, categoryId: 5, slug: 'pedicure' },
      ] as Subcategory[];
      categoryRepository.findSubcategoriesWithMasters.mockResolvedValue(
        subcategories,
      );

      await expect(service.getPage('nails', 'vilnius')).resolves.toEqual({
        category,
        subcategories,
      });
      expect(categoryRepository.findBySlug).toHaveBeenCalledWith('nails');
      expect(cityRepository.findBySlug).toHaveBeenCalledWith('vilnius');
      expect(
        categoryRepository.findSubcategoriesWithMasters,
      ).toHaveBeenCalledWith(5, 1);
    });

    it('throws NotFoundException for an unknown category', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getPage('unknown', 'vilnius')).rejects.toThrow(
        NotFoundException,
      );
      expect(
        categoryRepository.findSubcategoriesWithMasters,
      ).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getPage('nails', 'atlantis')).rejects.toThrow(
        NotFoundException,
      );
      expect(
        categoryRepository.findSubcategoriesWithMasters,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getMasters', () => {
    const query: CategoryMastersQuery = {
      city: 'vilnius',
      sort: 'price_asc',
      offset: 8,
      limit: 8,
    };

    it('returns cards in the order of the paged query with price and total', async () => {
      masterRepository.findCategoryPage.mockResolvedValue({
        total: 11,
        rows: [
          { id: 3, minPrice: 1500, currency: 'EUR' },
          { id: 1, minPrice: 2000, currency: 'EUR' },
          { id: 2, minPrice: 2500, currency: 'EUR' },
        ],
      });
      // Cards come back in id order, not in the sorted order.
      masterRepository.findCategoryCardsByIds.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ] as CategoryMasterCard[]);

      await expect(service.getMasters('nails', query)).resolves.toEqual({
        total: 11,
        masters: [
          { id: 3, minPrice: 1500, currency: 'EUR' },
          { id: 1, minPrice: 2000, currency: 'EUR' },
          { id: 2, minPrice: 2500, currency: 'EUR' },
        ],
      });
      expect(masterRepository.findCategoryPage).toHaveBeenCalledWith({
        categoryId: 5,
        cityId: 1,
        subcategoryId: null,
        sort: 'price_asc',
        offset: 8,
        limit: 8,
      });
      expect(masterRepository.findCategoryCardsByIds).toHaveBeenCalledWith(
        [3, 1, 2],
        5,
      );
      expect(categoryRepository.findSubcategoryBySlug).not.toHaveBeenCalled();
    });

    it('filters by the subcategory id when sub is given', async () => {
      categoryRepository.findSubcategoryBySlug.mockResolvedValue({
        id: 10,
        categoryId: 5,
        slug: 'manicure',
      });
      masterRepository.findCategoryPage.mockResolvedValue({
        total: 0,
        rows: [],
      });

      await service.getMasters('nails', { ...query, sub: 'manicure' });

      expect(categoryRepository.findSubcategoryBySlug).toHaveBeenCalledWith(
        5,
        'manicure',
      );
      expect(masterRepository.findCategoryPage).toHaveBeenCalledWith(
        expect.objectContaining({ subcategoryId: 10 }),
      );
    });

    it('returns an empty page without loading cards when nothing matches', async () => {
      masterRepository.findCategoryPage.mockResolvedValue({
        total: 0,
        rows: [],
      });

      await expect(service.getMasters('nails', query)).resolves.toEqual({
        total: 0,
        masters: [],
      });
      expect(masterRepository.findCategoryCardsByIds).not.toHaveBeenCalled();
    });

    it('keeps the real total when the offset is past the end', async () => {
      masterRepository.findCategoryPage.mockResolvedValue({
        total: 3,
        rows: [],
      });

      await expect(
        service.getMasters('nails', { ...query, offset: 50 }),
      ).resolves.toEqual({ total: 3, masters: [] });
      expect(masterRepository.findCategoryCardsByIds).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown subcategory', async () => {
      categoryRepository.findSubcategoryBySlug.mockResolvedValue(null);

      await expect(
        service.getMasters('nails', { ...query, sub: 'unknown' }),
      ).rejects.toThrow(NotFoundException);
      expect(masterRepository.findCategoryPage).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown category', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getMasters('unknown', query)).rejects.toThrow(
        NotFoundException,
      );
      expect(masterRepository.findCategoryPage).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.getMasters('nails', { ...query, city: 'atlantis' }),
      ).rejects.toThrow(NotFoundException);
      expect(masterRepository.findCategoryPage).not.toHaveBeenCalled();
    });
  });

  describe('getOtherCities', () => {
    const vilnius = {
      id: 1,
      slug: 'vilnius',
      lat: 54.6872,
      lng: 25.2797,
      _count: { masters: 4 },
    } as CityWithMastersCount;
    const kaunas = {
      id: 2,
      slug: 'kaunas',
      lat: 54.8985,
      lng: 23.9036,
      _count: { masters: 2 },
    } as CityWithMastersCount;
    const riga = {
      id: 3,
      slug: 'riga',
      lat: 56.9496,
      lng: 24.1052,
      _count: { masters: 5 },
    } as CityWithMastersCount;
    const warsaw = {
      id: 4,
      slug: 'warsaw',
      lat: 52.2297,
      lng: 21.0122,
      _count: { masters: 1 },
    } as CityWithMastersCount;
    const berlin = {
      id: 5,
      slug: 'berlin',
      lat: 52.52,
      lng: 13.405,
      _count: { masters: 3 },
    } as CityWithMastersCount;

    beforeEach(() => {
      cityRepository.findBySlug.mockResolvedValue(vilnius);
    });

    it('excludes the current city and returns the nearest ones first, up to the limit', async () => {
      categoryRepository.findCitiesWithMasters.mockResolvedValue([
        berlin,
        vilnius,
        warsaw,
        riga,
        kaunas,
      ]);

      await expect(
        service.getOtherCities('nails', 'vilnius', 3),
      ).resolves.toEqual([kaunas, riga, warsaw]);
      expect(categoryRepository.findBySlug).toHaveBeenCalledWith('nails');
      expect(cityRepository.findBySlug).toHaveBeenCalledWith('vilnius');
      expect(categoryRepository.findCitiesWithMasters).toHaveBeenCalledWith(5);
    });

    it('returns fewer cities than the limit when there are not enough', async () => {
      categoryRepository.findCitiesWithMasters.mockResolvedValue([
        riga,
        vilnius,
      ]);

      await expect(
        service.getOtherCities('nails', 'vilnius', 3),
      ).resolves.toEqual([riga]);
    });

    it('returns an empty list when only the current city has masters', async () => {
      categoryRepository.findCitiesWithMasters.mockResolvedValue([vilnius]);

      await expect(
        service.getOtherCities('nails', 'vilnius', 3),
      ).resolves.toEqual([]);
    });

    it('throws NotFoundException for an unknown category', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.getOtherCities('unknown', 'vilnius', 3),
      ).rejects.toThrow(NotFoundException);
      expect(categoryRepository.findCitiesWithMasters).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.getOtherCities('nails', 'atlantis', 3),
      ).rejects.toThrow(NotFoundException);
      expect(categoryRepository.findCitiesWithMasters).not.toHaveBeenCalled();
    });
  });
});
