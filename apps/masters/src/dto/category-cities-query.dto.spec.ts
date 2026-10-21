import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CategoryCitiesQueryDTO } from './category-cities-query.dto';

describe('CategoryCitiesQueryDTO', () => {
  const toDto = (query: Record<string, string>): CategoryCitiesQueryDTO =>
    plainToInstance(CategoryCitiesQueryDTO, { city: 'vilnius', ...query });

  const invalidProperties = async (
    query: Record<string, string>,
  ): Promise<string[]> => {
    const errors = await validate(toDto(query));
    return errors.map((error) => error.property);
  };

  it('defaults limit to 3', async () => {
    const dto = toDto({});

    expect(dto.limit).toBe(3);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('converts limit from a string to a number', async () => {
    const dto = toDto({ limit: '5' });

    expect(dto.limit).toBe(5);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('accepts limit from 1 to 10 only', async () => {
    await expect(invalidProperties({ limit: '1' })).resolves.toEqual([]);
    await expect(invalidProperties({ limit: '10' })).resolves.toEqual([]);
    await expect(invalidProperties({ limit: '0' })).resolves.toEqual(['limit']);
    await expect(invalidProperties({ limit: '11' })).resolves.toEqual([
      'limit',
    ]);
    await expect(invalidProperties({ limit: '1.5' })).resolves.toEqual([
      'limit',
    ]);
    await expect(invalidProperties({ limit: 'abc' })).resolves.toEqual([
      'limit',
    ]);
  });

  it('requires the city', async () => {
    const errors = await validate(
      plainToInstance(CategoryCitiesQueryDTO, { limit: '3' }),
    );

    expect(errors.map((error) => error.property)).toEqual(['city']);
  });
});
