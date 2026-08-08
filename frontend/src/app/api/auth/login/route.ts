import { NextRequest, NextResponse } from "next/server";
import { backendUrl, setSessionCookies } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const backendResponse = await fetch(backendUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json().catch(() => null);
    return NextResponse.json(
      { error: error?.detail ?? "Login failed" },
      { status: backendResponse.status },
    );
  }

  const data = await backendResponse.json();
  const response = NextResponse.json({ user: data.user });
  setSessionCookies(response, data);
  return response;
}
