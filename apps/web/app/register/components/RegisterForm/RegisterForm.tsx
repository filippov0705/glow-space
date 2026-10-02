"use client";

import styles from "./RegisterForm.module.scss";
import Link from "next/link";
import { useActionState } from "react";
import { getRegisterAction } from "../../actions";

export default function RegisterForm() {
  const [state, formAction] = useActionState(
    getRegisterAction,
    getRegisterInitialState(),
  );

  return (
    <>
      <form className={styles.form} action={formAction}>
        <div className={styles.form__input_container}>
          <label htmlFor="name">Name</label>
          <input
            className={styles.form__input}
            id="name"
            type="text"
            placeholder="Anna"
            defaultValue={state.name}
          />
          {state.fieldErrors.name && (
            <span className={styles.form__error}>{state.fieldErrors.name}</span>
          )}
        </div>
        <div className={styles.form__input_container}>
          <label htmlFor="email">Email</label>
          <input
            className={styles.form__input}
            id="email"
            type="email"
            placeholder="anna@example.com"
            defaultValue={state.email}
          />
          {state.fieldErrors.email && (
            <span className={styles.form__error}>
              {state.fieldErrors.email}
            </span>
          )}
        </div>
        <div className={styles.form__input_container}>
          <label htmlFor="password">Password</label>
          <input
            className={styles.form__input}
            id="password"
            type="password"
            placeholder="At least 8 characters"
            defaultValue={state.password}
          />
          {state.fieldErrors.password && (
            <span className={styles.form__error}>
              {state.fieldErrors.password}
            </span>
          )}
        </div>
        <button type="submit" className={styles.form__button}>
          Create account
        </button>
      </form>

      <p className={styles.form__terms}>
        By creating an account you agree to the{" "}
        <Link className={styles.form__link} href="/terms">
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link className={styles.form__link} href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>

      <p className={styles.form__terms}>
        Already have an account?{" "}
        <Link href="/login" className={styles.form__link}>
          Log in
        </Link>
      </p>
    </>
  );
}

export type RegisterInitialState = {
  fieldErrors: {
    name?: string;
    email?: string;
    password?: string;
  };
  name: string;
  email: string;
  password: string;
};

const getRegisterInitialState = (): RegisterInitialState => {
  return {
    fieldErrors: {
      name: "",
      email: "",
      password: "",
    },
    name: "",
    email: "",
    password: "",
  };
};
