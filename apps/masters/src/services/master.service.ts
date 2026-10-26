import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { CITIES, MasterSort, MasterStatus } from '@glow-space/shared';
import { City, Review } from 'src/generated/prisma';
import MasterRepository, {
  CategoryMasterCard,
  MasterCard,
  MasterProfile,
  MastersPageSlots,
  RatingCount,
} from '../repository/master.repository';
import { addDays, localNow } from '../utils/local-time';
import BookingService from './booking.service';
import { sortOrigin } from '../utils/origin';
import { mergePageCards } from '../utils/page-cards';
import CategoryService from './category.service';
import CityService from './city.service';

export type MastersListQuery = {
  city: string;
  // Category slug to filter by.
  category?: string;
  // Subcategory slug within the category; requires the category.
  subcategory?: string;
  // Highest offering price, in cents.
  priceMax?: number;
  // Local dates of a free slot, YYYY-MM-DD, inclusive. Set together or not at all.
  dateFrom?: string;
  dateTo?: string;
  sort: MasterSort;
  offset: number;
  limit: number;
  // Origin for the nearest sort. Set together or not at all; the city centre otherwise.
  lat?: number;
  lng?: number;
};

export type MasterListItem = CategoryMasterCard & {
  minPrice: number;
  currency: string;
  nextSlot: string | null;
};

// Longest free-slot date range, in days.
export const SLOT_DATES_MAX_DAYS = 7;

export type MastersList = {
  total: number;
  masters: MasterListItem[];
};

export const PROFILE_REVIEWS_LIMIT = 3;

// Ratings of the distribution, in display order.
const RATINGS = [5, 4, 3, 2, 1];

export type MasterProfileDetails = {
  master: MasterProfile;
  // Always five rows, 5 down to 1.
  ratingDistribution: RatingCount[];
  reviews: Review[];
  nextSlots: string[];
};

@Injectable()
class MasterService {
  constructor(
    private readonly cityService: CityService,
    private readonly categoryService: CategoryService,
    private readonly masterRepository: MasterRepository,
    private readonly bookingService: BookingService,
  ) {}

  // Masters with a rating go first, best rated first.
  // Free places are filled with random masters that have no reviews yet.
  async getTop(citySlug: string, limit: number): Promise<MasterCard[]> {
    const city = await this.cityService.getBySlug(citySlug);

    const rated = await this.masterRepository.findTopRatedCards(city.id, limit);
    if (rated.length === limit) {
      return rated;
    }

    const randomIds = await this.masterRepository.findRandomUnratedIds(
      city.id,
      limit - rated.length,
    );
    if (randomIds.length === 0) {
      return rated;
    }

    // findCardsByIds does not keep the random order, so restore it.
    const unrated = await this.masterRepository.findCardsByIds(randomIds);
    const unratedById = new Map(unrated.map((master) => [master.id, master]));

    return [...rated, ...randomIds.flatMap((id) => unratedById.get(id) ?? [])];
  }

  async getMapPoints(citySlug: string): Promise<MasterCard[]> {
    const city = await this.cityService.getBySlug(citySlug);

    return await this.masterRepository.findActiveCardsByCity(city.id);
  }

  // One page of eligible masters in the city, optionally in one category (and subcategory),
  // up to a price and with a free slot in the dates.
  async getList(query: MastersListQuery): Promise<MastersList> {
    if (query.subcategory && !query.category) {
      throw new BadRequestException('subcategory requires category');
    }

    const [city, category] = await Promise.all([
      this.cityService.getBySlug(query.city),
      query.category
        ? this.categoryService.getBySlug(query.category)
        : Promise.resolve(null),
    ]);
    const subcategory =
      category && query.subcategory
        ? await this.categoryService.getSubcategoryBySlug(
            category.id,
            query.subcategory,
          )
        : null;

    const { total, rows } = await this.masterRepository.findPage({
      cityId: city.id,
      categoryId: category?.id ?? null,
      subcategoryId: subcategory?.id ?? null,
      priceMax: query.priceMax ?? null,
      origin: sortOrigin(query, city),
      slots: this.slotsFor(query, city),
      sort: query.sort,
      offset: query.offset,
      limit: query.limit,
    });
    if (rows.length === 0) {
      return { total, masters: [] };
    }

    // findCategoryCardsByIds does not keep the sorted order, so restore it.
    const cards = await this.masterRepository.findCategoryCardsByIds(
      rows.map((row) => row.id),
      category?.id ?? null,
    );

    return { total, masters: mergePageCards(rows, cards) };
  }

  // Only active masters can be opened. A malformed uuid is treated as unknown.
  async getProfile(uuid: string): Promise<MasterProfileDetails> {
    const master = isUUID(uuid)
      ? await this.masterRepository.findProfileByUuid(uuid)
      : null;
    if (!master || master.status !== Number(MasterStatus.ACTIVE)) {
      throw new NotFoundException('Master not found');
    }

    const [counts, reviews, nextSlots] = await Promise.all([
      this.masterRepository.countReviewsByRating(master.id),
      this.masterRepository.findLatestTextReviews(
        master.id,
        PROFILE_REVIEWS_LIMIT,
      ),
      this.bookingService.getNextSlots(master.id, new Date()),
    ]);
    const countByRating = new Map(
      counts.map(({ rating, count }) => [rating, count]),
    );

    return {
      master,
      ratingDistribution: RATINGS.map((rating) => ({
        rating,
        count: countByRating.get(rating) ?? 0,
      })),
      reviews,
      nextSlots,
    };
  }

  // Dates are local to the city, so "today" and "now" are taken in its timezone.
  private slotsFor(
    query: MastersListQuery,
    city: City,
  ): MastersPageSlots | null {
    const { dateFrom, dateTo } = query;
    if (dateFrom === undefined || dateTo === undefined) {
      return null;
    }

    const timezone = CITIES.find((seed) => seed.slug === city.slug)?.timezone;
    if (!timezone) {
      throw new Error(`No timezone for city "${city.slug}"`);
    }

    const now = localNow(timezone);
    if (dateFrom < now.date) {
      throw new BadRequestException('dateFrom is in the past');
    }
    if (dateTo < dateFrom) {
      throw new BadRequestException('dateTo is before dateFrom');
    }
    if (dateTo > addDays(dateFrom, SLOT_DATES_MAX_DAYS - 1)) {
      throw new BadRequestException(
        `The date range is longer than ${SLOT_DATES_MAX_DAYS} days`,
      );
    }

    return { dateFrom, dateTo, now: `${now.date}T${now.time}` };
  }
}

export default MasterService;
