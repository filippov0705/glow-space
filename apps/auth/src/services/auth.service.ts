import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { LoginDTO } from 'src/dto/login.dto';
import UserRepository from 'src/repository/user.repository';
import RefreshTokenRepository from 'src/repository/refreshToken.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { REFRESH_TOKEN_TTL_MS } from 'src/constants/auth.constants';

@Injectable()
class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const token = await this.refreshTokenRepository.findByToken(tokenHash);

    if (
      !token ||
      token.revokedAt ||
      new Date(token.expiresAt).valueOf() < Date.now()
    ) {
      throw new UnauthorizedException();
    }

    this.refreshTokenRepository.revoke(token.id);

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return await this.generateTokens(user);
  }

  async generateTokens(user: {
    id: number;
    uuid: string;
    status: Status;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.uuid,
      status: user.status,
    });

    const refreshToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    await this.refreshTokenRepository.create(
      user.id,
      tokenHash,
      Date.now() + REFRESH_TOKEN_TTL_MS,
    );

    return { accessToken, refreshToken };
  }

  async validateUser(
    body: LoginDTO,
  ): Promise<{ id: number; uuid: string; status: Status } | null> {
    const user = await this.userRepository.findByEmail(body.email);

    if (!user) return null;

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) return null;

    return { id: user.id, uuid: user.uuid, status: user.status };
  }
}

export default AuthService;
