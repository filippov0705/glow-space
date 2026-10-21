import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MASTER_SORTS } from '@glow-space/shared';
import type { MasterSort } from '@glow-space/shared';
import { CityQueryDTO } from './city-query.dto';

export const CATEGORY_MASTERS_DEFAULT_LIMIT = 8;
export const CATEGORY_MASTERS_MAX_LIMIT = 24;

export class CategoryMastersQueryDTO extends CityQueryDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sub?: string;

  @IsOptional()
  @IsIn(MASTER_SORTS)
  sort: MasterSort = 'top_rated';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CATEGORY_MASTERS_MAX_LIMIT)
  limit: number = CATEGORY_MASTERS_DEFAULT_LIMIT;
}
