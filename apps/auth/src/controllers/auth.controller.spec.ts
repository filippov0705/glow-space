import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Status } from '@glow-space/shared';
import AuthController from './auth.controller';
import AuthService from '../services/auth.service';
import EmailVerificationService from '../services/emailVerification.service';
import UserRepository from 'src/repository/user.repository';
import UserResponder from '../../responders/user.responder';
import { User } from 'src/generated/prisma';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from 'src/constants/auth.constants';

const tokens = { accessToken: 'access', refreshToken: 'refresh' };

const requestWithCookies = (cookies: Record<string, string>) =>
  ({ cookies }) as unknown as Request;

describe('AuthController', () => {
  let authService: {
    validateUser: jest.Mock;
    generateTokens: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
    register: jest.Mock;
    googleLogin: jest.Mock;
  };
  let userRepository: { delete: jest.Mock };
  let emailVerificationService: {
    sendVerification: jest.Mock;
    verify: jest.Mock;
    resend: jest.Mock;
  };
  let res: { cookie: jest.Mock };
  let controller: AuthController;

  beforeEach(() => {
    authService = {
      validateUser: jest.fn(),
      generateTokens: jest.fn().mockResolvedValue(tokens),
      refreshTokens: jest.fn().mockResolvedValue(tokens),
      logout: jest.fn(),
      register: jest.fn(),
      googleLogin: jest.fn(),
    };
    userRepository = { delete: jest.fn() };
    emailVerificationService = {
      sendVerification: jest.fn(),
      verify: jest.fn(),
      resend: jest.fn(),
    };
    res = { cookie: jest.fn() };
    controller = new AuthController(
      authService as unknown as AuthService,
      userRepository as unknown as UserRepository,
      new UserResponder(),
      emailVerificationService as unknown as EmailVerificationService,
    );
  });

  const setCookieNames = () =>
    res.cookie.mock.calls.map(([name]: [string]) => name);

  describe('login', () => {
    const body = { email: 'anna@example.com', password: 'secret1' };

    it('sets both token cookies for an active user', async () => {
      authService.validateUser.mockResolvedValue({
        id: 1,
        uuid: 'uuid-1',
        status: Status.ACTIVE,
      });

      const result = await controller.login(body, res as unknown as Response);

      expect(result).toEqual({ uuid: 'uuid-1', status: Status.ACTIVE });
      expect(setCookieNames()).toEqual([
        ACCESS_TOKEN_COOKIE,
        REFRESH_TOKEN_COOKIE,
      ]);
    });

    it.each([Status.PENDING_VERIFICATION, Status.BLOCKED])(
      'returns the status without tokens for status %s',
      async (status) => {
        authService.validateUser.mockResolvedValue({
          id: 1,
          uuid: 'uuid-1',
          status,
        });

        const result = await controller.login(body, res as unknown as Response);

        expect(result).toEqual({ uuid: 'uuid-1', status });
        expect(authService.generateTokens).not.toHaveBeenCalled();
        expect(res.cookie).not.toHaveBeenCalled();
      },
    );

    it('rejects invalid credentials', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login(body, res as unknown as Response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates tokens from the refresh cookie', async () => {
      await controller.refresh(
        requestWithCookies({ [REFRESH_TOKEN_COOKIE]: 'old' }),
        res as unknown as Response,
      );

      expect(authService.refreshTokens).toHaveBeenCalledWith('old');
      expect(setCookieNames()).toEqual([
        ACCESS_TOKEN_COOKIE,
        REFRESH_TOKEN_COOKIE,
      ]);
    });

    it('rejects a request without the refresh cookie', async () => {
      await expect(
        controller.refresh(requestWithCookies({}), res as unknown as Response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the refresh token from the cookie', async () => {
      await controller.logout(
        requestWithCookies({ [REFRESH_TOKEN_COOKIE]: 'old' }),
        res as unknown as Response,
      );

      expect(authService.logout).toHaveBeenCalledWith('old');
    });

    it('rejects a request without the refresh cookie', async () => {
      await expect(
        controller.logout(requestWithCookies({}), res as unknown as Response),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('creates the user and sends the verification email', async () => {
      const user = { id: 1, uuid: 'uuid-1' } as User;
      authService.register.mockResolvedValue(user);
      const body = { name: 'Anna', email: 'anna@example.com', password: 'x' };

      await expect(controller.register(body)).resolves.toEqual({
        uuid: 'uuid-1',
      });
      expect(authService.register).toHaveBeenCalledWith(body);
      expect(emailVerificationService.sendVerification).toHaveBeenCalledWith(
        user,
      );
    });
  });

  describe('google', () => {
    it('sets token cookies and returns the user', async () => {
      authService.googleLogin.mockResolvedValue({
        isNewUser: true,
        user: {
          id: 1,
          uuid: 'uuid-1',
          status: Status.ACTIVE,
          email: 'anna@example.com',
          name: null,
        },
      });

      const result = await controller.google(
        { code: 'code' },
        res as unknown as Response,
      );

      expect(result).toEqual({
        is_new_user: true,
        user: {
          uuid: 'uuid-1',
          status: Status.ACTIVE,
          email: 'anna@example.com',
          name: 'anna',
        },
      });
      expect(setCookieNames()).toEqual([
        ACCESS_TOKEN_COOKIE,
        REFRESH_TOKEN_COOKIE,
      ]);
    });
  });
});
