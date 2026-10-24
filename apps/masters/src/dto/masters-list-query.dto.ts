import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  MASTERS_PAGE_MAX_LIMIT,
  MastersPageQueryDTO,
} from './masters-page-query.dto';

export const MASTERS_LIST_DEFAULT_LIMIT = 12;

// A subcategory slug is only unique within its category, so the category is required with it.
const needsCategory = (dto: MastersListQueryDTO): boolean =>
  dto.category !== undefined || dto.subcategory !== undefined;

export class MastersListQueryDTO extends MastersPageQueryDTO {
  // Category slug to filter by.
  @ValidateIf(needsCategory)
  @IsString()
  @IsNotEmpty()
  category?: string;

  // Subcategory slug within the category.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subcategory?: string;

  // Highest offering price, in cents.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MASTERS_PAGE_MAX_LIMIT)
  limit: number = MASTERS_LIST_DEFAULT_LIMIT;
}
