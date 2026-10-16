import { Injectable } from '@nestjs/common';
import { MasterStatus } from '@glow-space/shared';
import { Master, Prisma } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

// Data needed for a master card: categories in display order and the cover (first work).
const masterCardArgs = {
  include: {
    categories: {
      include: { category: true },
      orderBy: { category: { sortOrder: 'asc' } },
    },
    works: { orderBy: { sortOrder: 'asc' }, take: 1 },
  },
} satisfies Prisma.MasterDefaultArgs;

export type MasterCard = Prisma.MasterGetPayload<typeof masterCardArgs>;

@Injectable()
class MasterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTopRatedCards(
    cityId: number,
    limit: number,
  ): Promise<MasterCard[]> {
    return await this.prisma.master.findMany({
      where: { cityId, status: MasterStatus.ACTIVE, rating: { not: null } },
      orderBy: [{ rating: 'desc' }, { reviewsCount: 'desc' }],
      take: limit,
      ...masterCardArgs,
    });
  }

  // Prisma has no random ordering, hence the raw query.
  async findRandomUnratedIds(cityId: number, limit: number): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM masters
      WHERE city_id = ${cityId}
        AND status = ${MasterStatus.ACTIVE}
        AND rating IS NULL
      ORDER BY random()
      LIMIT ${limit}
    `;
    return rows.map((row) => row.id);
  }

  async findCardsByIds(ids: number[]): Promise<MasterCard[]> {
    return await this.prisma.master.findMany({
      where: { id: { in: ids } },
      ...masterCardArgs,
    });
  }

  async findActiveByCity(cityId: number): Promise<Master[]> {
    return await this.prisma.master.findMany({
      where: { cityId, status: MasterStatus.ACTIVE },
    });
  }
}

export default MasterRepository;
