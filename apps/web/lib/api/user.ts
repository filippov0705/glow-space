import axios, { AxiosInstance } from "axios";
import { UserResponse } from "@glow-space/shared";

class UserApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.USER_URL,
    });
  }

  async getUser(uuid: string): Promise<UserResponse | null> {
    try {
      const response = await this.client.get<UserResponse>(`/users/${uuid}`);
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default new UserApi();
