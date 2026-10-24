import { Subcategory } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import CategoryRepository from './category.repository';

describe('CategoryRepository', () => {
  describe('findAllSubcategories', () => {
    let findMany: jest.Mock;
    let repository: CategoryRepository;

    beforeEach(() => {
      findMany = jest.fn().mockResolvedValue([]);
      repository = new CategoryRepository({
        subcategory: { findMany },
      } as unknown as PrismaService);
    });

    it('selects every subcategory by category sortOrder, then its own', async () => {
      await repository.findAllSubcategories();

      expect(findMany).toHaveBeenCalledWith({
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      });
    });

    it('returns the bare models', async () => {
      const rows = [
        { id: 1, categoryId: 1, slug: 'manicure', name: 'Manicure' },
      ] as Subcategory[];
      findMany.mockResolvedValue(rows);

      await expect(repository.findAllSubcategories()).resolves.toBe(rows);
    });
  });
});
