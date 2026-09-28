import { Inter } from "next/font/google";
import "../globals.css";
import { CITY_COOKIE, DEFAULT_CITY, USER_COOKIE } from "../constants";
import { cookies } from "next/headers";
import Header from "../components/Header/Header";
import { User } from "../types/user";
import { getCityFromIpAction } from "./actions";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  const user = raw ? (JSON.parse(raw) as User) : null;

  const cityCookie = cookieStore.get(CITY_COOKIE)?.value;

  const city =
    cityCookie ?? user?.city ?? (await getCityFromIpAction()) ?? DEFAULT_CITY;

  return (
    <>
      <Header user={user} city={city} />
      {children}
    </>
  );
}
