import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import CityRepository from './repository/city.repository';
import CategoryRepository from './repository/category.repository';
import MasterRepository from './repository/master.repository';
import CategoryService from './services/category.service';
import MasterService from './services/master.service';
import CategoryController from './controllers/category.controller';
import MasterController from './controllers/master.controller';
import CategoryResponder from './responders/category.responder';
import MasterResponder from './responders/master.responder';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
  controllers: [CategoryController, MasterController],
  providers: [
    PrismaService,
    CityRepository,
    CategoryRepository,
    MasterRepository,
    CategoryService,
    MasterService,
    CategoryResponder,
    MasterResponder,
  ],
})
export class AppModule {}
