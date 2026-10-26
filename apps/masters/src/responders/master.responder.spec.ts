import { Category, Subcategory } from 'src/generated/prisma';
import {
  MasterListItem,
  MasterProfileDetails,
} from '../services/master.service';
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

  describe('profileResponse', () => {
    const details = (offerings: { price: number; currency: string }[]) =>
      ({
        master: {
          categories: [],
          languages: [],
          works: [],
          _count: { works: 0 },
          offerings: offerings.map((offering, index) => ({
            id: `o-${index}`,
            subcategory: subcategory(index, 1, `s-${index}`, index),
            ...offering,
          })),
        },
        ratingDistribution: [],
        reviews: [
          {
            id: 'r-1',
            text: null,
            createdAt: new Date('2026-10-01T00:00:00.000Z'),
          },
          {
            id: 'r-2',
            text: 'Nice',
            createdAt: new Date('2026-10-02T00:00:00.000Z'),
          },
        ],
        nextSlots: [],
      }) as unknown as MasterProfileDetails;

    it('takes the price and currency from the first (cheapest) offering', () => {
      const result = responder.profileResponse(
        details([
          { price: 1500, currency: 'EUR' },
          { price: 3000, currency: 'EUR' },
        ]),
      );

      expect(result.minPrice).toBe(1500);
      expect(result.currency).toBe('EUR');
    });

    it('returns distinct subcategories of several categories in display order', () => {
      const brows = category(7, 'brows', 1);
      const nails = category(5, 'nails', 2);
      const gel = subcategory(10, 5, 'gel', 1);
      const art = subcategory(11, 5, 'art', 2);
      const tint = subcategory(21, 7, 'tint', 1);
      const base = details([]);
      const offering = (id: string, sub: Subcategory, price: number) => ({
        id,
        name: id,
        durationMin: 60,
        price,
        currency: 'EUR',
        subcategory: sub,
      });

      const result = responder.profileResponse({
        ...base,
        master: {
          ...base.master,
          categories: [{ category: brows }, { category: nails }],
          offerings: [
            offering('o-1', art, 1000),
            offering('o-2', gel, 1500),
            offering('o-3', art, 2000),
            offering('o-4', tint, 2500),
          ],
        },
      } as unknown as MasterProfileDetails);

      expect(result.subcategories).toEqual([
        { slug: 'tint', name: 'tint' },
        { slug: 'gel', name: 'gel' },
        { slug: 'art', name: 'art' },
      ]);
    });

    it('returns a null price and currency without offerings', () => {
      const result = responder.profileResponse(details([]));

      expect(result.minPrice).toBeNull();
      expect(result.currency).toBeNull();
    });

    it('drops reviews without text and formats dates as ISO', () => {
      const { reviews } = responder.profileResponse(details([]));

      expect(reviews.map(({ id }) => id)).toEqual(['r-2']);
      expect(reviews[0].createdAt).toBe('2026-10-02T00:00:00.000Z');
    });
  });
});
