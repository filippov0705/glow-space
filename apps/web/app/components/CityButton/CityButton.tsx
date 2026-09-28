"use client";

import styles from "./CityButton.module.scss";
import { MapPin, ChevronDown } from "lucide-react";

interface CityButtonProps {
  city: string;
  onClick: () => void;
}

export default function CityButton({ city, onClick }: CityButtonProps) {
  return (
    <button className={styles.cityButton} onClick={onClick}>
      <MapPin size={14} />
      <span className={styles.cityButton__city}>{city}</span>
      <ChevronDown size={14} />
    </button>
  );
}
