import { NextRequest, NextResponse } from "next/server";
import setCookieParser from "set-cookie-parser";
import authApi from "@/lib/api/auth";
import userApi from "@/lib/api/user";
import {
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_TOKEN_COOKIE,
  GOOGLE_STATE_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/app/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User } from "@/app/types/user";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    redirect("/login");
  }

  cookieStore.delete(GOOGLE_STATE_COOKIE);

  const { success, setCookie, uuid } = await authApi.loginGoogle(code);
  if (!success || !setCookie || !uuid) {
    redirect("/login");
  }

  const parsed = setCookieParser.parse(setCookie, { map: true });
  const accessToken = parsed.access_token?.value;
  const refreshToken = parsed.refresh_token?.value;

  if (!accessToken || !refreshToken) {
    redirect("/login");
  }

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
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

  const userResponse = await userApi.getUser(uuid);
  if (!userResponse) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user: User = {
    uuid,
    email: userResponse.email,
  };

  cookieStore.set(USER_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  redirect("/");
}
