import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../../components/LegalPage/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use · GlowSpace",
  description: "The rules for using the GlowSpace beauty marketplace",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of the terms",
    paragraphs: [
      "By creating an account or using GlowSpace you agree to these Terms of Use. If you do not agree, please do not use the service.",
    ],
  },
  {
    heading: "The service",
    paragraphs: [
      "GlowSpace is a marketplace that connects clients with independent beauty masters. We provide the platform for discovering masters, viewing their works and ratings, and booking services.",
      "Masters are independent professionals, not employees or agents of GlowSpace. The master is solely responsible for the services they provide.",
    ],
  },
  {
    heading: "Your account",
    paragraphs: [
      "You must provide accurate information when registering and keep it up to date. You are responsible for keeping your password secure and for all activity under your account.",
      "You must be at least 16 years old to create an account.",
    ],
  },
  {
    heading: "Bookings",
    paragraphs: [
      "Prices, availability and service descriptions are set by masters. Please arrive on time and cancel in advance if you cannot attend an appointment.",
      "Any disputes about the quality of a service should first be resolved directly with the master. We may help mediate, but we are not a party to the agreement between a client and a master.",
    ],
  },
  {
    heading: "Content you publish",
    paragraphs: [
      "You keep the rights to the photos, reviews and other content you publish. By publishing it you grant GlowSpace a non-exclusive licence to display it on the platform.",
      "Do not publish content that is unlawful, misleading, offensive or that infringes the rights of others. We may remove such content without notice.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: [
      "Do not attempt to disrupt the service, access other users' accounts, scrape data at scale, or use the platform for spam or fraud.",
    ],
  },
  {
    heading: "Termination",
    paragraphs: [
      "You may delete your account at any time. We may suspend or close accounts that violate these terms.",
    ],
  },
  {
    heading: "Limitation of liability",
    paragraphs: [
      "GlowSpace is provided “as is”. To the extent permitted by law, we are not liable for indirect damages or for the services provided by masters.",
    ],
  },
  {
    heading: "Changes to the terms",
    paragraphs: [
      "We may update these terms from time to time. If the changes are significant, we will notify you before they take effect. Continuing to use the service means you accept the updated terms.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "If you have any questions about these terms, contact us at support@glowspace.app.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updatedAt="October 19, 2026"
      sections={SECTIONS}
      related={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
