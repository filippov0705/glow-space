"use server";

import { isEmailValid } from "@glow-space/shared";
import authApi from "@/lib/api/auth";

export type ResendVerificationState = {
  status: "idle" | "sent" | "error";
};

export async function resendVerificationAction(
  email: string,
): Promise<ResendVerificationState> {
  if (!isEmailValid(email)) {
    return { status: "error" };
  }

  const { success } = await authApi.resendVerification(email);

  return { status: success ? "sent" : "error" };
}
