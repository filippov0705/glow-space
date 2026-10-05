import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { GoogleAuthResponse, Status } from "@glow-space/shared";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/app/constants";

type LoginPayload = { email: string; password: string };
type LoginResponse = {
  success: boolean;
  setCookie: string[] | null;
  status: Status | null;
  uuid: string | null;
};

type GoogleLoginResponse =
  | {
      success: true;
      setCookie: string[] | null;
      user: {
        uuid: string;
        status: Status;
        email: string;
        name: string;
      };
      isNewUser: boolean;
    }
  | { success: false };

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

export class AuthApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AUTH_URL,
    });
  }

  async refreshTokens(refreshToken: string): Promise<AxiosResponse | null> {
    try {
      return await this.client.post(
        "/refresh",
        {},
        {
          headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
        },
      );
    } catch (error) {
      console.error(error);
      return null;
    }
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

  async loginGoogle(code: string): Promise<GoogleLoginResponse> {
    try {
      const response = await this.client.post<GoogleAuthResponse>("/google", {
        code,
      });
      return {
        success: true,
        setCookie: response.headers["set-cookie"] || null,
        user: response.data.user,
        isNewUser: response.data.is_new_user,
      };
    } catch (error) {
      console.error(error);
      return { success: false };
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.client.post(
        "/logout",
        {},
        {
          headers: {
            Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
          },
        },
      );
    } catch (error) {
      console.error(error);
    }
  }
}

export default new AuthApi();
