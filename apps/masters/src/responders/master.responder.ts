import { Injectable } from '@nestjs/common';
import {
  MasterCardResponse,
  MasterListCardResponse,
  MasterMapPointResponse,
  MasterProfileResponse,
  MastersListResponse,
  SubcategoryResponse,
} from '@glow-space/shared';
import { Category, Subcategory } from 'src/generated/prisma';
import { MasterCard } from '../repository/master.repository';
import {
  MasterListItem,
  MasterProfileDetails,
  MastersList,
} from '../services/master.service';

// Distinct subcategories of the offerings. subcategory.sortOrder is only counted within a
// category, so they are ordered by category display order first, then sortOrder, then id.
function sortedSubcategories(
  categories: { category: Category }[],
  offerings: { subcategory: Subcategory }[],
): Subcategory[] {
  const subcategories = new Map(
    offerings.map(({ subcategory }) => [subcategory.id, subcategory]),
  );
  const categoryOrder = new Map(
    categories.map(({ category }) => [category.id, category.sortOrder]),
  );
  const categoryRank = (subcategory: Subcategory): number =>
    categoryOrder.get(subcategory.categoryId) ?? Number.MAX_SAFE_INTEGER;

  return [...subcategories.values()].sort(
    (a, b) =>
      categoryRank(a) - categoryRank(b) ||
      a.categoryId - b.categoryId ||
      a.sortOrder - b.sortOrder ||
      a.id - b.id,
  );
}

@Injectable()
class MasterResponder {
  cardResponse(master: MasterCard): MasterCardResponse {
    return {
      uuid: master.uuid,
      name: master.displayName,
      categories: master.categories.map(({ category }) => ({
        slug: category.slug,
        name: category.name,
        imageUrl: category.imageUrl,
      })),
      photoUrl: master.photoUrl,
      coverUrl: master.works[0]?.imageUrl ?? null,
      rating: master.rating,
      reviewsCount: master.reviewsCount,
    };
  }

  mapPointResponse(master: MasterCard): MasterMapPointResponse {
    return {
      ...this.cardResponse(master),
      lat: master.lat,
      lng: master.lng,
    };
  }

  subcategoryResponse(subcategory: Subcategory): SubcategoryResponse {
    return {
      slug: subcategory.slug,
      name: subcategory.name,
    };
  }

  // Subcategories are distinct, from the loaded active offerings (of one category or all),
  // regardless of the subcategory filter.
  listCardResponse(master: MasterListItem): MasterListCardResponse {
    return {
      ...this.cardResponse(master),
      subcategories: sortedSubcategories(
        master.categories,
        master.offerings,
      ).map((subcategory) => this.subcategoryResponse(subcategory)),
      minPrice: master.minPrice,
      currency: master.currency,
    };
  }

  listResponse(list: MastersList): MastersListResponse {
    return {
      total: list.total,
      masters: list.masters.map((master) => this.listCardResponse(master)),
    };
  }

  // Offerings come cheapest first, so the first one gives the "from" price.
  profileResponse(details: MasterProfileDetails): MasterProfileResponse {
    const { master } = details;
    const cheapest = master.offerings[0] ?? null;

    return {
      uuid: master.uuid,
      name: master.displayName,
      photoUrl: master.photoUrl,
      address: master.address,
      lat: master.lat,
      lng: master.lng,
      categories: master.categories.map(({ category }) => ({
        slug: category.slug,
        name: category.name,
      })),
      subcategories: sortedSubcategories(
        master.categories,
        master.offerings,
      ).map((subcategory) => this.subcategoryResponse(subcategory)),
      rating: master.rating,
      reviewsCount: master.reviewsCount,
      about: master.about,
      experienceYears: master.experienceYears,
      languages: master.languages.map(({ language }) => ({
        code: language.code,
        name: language.name,
      })),
      works: master.works.map((work) => ({ imageUrl: work.imageUrl })),
      worksCount: master._count.works,
      offerings: master.offerings.map((offering) => ({
        id: offering.id,
        name: offering.name,
        durationMin: offering.durationMin,
        price: offering.price,
        currency: offering.currency,
      })),
      minPrice: cheapest?.price ?? null,
      currency: cheapest?.currency ?? null,
      ratingDistribution: details.ratingDistribution,
      reviews: details.reviews.flatMap((review) =>
        review.text === null
          ? []
          : [
              {
                id: review.id,
                authorName: review.authorName,
                offeringName: review.offeringName,
                rating: review.rating,
                text: review.text,
                createdAt: review.createdAt.toISOString(),
                replyText: review.replyText,
              },
            ],
      ),
      nextSlots: details.nextSlots.map((startsAt) => ({ startsAt })),
    };
  }
}

export default MasterResponder;
