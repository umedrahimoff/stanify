import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);
        const channelId = searchParams.get("channelId") || undefined;
        const channelName = searchParams.get("channel") || undefined;
        const dateFrom = searchParams.get("dateFrom") || undefined;
        const dateTo = searchParams.get("dateTo") || undefined;
        const keyword = searchParams.get("keyword")?.trim() || undefined;

        const conditions: object[] = [];

        if (channelId) {
            const channel = await prisma.channel.findUnique({ where: { id: channelId } });
            conditions.push(
                channel?.username
                    ? { OR: [{ channelId }, { channelName: channel.username }] }
                    : { channelId }
            );
        } else if (channelName) {
            conditions.push({ channelName });
        }

        if (dateFrom || dateTo) {
            const createdAt: { gte?: Date; lte?: Date } = {};
            if (dateFrom) createdAt.gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                createdAt.lte = end;
            }
            conditions.push({ createdAt });
        }

        if (keyword) {
            conditions.push({ matchedWord: { contains: keyword, mode: "insensitive" } });
        }

        const where = conditions.length > 0 ? { AND: conditions } : undefined;

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        return NextResponse.json(alerts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }
}
