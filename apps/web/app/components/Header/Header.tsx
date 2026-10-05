"use client";

import CityButton from "../CityButton/CityButton";
import Logo from "../Logo/Logo";
import styles from "./Header.module.scss";
import { User } from "../../types/user";
import Button from "../Button/Button";
import { redirect } from "next/navigation";
import { UserMenu } from "../UserMenu/UserMenu";

type HeaderProps = {
  user: User | null;
  city: string;
};

export default function Header({ user, city }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.header__left}>
        <Logo logoSize="small" />
        <CityButton city={city} onClick={() => {}} />
      </div>
      <div className={styles.header__right}>
        <Button variant="primary" onClick={() => {}}>
          Become a Master
        </Button>
        {user ? (
          <UserMenu
            name={user.name}
            email={user.email}
            initials={getInitials(user.name)}
          />
        ) : (
          <Button variant="secondary" onClick={() => redirect("/login")}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
