"use server";

import { RegisterInitialState } from "./components/RegisterForm/RegisterForm";
import {
  PASSWORD_MIN_LENGTH,
  NAME_MIN_LENGTH,
  isEmailValid,
  sleep,
} from "@glow-space/shared";
import authApi from "@/lib/api/auth";
import userApi from "@/lib/api/user";
import { REGISTER_RETRY_COUNT } from "../constants";
import { User } from "../types/user";

export const getRegisterAction = async (
  prevState: RegisterInitialState,
  formData: FormData,
): Promise<RegisterInitialState> => {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const res: RegisterInitialState = {
    fieldErrors: {
      name: "",
      email: "",
      password: "",
    },
    name,
    email,
    password,
  };

  if (!name || typeof name !== "string") {
    res.fieldErrors.name = "Enter your name";
  } else if (name.length < NAME_MIN_LENGTH) {
    res.fieldErrors.name = `At least ${NAME_MIN_LENGTH} characters`;
  }

  if (!email || typeof email !== "string") {
    res.fieldErrors.email = "Enter your email";
  } else if (!isEmailValid(email)) {
    res.fieldErrors.email = "Invalid email";
  }

  if (!password || typeof password !== "string") {
    res.fieldErrors.password = "Enter password";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    res.fieldErrors.password = `At least ${PASSWORD_MIN_LENGTH} characters`;
  }

  if (Object.values(res.fieldErrors).some((error) => error !== "")) {
    return res;
  }

  const authResponse = await authApi.register({
    name,
    email,
    password,
  });

  if (!authResponse.success) {
    return {
      fieldErrors: {
        password: "",
        email: authResponse.error || "Could not create account. Try again.",
      },
      name,
      email,
      password,
    };
  }

  if (!authResponse.uuid) {
    return {
      fieldErrors: {
        password: "",
        email: "Could not create account. Try again.",
      },
      name,
      email,
      password,
    };
  }

  const isRegisterSuccess = await userRegisterAction({
    uuid: authResponse.uuid,
    name,
    email,
  });

  if (!isRegisterSuccess) {
    await userRevertRegisterAction(authResponse.uuid);

    return {
      fieldErrors: {
        password: "",
        email: "Could not create account. Try again.",
      },
      name,
      email,
      password,
    };
  }
  return res;
};

export async function userRevertRegisterAction(uuid: string): Promise<void> {
  let retries = REGISTER_RETRY_COUNT;
  while (retries > 0) {
    try {
      const response = await authApi.revertRegister(uuid);
      if (response.success) break;
    } catch (error) {
      console.error(error);
    }

    retries--;
    await sleep(1000);
  }
}

export async function userRegisterAction(user: User): Promise<boolean> {
  let retries = REGISTER_RETRY_COUNT;
  let isSuccess = false;
  while (retries > 0) {
    const response = await userApi.register(user);
    if (response.success) {
      isSuccess = true;
      break;
    }
    retries--;
    await sleep(1000);
  }

  return isSuccess;
}
