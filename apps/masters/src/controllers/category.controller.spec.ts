import CategoryController from './category.controller';
import CategoryService from '../services/category.service';
import CategoryResponder from '../responders/category.responder';
import { Category } from 'src/generated/prisma';

describe('CategoryController', () => {
  it('returns categories as slug and name', async () => {
    const categoryService = {
      getAll: jest.fn().mockResolvedValue([
        { id: 1, slug: 'nails', name: 'Nails', sortOrder: 1 },
        { id: 2, slug: 'hair', name: 'Hair', sortOrder: 2 },
      ] as Category[]),
    };
    const controller = new CategoryController(
      categoryService as unknown as CategoryService,
      new CategoryResponder(),
    );

    await expect(controller.getAll()).resolves.toEqual([
      { slug: 'nails', name: 'Nails' },
      { slug: 'hair', name: 'Hair' },
    ]);
  });
});
