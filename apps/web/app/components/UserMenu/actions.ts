"use server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "@/app/constants";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import authApi from "@/lib/api/auth";

export async function logoutAction() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(USER_COOKIE);

  if (refreshToken) await authApi.logout(refreshToken);

  redirect("/");
}
