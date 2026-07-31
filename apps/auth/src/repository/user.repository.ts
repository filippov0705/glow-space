import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createUser(
    user: Omit<User, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    return this.prisma.user.create({ data: user });
  }
}

export default UserRepository;
