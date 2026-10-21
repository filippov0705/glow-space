import {
  Controller,
  Get,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  CategoriesOverviewResponse,
  CategoryMastersResponse,
  CategoryPageResponse,
  CategoryResponse,
  CityWithCountResponse,
} from '@glow-space/shared';
import CategoryService from '../services/category.service';
import CategoryResponder from '../responders/category.responder';
import { CityQueryDTO } from 'src/dto/city-query.dto';
import { CategoryMastersQueryDTO } from 'src/dto/category-masters-query.dto';
import { CategoryCitiesQueryDTO } from 'src/dto/category-cities-query.dto';

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

  @Get(':slug')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getPage(
    @Param('slug') slug: string,
    @Query() query: CityQueryDTO,
  ): Promise<CategoryPageResponse> {
    const page = await this.categoryService.getPage(slug, query.city);

    return this.categoryResponder.categoryPageResponse(page);
  }

  @Get(':slug/masters')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getMasters(
    @Param('slug') slug: string,
    @Query() query: CategoryMastersQueryDTO,
  ): Promise<CategoryMastersResponse> {
    const page = await this.categoryService.getMasters(slug, query);

    return this.categoryResponder.categoryMastersResponse(page);
  }

  @Get(':slug/cities')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getOtherCities(
    @Param('slug') slug: string,
    @Query() query: CategoryCitiesQueryDTO,
  ): Promise<CityWithCountResponse[]> {
    const cities = await this.categoryService.getOtherCities(
      slug,
      query.city,
      query.limit,
    );

    return cities.map((city) =>
      this.categoryResponder.cityWithCountResponse(city),
    );
  }
}

export default CategoryController;
