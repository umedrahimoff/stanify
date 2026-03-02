import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const alerts = await prisma.alert.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true },
        });

        const byDay: Record<string, number> = {};
        for (const a of alerts) {
            const key = a.createdAt.toISOString().slice(0, 10);
            byDay[key] = (byDay[key] || 0) + 1;
        }

        const alertsByDay: { date: string; count: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            alertsByDay.push({ date: key, count: byDay[key] || 0 });
        }

        const stats = {
            totalAlerts: await prisma.alert.count(),
            activeChannels: await prisma.channel.count({ where: { isActive: true } }),
            activeKeywords: await prisma.channelKeyword.count({ where: { isActive: true } }),
            systemHealth: "Optimal",
            recentAlerts: await prisma.alert.findMany({
                orderBy: { createdAt: "desc" },
                take: 5,
            }),
            alertsByDay,
        };
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
