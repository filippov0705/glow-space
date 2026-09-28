import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        status: number;
      }>(token);

      (req as JwtAuthGuardRequest).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

export type JwtAuthGuardRequest = Request & { user: { sub: string } };
