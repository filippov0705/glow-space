import axios, { AxiosInstance } from "axios";
import { Status } from "@glow-space/shared";

type LoginPayload = { email: string; password: string };
type LoginResponse = {
  success: boolean;
  setCookie: string[] | null;
  status: Status | null;
  uuid: string | null;
};

class AuthApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AUTH_URL,
    });
  }

  async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>("/login", payload);
      return {
        success: true,
        setCookie: response.headers["set-cookie"] || null,
        status: response.data.status,
        uuid: response.data.uuid,
      };
    } catch (error) {
      console.error(error);
      return { success: false, setCookie: null, status: null, uuid: null };
    }
  }
}

export default new AuthApi();
