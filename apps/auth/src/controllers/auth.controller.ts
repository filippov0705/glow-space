import { AuthService } from '../services/auth.service';
import {
  Body,
  Controller,
  Req,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Res,
} from '@nestjs/common';
import { LoginDTO } from '../dto/login.dto';
import type { Response, Request } from 'express';
import { Status } from '@prisma/client';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_MS,
} from 'src/constants/auth.constants';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!raw) {
      throw new UnauthorizedException();
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(raw);

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_MS,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  @Post('/login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() body: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ uuid: string; status: Status }> {
    const user = await this.authService.validateUser(body);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== Status.ACTIVE) {
      return { uuid: user.uuid, status: user.status };
    }

    const { accessToken, refreshToken } =
      await this.authService.generateTokens(user);

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_MS,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return { uuid: user.uuid, status: user.status };
  }
}
