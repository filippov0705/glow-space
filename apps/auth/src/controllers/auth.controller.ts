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
  HttpCode,
  HttpStatus,
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
import { GoogleAuthResponse, Status } from '@glow-space/shared';
import UserRepository from 'src/repository/user.repository';
import { GoogleLoginDTO } from 'src/dto/google.login.dto';
import UserResponder from '../../responders/user.responder';
import RefreshTokenRepository from 'src/repository/refreshToken.repository';
import EmailVerificationService from 'src/services/emailVerification.service';
import { VerifyEmailDTO } from 'src/dto/verify.email.dto';
import { ResendVerificationDTO } from 'src/dto/resend.verification.dto';

@Controller()
class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly userResponder: UserResponder,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('/logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!raw) throw new UnauthorizedException();

    await this.authService.logout(raw);
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!raw) throw new UnauthorizedException();

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
    await this.emailVerificationService.sendVerification(user);

    return { uuid: user.uuid };
  }

  @Post('/verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async verifyEmail(@Body() body: VerifyEmailDTO): Promise<void> {
    await this.emailVerificationService.verify(body.token);
  }

  @Post('/verify-email/resend')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async resendVerification(@Body() body: ResendVerificationDTO): Promise<void> {
    await this.emailVerificationService.resend(body.email);
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
  ): Promise<GoogleAuthResponse> {
    const { isNewUser, user } = await this.authService.googleLogin(body.code);

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

    return this.userResponder.googleAuthResponse(user, isNewUser);
  }
}

export default AuthController;
