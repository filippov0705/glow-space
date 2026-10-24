import { SearchSuggestion } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import SearchSuggestionRepository from './search-suggestion.repository';

describe('SearchSuggestionRepository', () => {
  describe('findActive', () => {
    let findMany: jest.Mock;
    let repository: SearchSuggestionRepository;

    beforeEach(() => {
      findMany = jest.fn().mockResolvedValue([]);
      repository = new SearchSuggestionRepository({
        searchSuggestion: { findMany },
      } as unknown as PrismaService);
    });

    it('selects active rows for the locale, the city and global ones, by sortOrder', async () => {
      await repository.findActive('en', 'vilnius', 6);

      expect(findMany).toHaveBeenCalledWith({
        where: {
          locale: 'en',
          isActive: true,
          OR: [{ citySlug: 'vilnius' }, { citySlug: null }],
        },
        orderBy: { sortOrder: 'asc' },
        take: 6,
      });
    });

    it('selects only global rows without a city', async () => {
      await repository.findActive('ru', undefined, 6);

      expect(findMany).toHaveBeenCalledWith({
        where: { locale: 'ru', isActive: true, OR: [{ citySlug: null }] },
        orderBy: { sortOrder: 'asc' },
        take: 6,
      });
    });

    it('returns the bare models', async () => {
      const rows = [{ id: 'a', text: 'Gel manicure' }] as SearchSuggestion[];
      findMany.mockResolvedValue(rows);

      await expect(repository.findActive('en', undefined, 6)).resolves.toBe(
        rows,
      );
    });
  });
});
