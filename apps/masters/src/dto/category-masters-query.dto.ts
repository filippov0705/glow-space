import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  MASTERS_PAGE_MAX_LIMIT,
  MastersPageQueryDTO,
} from './masters-page-query.dto';

export const CATEGORY_MASTERS_DEFAULT_LIMIT = 8;

export class CategoryMastersQueryDTO extends MastersPageQueryDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sub?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MASTERS_PAGE_MAX_LIMIT)
  limit: number = CATEGORY_MASTERS_DEFAULT_LIMIT;
}
