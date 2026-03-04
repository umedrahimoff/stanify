import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MAX_FETCH = 5000;

type ArchiveItem = {
    id: string;
    channelName: string;
    channelId: string | null;
    content: string;
    matchedWord: string;
    postLink: string | null;
    source?: string;
    createdAt: Date;
};

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
        const keywordRaw = searchParams.get("keyword")?.trim() || undefined;
        const keyword = keywordRaw === "__none__" ? undefined : keywordRaw;
        const noKeywordOnly = keywordRaw === "__none__";
        const source = searchParams.get("source") || undefined;

        const dateFilter: { gte?: Date; lte?: Date } = {};
        if (dateFrom) dateFilter.gte = new Date(dateFrom);
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        const alertConditions: object[] = [];
        if (source === "channel" || source === "global") alertConditions.push({ source });
        if (channelId) {
            const ch = await prisma.channel.findUnique({ where: { id: channelId } });
            alertConditions.push(
                ch?.username ? { OR: [{ channelId }, { channelName: ch.username }] } : { channelId }
            );
        } else if (channelName) {
            alertConditions.push({ channelName });
        }
        if (Object.keys(dateFilter).length) alertConditions.push({ createdAt: dateFilter });
        if (keyword) alertConditions.push({ matchedWord: { contains: keyword, mode: "insensitive" } });

        const alertWhere = alertConditions.length ? { AND: alertConditions } : undefined;

        const includePostsWithoutAlert = source !== "global" && !keyword;
        const alertsOnly = noKeywordOnly ? false : true;

        const [alerts, channelPosts, channelForName] = await Promise.all([
            alertsOnly
                ? prisma.alert.findMany({
                      where: alertWhere,
                      orderBy: { createdAt: "desc" },
                      take: MAX_FETCH,
                  })
                : [],
            includePostsWithoutAlert
                ? prisma.channelPost.findMany({
                      where: {
                          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
                          ...(channelId ? { channelId } : {}),
                          postLink: { not: null },
                      },
                      include: { channel: true },
                      orderBy: { createdAt: "desc" },
                      take: MAX_FETCH,
                  })
                : [],
            channelName && !channelId
                ? prisma.channel.findFirst({ where: { OR: [{ username: channelName }, { name: channelName }] } })
                : null,
        ]);

        let posts = channelPosts;
        if (channelName && channelForName && !channelId) {
            posts = posts.filter((p) => p.channelId === channelForName.id);
        }

        const channelIds = [...new Set(posts.map((p) => p.channelId))];
        const alertPostLinks =
            channelIds.length > 0
                ? new Set(
                      (
                          await prisma.alert.findMany({
                              where: { channelId: { in: channelIds } },
                              select: { channelId: true, postLink: true },
                          })
                      ).map((a) => `${a.channelId}:${a.postLink}`)
                  )
                : new Set<string>();
        const postsWithoutAlert = posts.filter(
            (p) => p.postLink && !alertPostLinks.has(`${p.channelId}:${p.postLink}`)
        );

        const alertItems: ArchiveItem[] = alerts.map((a) => ({
            id: a.id,
            channelName: a.channelName,
            channelId: a.channelId,
            content: a.content,
            matchedWord: a.matchedWord,
            postLink: a.postLink,
            source: a.source ?? undefined,
            createdAt: a.createdAt,
        }));

        const postItems: ArchiveItem[] = postsWithoutAlert.map((p) => ({
            id: `cp-${p.id}`,
            channelName: p.channel.name ?? p.channel.username ?? "?",
            channelId: p.channelId,
            content: p.content,
            matchedWord: "—",
            postLink: p.postLink,
            source: "channel",
            createdAt: p.createdAt,
        }));

        const merged = [...alertItems, ...postItems].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const total = merged.length;
        const items = merged.slice((page - 1) * pageSize, page * pageSize);

        return NextResponse.json({
            items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
            total,
            page,
            pageSize,
        });
    } catch (error) {
        console.error("Archive fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch archive" }, { status: 500 });
    }
}
