import CategoryController from './category.controller';
import CategoryService from '../services/category.service';
import CategoryResponder from '../responders/category.responder';
import MasterResponder from '../responders/master.responder';
import { Category, Subcategory } from 'src/generated/prisma';
import {
  CategoryWithMastersCount,
  CityWithMastersCount,
} from '../repository/category.repository';
import { CategoryMasterItem } from '../services/category.service';

describe('CategoryController', () => {
  it('returns categories as slug, name and imageUrl', async () => {
    const categoryService = {
      getAll: jest.fn().mockResolvedValue([
        {
          id: 1,
          slug: 'nails',
          name: 'Nails',
          imageUrl: 'https://img/nails',
          sortOrder: 1,
        },
        { id: 2, slug: 'hair', name: 'Hair', imageUrl: null, sortOrder: 2 },
      ] as Category[]),
    };
    const controller = new CategoryController(
      categoryService as unknown as CategoryService,
      new CategoryResponder(new MasterResponder()),
    );

    await expect(controller.getAll()).resolves.toEqual([
      { slug: 'nails', name: 'Nails', imageUrl: 'https://img/nails' },
      { slug: 'hair', name: 'Hair', imageUrl: null },
    ]);
  });

  it('returns the categories overview with counts and descriptions', async () => {
    const categoryService = {
      getOverview: jest.fn().mockResolvedValue({
        totalMasters: 3,
        categories: [
          {
            id: 1,
            slug: 'nails',
            name: 'Nails',
            description: 'Manicure, pedicure, nail art',
            imageUrl: 'https://img/nails',
            sortOrder: 1,
            _count: { masters: 2 },
          },
          {
            id: 2,
            slug: 'hair',
            name: 'Hair',
            description: null,
            imageUrl: null,
            sortOrder: 2,
            _count: { masters: 0 },
          },
        ] as CategoryWithMastersCount[],
      }),
    };
    const controller = new CategoryController(
      categoryService as unknown as CategoryService,
      new CategoryResponder(new MasterResponder()),
    );

    await expect(controller.getOverview({ city: 'vilnius' })).resolves.toEqual({
      totalMasters: 3,
      categories: [
        {
          slug: 'nails',
          name: 'Nails',
          imageUrl: 'https://img/nails',
          description: 'Manicure, pedicure, nail art',
          mastersCount: 2,
        },
        {
          slug: 'hair',
          name: 'Hair',
          imageUrl: null,
          description: null,
          mastersCount: 0,
        },
      ],
    });
    expect(categoryService.getOverview).toHaveBeenCalledWith('vilnius');
  });

  it('returns the category page with description and subcategories', async () => {
    const categoryService = {
      getPage: jest.fn().mockResolvedValue({
        category: {
          id: 1,
          slug: 'nails',
          name: 'Nails',
          description: 'Manicure, pedicure, nail art',
          imageUrl: 'https://img/nails',
          sortOrder: 1,
        },
        subcategories: [
          {
            id: 10,
            categoryId: 1,
            slug: 'manicure',
            name: 'Manicure',
            sortOrder: 1,
          },
          {
            id: 11,
            categoryId: 1,
            slug: 'pedicure',
            name: 'Pedicure',
            sortOrder: 2,
          },
        ] as Subcategory[],
      }),
    };
    const controller = new CategoryController(
      categoryService as unknown as CategoryService,
      new CategoryResponder(new MasterResponder()),
    );

    await expect(
      controller.getPage('nails', { city: 'vilnius' }),
    ).resolves.toEqual({
      category: {
        slug: 'nails',
        name: 'Nails',
        imageUrl: 'https://img/nails',
        description: 'Manicure, pedicure, nail art',
      },
      subcategories: [
        { slug: 'manicure', name: 'Manicure' },
        { slug: 'pedicure', name: 'Pedicure' },
      ],
    });
    expect(categoryService.getPage).toHaveBeenCalledWith('nails', 'vilnius');
  });

  it('returns category master cards with distinct ordered subcategories and the price', async () => {
    const manicure = {
      id: 10,
      categoryId: 1,
      slug: 'manicure',
      name: 'Manicure',
      sortOrder: 1,
    };
    const pedicure = {
      id: 11,
      categoryId: 1,
      slug: 'pedicure',
      name: 'Pedicure',
      sortOrder: 2,
    };
    const master = {
      id: 7,
      uuid: 'master-uuid',
      displayName: 'Anna',
      photoUrl: null,
      rating: 4.8,
      reviewsCount: 12,
      categories: [
        {
          category: {
            id: 1,
            slug: 'nails',
            name: 'Nails',
            imageUrl: null,
          },
        },
      ],
      works: [{ imageUrl: 'https://img/work' }],
      // Out of sortOrder and with a duplicate subcategory.
      offerings: [
        { subcategory: pedicure },
        { subcategory: manicure },
        { subcategory: pedicure },
      ],
      minPrice: 2550,
      currency: 'EUR',
    } as unknown as CategoryMasterItem;
    const categoryService = {
      getMasters: jest.fn().mockResolvedValue({ total: 5, masters: [master] }),
    };
    const controller = new CategoryController(
      categoryService as unknown as CategoryService,
      new CategoryResponder(new MasterResponder()),
    );
    const query = {
      city: 'vilnius',
      sort: 'top_rated' as const,
      offset: 0,
      limit: 8,
    };

    await expect(controller.getMasters('nails', query)).resolves.toEqual({
      total: 5,
      masters: [
        {
          uuid: 'master-uuid',
          name: 'Anna',
          categories: [{ slug: 'nails', name: 'Nails', imageUrl: null }],
          photoUrl: null,
          coverUrl: 'https://img/work',
          rating: 4.8,
          reviewsCount: 12,
          subcategories: [
            { slug: 'manicure', name: 'Manicure' },
            { slug: 'pedicure', name: 'Pedicure' },
          ],
          minPrice: 2550,
          currency: 'EUR',
        },
      ],
    });
    expect(categoryService.getMasters).toHaveBeenCalledWith('nails', query);
  });

  it('returns other cities as slug, name and mastersCount in service order', async () => {
    const categoryService = {
      getOtherCities: jest.fn().mockResolvedValue([
        {
          id: 2,
          slug: 'kaunas',
          name: 'Kaunas',
          country: 'Lithuania',
          lat: 54.8985,
          lng: 23.9036,
          _count: { masters: 2 },
        },
        {
          id: 3,
          slug: 'riga',
          name: 'Riga',
          country: 'Latvia',
          lat: 56.9496,
          lng: 24.1052,
          _count: { masters: 5 },
        },
      ] as CityWithMastersCount[]),
    };
    const controller = new CategoryController(
      categoryService as unknown as CategoryService,
      new CategoryResponder(new MasterResponder()),
    );

    await expect(
      controller.getOtherCities('tattoo', { city: 'vilnius', limit: 3 }),
    ).resolves.toEqual([
      { slug: 'kaunas', name: 'Kaunas', mastersCount: 2 },
      { slug: 'riga', name: 'Riga', mastersCount: 5 },
    ]);
    expect(categoryService.getOtherCities).toHaveBeenCalledWith(
      'tattoo',
      'vilnius',
      3,
    );
  });
});
