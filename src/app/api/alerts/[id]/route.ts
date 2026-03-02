import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const alert = await prisma.alert.findUnique({
            where: { id },
        });
        if (!alert) {
            return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        }
        return NextResponse.json(alert);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch alert" }, { status: 500 });
    }
}
