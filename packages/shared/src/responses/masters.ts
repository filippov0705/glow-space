export type CategoryResponse = {
  slug: string;
  name: string;
};

export type MasterCardResponse = {
  uuid: string;
  name: string;
  categories: CategoryResponse[];
  coverUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

export type TopMasterResponse = MasterCardResponse;

export type MasterMapPointResponse = MasterCardResponse & {
  lat: number;
  lng: number;
};
