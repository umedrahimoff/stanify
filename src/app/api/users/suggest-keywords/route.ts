import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

/** GET /api/users/suggest-keywords?q=... — predictive search from ChannelKeyword + GlobalKeyword */
export async function GET(req: Request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 50);

    if (!q) {
        const [channelKeywords, globalKeywords] = await Promise.all([
            prisma.channelKeyword.findMany({
                where: { isActive: true },
                select: { text: true },
                distinct: ["text"],
                take: limit,
            }),
            prisma.globalKeyword.findMany({
                where: { isActive: true },
                select: { text: true },
                take: limit,
            }),
        ]);
        const all = [...new Set([...channelKeywords.map((k) => k.text), ...globalKeywords.map((k) => k.text)])].slice(0, limit);
        return NextResponse.json({ keywords: all });
    }

    const [channelKeywords, globalKeywords] = await Promise.all([
        prisma.channelKeyword.findMany({
            where: { text: { contains: q, mode: "insensitive" }, isActive: true },
            select: { text: true },
            distinct: ["text"],
            take: limit,
        }),
        prisma.globalKeyword.findMany({
            where: { text: { contains: q, mode: "insensitive" }, isActive: true },
            select: { text: true },
            take: limit,
        }),
    ]);

    const all = [...new Set([...channelKeywords.map((k) => k.text), ...globalKeywords.map((k) => k.text)])].slice(0, limit);
    return NextResponse.json({ keywords: all });
}
