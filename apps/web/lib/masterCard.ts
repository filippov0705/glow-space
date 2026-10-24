import type { MasterListCardResponse } from "@glow-space/shared";

const SUBTITLE_NAMES_SHOWN = 3;

// What a card in MastersGrid shows. The subtitle is prepared on the
// server: subcategories on the category page, categories on /masters.
export type MasterGridItem = Pick<
  MasterListCardResponse,
  "uuid" | "name" | "photoUrl" | "rating" | "reviewsCount" | "minPrice" | "currency"
> & {
  subtitle: string;
};

export type LoadMoreMastersResult =
  | { ok: true; total: number; masters: MasterGridItem[] }
  | { ok: false };

// "Lashes, Brows, Nails": the first few names, comma-separated
export function joinNames(items: { name: string }[]): string {
  return items
    .slice(0, SUBTITLE_NAMES_SHOWN)
    .map((item) => item.name)
    .join(", ");
}

export function toMasterGridItem(
  master: MasterListCardResponse,
  subtitle: string,
): MasterGridItem {
  return {
    uuid: master.uuid,
    name: master.name,
    photoUrl: master.photoUrl,
    rating: master.rating,
    reviewsCount: master.reviewsCount,
    minPrice: master.minPrice,
    currency: master.currency,
    subtitle,
  };
}
