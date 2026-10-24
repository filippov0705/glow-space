import { Injectable } from '@nestjs/common';
import {
  CategoriesOverviewResponse,
  CategoryPageResponse,
  CategoryResponse,
  CategoryWithCountResponse,
  CityWithCountResponse,
  MastersListResponse,
  SubcategoryResponse,
} from '@glow-space/shared';
import { Category, Subcategory } from 'src/generated/prisma';
import {
  CategoriesOverview,
  CategoryPage,
  CategoryWithMastersCount,
  CityWithMastersCount,
} from '../repository/category.repository';
import { CategoryMastersPage } from '../services/category.service';
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
    return this.masterResponder.subcategoryResponse(subcategory);
  }

  // Same contract as GET /masters; subcategories are from the master's active
  // offerings in the category.
  categoryMastersResponse(page: CategoryMastersPage): MastersListResponse {
    return this.masterResponder.listResponse(page);
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
