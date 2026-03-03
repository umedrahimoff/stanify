import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Period = "all" | "7d" | "30d" | "6m" | "1y";

function getPeriodStart(period: Period): Date | null {
    const start = new Date();
    switch (period) {
        case "7d": start.setDate(start.getDate() - 7); break;
        case "30d": start.setDate(start.getDate() - 30); break;
        case "6m": start.setMonth(start.getMonth() - 6); break;
        case "1y": start.setFullYear(start.getFullYear() - 1); break;
        default: return null;
    }
    start.setUTCHours(0, 0, 0, 0);
    return start;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = (searchParams.get("period") || "all") as Period;
        const periodStart = getPeriodStart(period);

        const dateFilter = periodStart ? { gte: periodStart } : undefined;

        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
        const chartFrom = periodStart && periodStart > twelveWeeksAgo ? periodStart : twelveWeeksAgo;

        const alerts = await prisma.alert.findMany({
            where: { createdAt: { gte: chartFrom } },
            select: { createdAt: true },
        });

        const alertsFiltered = dateFilter
            ? alerts.filter((a) => a.createdAt >= periodStart!)
            : alerts;

        const getMonday = (d: Date) => {
            const x = new Date(d);
            const day = x.getDay();
            const diff = x.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(x);
            monday.setDate(diff);
            return monday.toISOString().slice(0, 10);
        };

        const byWeek: Record<string, number> = {};
        for (const a of alertsFiltered) {
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

        const totalPostsScanned = periodStart
            ? (await prisma.dailyScanStats.aggregate({
                where: { date: { gte: periodStart } },
                _sum: { count: true },
            }))._sum.count ?? 0
            : (await prisma.dailyScanStats.aggregate({ _sum: { count: true } }))._sum.count ?? 0;

        const uniqueKeywords = await prisma.channelKeyword.groupBy({
            by: ["text"],
            where: { isActive: true },
        });

        const stats = {
            totalAlerts: dateFilter
                ? await prisma.alert.count({ where: { createdAt: dateFilter } })
                : await prisma.alert.count(),
            activeChannels: await prisma.channel.count({ where: { isActive: true } }),
            activeKeywords: uniqueKeywords.length,
            systemHealth: "Optimal",
            totalPostsScanned,
            recentAlerts: await prisma.alert.findMany({
                where: dateFilter ? { createdAt: dateFilter } : undefined,
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
