export type CategoryResponse = {
  slug: string;
  name: string;
  imageUrl: string | null;
};

export type CategoryWithCountResponse = CategoryResponse & {
  description: string | null;
  mastersCount: number;
};

export type CategoriesOverviewResponse = {
  totalMasters: number;
  categories: CategoryWithCountResponse[];
};

export type MasterCardResponse = {
  uuid: string;
  name: string;
  categories: CategoryResponse[];
  photoUrl: string | null;
  coverUrl: string | null;
  rating: number | null;
  reviewsCount: number;
};

export type TopMasterResponse = MasterCardResponse;

export type MasterMapPointResponse = MasterCardResponse & {
  lat: number;
  lng: number;
};
