import { Injectable } from '@nestjs/common';
import { CategoryResponse } from '@glow-space/shared';
import { Category } from 'src/generated/prisma';

@Injectable()
class CategoryResponder {
  categoryResponse(category: Category): CategoryResponse {
    return {
      slug: category.slug,
      name: category.name,
    };
  }
}

export default CategoryResponder;
