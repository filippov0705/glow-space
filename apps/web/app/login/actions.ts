"use server";

import authApi from "@/lib/api/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginInitialState } from "./components/LoginForm/LoginForm";
import setCookieParser from "set-cookie-parser";

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
    res.fieldErrors.email = "Введите email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.fieldErrors.email = "Некорректный email";
  }

  if (!password || typeof password !== "string") {
    res.fieldErrors.password = "Введите пароль";
  } else if (password.length < 6) {
    res.fieldErrors.password = "Минимум 6 символов";
  }

  if (Object.values(res.fieldErrors).some((error) => error !== "")) {
    return res;
  }

  const response = await authApi.login({
    email,
    password,
  });

  if (!response.success || !response.setCookie) {
    return {
      fieldErrors: {
        password: "",
        email: "Некорректный email или пароль",
      },
      email,
      password,
    };
  }

  const parsed = setCookieParser.parse(response.setCookie, { map: true });
  const accessToken = parsed.access_token?.value;

  if (!accessToken) {
    return {
      fieldErrors: {
        password: "",
        email: "Некорректный email или пароль",
      },
      email,
      password,
    };
  }

  const cookieStore = await cookies();

  cookieStore.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
};
