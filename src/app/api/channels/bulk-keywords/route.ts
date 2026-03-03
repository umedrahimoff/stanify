import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseTags(input: string): string[] {
    return [...new Set(input.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const channelIds: string[] = Array.isArray(body.channelIds) ? body.channelIds : body.channelId ? [body.channelId] : [];
        const raw = body.texts
            ? Array.isArray(body.texts)
                ? body.texts.join(",")
                : String(body.texts)
            : body.text
                ? String(body.text)
                : "";
        const unique = parseTags(raw);

        if (!channelIds.length) return NextResponse.json({ error: "channelIds required" }, { status: 400 });
        if (!unique.length) return NextResponse.json({ error: "texts required" }, { status: 400 });

        const channels = await prisma.channel.findMany({
            where: { id: { in: channelIds } },
            select: { id: true },
        });
        const validIds = channels.map((c) => c.id);

        const ops = validIds.flatMap((channelId) =>
            unique.map((text) =>
                prisma.channelKeyword.upsert({
                    where: { channelId_text: { channelId, text } },
                    create: { channelId, text, isActive: true },
                    update: { isActive: true },
                })
            )
        );

        await prisma.$transaction(ops);

        return NextResponse.json({
            success: true,
            added: validIds.length * unique.length,
            channels: validIds.length,
            keywords: unique.length,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add keywords" }, { status: 500 });
    }
}
