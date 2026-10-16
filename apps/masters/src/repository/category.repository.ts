import { Injectable } from '@nestjs/common';
import { Category } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }
}

export default CategoryRepository;
