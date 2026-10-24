import { Category, Subcategory } from 'src/generated/prisma';
import { MasterListItem } from '../services/master.service';
import MasterResponder from './master.responder';

const category = (id: number, slug: string, sortOrder: number) =>
  ({ id, slug, name: slug, imageUrl: null, sortOrder }) as Category;

const subcategory = (
  id: number,
  categoryId: number,
  slug: string,
  sortOrder: number,
) => ({ id, categoryId, slug, name: slug, sortOrder });

describe('MasterResponder', () => {
  const responder = new MasterResponder();

  describe('listCardResponse', () => {
    // brows (id 7) is shown before nails (id 5); sortOrder repeats across categories.
    const brows = category(7, 'brows', 1);
    const nails = category(5, 'nails', 2);
    const gel = subcategory(10, 5, 'gel', 1);
    const art = subcategory(11, 5, 'art', 2);
    const lamination = subcategory(20, 7, 'lamination', 1);
    const tint = subcategory(21, 7, 'tint', 1);

    const master = (offerings: Subcategory[]) =>
      ({
        uuid: 'm-1',
        displayName: 'Anna K.',
        photoUrl: null,
        rating: null,
        reviewsCount: 0,
        categories: [{ category: brows }, { category: nails }],
        works: [],
        offerings: offerings.map((sub) => ({ subcategory: sub })),
        minPrice: 2500,
        currency: 'EUR',
      }) as unknown as MasterListItem;

    it('orders distinct subcategories of several categories by category order, sortOrder, then id', () => {
      const offerings = [art, tint, gel, lamination, gel, tint];

      const slugs = (list: Subcategory[]) =>
        responder
          .listCardResponse(master(list))
          .subcategories.map(({ slug }) => slug);

      expect(slugs(offerings)).toEqual(['lamination', 'tint', 'gel', 'art']);
      expect(slugs([...offerings].reverse())).toEqual([
        'lamination',
        'tint',
        'gel',
        'art',
      ]);
    });

    it('returns the subcategory slug and name only', () => {
      expect(responder.listCardResponse(master([gel])).subcategories).toEqual([
        { slug: 'gel', name: 'gel' },
      ]);
    });
  });
});
