import { Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma';
import CategoryRepository, {
  CategoriesOverview,
} from '../repository/category.repository';
import MasterRepository from '../repository/master.repository';
import CityService from './city.service';

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
}

export default CategoryService;
