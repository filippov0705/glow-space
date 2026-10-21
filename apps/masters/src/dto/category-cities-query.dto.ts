import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CityQueryDTO } from './city-query.dto';

export const CATEGORY_CITIES_DEFAULT_LIMIT = 3;
export const CATEGORY_CITIES_MAX_LIMIT = 10;

export class CategoryCitiesQueryDTO extends CityQueryDTO {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CATEGORY_CITIES_MAX_LIMIT)
  limit: number = CATEGORY_CITIES_DEFAULT_LIMIT;
}
