import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MastersListQueryDTO } from './masters-list-query.dto';

describe('MastersListQueryDTO', () => {
  const toDto = (query: Record<string, string>): MastersListQueryDTO =>
    plainToInstance(MastersListQueryDTO, { city: 'vilnius', ...query });

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
    expect(dto.limit).toBe(12);
    expect(dto.category).toBeUndefined();
    expect(dto.subcategory).toBeUndefined();
    expect(dto.priceMax).toBeUndefined();
    expect(dto.lat).toBeUndefined();
    expect(dto.lng).toBeUndefined();
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('requires the city', async () => {
    const errors = await validate(plainToInstance(MastersListQueryDTO, {}));

    expect(errors.map((error) => error.property)).toEqual(['city']);
  });

  it('converts offset and limit from strings to numbers', async () => {
    const dto = toDto({
      category: 'nails',
      offset: '12',
      limit: '24',
      sort: 'price_asc',
    });

    expect(dto.category).toBe('nails');
    expect(dto.offset).toBe(12);
    expect(dto.limit).toBe(24);
    expect(dto.sort).toBe('price_asc');
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects a sort that is not in MASTER_SORTS', async () => {
    await expect(invalidProperties({ sort: 'cheapest' })).resolves.toEqual([
      'sort',
    ]);
  });

  it('rejects a negative offset', async () => {
    await expect(invalidProperties({ offset: '-1' })).resolves.toEqual([
      'offset',
    ]);
  });

  it('accepts limit from 1 to 24 only', async () => {
    await expect(invalidProperties({ limit: '1' })).resolves.toEqual([]);
    await expect(invalidProperties({ limit: '0' })).resolves.toEqual(['limit']);
    await expect(invalidProperties({ limit: '25' })).resolves.toEqual([
      'limit',
    ]);
  });

  it('rejects an empty category', async () => {
    await expect(invalidProperties({ category: '' })).resolves.toEqual([
      'category',
    ]);
  });

  it('accepts a subcategory together with its category', async () => {
    const dto = toDto({ category: 'nails', subcategory: 'gel' });

    expect(dto.subcategory).toBe('gel');
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('requires the category with a subcategory', async () => {
    await expect(invalidProperties({ subcategory: 'gel' })).resolves.toEqual([
      'category',
    ]);
  });

  it('rejects an empty subcategory', async () => {
    await expect(
      invalidProperties({ category: 'nails', subcategory: '' }),
    ).resolves.toEqual(['subcategory']);
  });

  it('converts priceMax to a number', async () => {
    const dto = toDto({ priceMax: '3500' });

    expect(dto.priceMax).toBe(3500);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it.each(['0', '-100', '35.5', 'abc', ''])(
    'rejects priceMax %p',
    async (priceMax) => {
      await expect(invalidProperties({ priceMax })).resolves.toEqual([
        'priceMax',
      ]);
    },
  );

  it('converts lat and lng to numbers', async () => {
    const dto = toDto({ sort: 'nearest', lat: '54.687', lng: '25.28' });

    expect(dto.lat).toBe(54.687);
    expect(dto.lng).toBe(25.28);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects lat and lng out of range', async () => {
    await expect(
      invalidProperties({ lat: '-91', lng: '181' }),
    ).resolves.toEqual(['lat', 'lng']);
  });

  it('requires lat and lng together', async () => {
    await expect(invalidProperties({ lat: '54.687' })).resolves.toEqual([
      'lng',
    ]);
    await expect(invalidProperties({ lng: '25.28' })).resolves.toEqual(['lat']);
  });
});
