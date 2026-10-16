import { Injectable } from '@nestjs/common';
import { Status } from '@glow-space/shared';
import { EmailVerificationToken } from 'src/generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
class EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationToken> {
    return await this.prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async findLatestByUser(
    userId: number,
  ): Promise<EmailVerificationToken | null> {
    return await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteByUser(userId: number): Promise<void> {
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });
  }

  // Activates the user and removes all their verification tokens in one transaction.
  async activateUser(userId: number): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { status: Status.ACTIVE },
      }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    ]);
  }
}

export default EmailVerificationTokenRepository;
