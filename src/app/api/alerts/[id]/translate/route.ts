import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { translateToRussian } from "@/lib/deepl";
import { stripMarkdown } from "@/lib/telegramFormat";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const alert = await prisma.alert.findUnique({ where: { id } });
        if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

        if (alert.translatedContent) {
            return NextResponse.json({ translated: alert.translatedContent });
        }

        const contentPlain = stripMarkdown(alert.content);
        const translated = await translateToRussian(contentPlain);

        await prisma.alert.update({
            where: { id },
            data: { translatedContent: translated },
        });

        return NextResponse.json({ translated });
    } catch (e: any) {
        console.error("Translate error:", e);
        return NextResponse.json({ error: e.message || "Translation failed" }, { status: 500 });
    }
}
