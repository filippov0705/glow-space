import axios, { AxiosInstance, isAxiosError } from "axios";
import {
  CategoriesOverviewResponse,
  CategoryPageResponse,
  CategoryResponse,
  CityWithCountResponse,
  MasterMapPointResponse,
  MasterSort,
  MastersListResponse,
  SearchParseResponse,
  SearchSuggestionResponse,
  SuggestionLocale,
  TopMasterResponse,
} from "@glow-space/shared";

type MastersPageParams = {
  city: string;
  sort?: MasterSort;
  offset?: number;
  limit?: number;
  // Origin for the nearest sort; send both or neither
  lat?: number;
  lng?: number;
};

export type CategoryMastersParams = MastersPageParams & {
  sub?: string;
};

export type MastersListParams = MastersPageParams & {
  category?: string;
  // Subcategory slug; requires category
  subcategory?: string;
  // In cents
  priceMax?: number;
};

class MastersApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.MASTERS_URL,
    });
  }

  async getCategories(): Promise<CategoryResponse[]> {
    try {
      const response = await this.client.get<CategoryResponse[]>("/categories");
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getCategoriesOverview(
    citySlug: string,
  ): Promise<CategoriesOverviewResponse> {
    try {
      const response = await this.client.get<CategoriesOverviewResponse>(
        "/categories/overview",
        { params: { city: citySlug } },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return { totalMasters: 0, categories: [] };
    }
  }

  // null when the category (or city) is unknown; other errors propagate
  // so the page shows an error instead of a misleading 404.
  async getCategoryPage(
    categorySlug: string,
    citySlug: string,
  ): Promise<CategoryPageResponse | null> {
    try {
      const response = await this.client.get<CategoryPageResponse>(
        `/categories/${encodeURIComponent(categorySlug)}`,
        { params: { city: citySlug } },
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }

  // Errors propagate: an empty result here would wrongly show the
  // "no masters" empty state.
  async getCategoryMasters(
    categorySlug: string,
    params: CategoryMastersParams,
  ): Promise<MastersListResponse> {
    const response = await this.client.get<MastersListResponse>(
      `/categories/${encodeURIComponent(categorySlug)}/masters`,
      { params },
    );
    return response.data;
  }

  // All masters in a city, optionally in one category. Errors propagate
  // (including 404 for an unknown category) for the same reason as above.
  async getMasters(params: MastersListParams): Promise<MastersListResponse> {
    const response = await this.client.get<MastersListResponse>("/masters", {
      params,
    });
    return response.data;
  }

  // Turns free text into filters. Errors propagate so the search page
  // shows its error boundary instead of an empty result.
  async parseSearch(q: string, citySlug: string): Promise<SearchParseResponse> {
    const response = await this.client.get<SearchParseResponse>(
      "/search/parse",
      { params: { q, city: citySlug } },
    );
    return response.data;
  }

  async getSearchSuggestions(
    citySlug: string,
    locale: SuggestionLocale = "en",
  ): Promise<SearchSuggestionResponse[]> {
    try {
      const response = await this.client.get<SearchSuggestionResponse[]>(
        "/search/suggestions",
        { params: { locale, city: citySlug } },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getCategoryCities(
    categorySlug: string,
    citySlug: string,
    limit?: number,
  ): Promise<CityWithCountResponse[]> {
    try {
      const response = await this.client.get<CityWithCountResponse[]>(
        `/categories/${encodeURIComponent(categorySlug)}/cities`,
        { params: { city: citySlug, limit } },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getTopMasters(
    citySlug: string,
    limit?: number,
  ): Promise<TopMasterResponse[]> {
    try {
      const response = await this.client.get<TopMasterResponse[]>(
        "/masters/top",
        { params: { city: citySlug, limit } },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getMapPoints(citySlug: string): Promise<MasterMapPointResponse[]> {
    try {
      const response = await this.client.get<MasterMapPointResponse[]>(
        "/masters/map",
        { params: { city: citySlug } },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
}

export default new MastersApi();
