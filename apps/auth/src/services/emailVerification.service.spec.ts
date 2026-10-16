import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Status } from '@glow-space/shared';
import EmailVerificationService from './emailVerification.service';
import EmailVerificationTokenRepository from 'src/repository/emailVerificationToken.repository';
import UserRepository from 'src/repository/user.repository';
import MailClient from 'src/api/mailClient';
import { EmailVerificationToken, User } from 'src/generated/prisma';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('EmailVerificationService', () => {
  const user = {
    id: 1,
    uuid: 'uuid-1',
    email: 'anna@example.com',
    name: 'Anna',
    status: Status.PENDING_VERIFICATION,
  } as User;

  let tokenRepository: {
    create: jest.Mock;
    findByHash: jest.Mock;
    findLatestByUser: jest.Mock;
    deleteByUser: jest.Mock;
    activateUser: jest.Mock;
  };
  let userRepository: { findById: jest.Mock; findByEmail: jest.Mock };
  let mailClient: { sendVerificationEmail: jest.Mock };
  let service: EmailVerificationService;

  beforeEach(() => {
    tokenRepository = {
      create: jest.fn(),
      findByHash: jest.fn(),
      findLatestByUser: jest.fn(),
      deleteByUser: jest.fn(),
      activateUser: jest.fn(),
    };
    userRepository = { findById: jest.fn(), findByEmail: jest.fn() };
    mailClient = { sendVerificationEmail: jest.fn() };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('http://web.test'),
    };
    service = new EmailVerificationService(
      tokenRepository as unknown as EmailVerificationTokenRepository,
      userRepository as unknown as UserRepository,
      mailClient as unknown as MailClient,
      config as unknown as ConfigService,
    );
  });

  describe('sendVerification', () => {
    it('stores only the token hash and emails a link with the token', async () => {
      await service.sendVerification(user);

      const [, , link] = mailClient.sendVerificationEmail.mock.calls[0] as [
        string,
        string,
        string,
      ];
      const token = new URL(link).searchParams.get('token')!;
      expect(link).toMatch(/^http:\/\/web\.test\/verify-email\?token=/);
      expect(mailClient.sendVerificationEmail).toHaveBeenCalledWith(
        'anna@example.com',
        'Anna',
        link,
      );
      expect(tokenRepository.create).toHaveBeenCalledWith(
        1,
        sha256(token),
        expect.any(Date),
      );
    });

    it('does not throw when the email cannot be sent', async () => {
      mailClient.sendVerificationEmail.mockRejectedValue(new Error('smtp'));

      await expect(service.sendVerification(user)).resolves.toBeUndefined();
    });
  });

  describe('verify', () => {
    const validToken = (): EmailVerificationToken =>
      ({
        userId: 1,
        expiresAt: new Date(Date.now() + 60_000),
      }) as EmailVerificationToken;

    it('activates the user found by the token hash', async () => {
      tokenRepository.findByHash.mockResolvedValue(validToken());
      userRepository.findById.mockResolvedValue(user);

      await service.verify('raw-token');

      expect(tokenRepository.findByHash).toHaveBeenCalledWith(
        sha256('raw-token'),
      );
      expect(tokenRepository.activateUser).toHaveBeenCalledWith(1);
    });

    it('rejects an unknown token', async () => {
      tokenRepository.findByHash.mockResolvedValue(null);

      await expect(service.verify('raw-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(tokenRepository.activateUser).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      tokenRepository.findByHash.mockResolvedValue({
        userId: 1,
        expiresAt: new Date(Date.now() - 1),
      });

      await expect(service.verify('raw-token')).rejects.toThrow(
        BadRequestException,
      );
      expect(tokenRepository.activateUser).not.toHaveBeenCalled();
    });

    it('rejects a blocked user', async () => {
      tokenRepository.findByHash.mockResolvedValue(validToken());
      userRepository.findById.mockResolvedValue({
        ...user,
        status: Status.BLOCKED,
      });

      await expect(service.verify('raw-token')).rejects.toThrow(
        ForbiddenException,
      );
      expect(tokenRepository.activateUser).not.toHaveBeenCalled();
    });
  });

  describe('resend', () => {
    it('replaces old tokens and sends a new email to a pending user', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      tokenRepository.findLatestByUser.mockResolvedValue({
        createdAt: new Date(Date.now() - 5 * 60_000),
      });

      await service.resend('anna@example.com');

      expect(tokenRepository.deleteByUser).toHaveBeenCalledWith(1);
      expect(mailClient.sendVerificationEmail).toHaveBeenCalled();
    });

    it('does nothing within the cooldown', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      tokenRepository.findLatestByUser.mockResolvedValue({
        createdAt: new Date(),
      });

      await service.resend('anna@example.com');

      expect(tokenRepository.deleteByUser).not.toHaveBeenCalled();
      expect(mailClient.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it.each([
      ['unknown', null],
      ['active', { ...user, status: Status.ACTIVE }],
    ])('does nothing for an %s user', async (_, found) => {
      userRepository.findByEmail.mockResolvedValue(found);

      await service.resend('anna@example.com');

      expect(mailClient.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
