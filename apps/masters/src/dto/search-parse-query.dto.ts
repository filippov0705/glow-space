import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CityQueryDTO } from './city-query.dto';

export const SEARCH_QUERY_MAX_LENGTH = 300;

export class SearchParseQueryDTO extends CityQueryDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(SEARCH_QUERY_MAX_LENGTH)
  q!: string;
}
