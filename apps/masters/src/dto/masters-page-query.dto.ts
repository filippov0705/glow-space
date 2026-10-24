import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { MASTER_SORTS } from '@glow-space/shared';
import type { MasterSort } from '@glow-space/shared';
import { CityQueryDTO } from './city-query.dto';

export const MASTERS_PAGE_MAX_LIMIT = 24;

// Query strings become numbers; an empty string stays as is so that it fails IsNumber
// instead of turning into 0.
const toCoordinate = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

// lat and lng are validated when either is present, so one without the other fails.
const hasOrigin = (dto: MastersPageQueryDTO): boolean =>
  dto.lat !== undefined || dto.lng !== undefined;

// Query of a paged, sorted masters list in a city. Subclasses add `limit` with their own
// default (up to MASTERS_PAGE_MAX_LIMIT) and their filters.
export class MastersPageQueryDTO extends CityQueryDTO {
  @IsOptional()
  @IsIn(MASTER_SORTS)
  sort: MasterSort = 'top_rated';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  // Origin for the nearest sort (the user's location). Both or neither.
  @ValidateIf(hasOrigin)
  @Transform(toCoordinate)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ValidateIf(hasOrigin)
  @Transform(toCoordinate)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}
