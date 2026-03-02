import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const alerts = await prisma.alert.findMany({
            where: { createdAt: { gte: twelveWeeksAgo } },
            select: { createdAt: true },
        });

        const getMonday = (d: Date) => {
            const x = new Date(d);
            const day = x.getDay();
            const diff = x.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(x);
            monday.setDate(diff);
            return monday.toISOString().slice(0, 10);
        };

        const byWeek: Record<string, number> = {};
        for (const a of alerts) {
            const key = getMonday(a.createdAt);
            byWeek[key] = (byWeek[key] || 0) + 1;
        }

        const alertsByWeek: { week: string; count: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i * 7);
            const key = getMonday(d);
            const [y, m, day] = key.split("-").map(Number);
            const start = `${day.toString().padStart(2, "0")}.${m.toString().padStart(2, "0")}`;
            const endD = new Date(y, m - 1, day + 6);
            const end = `${endD.getDate().toString().padStart(2, "0")}.${(endD.getMonth() + 1).toString().padStart(2, "0")}`;
            alertsByWeek.push({ week: `${start}–${end}`, count: byWeek[key] || 0 });
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
            alertsByWeek,
        };
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
