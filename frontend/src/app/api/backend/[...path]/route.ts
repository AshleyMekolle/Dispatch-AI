import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, backendUrl } from "@/lib/session";

async function proxy(request: NextRequest, path: string[]) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const url = backendUrl(`/api/v1/${path.join("/")}`);

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const backendResponse = await fetch(url, init);
  const hasBody = backendResponse.status !== 204 && backendResponse.status !== 304;
  const body = hasBody ? await backendResponse.text() : null;

  return new NextResponse(body, {
    status: backendResponse.status,
    headers: {
      "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json",
    },
  });
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path);
}
