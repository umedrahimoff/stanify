import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAction } from "@/lib/actionLog";

function parseTags(input: string): string[] {
    return [...new Set(input.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id } = await params;
        const keywords = await prisma.channelKeyword.findMany({
            where: { channelId: id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(keywords);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id } = await params;
        const body = await req.json();
        const raw = body.texts
            ? Array.isArray(body.texts)
                ? body.texts.join(",")
                : String(body.texts)
            : body.text
                ? String(body.text)
                : "";
        const unique = parseTags(raw);
        if (!unique.length) return NextResponse.json({ error: "text or texts required" }, { status: 400 });

        const created = await prisma.$transaction(
            unique.map((text) =>
                prisma.channelKeyword.upsert({
                    where: { channelId_text: { channelId: id, text } },
                    create: { channelId: id, text, isActive: true },
                    update: { isActive: true },
                })
            )
        );
        const ch = await prisma.channel.findUnique({ where: { id }, select: { name: true, username: true } });
        await logAction({ action: "keyword_add", actorId: user.id, actorUsername: user.username, targetType: "channel", targetId: id, details: `${ch?.name || ch?.username || id}: ${unique.join(", ")}` });
        return NextResponse.json(created.length === 1 ? created[0] : created);
    } catch (error) {
        return NextResponse.json({ error: "Failed to add keywords" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id } = await params;
        const body = await req.json();
        const ids: string[] = body.ids ? (Array.isArray(body.ids) ? body.ids : [body.ids]) : body.id ? [body.id] : [];
        if (!ids.length) return NextResponse.json({ error: "id or ids required" }, { status: 400 });

        await prisma.channelKeyword.deleteMany({
            where: { id: { in: ids }, channelId: id },
        });
        const ch = await prisma.channel.findUnique({ where: { id }, select: { name: true, username: true } });
        await logAction({ action: "keyword_remove", actorId: user.id, actorUsername: user.username, targetType: "channel", targetId: id, details: `${ch?.name || ch?.username || id} ids=${ids.length}` });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete keywords" }, { status: 500 });
    }
}
