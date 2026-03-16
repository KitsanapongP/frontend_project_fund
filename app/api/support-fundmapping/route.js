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
      const isDefaultHttpsPort = parsed.protocol === "https:" && parsed.port === "443";
      const isDefaultHttpPort = parsed.protocol === "http:" && parsed.port === "80";
      const shouldDropKnownWrongPort =
        parsed.hostname === "fs.computing.kku.ac.th" && parsed.port === "8080";

      const normalizedPort =
        parsed.port && !isDefaultHttpsPort && !isDefaultHttpPort && !shouldDropKnownWrongPort
          ? `:${parsed.port}`
          : "";

      base = `${parsed.protocol}//${parsed.hostname}${normalizedPort}`;
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
  const configuredTarget = resolveBackendTarget();
  const { base, basePath } = configuredTarget;

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
