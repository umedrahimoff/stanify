import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const keywords = await prisma.keyword.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(keywords);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const texts: string[] = body.texts
            ? (Array.isArray(body.texts) ? body.texts : [body.texts])
            : body.text
                ? [body.text]
                : [];
        if (texts.length === 0) return NextResponse.json({ error: "text or texts required" }, { status: 400 });

        const unique = [...new Set(texts.map((t: string) => (t || "").trim().toLowerCase()).filter(Boolean))];
        const created = await prisma.$transaction(
            unique.map((text) =>
                prisma.keyword.upsert({
                    where: { text },
                    create: { text, isActive: true },
                    update: {}
                })
            )
        );
        return NextResponse.json(created.length === 1 ? created[0] : created);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const ids: string[] = body.ids
            ? (Array.isArray(body.ids) ? body.ids : [body.ids])
            : body.id
                ? [body.id]
                : [];
        if (ids.length === 0) return NextResponse.json({ error: "id or ids required" }, { status: 400 });

        await prisma.keyword.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 });
    }
}
