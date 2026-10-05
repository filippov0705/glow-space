import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/app/constants";
import { refreshTokens } from "../auth/refreshTokens";
import { RegisterResponse, UserResponse } from "@glow-space/shared";

type CreateUserPayload = {
  uuid: string;
  name: string;
  email: string;
};
type CreateUserResponse =
  | {
      success: true;
      user: RegisterResponse;
    }
  | {
      success: false;
      user: null;
    };

class UserApi {
  private readonly client: AxiosInstance;

  constructor(refreshTokens: () => Promise<string | null>) {
    this.client = axios.create({
      baseURL: process.env.USER_URL,
    });

    this.client.interceptors.request.use(async (config) => {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig & {
          retried?: boolean;
        };
        if (error.response?.status !== 401 || config.retried) {
          throw error;
        }
        config.retried = true;
        const accessToken = await refreshTokens();
        if (!accessToken) throw error;
        config.headers.Authorization = `Bearer ${accessToken}`;
        return this.client.request(config);
      },
    );
  }

  async getUser(
    uuid: string,
    accessToken: string,
  ): Promise<
    { success: true; user: UserResponse } | { success: false; user: null }
  > {
    try {
      const response = await this.client.get<UserResponse>(`/${uuid}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return { success: true, user: response.data };
    } catch (error) {
      console.error(error);
      return { success: false, user: null };
    }
  }

  async register(payload: CreateUserPayload): Promise<CreateUserResponse> {
    try {
      const response = await this.client.post<RegisterResponse>(
        "/register",
        payload,
      );
      return { success: true, user: response.data };
    } catch (error) {
      console.error(error);
      return { success: false, user: null };
    }
  }
}

export default new UserApi(refreshTokens);
