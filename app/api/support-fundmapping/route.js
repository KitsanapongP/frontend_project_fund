import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:8080/api/v1";

let API_BASE = "http://127.0.0.1:8080";
let API_BASE_PATH = "/api/v1";

try {
  const parsed = new URL(API_URL);
  API_BASE = `${parsed.protocol}//${parsed.host}`;
  API_BASE_PATH = parsed.pathname || "/api/v1";
} catch {
  // keep defaults
}

const joinURL = (base, path) =>
  `${base.replace(/\/+$/, "")}/${String(path || "").replace(/^\/+/, "")}`;

async function buildForwardHeaders() {
  const incomingHeaders = await nextHeaders();
  const incomingAuth = incomingHeaders.get("authorization");
  const baseHeaders = { Accept: "application/json", "Cache-Control": "no-store" };

  if (incomingAuth) {
    return { ...baseHeaders, Authorization: incomingAuth };
  }

  const cookieStore = await cookies();
  const token =
    cookieStore.get("access_token")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("auth_token")?.value;

  return token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  const headers = await buildForwardHeaders();
  const primaryURL = joinURL(joinURL(API_BASE, API_BASE_PATH || ""), "/support-fundmapping");
  const fallbackURL = joinURL(API_BASE, "/support-fundmapping");

  try {
    let response = await fetchWithTimeout(primaryURL, { headers, cache: "no-store" });

    if (!response.ok) {
      response = await fetchWithTimeout(fallbackURL, { headers, cache: "no-store" });
    }

    const bodyText = await response.text();
    return new NextResponse(bodyText, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch support fund mapping",
        details: error?.message || "unknown error",
      },
      { status: 502 }
    );
  }
}
