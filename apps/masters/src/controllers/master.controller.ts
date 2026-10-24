import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  MasterCardResponse,
  MasterMapPointResponse,
  MastersListResponse,
} from '@glow-space/shared';
import MasterService from '../services/master.service';
import MasterResponder from '../responders/master.responder';
import { CityQueryDTO } from 'src/dto/city-query.dto';
import { MastersListQueryDTO } from 'src/dto/masters-list-query.dto';
import { TopMastersQueryDTO } from 'src/dto/top-masters-query.dto';

// transform: true turns query strings into DTO instances, so `limit` becomes a number
// and gets its default value.
const queryValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

@Controller('masters')
class MasterController {
  constructor(
    private readonly masterService: MasterService,
    private readonly masterResponder: MasterResponder,
  ) {}

  @Get()
  @UsePipes(queryValidationPipe)
  async getList(
    @Query() query: MastersListQueryDTO,
  ): Promise<MastersListResponse> {
    const list = await this.masterService.getList(query);

    return this.masterResponder.listResponse(list);
  }

  @Get('top')
  @UsePipes(queryValidationPipe)
  async getTop(
    @Query() query: TopMastersQueryDTO,
  ): Promise<MasterCardResponse[]> {
    const masters = await this.masterService.getTop(query.city, query.limit);

    return masters.map((master) => this.masterResponder.cardResponse(master));
  }

  @Get('map')
  @UsePipes(queryValidationPipe)
  async getMapPoints(
    @Query() query: CityQueryDTO,
  ): Promise<MasterMapPointResponse[]> {
    const masters = await this.masterService.getMapPoints(query.city);

    return masters.map((master) =>
      this.masterResponder.mapPointResponse(master),
    );
  }
}

export default MasterController;
