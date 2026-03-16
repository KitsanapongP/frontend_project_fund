import { NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";

export const dynamic = "force-dynamic";

function resolveBackendTarget() {
  const publicAPIURL = process.env["NEXT_PUBLIC_API_URL"];
  const raw = (publicAPIURL || "").trim();

  let base = "https://fs.computing.kku.ac.th";
  let basePath = "/api/v1";

  if (raw) {
    try {
      const parsed = new URL(raw);
      base = `${parsed.protocol}//${parsed.host}`;
      basePath = parsed.pathname || "/api/v1";
    } catch {
      // keep defaults
    }
  }

  return {
    base,
    basePath,
  };
}

function resolveRequestOrigin(headers) {
  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost || headers.get("host");

  if (!host) return null;
  return `${forwardedProto || "https"}://${host}`;
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
  const incomingHeaders = await nextHeaders();
  const runtimeOrigin = resolveRequestOrigin(incomingHeaders);
  const configuredTarget = resolveBackendTarget();

  const base = runtimeOrigin || configuredTarget.base;
  const basePath = runtimeOrigin ? "/api/v1" : configuredTarget.basePath;

  const headers = await buildForwardHeaders();
  const primaryURL = joinURL(joinURL(base, basePath || ""), "/support-fundmapping");
  const fallbackURL = joinURL(base, "/support-fundmapping");

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
        primary_url: primaryURL,
        fallback_url: fallbackURL,
      },
      { status: 502 }
    );
  }
}
