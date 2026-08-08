import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "dispatch_access_token";
export const REFRESH_TOKEN_COOKIE = "dispatch_refresh_token";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  organizationName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

type IssuedTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
};

export function backendUrl(path: string): string {
  return `${process.env.BACKEND_URL}${path}`;
}

export function setSessionCookies(response: NextResponse, tokens: IssuedTokens): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: tokens.expires_in,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: tokens.refresh_expires_in,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  const response = await fetch(backendUrl("/api/v1/auth/me"), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const data = await response.json();
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    organizationName: data.organization_name,
    role: data.role,
  };
}
