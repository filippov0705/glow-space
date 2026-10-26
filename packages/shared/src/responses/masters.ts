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

// One master's public page: GET /masters/:uuid
export type MasterProfileResponse = {
  uuid: string;
  name: string;
  photoUrl: string | null;
  address: string;
  lat: number;
  lng: number;
  categories: { slug: string; name: string }[];
  subcategories: { slug: string; name: string }[];
  rating: number | null;
  reviewsCount: number;
  about: string | null;
  experienceYears: number | null;
  languages: { code: string; name: string }[];
  works: { imageUrl: string }[]; // at most 6, sortOrder
  worksCount: number;
  offerings: {
    id: string;
    name: string;
    durationMin: number;
    price: number; // cents
    currency: string;
  }[];
  minPrice: number | null; // cents of the cheapest active offering
  currency: string | null;
  // Always 5 rows, 5 down to 1, star-only reviews included
  ratingDistribution: { rating: number; count: number }[];
  reviews: {
    id: string;
    authorName: string;
    offeringName: string;
    rating: number;
    text: string;
    createdAt: string; // ISO
    replyText: string | null;
  }[]; // at most 3, newest with text
  // Local wall time, no offset. Format from the string parts.
  nextSlots: { startsAt: string }[];
};
