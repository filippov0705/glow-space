import Link from "next/link";
import styles from "./page.module.scss";
import LoginForm from "./components/LoginForm/LoginForm";
import GoogleButton from "./components/GoogleButton/GoogleButton";

export default function LoginPage() {
  return (
    <main className={styles.container}>
      <h2 className={styles.title}>Войти в glow-space</h2>
      <p className={styles.subtitle}>
        Забронируйте услугу или управляйте своими записями
      </p>
      <LoginForm />
      <div className={styles.separator}>
        <div className={styles.separator__line}></div>
        <span className={styles.separator__text}>или</span>
        <div className={styles.separator__line}></div>
      </div>

      <GoogleButton />

      <div className={styles.noAccount__wrapper}>
        <span className={styles.noAccount__text}>Нет аккаунта?</span>
        <Link href="/register" className={styles.noAccount__link}>
          Зарегистрироваться
        </Link>
      </div>
    </main>
  );
}
