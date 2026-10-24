import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  SearchParseResponse,
  SearchSuggestionResponse,
} from '@glow-space/shared';
import SearchService from '../services/search.service';
import SearchResponder from '../responders/search.responder';
import { SearchSuggestionsQueryDTO } from 'src/dto/search-suggestions-query.dto';
import { SearchParseQueryDTO } from 'src/dto/search-parse-query.dto';

@Controller('search')
class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly searchResponder: SearchResponder,
  ) {}

  @Get('suggestions')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async getSuggestions(
    @Query() query: SearchSuggestionsQueryDTO,
  ): Promise<SearchSuggestionResponse[]> {
    const suggestions = await this.searchService.getSuggestions(
      query.locale,
      query.city,
    );

    return suggestions.map((suggestion) =>
      this.searchResponder.suggestionResponse(suggestion),
    );
  }

  @Get('parse')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async parse(
    @Query() query: SearchParseQueryDTO,
  ): Promise<SearchParseResponse> {
    const result = await this.searchService.parse(query);

    return this.searchResponder.parseResponse(result);
  }
}

export default SearchController;
