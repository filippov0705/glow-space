import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchSuggestionsQueryDTO } from './search-suggestions-query.dto';

describe('SearchSuggestionsQueryDTO', () => {
  const invalidProperties = async (
    query: Record<string, string>,
  ): Promise<string[]> => {
    const errors = await validate(
      plainToInstance(SearchSuggestionsQueryDTO, query),
    );
    return errors.map((error) => error.property);
  };

  it('accepts every supported locale', async () => {
    await expect(invalidProperties({ locale: 'en' })).resolves.toEqual([]);
    await expect(invalidProperties({ locale: 'ru' })).resolves.toEqual([]);
    await expect(invalidProperties({ locale: 'lt' })).resolves.toEqual([]);
  });

  it('rejects an unsupported locale', async () => {
    await expect(invalidProperties({ locale: 'xx' })).resolves.toEqual([
      'locale',
    ]);
  });

  it('requires the locale', async () => {
    await expect(invalidProperties({ city: 'vilnius' })).resolves.toEqual([
      'locale',
    ]);
  });

  it('accepts an optional city', async () => {
    await expect(
      invalidProperties({ locale: 'en', city: 'vilnius' }),
    ).resolves.toEqual([]);
  });

  it('rejects an empty city', async () => {
    await expect(
      invalidProperties({ locale: 'en', city: '' }),
    ).resolves.toEqual(['city']);
  });
});
