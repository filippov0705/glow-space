import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import authApi from "@/lib/api/auth";

// The link from the confirmation email points here.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    redirect("/login?notice=verification-failed");
  }

  const { success } = await authApi.verifyEmail(token);

  redirect(
    success ? "/login?notice=verified" : "/login?notice=verification-failed",
  );
}
