import {
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_TOKEN_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
} from "@/app/constants";
import { cookies } from "next/headers";
import setCookieParser from "set-cookie-parser";
import authApi from "../api/auth";

export async function refreshTokens(): Promise<string | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

  const response = await authApi.refreshTokens(refreshToken);
  if (!response) return null;

  const parsed = setCookieParser.parse(response.headers["set-cookie"] || [], {
    map: true,
  });
  const accessToken = parsed[ACCESS_TOKEN_COOKIE]?.value;
  const newRefreshToken = parsed[REFRESH_TOKEN_COOKIE]?.value;
  if (!accessToken || !newRefreshToken) return null;

  cookieStore.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });

  return accessToken;
}
