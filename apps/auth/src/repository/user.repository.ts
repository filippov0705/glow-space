import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(
    user: Omit<User, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return await this.prisma.user.create({ data: user });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }
}

export default UserRepository;
