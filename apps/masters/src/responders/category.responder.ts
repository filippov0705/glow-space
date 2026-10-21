import { Injectable } from '@nestjs/common';
import {
  CategoriesOverviewResponse,
  CategoryResponse,
  CategoryWithCountResponse,
} from '@glow-space/shared';
import { Category } from 'src/generated/prisma';
import {
  CategoriesOverview,
  CategoryWithMastersCount,
} from '../repository/category.repository';

@Injectable()
class CategoryResponder {
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
}

export default CategoryResponder;
