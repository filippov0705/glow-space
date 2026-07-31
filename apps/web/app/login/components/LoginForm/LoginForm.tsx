"use client";

import { useActionState } from "react";
import Link from "next/link";
import styles from "./LoginForm.module.scss";
import { getLoginAction } from "../../actions";

export default function LoginForm() {
  const [state, formAction] = useActionState(
    getLoginAction,
    getLoginInitialState(),
  );

  return (
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
        <label className={styles.label}>Пароль</label>
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
          Забыли пароль?
        </Link>
      </div>
      <button className={styles.button} type="submit">
        Войти
      </button>
    </form>
  );
}

export type LoginInitialState = {
  fieldErrors: {
    email?: string;
    password?: string;
  };
  email: string;
  password: string;
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
