import axios, { AxiosError, AxiosInstance } from "axios";
import { Status } from "@glow-space/shared";

type LoginPayload = { email: string; password: string };
type LoginResponse = {
  success: boolean;
  setCookie: string[] | null;
  status: Status | null;
  uuid: string | null;
};

type RegisterPayload = { name: string; email: string; password: string };
type RegisterResponse =
  | {
      success: true;
      uuid: string;
    }
  | {
      success: false;
      error: string;
    };

class AuthApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AUTH_URL,
    });
  }

  async revertRegister(uuid: string): Promise<{ success: boolean }> {
    try {
      await this.client.delete(`/register/${uuid}`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  }

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const response = await this.client.post<{ uuid: string }>(
        "/register",
        payload,
      );

      return {
        success: true,
        uuid: response.data.uuid,
      };
    } catch (error) {
      console.error(error);

      if (error instanceof AxiosError && error.response?.status === 409) {
        return { success: false, error: "User already exists" };
      }

      return { success: false, error: "" };
    }
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

  async loginGoogle(code: string): Promise<LoginResponse> {
    try {
      const response = await this.client.post<LoginResponse>("/google", {
        code,
      });
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
