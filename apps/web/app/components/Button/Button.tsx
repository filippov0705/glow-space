import styles from "./Button.module.scss";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  onClick,
  variant,
  className,
  disabled,
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[`button_${variant}`]} ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
