import { Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma';
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

  async create(
    user: Omit<User, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return await this.prisma.user.create({ data: user });
  }

  async update(
    id: number,
    user: Omit<User, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return await this.prisma.user.update({ where: { id }, data: user });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { googleId } });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.user.delete({ where: { uuid } });
  }
}

export default UserRepository;
