import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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

// The free-slot dates come together or not at all.
const hasDates = (dto: MastersListQueryDTO): boolean =>
  dto.dateFrom !== undefined || dto.dateTo !== undefined;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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

  // Local dates of a free slot, YYYY-MM-DD, inclusive. The range is checked in the service,
  // since "today" depends on the city's timezone.
  @ValidateIf(hasDates)
  @Matches(DATE_ONLY)
  @IsISO8601({ strict: true })
  dateFrom?: string;

  @ValidateIf(hasDates)
  @Matches(DATE_ONLY)
  @IsISO8601({ strict: true })
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MASTERS_PAGE_MAX_LIMIT)
  limit: number = MASTERS_LIST_DEFAULT_LIMIT;
}
