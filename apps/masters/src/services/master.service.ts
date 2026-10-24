import { BadRequestException, Injectable } from '@nestjs/common';
import { MasterSort } from '@glow-space/shared';
import MasterRepository, {
  CategoryMasterCard,
  MasterCard,
} from '../repository/master.repository';
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
};

export type MastersList = {
  total: number;
  masters: MasterListItem[];
};

@Injectable()
class MasterService {
  constructor(
    private readonly cityService: CityService,
    private readonly categoryService: CategoryService,
    private readonly masterRepository: MasterRepository,
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

  // One page of eligible masters in the city, optionally in one category (and subcategory)
  // and up to a price.
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
}

export default MasterService;
