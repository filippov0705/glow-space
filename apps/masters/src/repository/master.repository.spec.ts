import { MASTER_SORTS, MasterSort } from '@glow-space/shared';
import { Prisma } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import MasterRepository, {
  CATEGORY_MASTERS_ORDER,
  CategoryMastersPageParams,
} from './master.repository';

describe('MasterRepository', () => {
  describe('findCategoryPage', () => {
    const params: CategoryMastersPageParams = {
      categoryId: 5,
      cityId: 1,
      subcategoryId: null,
      sort: 'top_rated',
      offset: 8,
      limit: 4,
    };
    let queryRaw: jest.Mock;
    let repository: MasterRepository;

    beforeEach(() => {
      queryRaw = jest.fn().mockResolvedValue([]);
      repository = new MasterRepository({
        $queryRaw: queryRaw,
      } as unknown as PrismaService);
    });

    const sentQuery = (): Prisma.Sql => {
      const [strings, ...values] = queryRaw.mock.calls[0] as [
        TemplateStringsArray,
        ...unknown[],
      ];
      return Prisma.sql(strings, ...values);
    };

    const compact = (sql: string): string => sql.replace(/\s+/g, ' ').trim();

    it.each(MASTER_SORTS)(
      'orders by the whitelisted clause for %s',
      async (sort: MasterSort) => {
        await repository.findCategoryPage({ ...params, sort });

        const query = compact(sentQuery().sql);
        const orderBy = compact(CATEGORY_MASTERS_ORDER[sort].sql);
        expect(query).toContain(
          `ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS position`,
        );
        expect(orderBy).toMatch(/e\.id ASC$/);
      },
    );

    it('orders top_rated by rated first, then score, then newest', () => {
      expect(compact(CATEGORY_MASTERS_ORDER.top_rated.sql)).toBe(
        'e.rating IS NULL, (e.reviews_count * e.rating + ? * p.avg_rating) / (e.reviews_count + ?) DESC, e.created_at DESC, e.id ASC',
      );
    });

    it('does not filter by subcategory without one', async () => {
      await repository.findCategoryPage(params);

      expect(sentQuery().sql).not.toContain('subcategory_id');
    });

    it('filters offerings by the subcategory when given', async () => {
      await repository.findCategoryPage({ ...params, subcategoryId: 10 });

      const query = sentQuery();
      expect(compact(query.sql)).toContain('AND o.subcategory_id = ?');
      expect(query.values).toContain(10);
    });

    it('maps rows and converts the bigint total', async () => {
      queryRaw.mockResolvedValue([
        { total: BigInt(11), id: 3, min_price: 1500, currency: 'EUR' },
        { total: BigInt(11), id: 1, min_price: 2000, currency: 'EUR' },
      ]);

      await expect(repository.findCategoryPage(params)).resolves.toEqual({
        total: 11,
        rows: [
          { id: 3, minPrice: 1500, currency: 'EUR' },
          { id: 1, minPrice: 2000, currency: 'EUR' },
        ],
      });
      expect(sentQuery().values.slice(-2)).toEqual([8, 4]);
    });

    it('keeps the total and drops the null row when the offset is past the end', async () => {
      queryRaw.mockResolvedValue([
        { total: BigInt(3), id: null, min_price: null, currency: null },
      ]);

      await expect(
        repository.findCategoryPage({ ...params, offset: 50 }),
      ).resolves.toEqual({ total: 3, rows: [] });
    });

    it('breaks currency ties by offering id', async () => {
      await repository.findCategoryPage(params);

      expect(compact(sentQuery().sql)).toContain(
        'ARRAY_AGG(o.currency ORDER BY o.price, o.id)',
      );
    });
  });
});
