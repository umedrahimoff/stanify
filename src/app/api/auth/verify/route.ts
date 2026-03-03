import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();
        const codeStr = typeof code === "string" ? code.trim() : String(code || "").trim();
        if (!codeStr) return NextResponse.json({ error: "Code is required" }, { status: 400 });

        const verification = await prisma.verificationCode.findFirst({
            where: {
                code: codeStr,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!verification) {
            return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
        }

        const userId = verification.targetUserId;
        if (!userId) {
            return NextResponse.json({ error: "Invalid code" }, { status: 401 });
        }

        const user = await prisma.appUser.findUnique({
            where: { id: userId, isActive: true },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        await prisma.verificationCode.delete({ where: { id: verification.id } });

        const cookieStore = await cookies();
        cookieStore.set("stanify_auth", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return NextResponse.json({ success: true, redirect: "/dashboard" });
    } catch (error: any) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
