import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import CityRepository from './repository/city.repository';
import CategoryRepository from './repository/category.repository';
import MasterRepository from './repository/master.repository';
import SearchSuggestionRepository from './repository/search-suggestion.repository';
import CityService from './services/city.service';
import CategoryService from './services/category.service';
import MasterService from './services/master.service';
import SearchService from './services/search.service';
import GeocodingService from './services/geocoding.service';
import CategoryController from './controllers/category.controller';
import MasterController from './controllers/master.controller';
import SearchController from './controllers/search.controller';
import CategoryResponder from './responders/category.responder';
import MasterResponder from './responders/master.responder';
import SearchResponder from './responders/search.responder';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })],
  controllers: [CategoryController, MasterController, SearchController],
  providers: [
    PrismaService,
    CityRepository,
    CategoryRepository,
    MasterRepository,
    SearchSuggestionRepository,
    CityService,
    CategoryService,
    MasterService,
    SearchService,
    GeocodingService,
    CategoryResponder,
    MasterResponder,
    SearchResponder,
  ],
})
export class AppModule {}
