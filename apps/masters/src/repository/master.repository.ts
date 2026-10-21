import { Injectable } from '@nestjs/common';
import { MasterSort, MasterStatus } from '@glow-space/shared';
import { Prisma } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

// Data needed for a master card: categories in display order and the cover (first work).
const masterCardArgs = {
  include: {
    categories: {
      include: { category: true },
      orderBy: { category: { sortOrder: 'asc' } },
    },
    works: { orderBy: { sortOrder: 'asc' }, take: 1 },
  },
} satisfies Prisma.MasterDefaultArgs;

export type MasterCard = Prisma.MasterGetPayload<typeof masterCardArgs>;

// A master card on a category page, plus the master's active offerings in that category
// with their subcategory (for the card subtitle).
function categoryMasterCardArgs(categoryId: number) {
  return {
    include: {
      ...masterCardArgs.include,
      offerings: {
        where: { categoryId, isActive: true },
        include: { subcategory: true },
      },
    },
  } satisfies Prisma.MasterDefaultArgs;
}

export type CategoryMasterCard = Prisma.MasterGetPayload<
  ReturnType<typeof categoryMasterCardArgs>
>;

// Weight of the city and category average in the Bayesian top_rated score,
// in "virtual reviews".
export const TOP_RATED_PRIOR_WEIGHT = 10;

// ORDER BY clauses for the category masters query. Picked by key, never built from input.
// Columns refer to the "eligible" CTE (e) and the "prior" CTE (p) of findCategoryPage.
// Every clause ends with the id so offset paging is stable.
export const CATEGORY_MASTERS_ORDER: Record<MasterSort, Prisma.Sql> = {
  // Bayesian score (v·R + m·C) / (v + m). Unrated masters go last, newest first.
  top_rated: Prisma.sql`
    e.rating IS NULL,
    (e.reviews_count * e.rating + ${TOP_RATED_PRIOR_WEIGHT} * p.avg_rating)
      / (e.reviews_count + ${TOP_RATED_PRIOR_WEIGHT}) DESC,
    e.created_at DESC,
    e.id ASC`,
  most_reviews: Prisma.sql`e.reviews_count DESC, e.id ASC`,
  price_asc: Prisma.sql`e.min_price ASC, e.id ASC`,
  price_desc: Prisma.sql`e.min_price DESC, e.id ASC`,
  newest: Prisma.sql`e.created_at DESC, e.id ASC`,
};

export type CategoryMastersPageParams = {
  categoryId: number;
  cityId: number;
  // When set, only offerings in this subcategory count, for eligibility and for the price.
  subcategoryId: number | null;
  sort: MasterSort;
  offset: number;
  limit: number;
};

export type CategoryMastersPageRow = {
  id: number;
  minPrice: number;
  currency: string;
};

export type CategoryMastersPageResult = {
  total: number;
  rows: CategoryMastersPageRow[];
};

// The query always returns at least one row carrying the total. When the page is empty
// (no masters, or offset past the end), that row has nulls in the page columns.
type CategoryMastersPageRawRow = {
  total: bigint;
  id: number | null;
  min_price: number | null;
  currency: string | null;
};

@Injectable()
class MasterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTopRatedCards(
    cityId: number,
    limit: number,
  ): Promise<MasterCard[]> {
    return await this.prisma.master.findMany({
      where: { cityId, status: MasterStatus.ACTIVE, rating: { not: null } },
      orderBy: [{ rating: 'desc' }, { reviewsCount: 'desc' }],
      take: limit,
      ...masterCardArgs,
    });
  }

  // Prisma has no random ordering, hence the raw query.
  async findRandomUnratedIds(cityId: number, limit: number): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM masters
      WHERE city_id = ${cityId}
        AND status = ${MasterStatus.ACTIVE}
        AND rating IS NULL
      ORDER BY random()
      LIMIT ${limit}
    `;
    return rows.map((row) => row.id);
  }

  async findCardsByIds(ids: number[]): Promise<MasterCard[]> {
    return await this.prisma.master.findMany({
      where: { id: { in: ids } },
      ...masterCardArgs,
    });
  }

  async findActiveCardsByCity(cityId: number): Promise<MasterCard[]> {
    return await this.prisma.master.findMany({
      where: { cityId, status: MasterStatus.ACTIVE },
      ...masterCardArgs,
    });
  }

  // One page of active masters in the city with at least one active offering in the category
  // (in the subcategory, when given). minPrice is the cheapest of those offerings, total is the
  // count of all such masters (also when the offset is past the end). The average rating
  // for top_rated ignores the subcategory.
  async findCategoryPage(
    params: CategoryMastersPageParams,
  ): Promise<CategoryMastersPageResult> {
    const { categoryId, cityId, subcategoryId, sort, offset, limit } = params;
    const subcategoryFilter =
      subcategoryId === null
        ? Prisma.empty
        : Prisma.sql`AND o.subcategory_id = ${subcategoryId}`;

    const rows = await this.prisma.$queryRaw<CategoryMastersPageRawRow[]>`
      WITH eligible AS (
        SELECT
          m.id,
          m.rating,
          m.reviews_count,
          m.created_at,
          MIN(o.price) AS min_price,
          (ARRAY_AGG(o.currency ORDER BY o.price, o.id))[1] AS currency
        FROM masters m
        JOIN offerings o ON o.master_id = m.id
        WHERE m.city_id = ${cityId}
          AND m.status = ${MasterStatus.ACTIVE}
          AND o.category_id = ${categoryId}
          AND o.is_active = true
          ${subcategoryFilter}
        GROUP BY m.id
      ),
      prior AS (
        SELECT AVG(m.rating) AS avg_rating
        FROM masters m
        WHERE m.city_id = ${cityId}
          AND m.status = ${MasterStatus.ACTIVE}
          AND m.rating IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM offerings o
            WHERE o.master_id = m.id
              AND o.category_id = ${categoryId}
              AND o.is_active = true
          )
      ),
      counted AS (
        SELECT COUNT(*) AS total FROM eligible
      )
      SELECT c.total, page.id, page.min_price, page.currency
      FROM counted c
      LEFT JOIN LATERAL (
        SELECT
          e.id,
          e.min_price,
          e.currency,
          ROW_NUMBER() OVER (ORDER BY ${CATEGORY_MASTERS_ORDER[sort]}) AS position
        FROM eligible e
        CROSS JOIN prior p
        ORDER BY position
        OFFSET ${offset}
        LIMIT ${limit}
      ) page ON true
      ORDER BY page.position
    `;

    return {
      total: rows.length > 0 ? Number(rows[0].total) : 0,
      rows: rows.flatMap(({ id, min_price, currency }) =>
        id === null || min_price === null || currency === null
          ? []
          : [{ id, minPrice: min_price, currency }],
      ),
    };
  }

  // Order of the result is not defined; the caller restores it.
  async findCategoryCardsByIds(
    ids: number[],
    categoryId: number,
  ): Promise<CategoryMasterCard[]> {
    return await this.prisma.master.findMany({
      where: { id: { in: ids } },
      ...categoryMasterCardArgs(categoryId),
    });
  }

  async countActiveByCity(cityId: number): Promise<number> {
    return await this.prisma.master.count({
      where: { cityId, status: MasterStatus.ACTIVE },
    });
  }
}

export default MasterRepository;
