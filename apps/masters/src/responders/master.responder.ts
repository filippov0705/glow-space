import { Injectable } from '@nestjs/common';
import { MasterCardResponse, MasterMapPointResponse } from '@glow-space/shared';
import { MasterCard } from '../repository/master.repository';

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
}

export default MasterResponder;
