import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET all channels
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

// POST: Add new or Update existing
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Case 1: Toggling status of existing
        if (body.id && body.isActive !== undefined) {
            const channel = await prisma.channel.update({
                where: { id: body.id },
                data: { isActive: !!body.isActive }
            });
            return NextResponse.json(channel);
        }

        // Case 2: Adding new channel by username/ID
        if (body.telegramId || body.username) {
            const channel = await prisma.channel.upsert({
                where: { telegramId: body.telegramId || body.username },
                update: {
                    username: body.username || null,
                    name: body.name || body.username || "New Source",
                    isActive: body.isActive ?? false
                },
                create: {
                    telegramId: body.telegramId || body.username,
                    username: body.username || null,
                    name: body.name || body.username || "New Source",
                    isActive: body.isActive ?? false
                }
            });
            return NextResponse.json(channel);
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}

// DELETE: Remove channel from monitoring list
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.channel.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
    }
}
