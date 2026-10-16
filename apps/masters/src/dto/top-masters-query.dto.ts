import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CityQueryDTO } from './city-query.dto';

export const TOP_MASTERS_DEFAULT_LIMIT = 4;
export const TOP_MASTERS_MAX_LIMIT = 20;

export class TopMastersQueryDTO extends CityQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TOP_MASTERS_MAX_LIMIT)
  limit: number = TOP_MASTERS_DEFAULT_LIMIT;
}
