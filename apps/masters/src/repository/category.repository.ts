import { Injectable } from '@nestjs/common';
import { MasterStatus } from '@glow-space/shared';
import { Category } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

export type CategoryWithMastersCount = Category & {
  _count: { masters: number };
};

export type CategoriesOverview = {
  totalMasters: number;
  categories: CategoryWithMastersCount[];
};

@Injectable()
class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Categories with no active masters in the city are returned too, with a count of 0.
  async findAllWithMastersCount(
    cityId: number,
  ): Promise<CategoryWithMastersCount[]> {
    return await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            masters: {
              where: { master: { cityId, status: MasterStatus.ACTIVE } },
            },
          },
        },
      },
    });
  }
}

export default CategoryRepository;
