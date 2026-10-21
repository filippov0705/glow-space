import styles from "./MasterCover.module.scss";

type MasterCoverProps = {
  coverUrl: string | null;
  name: string;
  // Sets the size and shape of the cover; the base styles only fill and center it
  className?: string;
};

export default function MasterCover({
  coverUrl,
  name,
  className,
}: MasterCoverProps) {
  return (
    <div className={className ? `${styles.cover} ${className}` : styles.cover}>
      {coverUrl ? (
        // coverUrl points to arbitrary hosts, so next/image is not used here
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.cover__image}
          src={coverUrl}
          alt={name}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={styles.cover__placeholder}>[Work photo]</span>
      )}
    </div>
  );
}
