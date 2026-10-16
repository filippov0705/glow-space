import Link from "next/link";
import styles from "./page.module.scss";
import LoginForm from "./components/LoginForm/LoginForm";
import GoogleButton from "./components/GoogleButton/GoogleButton";

const NOTICES: Record<string, { text: string; isError: boolean }> = {
  verified: { text: "Your email is confirmed. Now sign in.", isError: false },
  "verification-failed": {
    text: "The link is invalid, expired or already used. Sign in to get a new one.",
    isError: true,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { notice } = await searchParams;
  const noticeMessage =
    typeof notice === "string" ? NOTICES[notice] : undefined;

  return (
    <main className={styles.container}>
      <h2 className={styles.title}>Sign in to glow-space</h2>
      <p className={styles.subtitle}>Book a service or manage your bookings</p>
      {noticeMessage && (
        <p
          className={`${styles.notice} ${noticeMessage.isError ? styles.notice__error : ""}`}
        >
          {noticeMessage.text}
        </p>
      )}
      <LoginForm />
      <div className={styles.separator}>
        <div className={styles.separator__line}></div>
        <span className={styles.separator__text}>or</span>
        <div className={styles.separator__line}></div>
      </div>

      <GoogleButton />

      <div className={styles.noAccount__wrapper}>
        <span className={styles.noAccount__text}>Don&apos;t have an account?</span>
        <Link href="/register" className={styles.noAccount__link}>
          Sign up
        </Link>
      </div>
    </main>
  );
}
