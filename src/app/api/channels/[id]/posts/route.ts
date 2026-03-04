import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/channels/[id]/posts — all ChannelPost for this channel (paginated) */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)), 100);

    const [items, total] = await Promise.all([
        prisma.channelPost.findMany({
            where: { channelId: id },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.channelPost.count({ where: { channelId: id } }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
}
