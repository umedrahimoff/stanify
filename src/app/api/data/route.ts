import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const LIMIT_MB = 100;

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const [count, sizeResult] = await Promise.all([
            prisma.channelPost.count(),
            prisma.$queryRaw<[{ sum: bigint | null }]>`
                SELECT COALESCE(SUM(LENGTH(content)), 0)::bigint as sum FROM "ChannelPost"
            `,
        ]);

        const bytes = Number(sizeResult[0]?.sum ?? 0);
        const mb = bytes / (1024 * 1024);
        const limitReached = mb >= LIMIT_MB;

        return NextResponse.json({
            count,
            bytes,
            mb: Math.round(mb * 100) / 100,
            limitMb: LIMIT_MB,
            limitReached,
        });
    } catch (e) {
        console.error("Data stats error:", e);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
