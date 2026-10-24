import { Injectable } from '@nestjs/common';
import { SuggestionLocale } from '@glow-space/shared';
import { SearchSuggestion } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class SearchSuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Global rows (citySlug null) plus the city's rows, when a city is given.
  async findActive(
    locale: SuggestionLocale,
    citySlug: string | undefined,
    limit: number,
  ): Promise<SearchSuggestion[]> {
    return await this.prisma.searchSuggestion.findMany({
      where: {
        locale,
        isActive: true,
        OR: citySlug
          ? [{ citySlug }, { citySlug: null }]
          : [{ citySlug: null }],
      },
      orderBy: { sortOrder: 'asc' },
      take: limit,
    });
  }
}

export default SearchSuggestionRepository;
