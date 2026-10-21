import { Injectable, NotFoundException } from '@nestjs/common';
import { City } from 'src/generated/prisma';
import CityRepository from '../repository/city.repository';

@Injectable()
class CityService {
  constructor(private readonly cityRepository: CityRepository) {}

  async getBySlug(slug: string): Promise<City> {
    const city = await this.cityRepository.findBySlug(slug);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    return city;
  }
}

export default CityService;
