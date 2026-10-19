import { Injectable, NotFoundException } from '@nestjs/common';
import { City } from 'src/generated/prisma';
import CityRepository from '../repository/city.repository';
import MasterRepository, { MasterCard } from '../repository/master.repository';

@Injectable()
class MasterService {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly masterRepository: MasterRepository,
  ) {}

  // Masters with a rating go first, best rated first.
  // Free places are filled with random masters that have no reviews yet.
  async getTop(citySlug: string, limit: number): Promise<MasterCard[]> {
    const city = await this.getCity(citySlug);

    const rated = await this.masterRepository.findTopRatedCards(city.id, limit);
    if (rated.length === limit) {
      return rated;
    }

    const randomIds = await this.masterRepository.findRandomUnratedIds(
      city.id,
      limit - rated.length,
    );
    if (randomIds.length === 0) {
      return rated;
    }

    // findCardsByIds does not keep the random order, so restore it.
    const unrated = await this.masterRepository.findCardsByIds(randomIds);
    const unratedById = new Map(unrated.map((master) => [master.id, master]));

    return [...rated, ...randomIds.flatMap((id) => unratedById.get(id) ?? [])];
  }

  async getMapPoints(citySlug: string): Promise<MasterCard[]> {
    const city = await this.getCity(citySlug);

    return await this.masterRepository.findActiveCardsByCity(city.id);
  }

  private async getCity(citySlug: string): Promise<City> {
    const city = await this.cityRepository.findBySlug(citySlug);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    return city;
  }
}

export default MasterService;
