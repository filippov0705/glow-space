import CategoryController from './category.controller';
import CategoryService from '../services/category.service';
import CategoryResponder from '../responders/category.responder';
import { Category } from 'src/generated/prisma';
import { CategoryWithMastersCount } from '../repository/category.repository';

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
      new CategoryResponder(),
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
      new CategoryResponder(),
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
});
