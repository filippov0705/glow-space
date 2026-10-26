import { Injectable } from '@nestjs/common';
import { MasterSort, MasterStatus } from '@glow-space/shared';
import { Prisma, Review } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { Coordinates, EARTH_RADIUS_KM } from '../utils/haversine';

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

// A master card in a list, plus the master's active offerings with their subcategory (for
// the card subtitle). Only offerings in the category when given, of every category for null.
function categoryMasterCardArgs(categoryId: number | null) {
  return {
    include: {
      ...masterCardArgs.include,
      offerings: {
        where:
          categoryId === null
            ? { isActive: true }
            : { categoryId, isActive: true },
        include: { subcategory: true },
      },
    },
  } satisfies Prisma.MasterDefaultArgs;
}

export type CategoryMasterCard = Prisma.MasterGetPayload<
  ReturnType<typeof categoryMasterCardArgs>
>;

// Data for the master profile page: categories and languages in display order, the first
// works plus the total work count, and active offerings (cheapest first, then id) with
// their subcategory.
export const PROFILE_WORKS_LIMIT = 6;

const masterProfileArgs = {
  include: {
    categories: {
      include: { category: true },
      orderBy: { category: { sortOrder: 'asc' } },
    },
    languages: {
      include: { language: true },
      orderBy: { language: { sortOrder: 'asc' } },
    },
    works: {
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take: PROFILE_WORKS_LIMIT,
    },
    offerings: {
      where: { isActive: true },
      include: { subcategory: true },
      orderBy: [{ price: 'asc' }, { id: 'asc' }],
    },
    _count: { select: { works: true } },
  },
} satisfies Prisma.MasterDefaultArgs;

export type MasterProfile = Prisma.MasterGetPayload<typeof masterProfileArgs>;

export type RatingCount = {
  rating: number;
  count: number;
};

// Weight of the city or category average in the Bayesian top_rated score,
// in "virtual reviews".
export const TOP_RATED_PRIOR_WEIGHT = 10;

// ORDER BY clauses for the masters page query. Picked by key, never built from input.
// Columns refer to the "eligible" CTE (e) and the "prior" CTE (p) of findPage.
// Every clause ends with the id so offset paging is stable.
export const MASTERS_PAGE_ORDER: Record<MasterSort, Prisma.Sql> = {
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
  nearest: Prisma.sql`e.distance_km ASC, e.id ASC`,
};

// Great-circle (haversine) distance in kilometres from the origin to the master "m",
// the same formula as utils/haversine.
function distanceKmSql(origin: Coordinates): Prisma.Sql {
  const lat = Prisma.sql`${origin.lat}::double precision`;
  const lng = Prisma.sql`${origin.lng}::double precision`;
  return Prisma.sql`
    2 * ${EARTH_RADIUS_KM} * ASIN(LEAST(1, SQRT(
      POWER(SIN(RADIANS(m.lat - ${lat}) / 2), 2)
      + COS(RADIANS(${lat})) * COS(RADIANS(m.lat))
        * POWER(SIN(RADIANS(m.lng - ${lng}) / 2), 2)
    )))`;
}

// Free slots start on this grid, counted from the start of a working interval.
export const SLOT_STEP_MINUTES = 30;

export type MastersPageSlots = {
  // Local dates, YYYY-MM-DD, inclusive
  dateFrom: string;
  dateTo: string;
  // Local YYYY-MM-DDTHH:MM in the city; a slot must start after it.
  now: string;
};

// The "eligible" CTE: the offered masters, or only those with a free slot in the dates,
// with the earliest one as local YYYY-MM-DDTHH:MM text.
//
// A slot is as long as the master's shortest offered offering, starts on the
// SLOT_STEP_MINUTES grid from the start of a working interval, ends inside it, starts after
// `now`, and overlaps no PENDING or CONFIRMED booking (half-open ranges, as in the bookings
// EXCLUDE constraint). A schedule exception replaces the weekly hours of its date: a day off
// has no interval, otherwise its single interval is used.
function eligibleSql(slots: MastersPageSlots | null): Prisma.Sql {
  if (slots === null) {
    return Prisma.sql`
      eligible AS (
        SELECT ofr.*, NULL::text AS next_slot FROM offered ofr
      )`;
  }

  return Prisma.sql`
    days AS (
      SELECT d::date AS day
      FROM generate_series(
        ${slots.dateFrom}::date, ${slots.dateTo}::date, interval '1 day'
      ) d
    ),
    intervals AS (
      SELECT
        ofr.id AS master_id,
        ofr.min_duration,
        dy.day + se.start_time::time AS starts_at,
        dy.day + se.end_time::time AS ends_at
      FROM offered ofr
      CROSS JOIN days dy
      JOIN schedule_exceptions se
        ON se.master_id = ofr.id AND se.date = dy.day AND NOT se.is_day_off
      UNION ALL
      SELECT
        ofr.id,
        ofr.min_duration,
        dy.day + wh.start_time::time,
        dy.day + wh.end_time::time
      FROM offered ofr
      CROSS JOIN days dy
      JOIN working_hours wh
        ON wh.master_id = ofr.id AND wh.weekday = EXTRACT(ISODOW FROM dy.day)
      WHERE NOT EXISTS (
        SELECT 1 FROM schedule_exceptions se
        WHERE se.master_id = ofr.id AND se.date = dy.day
      )
    ),
    free AS (
      SELECT i.master_id, MIN(s.starts_at) AS next_slot
      FROM intervals i
      CROSS JOIN LATERAL generate_series(
        i.starts_at,
        i.ends_at - make_interval(mins => i.min_duration),
        make_interval(mins => ${SLOT_STEP_MINUTES}::int)
      ) AS s(starts_at)
      WHERE s.starts_at > ${slots.now}::timestamp
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.master_id = i.master_id
            AND b.status IN ('PENDING', 'CONFIRMED')
            AND tsrange(b.starts_at, b.ends_at)
              && tsrange(
                s.starts_at,
                s.starts_at + make_interval(mins => i.min_duration)
              )
        )
      GROUP BY i.master_id
    ),
    eligible AS (
      SELECT ofr.*, to_char(f.next_slot, 'YYYY-MM-DD"T"HH24:MI') AS next_slot
      FROM offered ofr
      JOIN free f ON f.master_id = ofr.id
    )`;
}

export type MastersPageParams = {
  cityId: number;
  // When set, only offerings in this category count, for eligibility, the price and the
  // top_rated prior. When null, any active offering counts.
  categoryId: number | null;
  // When set, only offerings in this subcategory count, for eligibility and for the price.
  subcategoryId: number | null;
  // When set, only offerings priced at most this (in cents) count, for eligibility and for
  // the price.
  priceMax: number | null;
  // Point the distance is measured from. The distance is always computed but only used to
  // order by `nearest`, so the origin is required for every sort.
  origin: Coordinates;
  // When set, only masters with a free slot in these dates count. See eligibleSql.
  slots: MastersPageSlots | null;
  sort: MasterSort;
  offset: number;
  limit: number;
};

export type MastersPageRow = {
  id: number;
  minPrice: number;
  currency: string;
  nextSlot: string | null; // null without slots
};

export type MastersPageResult = {
  total: number;
  rows: MastersPageRow[];
};

// The query always returns at least one row carrying the total. When the page is empty
// (no masters, or offset past the end), that row has nulls in the page columns.
type MastersPageRawRow = {
  total: bigint;
  id: number | null;
  min_price: number | null;
  currency: string | null;
  next_slot: string | null;
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

  // One page of active masters in the city with at least one active offering (in the category
  // and the subcategory, and up to priceMax, when given) and, with slots, a free slot for one
  // of them. minPrice is the cheapest of those offerings, total is the count of all such
  // masters (also when the offset is past the end).
  // The average rating for top_rated is taken over the city (or the category in it) and
  // ignores the subcategory and the price.
  async findPage(params: MastersPageParams): Promise<MastersPageResult> {
    const {
      cityId,
      categoryId,
      subcategoryId,
      priceMax,
      origin,
      slots,
      sort,
      offset,
      limit,
    } = params;
    const categoryFilter =
      categoryId === null
        ? Prisma.empty
        : Prisma.sql`AND o.category_id = ${categoryId}`;
    const subcategoryFilter =
      subcategoryId === null
        ? Prisma.empty
        : Prisma.sql`AND o.subcategory_id = ${subcategoryId}`;
    const priceFilter =
      priceMax === null ? Prisma.empty : Prisma.sql`AND o.price <= ${priceMax}`;

    const rows = await this.prisma.$queryRaw<MastersPageRawRow[]>`
      WITH offered AS (
        SELECT
          m.id,
          m.rating,
          m.reviews_count,
          m.created_at,
          ${distanceKmSql(origin)} AS distance_km,
          MIN(o.price) AS min_price,
          (ARRAY_AGG(o.currency ORDER BY o.price, o.id))[1] AS currency,
          MIN(o.duration_min) AS min_duration
        FROM masters m
        JOIN offerings o ON o.master_id = m.id
        WHERE m.city_id = ${cityId}
          AND m.status = ${MasterStatus.ACTIVE}
          AND o.is_active = true
          ${categoryFilter}
          ${subcategoryFilter}
          ${priceFilter}
        GROUP BY m.id
      ),
      ${eligibleSql(slots)},
      prior AS (
        SELECT AVG(m.rating) AS avg_rating
        FROM masters m
        WHERE m.city_id = ${cityId}
          AND m.status = ${MasterStatus.ACTIVE}
          AND m.rating IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM offerings o
            WHERE o.master_id = m.id
              AND o.is_active = true
              ${categoryFilter}
          )
      ),
      counted AS (
        SELECT COUNT(*) AS total FROM eligible
      )
      SELECT c.total, page.id, page.min_price, page.currency, page.next_slot
      FROM counted c
      LEFT JOIN LATERAL (
        SELECT
          e.id,
          e.min_price,
          e.currency,
          e.next_slot,
          ROW_NUMBER() OVER (ORDER BY ${MASTERS_PAGE_ORDER[sort]}) AS position
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
      rows: rows.flatMap(({ id, min_price, currency, next_slot }) =>
        id === null || min_price === null || currency === null
          ? []
          : [{ id, minPrice: min_price, currency, nextSlot: next_slot }],
      ),
    };
  }

  // Order of the result is not defined; the caller restores it. A null categoryId loads
  // offerings of every category.
  async findCategoryCardsByIds(
    ids: number[],
    categoryId: number | null,
  ): Promise<CategoryMasterCard[]> {
    return await this.prisma.master.findMany({
      where: { id: { in: ids } },
      ...categoryMasterCardArgs(categoryId),
    });
  }

  // Any status; the caller decides who can be opened.
  async findProfileByUuid(uuid: string): Promise<MasterProfile | null> {
    return await this.prisma.master.findUnique({
      where: { uuid },
      ...masterProfileArgs,
    });
  }

  // Review count per rating, star-only reviews included. Ratings without reviews are absent.
  async countReviewsByRating(masterId: number): Promise<RatingCount[]> {
    const rows = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { masterId },
      _count: { _all: true },
    });
    return rows.map((row) => ({ rating: row.rating, count: row._count._all }));
  }

  // Newest reviews that have text, newest first.
  async findLatestTextReviews(
    masterId: number,
    limit: number,
  ): Promise<Review[]> {
    return await this.prisma.review.findMany({
      where: { masterId, text: { not: null } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  async countActiveByCity(cityId: number): Promise<number> {
    return await this.prisma.master.count({
      where: { cityId, status: MasterStatus.ACTIVE },
    });
  }
}

export default MasterRepository;
