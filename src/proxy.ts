import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define paths that require auth
    const isDashboard = pathname.startsWith("/dashboard");
    const isHome = pathname === "/";

    // 2. Check for auth cookie
    const token = request.cookies.get("stanify_token");

    // 3. Logic for Home / Landing
    if (isHome && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 4. Logic for Dashboard
    if (isDashboard && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
