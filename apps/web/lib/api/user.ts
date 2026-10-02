import axios, { AxiosInstance } from "axios";
import { UserResponse } from "@glow-space/shared";

type CreateUserPayload = {
  uuid: string;
  name: string;
  email: string;
};
type CreateUserResponse = {
  success: boolean;
  uuid: string | null;
};

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

  async register(payload: CreateUserPayload): Promise<CreateUserResponse> {
    try {
      const response = await this.client.post<CreateUserResponse>(
        "/register",
        payload,
      );
      return { success: true, uuid: response.data.uuid };
    } catch (error) {
      console.error(error);
      return { success: false, uuid: null };
    }
  }
}

export default new UserApi();
