import { Injectable } from '@nestjs/common';
import {
  CategoriesOverviewResponse,
  CategoryMasterCardResponse,
  CategoryMastersResponse,
  CategoryPageResponse,
  CategoryResponse,
  CategoryWithCountResponse,
  CityWithCountResponse,
  SubcategoryResponse,
} from '@glow-space/shared';
import { Category, Subcategory } from 'src/generated/prisma';
import {
  CategoriesOverview,
  CategoryPage,
  CategoryWithMastersCount,
  CityWithMastersCount,
} from '../repository/category.repository';
import {
  CategoryMasterItem,
  CategoryMastersPage,
} from '../services/category.service';
import MasterResponder from './master.responder';

@Injectable()
class CategoryResponder {
  constructor(private readonly masterResponder: MasterResponder) {}

  categoryResponse(category: Category): CategoryResponse {
    return {
      slug: category.slug,
      name: category.name,
      imageUrl: category.imageUrl,
    };
  }

  categoryWithCountResponse(
    category: CategoryWithMastersCount,
  ): CategoryWithCountResponse {
    return {
      ...this.categoryResponse(category),
      description: category.description,
      mastersCount: category._count.masters,
    };
  }

  categoriesOverviewResponse(
    overview: CategoriesOverview,
  ): CategoriesOverviewResponse {
    return {
      totalMasters: overview.totalMasters,
      categories: overview.categories.map((category) =>
        this.categoryWithCountResponse(category),
      ),
    };
  }

  subcategoryResponse(subcategory: Subcategory): SubcategoryResponse {
    return {
      slug: subcategory.slug,
      name: subcategory.name,
    };
  }

  // Subcategories are distinct, from the master's active offerings in the category,
  // in subcategory sortOrder, regardless of the subcategory filter.
  categoryMasterCardResponse(
    master: CategoryMasterItem,
  ): CategoryMasterCardResponse {
    const subcategories = new Map(
      master.offerings.map(({ subcategory }) => [subcategory.id, subcategory]),
    );

    return {
      ...this.masterResponder.cardResponse(master),
      subcategories: [...subcategories.values()]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((subcategory) => this.subcategoryResponse(subcategory)),
      minPrice: master.minPrice,
      currency: master.currency,
    };
  }

  categoryMastersResponse(page: CategoryMastersPage): CategoryMastersResponse {
    return {
      total: page.total,
      masters: page.masters.map((master) =>
        this.categoryMasterCardResponse(master),
      ),
    };
  }

  cityWithCountResponse(city: CityWithMastersCount): CityWithCountResponse {
    return {
      slug: city.slug,
      name: city.name,
      mastersCount: city._count.masters,
    };
  }

  categoryPageResponse(page: CategoryPage): CategoryPageResponse {
    return {
      category: {
        ...this.categoryResponse(page.category),
        description: page.category.description,
      },
      subcategories: page.subcategories.map((subcategory) =>
        this.subcategoryResponse(subcategory),
      ),
    };
  }
}

export default CategoryResponder;
