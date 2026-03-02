import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createAuthToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();
        if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

        // 1. Check code in DB
        const verification = await prisma.verificationCode.findFirst({
            where: {
                code: code,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!verification) {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
        }

        // 2. Clear used code
        await prisma.verificationCode.delete({ where: { id: verification.id } });

        // 3. Create signed JWT and set cookie
        const token = await createAuthToken("umedrahimoff");
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            sameSite: "lax",
        });

        return NextResponse.json({ success: true, redirect: "/dashboard" });
    } catch (error: any) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
