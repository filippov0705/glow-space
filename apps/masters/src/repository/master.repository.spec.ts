import { MASTER_SORTS, MasterSort } from '@glow-space/shared';
import { Prisma } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import MasterRepository, {
  MASTERS_PAGE_ORDER,
  MastersPageParams,
} from './master.repository';

describe('MasterRepository', () => {
  describe('findPage', () => {
    const params: MastersPageParams = {
      cityId: 1,
      categoryId: 5,
      subcategoryId: null,
      priceMax: null,
      origin: { lat: 54.6872, lng: 25.2797 },
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
        await repository.findPage({ ...params, sort });

        const query = compact(sentQuery().sql);
        const orderBy = compact(MASTERS_PAGE_ORDER[sort].sql);
        expect(query).toContain(
          `ROW_NUMBER() OVER (ORDER BY ${orderBy}) AS position`,
        );
        expect(orderBy).toMatch(/e\.id ASC$/);
      },
    );

    it('orders top_rated by rated first, then score, then newest', () => {
      expect(compact(MASTERS_PAGE_ORDER.top_rated.sql)).toBe(
        'e.rating IS NULL, (e.reviews_count * e.rating + ? * p.avg_rating) / (e.reviews_count + ?) DESC, e.created_at DESC, e.id ASC',
      );
    });

    it('orders nearest by distance from the origin, then id', () => {
      expect(compact(MASTERS_PAGE_ORDER.nearest.sql)).toBe(
        'e.distance_km ASC, e.id ASC',
      );
    });

    it('computes the haversine distance from the origin', async () => {
      await repository.findPage({ ...params, sort: 'nearest' });

      const query = sentQuery();
      expect(compact(query.sql)).toContain(
        'ASIN(LEAST(1, SQRT( POWER(SIN(RADIANS(m.lat - ?::double precision) / 2), 2)',
      );
      expect(compact(query.sql)).toContain(') AS distance_km');
      expect(query.values).toEqual(
        expect.arrayContaining([6371, 54.6872, 25.2797]),
      );
    });

    it('limits offerings and the prior to the category when given', async () => {
      await repository.findPage(params);

      const query = sentQuery();
      expect(compact(query.sql).match(/AND o\.category_id = \?/g)).toHaveLength(
        2,
      );
      expect(query.values.filter((value) => value === 5)).toHaveLength(2);
    });

    it('counts any active offering when no category is given', async () => {
      await repository.findPage({ ...params, categoryId: null });

      const query = compact(sentQuery().sql);
      expect(query).not.toContain('category_id');
      expect(query.match(/o\.is_active = true/g)).toHaveLength(2);
    });

    it('does not filter by subcategory without one', async () => {
      await repository.findPage(params);

      expect(sentQuery().sql).not.toContain('subcategory_id');
    });

    it('filters offerings by the subcategory when given', async () => {
      await repository.findPage({ ...params, subcategoryId: 10 });

      const query = sentQuery();
      expect(compact(query.sql)).toContain('AND o.subcategory_id = ?');
      expect(query.values).toContain(10);
    });

    it('does not filter by price without priceMax', async () => {
      await repository.findPage(params);

      expect(sentQuery().sql).not.toContain('o.price <=');
    });

    it('limits offerings to priceMax in the eligible masters only', async () => {
      await repository.findPage({ ...params, priceMax: 3500 });

      const query = sentQuery();
      const sql = compact(query.sql);
      expect(sql.match(/AND o\.price <= \?/g)).toHaveLength(1);
      expect(sql.indexOf('AND o.price <= ?')).toBeLessThan(
        sql.indexOf('GROUP BY m.id'),
      );
      expect(query.values).toContain(3500);
    });

    it('maps rows and converts the bigint total', async () => {
      queryRaw.mockResolvedValue([
        { total: BigInt(11), id: 3, min_price: 1500, currency: 'EUR' },
        { total: BigInt(11), id: 1, min_price: 2000, currency: 'EUR' },
      ]);

      await expect(repository.findPage(params)).resolves.toEqual({
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
        repository.findPage({ ...params, offset: 50 }),
      ).resolves.toEqual({ total: 3, rows: [] });
    });

    it('breaks currency ties by offering id', async () => {
      await repository.findPage(params);

      expect(compact(sentQuery().sql)).toContain(
        'ARRAY_AGG(o.currency ORDER BY o.price, o.id)',
      );
    });
  });

  describe('findCategoryCardsByIds', () => {
    let findMany: jest.Mock;
    let repository: MasterRepository;

    beforeEach(() => {
      findMany = jest.fn().mockResolvedValue([]);
      repository = new MasterRepository({
        master: { findMany },
      } as unknown as PrismaService);
    });

    const offeringsWhere = (): unknown =>
      (
        findMany.mock.calls[0] as [
          { include: { offerings: { where: unknown } } },
        ]
      )[0].include.offerings.where;

    it('loads active offerings in the category', async () => {
      await repository.findCategoryCardsByIds([1, 2], 5);

      expect(offeringsWhere()).toEqual({ categoryId: 5, isActive: true });
    });

    it('loads active offerings of every category for a null category', async () => {
      await repository.findCategoryCardsByIds([1, 2], null);

      expect(offeringsWhere()).toEqual({ isActive: true });
    });
  });
});
