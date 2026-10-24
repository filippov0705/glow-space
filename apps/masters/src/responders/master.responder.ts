import { Injectable } from '@nestjs/common';
import {
  MasterCardResponse,
  MasterListCardResponse,
  MasterMapPointResponse,
  MastersListResponse,
  SubcategoryResponse,
} from '@glow-space/shared';
import { Subcategory } from 'src/generated/prisma';
import { MasterCard } from '../repository/master.repository';
import { MasterListItem, MastersList } from '../services/master.service';

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
  // regardless of the subcategory filter. subcategory.sortOrder is only counted within a
  // category, so they are ordered by category display order first, then sortOrder, then id.
  listCardResponse(master: MasterListItem): MasterListCardResponse {
    const subcategories = new Map(
      master.offerings.map(({ subcategory }) => [subcategory.id, subcategory]),
    );
    const categoryOrder = new Map(
      master.categories.map(({ category }) => [
        category.id,
        category.sortOrder,
      ]),
    );
    const categoryRank = (subcategory: Subcategory): number =>
      categoryOrder.get(subcategory.categoryId) ?? Number.MAX_SAFE_INTEGER;

    return {
      ...this.cardResponse(master),
      subcategories: [...subcategories.values()]
        .sort(
          (a, b) =>
            categoryRank(a) - categoryRank(b) ||
            a.categoryId - b.categoryId ||
            a.sortOrder - b.sortOrder ||
            a.id - b.id,
        )
        .map((subcategory) => this.subcategoryResponse(subcategory)),
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
}

export default MasterResponder;
