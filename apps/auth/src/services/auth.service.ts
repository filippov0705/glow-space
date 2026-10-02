import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { LoginDTO } from 'src/dto/login.dto';
import UserRepository from 'src/repository/user.repository';
import RefreshTokenRepository from 'src/repository/refreshToken.repository';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { REFRESH_TOKEN_TTL_MS } from 'src/constants/auth.constants';
import { RegisterDTO } from 'src/dto/register.dto';
import { Status } from '@glow-space/shared';
import { GoogleLoginDTO } from 'src/dto/google.login.dto';
import OAuth2Client from 'src/api/oauth2Client';
import e from 'express';

@Injectable()
class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly oauth2Client: OAuth2Client,
  ) {}

  async register(body: RegisterDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(body.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.userRepository.create({
      email: body.email,
      password: await bcrypt.hash(body.password, 10),
      name: body.name,
      status: Status.PENDING_VERIFICATION,
      googleId: null,
    });

    return user;
  }

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

    if (!user || !user.password) return null;

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) return null;

    return { id: user.id, uuid: user.uuid, status: user.status };
  }

  async googleLogin(code: string): Promise<User> {
    const accessToken = await this.oauth2Client.getToken(code);
    const { email, sub } = await this.oauth2Client.getUserInfo(accessToken);

    const sameSubUser = await this.userRepository.findByGoogleId(sub);
    if (sameSubUser) {
      if (sameSubUser.status === Status.BLOCKED) {
        throw new ForbiddenException('User is blocked');
      }

      return sameSubUser;
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      if (existingUser.googleId) {
        throw new ConflictException('User already exists');
      }

      if (existingUser.status !== Status.PENDING_VERIFICATION) {
        existingUser.password = null;
      }

      if (existingUser.status === Status.BLOCKED) {
        throw new ForbiddenException('User is blocked');
      }

      existingUser.googleId = sub;
      existingUser.status = Status.ACTIVE;

      await this.userRepository.update(existingUser.id, existingUser);
      return existingUser;
    }

    const user = await this.userRepository.create({
      email,
      password: null,
      name: null,
      status: Status.ACTIVE,
      googleId: sub,
    });

    return user;
  }
}

export default AuthService;
