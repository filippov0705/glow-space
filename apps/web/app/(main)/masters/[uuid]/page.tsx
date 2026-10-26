import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import mastersApi from "@/lib/api/masters";
import About from "./components/About/About";
import BookingBar from "./components/BookingBar/BookingBar";
import BookingCard from "./components/BookingCard/BookingCard";
import Location from "./components/Location/Location";
import Portfolio from "./components/Portfolio/Portfolio";
import ProfileHeader from "./components/ProfileHeader/ProfileHeader";
import Reviews from "./components/Reviews/Reviews";
import Services from "./components/Services/Services";
import { slotLabels } from "./profile";
import styles from "./page.module.scss";

// Memoized per request: generateMetadata and the page both need it.
// Errors other than 404 reach the masters error boundary.
const getMasterProfile = cache((uuid: string) =>
  mastersApi.getMasterProfile(uuid),
);

export async function generateMetadata(
  props: PageProps<"/masters/[uuid]">,
): Promise<Metadata> {
  const { uuid } = await props.params;
  const profile = await getMasterProfile(uuid);
  if (!profile) return { title: "Master not found · GlowSpace" };

  return { title: `${profile.name} · GlowSpace` };
}

export default async function MasterProfilePage(
  props: PageProps<"/masters/[uuid]">,
) {
  const { uuid } = await props.params;
  const profile = await getMasterProfile(uuid);
  if (!profile) notFound();

  // No active offerings: no booking card and no bar (minPrice is null then)
  const price =
    profile.minPrice !== null && profile.currency !== null
      ? { minPrice: profile.minPrice, currency: profile.currency }
      : null;
  const slots = slotLabels(profile.nextSlots);

  return (
    <main className={styles.page}>
      <nav aria-label="Breadcrumb" className={styles.page__breadcrumb}>
        <Link href="/" className={styles.page__breadcrumbLink}>
          Home
        </Link>
        <span className={styles.page__breadcrumbSeparator}>/</span>
        <Link href="/masters" className={styles.page__breadcrumbLink}>
          Masters
        </Link>
        <span className={styles.page__breadcrumbSeparator}>/</span>
        <span aria-current="page">{profile.name}</span>
      </nav>

      <ProfileHeader profile={profile} />

      {/* Sections on the left; at >= 1024px the booking card sits in the
          right column */}
      <div className={styles.page__body}>
        <div className={styles.page__sections}>
          {profile.works.length > 0 && (
            <Portfolio
              name={profile.name}
              works={profile.works}
              worksCount={profile.worksCount}
            />
          )}
          <About
            about={profile.about}
            experienceYears={profile.experienceYears}
            languages={profile.languages}
          />
          {profile.offerings.length > 0 && (
            <Services offerings={profile.offerings} />
          )}
          <Reviews
            name={profile.name}
            rating={profile.rating}
            reviewsCount={profile.reviewsCount}
            ratingDistribution={profile.ratingDistribution}
            reviews={profile.reviews}
          />
          <Location
            address={profile.address}
            lat={profile.lat}
            lng={profile.lng}
          />
        </div>
        {price && <BookingCard {...price} slots={slots} />}
      </div>

      {price && <BookingBar {...price} nextSlot={slots[0] ?? null} />}
    </main>
  );
}
