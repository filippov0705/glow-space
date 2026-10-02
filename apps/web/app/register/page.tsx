import Logo from "../components/Logo/Logo";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import styles from "./page.module.scss";

export default function RegisterPage() {
  return (
    <main className={styles.container}>
      <Logo logoSize="medium" />
      <div className={styles.form}>
        <header className={styles.form__header}>
          <h1>Create your account</h1>
          <p>Book beauty masters in your city in a few taps.</p>
        </header>
        <RegisterForm />
      </div>
    </main>
  );
}
