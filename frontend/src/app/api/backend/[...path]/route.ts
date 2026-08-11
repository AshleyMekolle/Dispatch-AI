import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE, backendUrl } from "@/lib/session";

const NO_BODY_METHODS = new Set(["GET", "HEAD", "DELETE"]);

async function proxy(request: NextRequest, path: string[]) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const url = backendUrl(`/api/v1/${path.join("/")}`);

  const headers: HeadersInit = {};
  // Preserve the caller's Content-Type as-is (e.g. "multipart/form-data;
  // boundary=..." for file uploads) instead of forcing JSON — only fall back
  // to JSON when the request didn't set one itself.
  const incomingContentType = request.headers.get("content-type");
  if (incomingContentType) {
    headers["Content-Type"] = incomingContentType;
  } else if (!NO_BODY_METHODS.has(request.method)) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const init: RequestInit = { method: request.method, headers };
  if (!NO_BODY_METHODS.has(request.method)) {
    // arrayBuffer, not text: request bodies can be binary (an uploaded
    // .xlsx file), and text() would corrupt them.
    init.body = await request.arrayBuffer();
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxy(request, path);
}
