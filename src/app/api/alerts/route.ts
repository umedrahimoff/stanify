import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);
        const channelId = searchParams.get("channelId") || undefined;
        const channelName = searchParams.get("channel") || undefined;

        let where: object | undefined;
        if (channelId) {
            const channel = await prisma.channel.findUnique({ where: { id: channelId } });
            where = channel?.username
                ? { OR: [{ channelId }, { channelName: channel.username }] }
                : { channelId };
        } else if (channelName) {
            where = { channelName };
        }

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return NextResponse.json(alerts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }
}
