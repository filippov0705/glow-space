"use server";

import authApi from "@/lib/api/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginInitialState } from "./components/LoginForm/LoginForm";
import setCookieParser from "set-cookie-parser";
import { Status } from "@glow-space/shared";

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
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.fieldErrors.email = "Invalid email";
  }

  if (!password || typeof password !== "string") {
    res.fieldErrors.password = "Enter password";
  } else if (password.length < 6) {
    res.fieldErrors.password = "At least 6 characters";
  }

  if (Object.values(res.fieldErrors).some((error) => error !== "")) {
    return res;
  }

  const response = await authApi.login({
    email,
    password,
  });

  if (response.success && response.status === Status.PENDING_VERIFICATION) {
    redirect("/dashboard?notice=pending");
  }

  if (response.success && response.status === Status.BLOCKED) {
    redirect("/dashboard?notice=blocked");
  }

  if (!response.success || !response.setCookie) {
    return {
      fieldErrors: {
        password: "",
        email: "Invalid email or password",
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
        email: "Invalid email or password",
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
