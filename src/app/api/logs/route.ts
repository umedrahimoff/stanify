import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "30", 10)));
        const dateFrom = searchParams.get("dateFrom") || undefined;
        const dateTo = searchParams.get("dateTo") || undefined;
        const type = searchParams.get("type") || undefined;
        const recipient = searchParams.get("recipient")?.trim().replace(/^@/, "") || undefined;
        const keyword = searchParams.get("keyword")?.trim() || undefined;
        const sourceChannel = searchParams.get("sourceChannel")?.trim() || undefined;
        const success = searchParams.get("success");

        const conditions: object[] = [];

        if (dateFrom || dateTo) {
            const createdAt: { gte?: Date; lte?: Date } = {};
            if (dateFrom) createdAt.gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                createdAt.lte = end;
            }
            conditions.push({ createdAt });
        }
        if (type === "channel" || type === "global") conditions.push({ type });
        if (recipient) conditions.push({ recipient: { contains: recipient, mode: "insensitive" } });
        if (keyword) conditions.push({ keyword: { contains: keyword, mode: "insensitive" } });
        if (sourceChannel) conditions.push({ sourceChannel: { contains: sourceChannel, mode: "insensitive" } });
        if (success === "true") conditions.push({ success: true });
        if (success === "false") conditions.push({ success: false });

        const where = conditions.length > 0 ? { AND: conditions } : undefined;

        const [items, total] = await Promise.all([
            prisma.notificationLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.notificationLog.count({ where }),
        ]);

        return NextResponse.json({ items, total, page, pageSize });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
