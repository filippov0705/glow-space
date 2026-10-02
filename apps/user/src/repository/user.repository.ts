import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
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
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return await this.prisma.user.create({ data: user });
  }
}

export default UserRepository;
