import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

/* ---------------------------------------------------------
 * Proteksi route — proxy.ts (pengganti middleware di Next 16)
 * Route publik: /, /login, /register, /api/auth/*
 * Route privat: /dashboard, /editor, /api/projects, /api/ai/*
 * ------------------------------------------------------- */
export const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  // API privat → 401 JSON (kecuali endpoint publik)
  if (!isLoggedIn && pathname.startsWith("/api/") && !isPublicPath) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Halaman privat → redirect ke login dengan callbackUrl
  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // User yang sudah login tidak boleh buka halaman auth
  if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)).*)"],
};
