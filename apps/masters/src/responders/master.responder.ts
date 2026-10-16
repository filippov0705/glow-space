import { Injectable } from '@nestjs/common';
import { MasterMapPointResponse, TopMasterResponse } from '@glow-space/shared';
import { Master } from 'src/generated/prisma';
import { MasterCard } from '../repository/master.repository';

@Injectable()
class MasterResponder {
  topMasterResponse(master: MasterCard): TopMasterResponse {
    return {
      uuid: master.uuid,
      name: master.displayName,
      categories: master.categories.map(({ category }) => ({
        slug: category.slug,
        name: category.name,
      })),
      coverUrl: master.works[0]?.imageUrl ?? null,
      rating: master.rating,
      reviewsCount: master.reviewsCount,
    };
  }

  mapPointResponse(master: Master): MasterMapPointResponse {
    return {
      uuid: master.uuid,
      lat: master.lat,
      lng: master.lng,
    };
  }
}

export default MasterResponder;
