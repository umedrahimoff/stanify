import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize = Math.min(Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)), 100);
        const channelId = searchParams.get("channelId") || undefined;
        const channelName = searchParams.get("channel") || undefined;
        const dateFrom = searchParams.get("dateFrom") || undefined;
        const dateTo = searchParams.get("dateTo") || undefined;
        const keyword = searchParams.get("keyword")?.trim() || undefined;
        const source = searchParams.get("source") || undefined; // "channel" | "global"

        const conditions: object[] = [];
        if (source === "channel" || source === "global") {
            conditions.push({ source });
        }

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

        const [alerts, total] = await Promise.all([
            prisma.alert.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.alert.count({ where }),
        ]);
        return NextResponse.json({ items: alerts, total, page, pageSize });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }
}
