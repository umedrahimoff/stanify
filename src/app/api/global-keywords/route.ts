import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function normalize(text: string): string {
    return text.trim().toLowerCase();
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const items = await prisma.globalKeyword.findMany({
            orderBy: { createdAt: "desc" },
            include: { recipients: { select: { username: true } } },
        });

        return NextResponse.json(
            items.map((k) => ({
                id: k.id,
                text: k.text,
                isActive: k.isActive,
                createdAt: k.createdAt,
                recipients: k.recipients.map((r) => r.username),
            }))
        );
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch global keywords" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const text = normalize(body.text ?? "");
        const usernames: string[] = Array.isArray(body.recipients)
            ? body.recipients.map((u: string) => String(u).trim().replace(/^@/, "").toLowerCase()).filter(Boolean)
            : body.recipient
                ? [String(body.recipient).trim().replace(/^@/, "").toLowerCase()]
                : [];

        if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
        if (!usernames.length) return NextResponse.json({ error: "At least one recipient required" }, { status: 400 });

        const existing = await prisma.globalKeyword.findUnique({ where: { text } });
        if (existing) return NextResponse.json({ error: "Keyword already exists" }, { status: 409 });

        const created = await prisma.globalKeyword.create({
            data: {
                text,
                isActive: true,
                recipients: {
                    create: usernames.map((username) => ({ username })),
                },
            },
            include: { recipients: { select: { username: true } } },
        });

        return NextResponse.json({
            id: created.id,
            text: created.text,
            isActive: created.isActive,
            recipients: created.recipients.map((r) => r.username),
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create global keyword" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];
        if (!ids.length) return NextResponse.json({ error: "id or ids required" }, { status: 400 });

        await prisma.globalKeyword.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
