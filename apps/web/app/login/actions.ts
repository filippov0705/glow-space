"use server";

import authApi from "@/lib/api/auth";
import userApi from "@/lib/api/user";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginInitialState } from "./components/LoginForm/LoginForm";
import setCookieParser from "set-cookie-parser";
import { Status, isEmailValid } from "@glow-space/shared";
import {
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_TOKEN_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
} from "../constants";
import { User } from "../types/user";

export const getLoginAction = async (
  prevState: LoginInitialState,
  formData: FormData,
): Promise<LoginInitialState> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const res: LoginInitialState = {
    fieldErrors: {
      email: "",
      password: "",
    },
    email,
    password,
  };

  if (!email || typeof email !== "string") {
    res.fieldErrors.email = "Enter your email";
  } else if (!isEmailValid(email)) {
    res.fieldErrors.email = "Invalid email";
  }

  if (!password || typeof password !== "string") {
    res.fieldErrors.password = "Enter password";
  }

  if (Object.values(res.fieldErrors).some((error) => error !== "")) {
    return res;
  }

  const { success, status, uuid, setCookie } = await authApi.login({
    email,
    password,
  });

  if (success && status === Status.PENDING_VERIFICATION) {
    redirect("/?notice=pending");
  }

  if (success && status === Status.BLOCKED) {
    redirect("/?notice=blocked");
  }

  if (!success || !setCookie || !uuid) {
    return {
      fieldErrors: {
        password: "",
        email: "Invalid email or password",
      },
      email,
      password,
    };
  }

  const parsed = setCookieParser.parse(setCookie, { map: true });
  const accessToken = parsed.access_token?.value;
  const refreshToken = parsed.refresh_token?.value;

  if (!accessToken || !refreshToken) {
    return {
      fieldErrors: {
        password: "",
        email: "Invalid email or password",
      },
      email,
      password,
    };
  }

  const cookieStore = await cookies();

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

  const userResponse = await userApi.getUser(uuid, accessToken);
  if (!userResponse.success || !userResponse.user) {
    return {
      fieldErrors: {
        password: "",
        email: "Invalid email or password",
      },
      email,
      password,
    };
  }

  const user: User = {
    uuid,
    email: userResponse.user.email,
    name: userResponse.user.name,
  };

  cookieStore.set(USER_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  redirect("/");
};
