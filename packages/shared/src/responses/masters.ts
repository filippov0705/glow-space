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

export type SubcategoryResponse = {
  slug: string;
  name: string;
};

export type CategoryPageResponse = {
  category: CategoryResponse & { description: string | null };
  subcategories: SubcategoryResponse[];
};

// A master in a paged list: GET /masters and GET /categories/:slug/masters
export type MasterListCardResponse = MasterCardResponse & {
  // Subcategories of the master's active offerings: only the requested
  // category's ones when the list is filtered by category, otherwise all
  subcategories: SubcategoryResponse[];
  minPrice: number; // in cents
  currency: string; // ISO 4217 code
};

export type MastersListResponse = {
  total: number;
  masters: MasterListCardResponse[];
};

export type CityWithCountResponse = {
  slug: string;
  name: string;
  mastersCount: number;
};
