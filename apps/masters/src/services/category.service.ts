import { Injectable, NotFoundException } from '@nestjs/common';
import { MasterSort } from '@glow-space/shared';
import { Category, Subcategory } from 'src/generated/prisma';
import CategoryRepository, {
  CategoriesOverview,
  CategoryPage,
  CityWithMastersCount,
} from '../repository/category.repository';
import { haversineKm } from '../utils/haversine';
import { sortOrigin } from '../utils/origin';
import { mergePageCards } from '../utils/page-cards';
import MasterRepository, {
  CategoryMasterCard,
} from '../repository/master.repository';
import CityService from './city.service';

export type CategoryMastersQuery = {
  city: string;
  sub?: string;
  sort: MasterSort;
  offset: number;
  limit: number;
  // Origin for the nearest sort. Set together or not at all; the city centre otherwise.
  lat?: number;
  lng?: number;
};

export type CategoryMasterItem = CategoryMasterCard & {
  minPrice: number;
  currency: string;
};

export type CategoryMastersPage = {
  total: number;
  masters: CategoryMasterItem[];
};

@Injectable()
class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cityService: CityService,
    private readonly masterRepository: MasterRepository,
  ) {}

  async getAll(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  // totalMasters counts distinct active masters in the city. It is not the sum of the
  // category counts, because a master can belong to several categories.
  async getOverview(citySlug: string): Promise<CategoriesOverview> {
    const city = await this.cityService.getBySlug(citySlug);

    const [categories, totalMasters] = await Promise.all([
      this.categoryRepository.findAllWithMastersCount(city.id),
      this.masterRepository.countActiveByCity(city.id),
    ]);

    return { totalMasters, categories };
  }

  async getPage(slug: string, citySlug: string): Promise<CategoryPage> {
    const [category, city] = await Promise.all([
      this.getBySlug(slug),
      this.cityService.getBySlug(citySlug),
    ]);

    const subcategories =
      await this.categoryRepository.findSubcategoriesWithMasters(
        category.id,
        city.id,
      );

    return { category, subcategories };
  }

  async getMasters(
    slug: string,
    query: CategoryMastersQuery,
  ): Promise<CategoryMastersPage> {
    const [category, city] = await Promise.all([
      this.getBySlug(slug),
      this.cityService.getBySlug(query.city),
    ]);
    const subcategory = query.sub
      ? await this.getSubcategoryBySlug(category.id, query.sub)
      : null;

    const { total, rows } = await this.masterRepository.findPage({
      cityId: city.id,
      categoryId: category.id,
      subcategoryId: subcategory?.id ?? null,
      priceMax: null,
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
      category.id,
    );

    return { total, masters: mergePageCards(rows, cards) };
  }

  // The nearest other cities (by straight-line distance between city centres)
  // that have at least one eligible master in the category.
  async getOtherCities(
    slug: string,
    citySlug: string,
    limit: number,
  ): Promise<CityWithMastersCount[]> {
    const [category, city] = await Promise.all([
      this.getBySlug(slug),
      this.cityService.getBySlug(citySlug),
    ]);

    const cities = await this.categoryRepository.findCitiesWithMasters(
      category.id,
    );

    return cities
      .filter((other) => other.id !== city.id)
      .map((other) => ({ other, distance: haversineKm(city, other) }))
      .sort((a, b) => a.distance - b.distance || a.other.id - b.other.id)
      .slice(0, limit)
      .map(({ other }) => other);
  }

  async getSubcategoryBySlug(
    categoryId: number,
    slug: string,
  ): Promise<Subcategory> {
    const subcategory = await this.categoryRepository.findSubcategoryBySlug(
      categoryId,
      slug,
    );
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return subcategory;
  }

  async getBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }
}

export default CategoryService;
