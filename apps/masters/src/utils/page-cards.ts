type PageRow<Id> = {
  id: Id;
  minPrice: number;
  currency: string;
};

// Cards loaded by id come back in any order. Put them in the order of the page
// rows and add each row's minPrice/currency. Rows without a loaded card are dropped.
export function mergePageCards<Id, Card extends { id: Id }>(
  rows: PageRow<Id>[],
  cards: Card[],
): (Card & { minPrice: number; currency: string })[] {
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  return rows.flatMap((row) => {
    const card = cardsById.get(row.id);
    return card
      ? [{ ...card, minPrice: row.minPrice, currency: row.currency }]
      : [];
  });
}
