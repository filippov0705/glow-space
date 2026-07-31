import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import UserRepository from './repository/user.repository';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // доступно везде
      envFilePath: '.env', // apps/auth/.env при запуске из apps/auth
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, PrismaService],
})
export class AppModule {}
