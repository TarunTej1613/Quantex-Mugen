import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper: Check if JWT is structurally valid and unexpired
function isTokenValid(token?: string): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Expired
    }
    return true;
  } catch {
    return false;
  }
}

// Map named admin subroutes to dashboard tabs
const SUBROUTE_TAB_MAP: Record<string, string> = {
  "/admin/registrations": "registrations",
  "/admin/teams": "teams",
  "/admin/participants": "participants",
  "/admin/payments": "payments",
  "/admin/verification": "qr_verify",
  "/admin/settings": "event_settings",
  "/admin/export": "export",
  "/admin/activity-logs": "activity_logs",
  "/admin/admins": "admins",
  "/admin/system-health": "health",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get("qxm_admin_session")?.value;
  const hasValidSession = isTokenValid(rawCookie);

  // 1. Unauthenticated access to any /admin/* route -> Redirect immediately to /admin
  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    if (!hasValidSession) {
      const loginUrl = new URL("/admin", request.url);
      const res = NextResponse.redirect(loginUrl);
      // Clean invalid cookie if present
      if (rawCookie) {
        res.cookies.delete("qxm_admin_session");
      }
      return res;
    }
  }

  // 2. Authenticated user visiting login page /admin -> Redirect to /admin/dashboard
  if (pathname === "/admin") {
    if (hasValidSession) {
      const dashboardUrl = new URL("/admin/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // 3. Authenticated user visiting named subroute -> Route to /admin/dashboard with corresponding tab
  if (hasValidSession && SUBROUTE_TAB_MAP[pathname]) {
    const tabName = SUBROUTE_TAB_MAP[pathname];
    const targetUrl = new URL(`/admin/dashboard?tab=${tabName}`, request.url);
    return NextResponse.redirect(targetUrl);
  }

  const response = NextResponse.next();

  // Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
  ],
};
