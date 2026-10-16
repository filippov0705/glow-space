import { Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma';
import CategoryRepository from '../repository/category.repository';

@Injectable()
class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async getAll(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }
}

export default CategoryService;
