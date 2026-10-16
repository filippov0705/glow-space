export type CategoryResponse = {
  slug: string;
  name: string;
};

export type TopMasterResponse = {
  uuid: string;
  name: string;
  categories: CategoryResponse[];
  coverUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

export type MasterMapPointResponse = {
  uuid: string;
  lat: number;
  lng: number;
};
