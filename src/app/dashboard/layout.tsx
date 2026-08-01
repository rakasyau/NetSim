import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/* ---------------------------------------------------------
 * Layout dashboard — guard auth (lapis kedua setelah proxy)
 * Shell visual di-render oleh AppShell per halaman
 * ------------------------------------------------------- */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <>{children}</>;
}
