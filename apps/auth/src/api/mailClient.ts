import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

@Injectable()
class MailClient {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');

    this.transporter = createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: Number(config.getOrThrow<string>('SMTP_PORT')),
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user
        ? { user, pass: config.getOrThrow<string>('SMTP_PASSWORD') }
        : undefined,
    });
    this.from = config.getOrThrow<string>('MAIL_FROM');
  }

  async sendVerificationEmail(
    to: string,
    name: string | null,
    link: string,
  ): Promise<void> {
    const greeting = name ? `Hi ${name},` : 'Hi,';

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Confirm your email for glow-space',
      text: `${greeting}\n\nConfirm your email by opening this link:\n${link}\n\nThe link is valid for 24 hours.`,
      html:
        `<p>${escapeHtml(greeting)}</p>` +
        `<p>Confirm your email by opening this link:</p>` +
        `<p><a href="${escapeHtml(link)}">Confirm email</a></p>` +
        `<p>The link is valid for 24 hours.</p>`,
    });
  }
}

export default MailClient;
