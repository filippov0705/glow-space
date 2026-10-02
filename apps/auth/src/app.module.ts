import { Module } from '@nestjs/common';
import AuthController from './controllers/auth.controller';
import AuthService from './services/auth.service';
import UserRepository from './repository/user.repository';
import PrismaService from '../prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import RefreshTokenRepository from './repository/refreshToken.repository';
import OAuth2Client from './api/oauth2Client';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    PrismaService,
    RefreshTokenRepository,
    OAuth2Client,
  ],
})
export class AppModule {}
