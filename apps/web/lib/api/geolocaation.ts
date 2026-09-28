import { GEOLOCATION_URL } from "@/app/constants";
import axios, { AxiosInstance } from "axios";

class GeolocationApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: GEOLOCATION_URL,
    });
  }

  async getCityFromIp(ip: string): Promise<string | null> {
    try {
      const response = await this.client.get<{ city: string }>(`/${ip}`);
      return response.data.city;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default new GeolocationApi();
