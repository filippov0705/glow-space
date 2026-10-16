import { Injectable, NotFoundException } from '@nestjs/common';
import { City, User } from 'src/generated/prisma';
import UserRepository from '../repository/user.repository';
import CityRepository from '../repository/city.repository';

@Injectable()
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cityRepository: CityRepository,
  ) {}

  async updateCity(
    userUUID: string,
    citySlug: string,
  ): Promise<{ user: User; city: City }> {
    const city = await this.cityRepository.findBySlug(citySlug);
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const user = await this.userRepository.updateCity(userUUID, city.id);

    return { user, city };
  }

  async updateName(userUUID: string, name: string): Promise<User> {
    const user = await this.userRepository.updateName(userUUID, name);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

export default UserService;
