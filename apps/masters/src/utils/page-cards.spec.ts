import { mergePageCards } from './page-cards';

describe('mergePageCards', () => {
  const rows = [
    { id: 3, minPrice: 30, currency: 'EUR' },
    { id: 1, minPrice: 10, currency: 'USD' },
    { id: 2, minPrice: 20, currency: 'EUR' },
  ];

  it('keeps the row order and adds minPrice and currency', () => {
    const cards = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];

    expect(mergePageCards(rows, cards)).toEqual([
      { id: 3, name: 'C', minPrice: 30, currency: 'EUR' },
      { id: 1, name: 'A', minPrice: 10, currency: 'USD' },
      { id: 2, name: 'B', minPrice: 20, currency: 'EUR' },
    ]);
  });

  it('drops rows whose card was not loaded', () => {
    const cards = [{ id: 1, name: 'A' }];

    expect(mergePageCards(rows, cards)).toEqual([
      { id: 1, name: 'A', minPrice: 10, currency: 'USD' },
    ]);
  });

  it('returns an empty list for no rows', () => {
    expect(mergePageCards([], [{ id: 1 }])).toEqual([]);
  });
});
