import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  CategoriesOverviewResponse,
  CategoryResponse,
} from '@glow-space/shared';
import CategoryService from '../services/category.service';
import CategoryResponder from '../responders/category.responder';
import { CityQueryDTO } from 'src/dto/city-query.dto';

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

  @Get('overview')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getOverview(
    @Query() query: CityQueryDTO,
  ): Promise<CategoriesOverviewResponse> {
    const overview = await this.categoryService.getOverview(query.city);

    return this.categoryResponder.categoriesOverviewResponse(overview);
  }
}

export default CategoryController;
