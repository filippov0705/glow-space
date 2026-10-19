import { USER_COOKIE } from "../constants";
import { cookies } from "next/headers";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { User } from "../types/user";
import { resolveCurrentCity } from "./actions";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_COOKIE)?.value;
  const user = raw ? (JSON.parse(raw) as User) : null;

  const city = await resolveCurrentCity();

  return (
    <>
      <Header user={user} city={city.name} />
      <div className="flex-grow">{children}</div>
      <Footer />
    </>
  );
}
