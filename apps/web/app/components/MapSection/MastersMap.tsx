"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleMarker as LeafletCircleMarker,
  DomEvent,
  latLngBounds,
  LeafletEvent,
  LeafletMouseEvent,
  Map as LeafletMap,
} from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvent,
  ZoomControl,
} from "react-leaflet";
import { MasterMapPointResponse } from "@glow-space/shared";
import {
  MAP_DEFAULT_ZOOM,
  MAP_DOCKED_CARD_PAN_PADDING_BOTTOM,
  MAP_MARKER_ACTIVE_COLOR,
  MAP_MARKER_ACTIVE_RADIUS,
  MAP_MARKER_COLOR,
  MAP_MARKER_RADIUS,
  MAP_MAX_FIT_ZOOM,
  MAP_POPUP_AUTO_PAN_PADDING,
  MAP_POPUP_AUTO_PAN_PADDING_TOP,
  MAP_SINGLE_POINT_ZOOM,
  MAP_TILE_ATTRIBUTION,
  MAP_TILE_URL,
  MOBILE_QUERY,
} from "@/app/constants";
import MapMasterCard from "../MapMasterCard/MapMasterCard";
import "leaflet/dist/leaflet.css";
import styles from "./MapSection.module.scss";

type MastersMapProps = {
  points: MasterMapPointResponse[];
  center: { lat: number; lng: number };
};

type FitToPointsProps = MastersMapProps & {
  // the mobile docked card, which defers re-fits like an open popup
  isCardOpen: boolean;
};

function FitToPoints({ points, center, isCardOpen }: FitToPointsProps) {
  const map = useMap();
  // Re-fitting moves the view away from an open card, so it is skipped while
  // one is open. Kept in a ref so the state survives re-runs of the fit effect.
  const isPopupOpenRef = useRef(false);
  // Mirrors isCardOpen for the event and observer callbacks.
  const isCardOpenRef = useRef(isCardOpen);
  // Set when a fit was skipped because of an open popup, so it can be applied
  // once the popup closes. Without a skipped fit, closing keeps the user's view.
  const pendingFitRef = useRef(false);
  // The latest fit for the current points/center, read by the popupclose
  // handler, which lives in a separate effect.
  const fitRef = useRef<() => void>(() => {});

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Clicking another pin first closes the open popup (the map's preclick
    // closes it via closeOnClick), then opens the new one, so the flag ends up
    // true when switching between pins.
    const onPopupOpen = () => {
      isPopupOpenRef.current = true;
    };
    const onPopupClose = () => {
      isPopupOpenRef.current = false;
      if (!pendingFitRef.current) {
        return;
      }

      // Deferred because on a pin switch the next popup opens synchronously
      // right after this close. Fitting in that gap would move the view under
      // the new card, so re-check and keep the fit pending if one is open.
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (
          isPopupOpenRef.current ||
          isCardOpenRef.current ||
          !pendingFitRef.current
        ) {
          return;
        }
        pendingFitRef.current = false;
        fitRef.current();
      }, 0);
    };
    map.on("popupopen", onPopupOpen);
    map.on("popupclose", onPopupClose);

    return () => {
      clearTimeout(timeoutId);
      map.off("popupopen", onPopupOpen);
      map.off("popupclose", onPopupClose);
    };
  }, [map]);

  useEffect(() => {
    const fit = () => {
      if (!points.length) {
        map.setView([center.lat, center.lng], MAP_DEFAULT_ZOOM);
        return;
      }

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], MAP_SINGLE_POINT_ZOOM);
        return;
      }

      const bounds = latLngBounds(
        points.map((point): [number, number] => [point.lat, point.lng]),
      );
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: MAP_MAX_FIT_ZOOM });
    };
    fitRef.current = fit;

    // Fits now, or remembers the fit for when the open popup or docked card
    // closes.
    const fitOrDefer = () => {
      if (isPopupOpenRef.current || isCardOpenRef.current) {
        pendingFitRef.current = true;
        return;
      }
      pendingFitRef.current = false;
      fit();
    };

    fitOrDefer();

    // The container size can change after mount (late leaflet.css, font layout
    // shift), so re-measure on every resize and re-fit (or defer the fit while a
    // card is open). Fitting only changes the view, not the container size, so
    // it cannot retrigger the observer.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fitOrDefer();
    });
    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map, points, center.lat, center.lng]);

  // The docked card's counterpart of popupclose: applies a fit skipped while
  // the card was open. Switching pins keeps the card open, so no fit then.
  useEffect(() => {
    isCardOpenRef.current = isCardOpen;
    if (isCardOpen || isPopupOpenRef.current || !pendingFitRef.current) {
      return;
    }
    pendingFitRef.current = false;
    fitRef.current();
  }, [isCardOpen]);

  return null;
}

type DockedCardEventsProps = {
  onMapClick: () => void;
  onViewportChange: (isMobile: boolean) => void;
};

// Map-level events for the mobile docked card: a tap on the map (not on a
// pin, those stop propagation) closes it, and crossing the mobile breakpoint
// closes whatever is open, popup or card.
function DockedCardEvents({
  onMapClick,
  onViewportChange,
}: DockedCardEventsProps) {
  const map = useMapEvent("click", onMapClick);

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      map.closePopup();
      onViewportChange(event.matches);
    };

    mobile.addEventListener("change", onChange);
    return () => mobile.removeEventListener("change", onChange);
  }, [map, onViewportChange]);

  return null;
}

export default function MastersMap({ points, center }: MastersMapProps) {
  const [activeUuid, setActiveUuid] = useState<string | null>(null);
  // The map renders only on the client (see MastersMapLoader), so the query
  // can be read during the first render.
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches,
  );
  const mapRef = useRef<LeafletMap>(null);

  // Drops the active master when new points no longer include it, so its card
  // doesn't come back unprompted if it reappears later. Adjusted during render
  // rather than in an effect, as React recommends for state derived from props.
  const [prevPoints, setPrevPoints] = useState(points);
  if (points !== prevPoints) {
    setPrevPoints(points);
    if (activeUuid && !points.some((point) => point.uuid === activeUuid)) {
      setActiveUuid(null);
    }
  }

  const activePoint = isMobile
    ? points.find((point) => point.uuid === activeUuid)
    : undefined;

  const closeCard = useCallback(() => setActiveUuid(null), []);
  const onViewportChange = useCallback((matches: boolean) => {
    setIsMobile(matches);
    setActiveUuid(null);
  }, []);

  return (
    <>
      <MapContainer
        ref={mapRef}
        className={styles.mapSection__map}
        center={[center.lat, center.lng]}
        zoom={MAP_DEFAULT_ZOOM}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />
        {points.map((point) => {
          const isActive = point.uuid === activeUuid;

          return (
            <CircleMarker
              key={point.uuid}
              center={[point.lat, point.lng]}
              radius={isActive ? MAP_MARKER_ACTIVE_RADIUS : MAP_MARKER_RADIUS}
              pathOptions={{
                color: "white",
                weight: 2,
                fillColor: isActive
                  ? MAP_MARKER_ACTIVE_COLOR
                  : MAP_MARKER_COLOR,
                fillOpacity: 1,
              }}
              eventHandlers={{
                // On mobile a pin toggles the docked card. Above the
                // breakpoint the popup bound to the pin handles the click.
                click: (event: LeafletMouseEvent) => {
                  if (!isMobile) {
                    return;
                  }
                  // keeps the map's click handler from closing the card
                  DomEvent.stopPropagation(event);

                  if (isActive) {
                    setActiveUuid(null);
                    return;
                  }

                  // draws the dark active pin above its neighbours
                  (event.target as LeafletCircleMarker).bringToFront();
                  setActiveUuid(point.uuid);
                  mapRef.current?.panInside([point.lat, point.lng], {
                    paddingTopLeft: [
                      MAP_POPUP_AUTO_PAN_PADDING,
                      MAP_POPUP_AUTO_PAN_PADDING_TOP,
                    ],
                    paddingBottomRight: [
                      MAP_POPUP_AUTO_PAN_PADDING,
                      MAP_DOCKED_CARD_PAN_PADDING_BOTTOM,
                    ],
                  });
                },
                popupopen: (event: LeafletEvent) => {
                  // draws the dark active pin above its neighbours
                  (event.target as LeafletCircleMarker).bringToFront();
                  setActiveUuid(point.uuid);
                },
                // When switching pins the previous popup also closes, so only
                // clear the state if it still points at this pin. That keeps
                // the new pin active regardless of the event order.
                popupclose: () =>
                  setActiveUuid((current) =>
                    current === point.uuid ? null : current,
                  ),
              }}
            >
              {!isMobile && (
                <Popup
                  className={styles.mapSection__popup}
                  autoPanPadding={[
                    MAP_POPUP_AUTO_PAN_PADDING,
                    MAP_POPUP_AUTO_PAN_PADDING,
                  ]}
                  autoPanPaddingTopLeft={[
                    MAP_POPUP_AUTO_PAN_PADDING,
                    MAP_POPUP_AUTO_PAN_PADDING_TOP,
                  ]}
                >
                  <MapMasterCard master={point} />
                </Popup>
              )}
            </CircleMarker>
          );
        })}
        <FitToPoints
          points={points}
          center={center}
          isCardOpen={Boolean(activePoint)}
        />
        <DockedCardEvents
          onMapClick={closeCard}
          onViewportChange={onViewportChange}
        />
      </MapContainer>

      {activePoint && (
        <div className={styles.mapSection__dockedCard}>
          <MapMasterCard master={activePoint} variant="docked" />
        </div>
      )}
    </>
  );
}
