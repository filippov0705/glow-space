import { NotFoundException } from '@nestjs/common';
import CategoryService from './category.service';
import CityService from './city.service';
import CategoryRepository, {
  CategoryWithMastersCount,
} from '../repository/category.repository';
import CityRepository from '../repository/city.repository';
import MasterRepository from '../repository/master.repository';
import { City } from 'src/generated/prisma';

describe('CategoryService', () => {
  const city = { id: 1, slug: 'vilnius' } as City;
  let categoryRepository: {
    findAll: jest.Mock;
    findAllWithMastersCount: jest.Mock;
  };
  let cityRepository: { findBySlug: jest.Mock };
  let masterRepository: { countActiveByCity: jest.Mock };
  let service: CategoryService;

  beforeEach(() => {
    categoryRepository = {
      findAll: jest.fn(),
      findAllWithMastersCount: jest.fn(),
    };
    cityRepository = { findBySlug: jest.fn().mockResolvedValue(city) };
    masterRepository = { countActiveByCity: jest.fn() };
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
});
