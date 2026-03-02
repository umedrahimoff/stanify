import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken, COOKIE_NAME } from "@/lib/auth";

function clearAuthCookie(response: NextResponse) {
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isDashboard = pathname.startsWith("/dashboard");
    const isHome = pathname === "/";

    const tokenValue = request.cookies.get(COOKIE_NAME)?.value;

    // Verify JWT if present
    let isValid = false;
    if (tokenValue) {
        try {
            const payload = await verifyAuthToken(tokenValue);
            isValid = !!payload;
        } catch {
            isValid = false;
        }
    }

    if (tokenValue && !isValid) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        clearAuthCookie(res);
        return res;
    }

    if (isHome && isValid) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isDashboard && !isValid) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/", "/dashboard/:path*"],
};
