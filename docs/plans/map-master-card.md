# Master card on the map

Clicking a pin on the home page map opens a small card for that master. The card is a horizontal
layout with the photo, name, first category, rating and a "View profile" button, as in the mockup.

- Only one card is open at a time. Clicking another pin switches the card to that master.
- Clicking the map itself, or the card's ×, closes the card.
- The pin of the open card turns dark (`#1a1a1a`). The other pins stay pink.

This touches `packages/shared`, `apps/masters` and `apps/web`.

## Key decisions

- **Card data comes with the map points.** No separate request is made on click.
  - `GET /masters/map` returns everything the card needs, so it opens instantly and there is no
    loading state.
  - The extra payload is small: about 150 bytes per master. If a city ever has thousands of
    masters, the map will need clustering or viewport loading anyway, and that is a separate task.
- **Contract.** In `@glow-space/shared`, rename `TopMasterResponse` to `MasterCardResponse`, because
  the top list and the map now share it, and keep `TopMasterResponse` as an alias so nothing breaks.
  `MasterMapPointResponse` becomes `MasterCardResponse & { lat: number; lng: number }`.
- **Masters repository.** Add a new method `findActiveCardsByCity(cityId)` that uses the existing
  `masterCardArgs`. Do not add an `include` to `findActiveByCity`, per the AGENTS.md rule. If
  `findActiveByCity` has no other callers, remove it.
- **Responder.** Rename `topMasterResponse` to `cardResponse` so it matches `MasterCardResponse`.
  `mapPointResponse(master: MasterCard)` reuses `cardResponse(master)` and adds `lat`/`lng`.
- **Popup.** Use react-leaflet's `<Popup>` on each `CircleMarker`. Leaflet's defaults already give
  the required behavior:
  - `autoClose: true` keeps only one popup open.
  - `closeOnClick: true` closes the popup when the map is clicked.
  - `autoPan` keeps the card inside the 210px map.

  Track the active pin with the marker's `popupopen`/`popupclose` events in local state
  (`activeUuid`). The popup appears above the pin, which is Leaflet's standard placement, not to the
  side as in the mockup, because that is reliable at any pin position.
- **Popup styling.** Pass `className` to `<Popup>` and restyle Leaflet's wrapper with `:global(...)`
  inside the SCSS module: white background, 14px radius, soft shadow, the tip hidden, and a round ×
  close button. The card body is a new `MapMasterCard` component.
- **Shared card bits.** Extract the "[Work photo]" fallback and the ★ rating line out of
  `MasterCard` into small shared pieces (`MasterCover` and `MasterRating` in
  `app/components/TopMastersSection/` or a new `app/components/MasterCardParts/`), so both cards
  render them the same way, aria labels included.
- **"View profile".** It is a `next/link` to `/masters/<uuid>`. That page does not exist yet, so
  the link returns 404 until the profile task is done (see open question).

## Steps

1. [x] **Shared contract.** In `packages/shared/src/responses/masters.ts`, add
   `MasterCardResponse`, make `TopMasterResponse` an alias of it, and redefine
   `MasterMapPointResponse` as `MasterCardResponse & { lat, lng }`. Export the new type. Rebuild
   shared (`npm run build` in `packages/shared`).
2. [x] **Masters service.**
   - Add `findActiveCardsByCity` to the repository, and make `MasterService.getMapPoints` return
     `MasterCard[]` using it.
   - Make `MasterResponder.mapPointResponse` reuse the card response.
   - Update `master.service.spec.ts` and `master.controller.spec.ts` for the new shape.
   - Run `npm run lint` and `npm test` in `apps/masters`.
3. [x] **Web card parts.** Extract `MasterCover` and `MasterRating` from `MasterCard`, and update
   `MasterCard` to use them with no visual change. Create `MapMasterCard`: a horizontal card with a
   64px rounded photo, name, category, rating and a dark "View profile" link button.
4. [x] **Map popup.**
   - In `MastersMap.tsx`, add a `<Popup>` with `MapMasterCard` to each marker.
   - Keep `activeUuid` state from `popupopen`/`popupclose`, and render the active marker dark
     (`fillColor` `#1a1a1a`) and slightly bigger.
   - Add the popup styles.
   - The `FitToPoints` refit runs on every container resize, so make sure it doesn't close or jump
     the open popup. Skip the refit while a popup is open.
   - Run `npm run lint`, `npx tsc --noEmit` and `npm run build` in `apps/web`.
5. [x] **Fixes after manual check.**
   - Make the map taller: 210px → 280px.
   - The card doesn't match the mockup because Leaflet's popup CSS wins inside the popup:
     - `.leaflet-popup-content p { margin: 1.3em 0 }` adds big gaps.
     - `.leaflet-container a { color: #0078A8 }` turns the button text blue.
     - `.leaflet-container` sets the Helvetica font.

     Reset these under the popup class with higher specificity: `p` margin 0, `a` color inherit,
     font inherited from the page. Spacing inside the card then comes from flex `gap`, not margins.
   - Match the mockup's layout:
     - The card is about 64px tall, the same as the photo.
     - The right column holds the name (13px semibold), the category (11-12px grey), and a
       bottom row with the rating on the left and a small dark "View profile" button with
       white text on the right.
     - Total popup width is about 230px, including the × space.
