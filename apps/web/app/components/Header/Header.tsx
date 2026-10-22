"use client";

import { useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import CityButton from "../CityButton/CityButton";
import Logo from "../Logo/Logo";
import styles from "./Header.module.scss";
import { User } from "../../types/user";
import Button from "../Button/Button";
import { UserMenu } from "../UserMenu/UserMenu";
import MobileMenu from "../MobileMenu/MobileMenu";

type HeaderProps = {
  user: User | null;
  city: string;
};

const MOBILE_MENU_ID = "mobile-menu";

export default function Header({ user, city }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const initials = user ? getInitials(user.name) : "";

  // Navigating to another route closes the mobile menu
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className={styles.header}>
      <div className={styles.header__left}>
        <Logo logoSize="small" />
        <CityButton city={city} onClick={() => {}} />
      </div>
      <div className={styles.header__right}>
        <Button
          variant="primary"
          onClick={() => {}}
          className={styles.header__becomeMaster}
        >
          Become a Master
        </Button>
        {user ? (
          <>
            <div className={styles.header__userMenu}>
              <UserMenu
                name={user.name}
                email={user.email}
                initials={initials}
              />
            </div>
            {/* On mobile the avatar opens the burger menu instead of the dropdown */}
            <button
              type="button"
              className={styles.header__avatar}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? MOBILE_MENU_ID : undefined}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {initials}
            </button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => router.push("/login")}
              className={styles.header__signIn}
            >
              Sign In
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                closeMenu();
                router.push("/login");
              }}
              className={styles.header__logIn}
            >
              Log in
            </Button>
          </>
        )}
        <button
          ref={burgerRef}
          type="button"
          className={styles.header__burger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? MOBILE_MENU_ID : undefined}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <MobileMenu
          id={MOBILE_MENU_ID}
          user={user ? { name: user.name, email: user.email, initials } : null}
          onClose={closeMenu}
          returnFocusRef={burgerRef}
        />
      )}
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
