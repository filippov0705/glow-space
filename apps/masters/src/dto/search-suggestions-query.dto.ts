import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SUGGESTION_LOCALES } from '@glow-space/shared';
import type { SuggestionLocale } from '@glow-space/shared';

export class SearchSuggestionsQueryDTO {
  @IsIn(SUGGESTION_LOCALES)
  locale!: SuggestionLocale;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;
}
