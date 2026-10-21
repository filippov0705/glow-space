import { Injectable } from '@nestjs/common';
import MasterRepository, { MasterCard } from '../repository/master.repository';
import CityService from './city.service';

@Injectable()
class MasterService {
  constructor(
    private readonly cityService: CityService,
    private readonly masterRepository: MasterRepository,
  ) {}

  // Masters with a rating go first, best rated first.
  // Free places are filled with random masters that have no reviews yet.
  async getTop(citySlug: string, limit: number): Promise<MasterCard[]> {
    const city = await this.cityService.getBySlug(citySlug);

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
    const city = await this.cityService.getBySlug(citySlug);

    return await this.masterRepository.findActiveCardsByCity(city.id);
  }
}

export default MasterService;
