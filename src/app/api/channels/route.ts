import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const channels = await prisma.channel.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(channels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { id, isActive } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const channel = await prisma.channel.update({
            where: { id },
            data: { isActive: !!isActive }
        });
        return NextResponse.json(channel);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
    }
}
