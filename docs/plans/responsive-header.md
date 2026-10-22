# Responsive header

The header must not break at any width. At ≤480px it switches to a mobile layout with a burger
menu that covers the whole page.

Mockups (attached in the conversation): mobile header, mobile menu signed out, mobile menu
signed in.

Touches only `apps/web`.

## Key decisions

- **Breakpoints:** 1280px, 768px, 480px (`max-width`, inclusive). The mobile layout starts at
  ≤480px, not 390px.
  - ≤1280px: padding `1rem 1.5rem`.
  - ≤768px: padding `12px 16px`, gaps 8px.
  - ≤480px: mobile layout (below).
  - At every width the header stays on one line: the left group may shrink and the city name in
    `CityButton` is truncated with an ellipsis. The right group does not shrink.
- **Mobile header (≤480px):** logo (with the ✦ icon) + city button on the left. On the right:
  - signed out: "Log in" (primary/dark, → `/login`) + burger button;
  - signed in: an avatar with initials (no dropdown; tapping it toggles the mobile menu, like
    the burger) + burger button. The `UserMenu` dropdown is hidden at ≤480px so the user
    items are not duplicated.
  - "Become a Master" is hidden. When the menu is open, the burger turns into ×.
- **Mobile menu** (new `MobileMenu` component, only rendered/visible at ≤480px):
  - Full-screen overlay under the header (fixed, fills the viewport, background as in the
    mockup). Body scroll is locked while it is open.
  - Signed in: at the top, an avatar with initials + name + email (like the `UserMenu` dropdown
    header).
  - Nav rows with a chevron: "Categories" (→ `/categories`), "Top masters", "Become a master".
    The last two have no page yet, so they are `<button>`s with no action, like Profile / My
    bookings / Settings in `UserMenu` today.
  - Signed in: rows with icons "Profile", "My bookings", "Settings" (no action, as in
    `UserMenu`), and at the bottom "Log out" in red (calls `logoutAction`).
  - Signed out: at the bottom, "Log in" (primary, → `/login`) and "Create account" (secondary,
    → `/register`), full width.
  - Closes on ×, on Esc, on route change (following a link), and when the viewport grows above
    480px.
- **Desktop (>480px)** keeps the current look: "Become a Master", "Sign In" / `UserMenu` dropdown.
- Use the existing `Button`, `Logo`, `CityButton` components and `lucide-react` icons. Match
  the surrounding SCSS module style (BEM-like `&__element`, double quotes in TS).

## Steps

1. ✅ **Done.** **Header responsiveness above 480px.** In `Header.module.scss` add the 1280/768 breakpoints,
   make the header never wrap or overflow (left group shrinks, city name ellipsis in
   `CityButton`), move the "Become a Master" hiding from the old rule to ≤480px, and remove the
   old 640px rule. Check at 1440, 1280, 1024, 768, 600, 481px, signed in and signed out.
2. ✅ **Done.** **Mobile header and menu (≤480px).** Add the burger/× toggle and the signed-out "Log in"
   button to `Header`, and a new `components/MobileMenu/` (`MobileMenu.tsx` +
   `MobileMenu.module.scss`) per the decisions above. Check against the mockups at 390px and
   480px, signed in and signed out, menu open and closed.
