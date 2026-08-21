import { NextRequest, NextResponse } from "next/server";

/**
 * Root Middleware for Cloud Run Serverless Workload Security.
 * Provides OWASP Security Headers, CORS Policy enforcement, Origin Validation,
 * and API route protection against unauthorized external access.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent") || "";

  // 1. Prepare Security Headers
  const securityHeaders: Record<string, string> = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "X-Serverless-Protection": "enabled",
  };

  // Content Security Policy
  securityHeaders["Content-Security-Policy"] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss: http:",
    "frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.run.app",
  ].join("; ");

  // 2. Handle API Route Security (/api/*)
  if (pathname.startsWith("/api/")) {
    // CORS Handling
    if (req.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      Object.entries(securityHeaders).forEach(([k, v]) => response.headers.set(k, v));
      response.headers.set("Access-Control-Allow-Origin", origin || "*");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-aistudio-client, x-internal-token");
      response.headers.set("Access-Control-Max-Age", "86400");
      return response;
    }

    // Block suspicious automated scanner agents attempting public endpoint exploitation
    const isKnownScanner = /sqlmap|nikto|nmap|zgrab|masscan|dirbuster|gobuster|w3af|openvas/i.test(userAgent);
    if (isKnownScanner) {
      return new NextResponse(
        JSON.stringify({ error: "Access Denied: Unrecognized security scanner agent" }),
        { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }

    // Verify origin/referer consistency for web application requests
    if (origin) {
      const originHost = origin.replace(/^https?:\/\//, "").split(":")[0];
      const reqHost = host.split(":")[0];

      // Allow same-host or internal Cloud Run domains
      const isSameHost = originHost === reqHost || reqHost.includes("run.app") || originHost.includes("run.app") || originHost === "localhost" || originHost === "127.0.0.1";

      if (!isSameHost) {
        // Reject cross-origin POSTs from arbitrary unauthorized third-party origins
        const hasAuthOrClientHeader = req.headers.has("authorization") || req.headers.has("x-aistudio-client") || req.headers.has("x-internal-token");
        if (!hasAuthOrClientHeader) {
          return new NextResponse(
            JSON.stringify({ error: "Forbidden: Unauthorized cross-origin API invocation" }),
            { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
          );
        }
      }
    }
  }

  // 3. Proceed with response and append Security Headers
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([k, v]) => {
    response.headers.set(k, v);
  });

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files (_next/static, images, favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
  ],
};
