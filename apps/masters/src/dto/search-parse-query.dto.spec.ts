import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchParseQueryDTO } from './search-parse-query.dto';

describe('SearchParseQueryDTO', () => {
  const invalidProperties = async (
    query: Record<string, string>,
  ): Promise<string[]> => {
    const errors = await validate(plainToInstance(SearchParseQueryDTO, query));
    return errors.map((error) => error.property).sort();
  };

  it('accepts a query and a city', async () => {
    await expect(
      invalidProperties({ q: 'Gel manicure', city: 'vilnius' }),
    ).resolves.toEqual([]);
  });

  it('requires q and city', async () => {
    await expect(invalidProperties({})).resolves.toEqual(['city', 'q']);
  });

  it('rejects an empty q and an empty city', async () => {
    await expect(invalidProperties({ q: '', city: '' })).resolves.toEqual([
      'city',
      'q',
    ]);
  });

  it('accepts q of 300 chars and rejects 301', async () => {
    await expect(
      invalidProperties({ q: 'a'.repeat(300), city: 'vilnius' }),
    ).resolves.toEqual([]);
    await expect(
      invalidProperties({ q: 'a'.repeat(301), city: 'vilnius' }),
    ).resolves.toEqual(['q']);
  });
});
