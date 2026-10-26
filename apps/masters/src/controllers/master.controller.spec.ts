import { NotFoundException } from '@nestjs/common';
import MasterController from './master.controller';
import MasterService from '../services/master.service';
import MasterResponder from '../responders/master.responder';

describe('MasterController', () => {
  let masterService: {
    getTop: jest.Mock;
    getMapPoints: jest.Mock;
    getList: jest.Mock;
    getProfile: jest.Mock;
  };
  let controller: MasterController;

  beforeEach(() => {
    masterService = {
      getTop: jest.fn(),
      getMapPoints: jest.fn(),
      getList: jest.fn(),
      getProfile: jest.fn(),
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

  describe('getProfile', () => {
    const nails = { id: 5, slug: 'nails', name: 'Nails', sortOrder: 1 };
    const gel = {
      id: 10,
      categoryId: 5,
      slug: 'gel',
      name: 'Gel',
      sortOrder: 1,
    };
    const art = {
      id: 11,
      categoryId: 5,
      slug: 'art',
      name: 'Nail art',
      sortOrder: 2,
    };
    const master = {
      id: 42,
      uuid: 'm-1',
      displayName: 'Anna K.',
      photoUrl: null,
      address: 'Gedimino pr. 1, Vilnius',
      lat: 54.68,
      lng: 25.27,
      rating: 4.8,
      reviewsCount: 12,
      about: 'Nail artist.',
      experienceYears: 7,
      categories: [{ category: nails }],
      languages: [
        { language: { code: 'en', name: 'English' } },
        { language: { code: 'lt', name: 'Lithuanian' } },
      ],
      works: [{ imageUrl: 'https://img/1' }, { imageUrl: 'https://img/2' }],
      _count: { works: 8 },
      offerings: [
        {
          id: 'o-1',
          name: 'Nail art',
          durationMin: 30,
          price: 1500,
          currency: 'EUR',
          subcategory: art,
        },
        {
          id: 'o-2',
          name: 'Gel manicure',
          durationMin: 60,
          price: 3000,
          currency: 'EUR',
          subcategory: gel,
        },
      ],
    };
    const ratingDistribution = [
      { rating: 5, count: 10 },
      { rating: 4, count: 2 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ];
    const review = {
      id: 'r-1',
      authorName: 'Ieva',
      offeringName: 'Gel manicure',
      rating: 5,
      text: 'Great',
      createdAt: new Date('2026-10-12T10:00:00.000Z'),
      replyText: null,
    };

    it('returns the profile with the cheapest price and slots', async () => {
      masterService.getProfile.mockResolvedValue({
        master,
        ratingDistribution,
        reviews: [review],
        nextSlots: ['2026-10-31T14:00:00', '2026-10-31T14:30:00'],
      });

      const result = await controller.getProfile('m-1');

      expect(masterService.getProfile).toHaveBeenCalledWith('m-1');
      expect(result).toEqual({
        uuid: 'm-1',
        name: 'Anna K.',
        photoUrl: null,
        address: 'Gedimino pr. 1, Vilnius',
        lat: 54.68,
        lng: 25.27,
        categories: [{ slug: 'nails', name: 'Nails' }],
        subcategories: [
          { slug: 'gel', name: 'Gel' },
          { slug: 'art', name: 'Nail art' },
        ],
        rating: 4.8,
        reviewsCount: 12,
        about: 'Nail artist.',
        experienceYears: 7,
        languages: [
          { code: 'en', name: 'English' },
          { code: 'lt', name: 'Lithuanian' },
        ],
        works: [{ imageUrl: 'https://img/1' }, { imageUrl: 'https://img/2' }],
        worksCount: 8,
        offerings: [
          {
            id: 'o-1',
            name: 'Nail art',
            durationMin: 30,
            price: 1500,
            currency: 'EUR',
          },
          {
            id: 'o-2',
            name: 'Gel manicure',
            durationMin: 60,
            price: 3000,
            currency: 'EUR',
          },
        ],
        minPrice: 1500,
        currency: 'EUR',
        ratingDistribution,
        reviews: [
          {
            id: 'r-1',
            authorName: 'Ieva',
            offeringName: 'Gel manicure',
            rating: 5,
            text: 'Great',
            createdAt: '2026-10-12T10:00:00.000Z',
            replyText: null,
          },
        ],
        nextSlots: [
          { startsAt: '2026-10-31T14:00:00' },
          { startsAt: '2026-10-31T14:30:00' },
        ],
      });
    });

    it('returns a null price and no subcategories without active offerings', async () => {
      masterService.getProfile.mockResolvedValue({
        master: { ...master, offerings: [] },
        ratingDistribution,
        reviews: [],
        nextSlots: [],
      });

      const result = await controller.getProfile('m-1');

      expect(result).toMatchObject({
        offerings: [],
        subcategories: [],
        minPrice: null,
        currency: null,
        reviews: [],
        nextSlots: [],
      });
    });

    it('propagates NotFoundException from the service', async () => {
      masterService.getProfile.mockRejectedValue(new NotFoundException());

      await expect(controller.getProfile('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
