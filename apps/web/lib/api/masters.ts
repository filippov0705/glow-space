import axios, { AxiosInstance } from "axios";
import {
  CategoryResponse,
  MasterMapPointResponse,
  TopMasterResponse,
} from "@glow-space/shared";

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
