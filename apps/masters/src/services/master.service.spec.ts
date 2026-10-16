import { NotFoundException } from '@nestjs/common';
import MasterService from './master.service';
import CityRepository from '../repository/city.repository';
import MasterRepository, { MasterCard } from '../repository/master.repository';
import { City, Master } from 'src/generated/prisma';

const card = (id: number) => ({ id }) as MasterCard;

describe('MasterService', () => {
  const city = { id: 1, slug: 'vilnius' } as City;
  let cityRepository: { findBySlug: jest.Mock };
  let masterRepository: {
    findTopRatedCards: jest.Mock;
    findRandomUnratedIds: jest.Mock;
    findCardsByIds: jest.Mock;
    findActiveByCity: jest.Mock;
  };
  let service: MasterService;

  beforeEach(() => {
    cityRepository = { findBySlug: jest.fn().mockResolvedValue(city) };
    masterRepository = {
      findTopRatedCards: jest.fn(),
      findRandomUnratedIds: jest.fn(),
      findCardsByIds: jest.fn(),
      findActiveByCity: jest.fn(),
    };
    service = new MasterService(
      cityRepository as unknown as CityRepository,
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
    it('returns active masters of the city', async () => {
      const masters = [{ id: 1 }] as Master[];
      masterRepository.findActiveByCity.mockResolvedValue(masters);

      await expect(service.getMapPoints('vilnius')).resolves.toBe(masters);
      expect(masterRepository.findActiveByCity).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException for an unknown city', async () => {
      cityRepository.findBySlug.mockResolvedValue(null);

      await expect(service.getMapPoints('atlantis')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
