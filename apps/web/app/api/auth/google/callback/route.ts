import { NextRequest } from "next/server";
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
import {
  userRegisterAction,
  userRevertRegisterAction,
} from "@/app/register/actions";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    redirect("/login");
  }

  cookieStore.delete(GOOGLE_STATE_COOKIE);

  const authResponse = await authApi.loginGoogle(code);
  if (!authResponse.success || !authResponse.setCookie || !authResponse.user) {
    redirect("/login");
  }

  const parsed = setCookieParser.parse(authResponse.setCookie, { map: true });
  const accessToken = parsed.access_token?.value;
  const refreshToken = parsed.refresh_token?.value;

  if (!accessToken || !refreshToken) {
    redirect("/login");
  }

  const { success, user } = await getUser(authResponse, accessToken);
  if (!success) redirect("/login");

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

  cookieStore.set(USER_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  redirect("/");
}

async function getUser(
  authResponse: {
    user: {
      uuid: string;
      email: string;
      name: string;
    };
    isNewUser: boolean;
  },
  accessToken: string,
): Promise<{ success: true; user: User } | { success: false; user: null }> {
  const user: User = {
    uuid: authResponse.user.uuid,
    email: authResponse.user.email,
    name: authResponse.user.name,
  };

  if (authResponse.isNewUser) {
    const isRegisterSuccess = await userRegisterAction(user);

    if (!isRegisterSuccess) {
      await userRevertRegisterAction(user.uuid);
      return { success: false, user: null };
    }

    return { success: true, user };
  }

  const userResponse = await userApi.getUser(user.uuid, accessToken);
  if (!userResponse.success) return { success: false, user: null };

  return { success: true, user };
}
