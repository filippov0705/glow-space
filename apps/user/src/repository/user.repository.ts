import { Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(userUUID: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { uuid: userUUID },
    });
  }

  async create(
    user: Omit<User, 'id' | 'cityId' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return await this.prisma.user.create({ data: user });
  }

  async updateName(userUUID: string, name: string): Promise<User | null> {
    return await this.prisma.user.update({
      where: { uuid: userUUID },
      data: { name },
    });
  }

  async updateCity(userUUID: string, cityId: number): Promise<User> {
    return await this.prisma.user.update({
      where: { uuid: userUUID },
      data: { cityId },
    });
  }
}

export default UserRepository;
