import MasterController from './master.controller';
import MasterService from '../services/master.service';
import MasterResponder from '../responders/master.responder';

describe('MasterController', () => {
  let masterService: { getTop: jest.Mock; getMapPoints: jest.Mock };
  let controller: MasterController;

  beforeEach(() => {
    masterService = { getTop: jest.fn(), getMapPoints: jest.fn() };
    controller = new MasterController(
      masterService as unknown as MasterService,
      new MasterResponder(),
    );
  });

  describe('getTop', () => {
    it('returns master cards with categories and cover', async () => {
      masterService.getTop.mockResolvedValue([
        {
          uuid: 'm-1',
          displayName: 'Anna K.',
          rating: 4.9,
          reviewsCount: 128,
          categories: [{ category: { slug: 'nails', name: 'Nails' } }],
          works: [{ imageUrl: 'https://img/1' }],
        },
        {
          uuid: 'm-2',
          displayName: 'Ieva M.',
          rating: null,
          reviewsCount: 0,
          categories: [],
          works: [],
        },
      ] as unknown);

      const result = await controller.getTop({ city: 'vilnius', limit: 4 });

      expect(masterService.getTop).toHaveBeenCalledWith('vilnius', 4);
      expect(result).toEqual([
        {
          uuid: 'm-1',
          name: 'Anna K.',
          categories: [{ slug: 'nails', name: 'Nails' }],
          coverUrl: 'https://img/1',
          rating: 4.9,
          reviewsCount: 128,
        },
        {
          uuid: 'm-2',
          name: 'Ieva M.',
          categories: [],
          coverUrl: null,
          rating: null,
          reviewsCount: 0,
        },
      ]);
    });
  });

  describe('getMapPoints', () => {
    it('returns map points with card data', async () => {
      masterService.getMapPoints.mockResolvedValue([
        {
          uuid: 'm-1',
          displayName: 'Anna K.',
          rating: 4.9,
          reviewsCount: 128,
          lat: 54.68,
          lng: 25.27,
          categories: [{ category: { slug: 'nails', name: 'Nails' } }],
          works: [{ imageUrl: 'https://img/1' }],
        },
      ] as unknown);

      const result = await controller.getMapPoints({ city: 'vilnius' });

      expect(masterService.getMapPoints).toHaveBeenCalledWith('vilnius');
      expect(result).toEqual([
        {
          uuid: 'm-1',
          name: 'Anna K.',
          categories: [{ slug: 'nails', name: 'Nails' }],
          coverUrl: 'https://img/1',
          rating: 4.9,
          reviewsCount: 128,
          lat: 54.68,
          lng: 25.27,
        },
      ]);
    });
  });
});
