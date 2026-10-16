import { Controller, Get } from '@nestjs/common';
import { CategoryResponse } from '@glow-space/shared';
import CategoryService from '../services/category.service';
import CategoryResponder from '../responders/category.responder';

@Controller('categories')
class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly categoryResponder: CategoryResponder,
  ) {}

  @Get()
  async getAll(): Promise<CategoryResponse[]> {
    const categories = await this.categoryService.getAll();

    return categories.map((category) =>
      this.categoryResponder.categoryResponse(category),
    );
  }
}

export default CategoryController;
