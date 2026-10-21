export enum MasterStatus {
  DRAFT = 1,
  ACTIVE = 2,
  PAUSED = 3,
  BLOCKED = 4,
}

export const MASTER_SORTS = [
  "top_rated",
  "most_reviews",
  "price_asc",
  "price_desc",
  "newest",
] as const;

export type MasterSort = (typeof MASTER_SORTS)[number];
