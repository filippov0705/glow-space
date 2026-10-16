"use client";

import { useActionState } from "react";
import Link from "next/link";
import styles from "./LoginForm.module.scss";
import { getLoginAction } from "../../actions";
import ResendVerification from "@/app/components/ResendVerification/ResendVerification";

export default function LoginForm() {
  const [state, formAction] = useActionState(
    getLoginAction,
    getLoginInitialState(),
  );

  return (
    <>
      {state.pendingVerification && (
        <ResendVerification
          key={state.email}
          email={state.email}
          message="Your email is not confirmed yet. Open the link from the email we sent you."
        />
      )}
      <form action={formAction}>
        <div className={styles.input__wrapper}>
          <label className={styles.label}>Email</label>
          <input
            className={`${styles.input} ${state.fieldErrors.email ? styles.input__error : ""}`}
            type="email"
            name="email"
            defaultValue={state.email}
          />
          {state.fieldErrors.email && (
            <span className={styles.input__message}>
              {state.fieldErrors.email}
            </span>
          )}
        </div>
        <div className={styles.input__wrapper}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            name="password"
            defaultValue={state.password}
          />
          {state.fieldErrors.password && (
            <span className={styles.input__message}>
              {state.fieldErrors.password}
            </span>
          )}
          <Link href="/forgot-password" className={styles.input__link}>
            Forgot password?
          </Link>
        </div>
        <button className={styles.button} type="submit">
          Sign in
        </button>
      </form>
    </>
  );
}

export type LoginInitialState = {
  fieldErrors: {
    email?: string;
    password?: string;
  };
  email: string;
  password: string;
  pendingVerification?: boolean;
};

export const getLoginInitialState = (): LoginInitialState => {
  return {
    fieldErrors: {
      email: "",
      password: "",
    },
    email: "",
    password: "",
  };
};
