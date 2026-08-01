import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/* ---------------------------------------------------------
 * Landing — user login → /dashboard, belum → /login
 * ------------------------------------------------------- */
export default async function HomePage() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}
