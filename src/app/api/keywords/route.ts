import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseTexts(input: string): string[] {
    return [...new Set(input.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export async function GET() {
    try {
        const rows = await prisma.channelKeyword.findMany({
            where: { isActive: true },
            include: { channel: { select: { id: true, name: true, username: true } } },
            orderBy: [{ text: "asc" }, { channel: { name: "asc" } }],
        });

        const byText: Record<string, { text: string; items: typeof rows }> = {};
        for (const r of rows) {
            if (!byText[r.text]) byText[r.text] = { text: r.text, items: [] };
            byText[r.text].items.push(r);
        }

        const keywords = Object.values(byText).map((g) => ({
            text: g.text,
            channels: g.items.map((i) => ({
                id: i.channel.id,
                name: i.channel.name,
                username: i.channel.username,
            })),
            ids: g.items.map((i) => i.id),
        }));

        return NextResponse.json({ keywords });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const channelIds: string[] = Array.isArray(body.channelIds) ? body.channelIds : body.channelId ? [body.channelId] : [];
        const raw = body.texts ?? body.text ?? "";
        const texts = typeof raw === "string" ? parseTexts(raw) : Array.isArray(raw) ? raw.map((s) => String(s).trim().toLowerCase()).filter(Boolean) : [];

        if (!channelIds.length) return NextResponse.json({ error: "channelIds required" }, { status: 400 });
        if (!texts.length) return NextResponse.json({ error: "text or texts required" }, { status: 400 });

        const channels = await prisma.channel.findMany({
            where: { id: { in: channelIds } },
            select: { id: true },
        });
        const validIds = channels.map((c) => c.id);

        const ops = validIds.flatMap((channelId) =>
            texts.map((text) =>
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
            added: validIds.length * texts.length,
            channels: validIds.length,
            keywords: texts.length,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add keywords" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

        if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

        await prisma.channelKeyword.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete keywords" }, { status: 500 });
    }
}
