import { NotFoundException } from '@nestjs/common';
import CityService from './city.service';
import CityRepository from '../repository/city.repository';
import { City } from 'src/generated/prisma';

describe('CityService', () => {
  const city = { id: 1, slug: 'vilnius' } as City;
  let cityRepository: { findBySlug: jest.Mock };
  let service: CityService;

  beforeEach(() => {
    cityRepository = { findBySlug: jest.fn() };
    service = new CityService(cityRepository as unknown as CityRepository);
  });

  describe('getBySlug', () => {
    it('returns the city', async () => {
      cityRepository.findBySlug.mockResolvedValue(city);

      await expect(service.getBySlug('vilnius')).resolves.toBe(city);
      expect(cityRepository.findBySlug).toHaveBeenCalledWith('vilnius');
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getBySlug('atlantis')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
