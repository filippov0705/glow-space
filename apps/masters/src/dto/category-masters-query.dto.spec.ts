import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CategoryMastersQueryDTO } from './category-masters-query.dto';

describe('CategoryMastersQueryDTO', () => {
  const toDto = (query: Record<string, string>): CategoryMastersQueryDTO =>
    plainToInstance(CategoryMastersQueryDTO, { city: 'vilnius', ...query });

  const invalidProperties = async (
    query: Record<string, string>,
  ): Promise<string[]> => {
    const errors = await validate(toDto(query));
    return errors.map((error) => error.property);
  };

  it('applies defaults when only the city is given', async () => {
    const dto = toDto({});

    expect(dto.sort).toBe('top_rated');
    expect(dto.offset).toBe(0);
    expect(dto.limit).toBe(8);
    expect(dto.sub).toBeUndefined();
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('converts offset and limit from strings to numbers', async () => {
    const dto = toDto({ offset: '16', limit: '24', sort: 'newest' });

    expect(dto.offset).toBe(16);
    expect(dto.limit).toBe(24);
    expect(dto.sort).toBe('newest');
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects a sort that is not in MASTER_SORTS', async () => {
    await expect(invalidProperties({ sort: 'nearest' })).resolves.toEqual([
      'sort',
    ]);
  });

  it('rejects a negative or fractional offset', async () => {
    await expect(invalidProperties({ offset: '-1' })).resolves.toEqual([
      'offset',
    ]);
    await expect(invalidProperties({ offset: '1.5' })).resolves.toEqual([
      'offset',
    ]);
  });

  it('accepts limit from 1 to 24 only', async () => {
    await expect(invalidProperties({ limit: '1' })).resolves.toEqual([]);
    await expect(invalidProperties({ limit: '0' })).resolves.toEqual(['limit']);
    await expect(invalidProperties({ limit: '25' })).resolves.toEqual([
      'limit',
    ]);
    await expect(invalidProperties({ limit: 'abc' })).resolves.toEqual([
      'limit',
    ]);
  });

  it('rejects an empty sub', async () => {
    await expect(invalidProperties({ sub: '' })).resolves.toEqual(['sub']);
  });
});
