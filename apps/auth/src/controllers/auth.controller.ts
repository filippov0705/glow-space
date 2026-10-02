import AuthService from '../services/auth.service';
import {
  Body,
  Controller,
  Req,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Res,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { LoginDTO } from '../dto/login.dto';
import type { Response, Request } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_MS,
} from 'src/constants/auth.constants';
import { RegisterDTO } from 'src/dto/register.dto';
import { Status } from '@glow-space/shared';
import UserRepository from 'src/repository/user.repository';
import { GoogleLoginDTO } from 'src/dto/google.login.dto';

@Controller()
class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
  ) {}

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

  @Post('/register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() body: RegisterDTO): Promise<{ uuid: string }> {
    const user = await this.authService.register(body);

    return { uuid: user.uuid };
  }

  @Delete('/register/:uuid')
  async revertRegister(@Param('uuid') uuid: string): Promise<void> {
    await this.userRepository.delete(uuid);
  }

  @Post('/google')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async google(
    @Body() body: GoogleLoginDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ uuid: string; status: Status }> {
    const user = await this.authService.googleLogin(body.code);

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

export default AuthController;
