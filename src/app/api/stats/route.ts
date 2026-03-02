import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const stats = {
            totalAlerts: await prisma.alert.count(),
            activeChannels: await prisma.channel.count({ where: { isActive: true } }),
            activeKeywords: await prisma.keyword.count({ where: { isActive: true } }),
            systemHealth: "Optimal",
            recentAlerts: await prisma.alert.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        };
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
