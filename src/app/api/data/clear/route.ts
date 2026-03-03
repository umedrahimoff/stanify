import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
    try {
        const admin = await requireAdmin();
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await prisma.channelPost.deleteMany({});
        return NextResponse.json({ deleted: result.count });
    } catch (e) {
        console.error("Clear error:", e);
        return NextResponse.json({ error: "Clear failed" }, { status: 500 });
    }
}
