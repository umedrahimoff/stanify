import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { suggestKeywords } from "@/lib/openai";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin();
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        const channel = await prisma.channel.findUnique({ where: { id } });
        if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

        const [alerts, posts] = await Promise.all([
            prisma.alert.findMany({ where: { channelId: id }, orderBy: { createdAt: "desc" }, take: 20, select: { content: true } }),
            prisma.channelPost.findMany({ where: { channelId: id }, orderBy: { createdAt: "desc" }, take: 30, select: { content: true } }),
        ]);
        const content = [...alerts.map((a) => a.content), ...posts.map((p) => p.content)].filter(Boolean).slice(0, 50).join("\n\n");
        if (!content.trim()) {
            return NextResponse.json({ error: "Нет контента для анализа. Добавьте ключевые слова и дождитесь постов." }, { status: 400 });
        }

        const keywords = await prisma.channelKeyword.findMany({
            where: { channelId: id, isActive: true },
            select: { text: true },
        });
        const existing = keywords.map((k) => k.text);

        const suggested = await suggestKeywords(content, existing);
        return NextResponse.json({ keywords: suggested });
    } catch (e: any) {
        if (e.message?.includes("OPENAI_API_KEY")) {
            return NextResponse.json({ error: "OpenAI не настроен. Добавьте OPENAI_API_KEY в Vercel → Settings → Environment Variables и сделайте Redeploy." }, { status: 500 });
        }
        console.error("Suggest keywords error:", e);
        return NextResponse.json({ error: e.message || "Ошибка" }, { status: 500 });
    }
}
