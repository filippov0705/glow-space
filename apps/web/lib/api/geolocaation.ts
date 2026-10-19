import { GEOLOCATION_URL } from "@/app/constants";
import axios, { AxiosInstance } from "axios";

type Coordinates = { lat: number; lng: number };

type IpWhoIsResponse = {
  success?: boolean;
  latitude?: number;
  longitude?: number;
};

class GeolocationApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: GEOLOCATION_URL,
    });
  }

  async getLocationFromIp(ip: string): Promise<Coordinates | null> {
    try {
      const response = await this.client.get<IpWhoIsResponse>(`/${ip}`);
      const { success, latitude, longitude } = response.data;
      if (
        success === false ||
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return null;
      }
      return { lat: latitude, lng: longitude };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default new GeolocationApi();
