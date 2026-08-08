import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, backendUrl, clearSessionCookies, setSessionCookies } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/automations",
  "/templates",
  "/history",
  "/integrations",
  "/analytics",
  "/billing",
  "/settings",
];
const AUTH_PAGES = ["/login", "/signup"];

function isExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    const { exp } = JSON.parse(atob(payload));
    return typeof exp !== "number" || Date.now() >= exp * 1000 - 5000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isApi = pathname.startsWith("/api/backend");
  if (!isProtected && !isAuthPage && !isApi) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && !isExpired(accessToken)) {
    if (isAuthPage) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (refreshToken) {
    const refreshed = await fetch(backendUrl("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (refreshed.ok) {
      const tokens = await refreshed.json();
      const response = isAuthPage
        ? NextResponse.redirect(new URL("/dashboard", request.url))
        : NextResponse.next();
      setSessionCookies(response, tokens);
      return response;
    }
  }

  if (isAuthPage) return NextResponse.next();

  if (isApi) {
    const response = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookies(response);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/automations/:path*",
    "/templates/:path*",
    "/history/:path*",
    "/integrations/:path*",
    "/analytics/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
    "/api/backend/:path*",
  ],
};
