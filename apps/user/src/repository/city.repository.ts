import { Injectable } from '@nestjs/common';
import { City } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class CityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<City | null> {
    return await this.prisma.city.findUnique({
      where: { slug },
    });
  }
}

export default CityRepository;
