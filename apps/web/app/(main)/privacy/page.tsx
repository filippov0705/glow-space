import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../../components/LegalPage/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · GlowSpace",
  description: "How GlowSpace collects, uses and protects your data",
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "This Privacy Policy explains how GlowSpace collects, uses and protects your personal data when you use our beauty marketplace.",
    ],
  },
  {
    heading: "Data we collect",
    paragraphs: [
      "Account data: your name, email address and password (stored only as a secure hash). If you sign in with Google, we receive your name, email and Google account identifier.",
      "Profile data: your city and any information you add to your profile. Masters also provide details about their services, works and portfolio.",
      "Technical data: your IP address, which we use to suggest your city, and cookies required for signing in.",
    ],
  },
  {
    heading: "How we use your data",
    paragraphs: [
      "We use your data to create and secure your account, show you masters in your city, process bookings, send service emails such as email confirmation, and improve the platform.",
      "We do not sell your personal data.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "We use essential cookies to keep you signed in and to remember your selected city. These cookies are necessary for the service to work.",
    ],
  },
  {
    heading: "Sharing your data",
    paragraphs: [
      "When you book a service, we share the details needed for the appointment with the master. We also use trusted providers, such as hosting and email delivery, who process data on our behalf.",
      "We may disclose data if required by law.",
    ],
  },
  {
    heading: "Data retention",
    paragraphs: [
      "We keep your data while your account is active. When you delete your account, we delete or anonymise your personal data unless we are required to keep it by law.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "You can access, correct or delete your personal data, object to or restrict its processing, and request a copy of it. You can also lodge a complaint with your local data protection authority.",
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "We protect your data with encryption in transit, hashed passwords and short-lived access tokens. No system is perfectly secure, but we work to keep your data safe.",
    ],
  },
  {
    heading: "Changes to this policy",
    paragraphs: [
      "We may update this policy from time to time. We will notify you of significant changes before they take effect.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "To exercise your rights or ask a question about privacy, contact us at privacy@glowspace.app.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="October 19, 2026"
      sections={SECTIONS}
      related={{ href: "/terms", label: "Terms of Use" }}
    />
  );
}
