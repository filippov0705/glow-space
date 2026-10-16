"use client";

import { useActionState } from "react";
import styles from "./ResendVerification.module.scss";
import { resendVerificationAction, ResendVerificationState } from "./actions";

interface ResendVerificationProps {
  email: string;
  message: string;
}

export default function ResendVerification({
  email,
  message,
}: ResendVerificationProps) {
  const [state, formAction, isPending] = useActionState(
    (): Promise<ResendVerificationState> => resendVerificationAction(email),
    { status: "idle" },
  );

  return (
    <div className={styles.notice}>
      <p className={styles.notice__text}>{message}</p>
      {state.status === "sent" ? (
        <p className={styles.notice__text}>
          If the email is not confirmed yet, we sent a new link. It can take a
          minute to arrive.
        </p>
      ) : (
        <form action={formAction}>
          <button
            className={styles.notice__button}
            type="submit"
            disabled={isPending}
          >
            Send the email again
          </button>
        </form>
      )}
      {state.status === "error" && (
        <p className={styles.notice__error}>
          Could not send the email. Try again later.
        </p>
      )}
    </div>
  );
}
