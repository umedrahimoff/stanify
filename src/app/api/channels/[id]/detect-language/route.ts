import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { detectLanguage } from "@/lib/openai";

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
            prisma.alert.findMany({ where: { channelId: id }, orderBy: { createdAt: "desc" }, take: 15, select: { content: true } }),
            prisma.channelPost.findMany({ where: { channelId: id }, orderBy: { createdAt: "desc" }, take: 25, select: { content: true } }),
        ]);
        const content = [...alerts.map((a) => a.content), ...posts.map((p) => p.content)].filter(Boolean).slice(0, 40).join("\n\n");
        if (!content.trim()) {
            return NextResponse.json({ error: "Нет контента. Добавьте ключевые слова и дождитесь постов." }, { status: 400 });
        }

        const language = await detectLanguage(content);
        await prisma.channel.update({
            where: { id },
            data: { language },
        });

        return NextResponse.json({ language });
    } catch (e: any) {
        if (e.message?.includes("OPENAI_API_KEY")) {
            return NextResponse.json({ error: "OpenAI не настроен. Добавьте OPENAI_API_KEY в Vercel → Settings → Environment Variables и сделайте Redeploy." }, { status: 500 });
        }
        console.error("Detect language error:", e);
        return NextResponse.json({ error: e.message || "Ошибка" }, { status: 500 });
    }
}
