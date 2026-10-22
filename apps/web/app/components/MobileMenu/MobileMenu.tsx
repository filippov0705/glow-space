"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefObject, useEffect, useRef } from "react";
import {
  Calendar,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  User,
} from "lucide-react";
import Button from "../Button/Button";
import { logoutAction } from "../UserMenu/actions";
import styles from "./MobileMenu.module.scss";

// Keep in sync with the 480px breakpoint in Header.module.scss
const MOBILE_QUERY = "(max-width: 480px)";

type MobileMenuProps = {
  id: string;
  user: { name: string; email: string; initials: string } | null;
  onClose: () => void;
  // Gets focus back when the menu closes
  returnFocusRef: RefObject<HTMLElement | null>;
};

export default function MobileMenu({
  id,
  user,
  onClose,
  returnFocusRef,
}: MobileMenuProps) {
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  // Move focus into the menu on open, return it to the toggle on close
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const returnTo = returnFocusRef.current;
    return () => {
      // Focus falls back to <body> when the focused item is removed; don't steal
      // it if the user has already moved it elsewhere (e.g. the avatar button)
      if (document.activeElement === document.body) returnTo?.focus();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    const mobile = window.matchMedia(MOBILE_QUERY);
    function onViewportChange(e: MediaQueryListEvent) {
      if (!e.matches) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    mobile.addEventListener("change", onViewportChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      mobile.removeEventListener("change", onViewportChange);
    };
  }, [onClose]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <nav
      ref={navRef}
      id={id}
      className={styles.mobileMenu}
      aria-label="Main menu"
    >
      {user && (
        <div className={styles.mobileMenu__user}>
          <span className={styles.mobileMenu__avatar}>{user.initials}</span>
          <div className={styles.mobileMenu__userText}>
            <span className={styles.mobileMenu__name}>{user.name}</span>
            <span className={styles.mobileMenu__email}>{user.email}</span>
          </div>
        </div>
      )}

      <Link
        href="/categories"
        className={styles.mobileMenu__row}
        onClick={onClose}
      >
        Categories
        <ChevronRight size={18} className={styles.mobileMenu__chevron} />
      </Link>
      <button type="button" className={styles.mobileMenu__row}>
        Top masters
        <ChevronRight size={18} className={styles.mobileMenu__chevron} />
      </button>
      <button type="button" className={styles.mobileMenu__row}>
        Become a master
        <ChevronRight size={18} className={styles.mobileMenu__chevron} />
      </button>

      {user ? (
        <>
          <button type="button" className={styles.mobileMenu__row}>
            <span className={styles.mobileMenu__label}>
              <User size={18} className={styles.mobileMenu__icon} />
              Profile
            </span>
          </button>
          <button type="button" className={styles.mobileMenu__row}>
            <span className={styles.mobileMenu__label}>
              <Calendar size={18} className={styles.mobileMenu__icon} />
              My bookings
            </span>
          </button>
          <button type="button" className={styles.mobileMenu__row}>
            <span className={styles.mobileMenu__label}>
              <SlidersHorizontal size={18} className={styles.mobileMenu__icon} />
              Settings
            </span>
          </button>

          <div className={styles.mobileMenu__footer}>
            <button
              type="button"
              className={`${styles.mobileMenu__row} ${styles.mobileMenu__logout}`}
              onClick={() => {
                onClose();
                void logoutAction();
              }}
            >
              <span className={styles.mobileMenu__label}>
                <LogOut size={18} />
                Log out
              </span>
            </button>
          </div>
        </>
      ) : (
        <div
          className={`${styles.mobileMenu__footer} ${styles.mobileMenu__actions}`}
        >
          <Button
            variant="secondary"
            onClick={() => navigate("/login")}
            className={styles.mobileMenu__action}
          >
            Log in
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/register")}
            className={`${styles.mobileMenu__action} ${styles.mobileMenu__action_outline}`}
          >
            Create account
          </Button>
        </div>
      )}
    </nav>
  );
}
