import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define paths that require auth
    const isDashboard = pathname.startsWith("/dashboard");
    const isHome = pathname === "/";

    // 2. Check auth cookie
    const auth = request.cookies.get("stanify_auth");

    // 3. Home: if logged in → dashboard
    if (isHome && auth?.value) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 4. Dashboard: if not logged in → login
    if (isDashboard && !auth?.value) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
