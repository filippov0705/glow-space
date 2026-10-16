import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { Status } from '@glow-space/shared';
import { User } from 'src/generated/prisma';
import UserRepository from 'src/repository/user.repository';
import EmailVerificationTokenRepository from 'src/repository/emailVerificationToken.repository';
import MailClient from 'src/api/mailClient';
import {
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_TTL_MS,
} from 'src/constants/auth.constants';

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly tokenRepository: EmailVerificationTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly mailClient: MailClient,
    private readonly config: ConfigService,
  ) {}

  // A failed email does not fail the caller: the user can request it again.
  async sendVerification(user: User): Promise<void> {
    const token = randomBytes(32).toString('base64url');
    await this.tokenRepository.create(
      user.id,
      hashToken(token),
      new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    );

    const link = new URL(
      '/verify-email',
      this.config.getOrThrow<string>('WEB_URL'),
    );
    link.searchParams.set('token', token);

    try {
      await this.mailClient.sendVerificationEmail(
        user.email,
        user.name,
        link.toString(),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to user ${user.uuid}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async verify(token: string): Promise<void> {
    const record = await this.tokenRepository.findByHash(hashToken(token));
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.userRepository.findById(record.userId);
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    const status: Status = user.status;
    if (status === Status.BLOCKED) {
      throw new ForbiddenException('User is blocked');
    }

    await this.tokenRepository.activateUser(user.id);
  }

  // Silently does nothing for unknown, already verified or too frequent requests,
  // so the response does not reveal whether the email is registered.
  async resend(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return;
    }
    const status: Status = user.status;
    if (status !== Status.PENDING_VERIFICATION) {
      return;
    }

    const latest = await this.tokenRepository.findLatestByUser(user.id);
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() <
        EMAIL_VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      return;
    }

    await this.tokenRepository.deleteByUser(user.id);
    await this.sendVerification(user);
  }
}

export default EmailVerificationService;
