import { mergePageCards } from './page-cards';

describe('mergePageCards', () => {
  const rows = [
    { id: 3, minPrice: 30, currency: 'EUR', nextSlot: '2026-10-24T12:00' },
    { id: 1, minPrice: 10, currency: 'USD', nextSlot: null },
    { id: 2, minPrice: 20, currency: 'EUR', nextSlot: null },
  ];

  it('keeps the row order and adds minPrice, currency and nextSlot', () => {
    const cards = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];

    expect(mergePageCards(rows, cards)).toEqual([
      {
        id: 3,
        name: 'C',
        minPrice: 30,
        currency: 'EUR',
        nextSlot: '2026-10-24T12:00',
      },
      { id: 1, name: 'A', minPrice: 10, currency: 'USD', nextSlot: null },
      { id: 2, name: 'B', minPrice: 20, currency: 'EUR', nextSlot: null },
    ]);
  });

  it('drops rows whose card was not loaded', () => {
    const cards = [{ id: 1, name: 'A' }];

    expect(mergePageCards(rows, cards)).toEqual([
      { id: 1, name: 'A', minPrice: 10, currency: 'USD', nextSlot: null },
    ]);
  });

  it('returns an empty list for no rows', () => {
    expect(mergePageCards([], [{ id: 1 }])).toEqual([]);
  });
});
