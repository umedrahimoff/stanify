import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const prisma = new PrismaClient();
const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

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
        if (body.username) {
            const session = await prisma.session.findFirst({ where: { isActive: true } });
            if (!session) return NextResponse.json({ error: "No active session" }, { status: 401 });

            const client = new TelegramClient(new StringSession(session.sessionStr), apiId, apiHash, {
                connectionRetries: 3,
            });
            await client.connect();

            try {
                const cleanUsername = body.username.replace("@", "").replace("https://t.me/", "").split("/")[0].split("?")[0].trim();
                const entity: any = await client.getEntity(cleanUsername);
                const telegramId = entity.id.toString();
                const name = entity.title || entity.firstName || body.username;
                const finalUsername = entity.username || null;

                const channel = await prisma.channel.upsert({
                    where: { telegramId: telegramId },
                    update: {
                        username: finalUsername,
                        name: name,
                        isActive: true
                    },
                    create: {
                        telegramId: telegramId,
                        username: finalUsername,
                        name: name,
                        isActive: true
                    }
                });
                await client.disconnect();
                return NextResponse.json(channel);
            } catch (e: any) {
                await client.disconnect();
                return NextResponse.json({ error: "Could not find: " + e.message }, { status: 404 });
            }
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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
