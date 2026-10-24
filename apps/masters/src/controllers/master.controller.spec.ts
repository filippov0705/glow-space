import MasterController from './master.controller';
import MasterService from '../services/master.service';
import MasterResponder from '../responders/master.responder';

describe('MasterController', () => {
  let masterService: {
    getTop: jest.Mock;
    getMapPoints: jest.Mock;
    getList: jest.Mock;
  };
  let controller: MasterController;

  beforeEach(() => {
    masterService = {
      getTop: jest.fn(),
      getMapPoints: jest.fn(),
      getList: jest.fn(),
    };
    controller = new MasterController(
      masterService as unknown as MasterService,
      new MasterResponder(),
    );
  });

  describe('getList', () => {
    it('returns the total and list cards with distinct sorted subcategories and the price', async () => {
      masterService.getList.mockResolvedValue({
        total: 30,
        masters: [
          {
            uuid: 'm-1',
            displayName: 'Anna K.',
            photoUrl: null,
            rating: 4.9,
            reviewsCount: 128,
            categories: [
              { category: { slug: 'nails', name: 'Nails', imageUrl: null } },
              { category: { slug: 'brows', name: 'Brows', imageUrl: null } },
            ],
            works: [{ imageUrl: 'https://img/1' }],
            offerings: [
              {
                subcategory: {
                  id: 2,
                  slug: 'art',
                  name: 'Nail art',
                  sortOrder: 2,
                },
              },
              {
                subcategory: { id: 1, slug: 'gel', name: 'Gel', sortOrder: 1 },
              },
              {
                subcategory: {
                  id: 2,
                  slug: 'art',
                  name: 'Nail art',
                  sortOrder: 2,
                },
              },
            ],
            minPrice: 2500,
            currency: 'EUR',
          },
        ],
      });
      const query = {
        city: 'vilnius',
        category: 'nails',
        subcategory: 'gel',
        priceMax: 3500,
        sort: 'nearest' as const,
        offset: 0,
        limit: 12,
        lat: 54.7,
        lng: 25.3,
      };

      const result = await controller.getList(query);

      expect(masterService.getList).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        total: 30,
        masters: [
          {
            uuid: 'm-1',
            name: 'Anna K.',
            categories: [
              { slug: 'nails', name: 'Nails', imageUrl: null },
              { slug: 'brows', name: 'Brows', imageUrl: null },
            ],
            photoUrl: null,
            coverUrl: 'https://img/1',
            rating: 4.9,
            reviewsCount: 128,
            subcategories: [
              { slug: 'gel', name: 'Gel' },
              { slug: 'art', name: 'Nail art' },
            ],
            minPrice: 2500,
            currency: 'EUR',
          },
        ],
      });
    });
  });

  describe('getTop', () => {
    it('returns master cards with categories, photo and cover', async () => {
      masterService.getTop.mockResolvedValue([
        {
          uuid: 'm-1',
          displayName: 'Anna K.',
          photoUrl: 'https://photo/1',
          rating: 4.9,
          reviewsCount: 128,
          categories: [
            { category: { slug: 'nails', name: 'Nails', imageUrl: null } },
          ],
          works: [{ imageUrl: 'https://img/1' }],
        },
        {
          uuid: 'm-2',
          displayName: 'Ieva M.',
          photoUrl: null,
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
          categories: [{ slug: 'nails', name: 'Nails', imageUrl: null }],
          photoUrl: 'https://photo/1',
          coverUrl: 'https://img/1',
          rating: 4.9,
          reviewsCount: 128,
        },
        {
          uuid: 'm-2',
          name: 'Ieva M.',
          categories: [],
          photoUrl: null,
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
          photoUrl: 'https://photo/1',
          rating: 4.9,
          reviewsCount: 128,
          lat: 54.68,
          lng: 25.27,
          categories: [
            { category: { slug: 'nails', name: 'Nails', imageUrl: null } },
          ],
          works: [{ imageUrl: 'https://img/1' }],
        },
      ] as unknown);

      const result = await controller.getMapPoints({ city: 'vilnius' });

      expect(masterService.getMapPoints).toHaveBeenCalledWith('vilnius');
      expect(result).toEqual([
        {
          uuid: 'm-1',
          name: 'Anna K.',
          categories: [{ slug: 'nails', name: 'Nails', imageUrl: null }],
          photoUrl: 'https://photo/1',
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
