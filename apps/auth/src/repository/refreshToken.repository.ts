import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { convertDateForSQL } from '@glow-space/shared';

@Injectable()
class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    tokenHash: string,
    expiresAt: number,
  ): Promise<RefreshToken> {
    return await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: convertDateForSQL(new Date(expiresAt)),
      },
    });
  }

  async findByToken(tokenHash: string): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revoke(id: number): Promise<RefreshToken> {
    return await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: convertDateForSQL(new Date()) },
    });
  }
}

export default RefreshTokenRepository;
