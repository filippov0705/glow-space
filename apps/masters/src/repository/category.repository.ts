import { Injectable } from '@nestjs/common';
import { MasterStatus } from '@glow-space/shared';
import { Category, City, Subcategory } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

export type CityWithMastersCount = City & {
  _count: { masters: number };
};

export type CategoryWithMastersCount = Category & {
  _count: { masters: number };
};

export type CategoriesOverview = {
  totalMasters: number;
  categories: CategoryWithMastersCount[];
};

export type CategoryPage = {
  category: Category;
  subcategories: Subcategory[];
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

  async findBySlug(slug: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { slug },
    });
  }

  async findSubcategoryBySlug(
    categoryId: number,
    slug: string,
  ): Promise<Subcategory | null> {
    return await this.prisma.subcategory.findUnique({
      where: { categoryId_slug: { categoryId, slug } },
    });
  }

  // Subcategories of the category with at least one active master in the city
  // that has an active offering in them.
  async findSubcategoriesWithMasters(
    categoryId: number,
    cityId: number,
  ): Promise<Subcategory[]> {
    return await this.prisma.subcategory.findMany({
      where: {
        categoryId,
        offerings: {
          some: {
            isActive: true,
            master: { cityId, status: MasterStatus.ACTIVE },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Cities with at least one active master that has an active offering in the
  // category, with the count of such masters.
  async findCitiesWithMasters(
    categoryId: number,
  ): Promise<CityWithMastersCount[]> {
    const eligibleMaster = {
      status: MasterStatus.ACTIVE,
      offerings: { some: { categoryId, isActive: true } },
    };

    return await this.prisma.city.findMany({
      where: { masters: { some: eligibleMaster } },
      include: {
        _count: { select: { masters: { where: eligibleMaster } } },
      },
    });
  }
}

export default CategoryRepository;
