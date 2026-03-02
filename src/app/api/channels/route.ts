import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

// GET all channels
export async function GET() {
    try {
        const channels = await prisma.channel.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(channels);
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }
}

// POST: Add new OR Update existing (toggle status)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("POST Body:", body);

        // Case 1: Toggling status of existing channel
        if (body.id && body.isActive !== undefined) {
            const channel = await prisma.channel.update({
                where: { id: body.id },
                data: { isActive: !!body.isActive },
            });
            return NextResponse.json(channel);
        }

        // Case 2: Adding new channel by username/link
        if (body.username) {
            // Clean up the input
            const cleanInput = body.username.trim();
            const cleanUsername = cleanInput
                .replace(/^@/, "")
                .replace(/^https?:\/\/t\.me\//, "")
                .split("/")[0]
                .split("?")[0]
                .trim();

            if (!cleanUsername) {
                return NextResponse.json({ error: "Invalid username or link" }, { status: 400 });
            }

            console.log("Resolving Username:", cleanUsername);

            // Check if already exists in DB
            const existing = await prisma.channel.findFirst({
                where: {
                    OR: [{ username: cleanUsername }, { username: `@${cleanUsername}` }],
                },
            });

            if (existing) {
                // Re-activate if it was paused
                const updated = await prisma.channel.update({
                    where: { id: existing.id },
                    data: { isActive: true },
                });
                return NextResponse.json(updated);
            }

            // Try to resolve via Telegram (with short timeout for Vercel)
            const sessionEntry = await prisma.session.findFirst({ where: { isActive: true } });

            if (sessionEntry) {
                const client = new TelegramClient(
                    new StringSession(sessionEntry.sessionStr),
                    apiId,
                    apiHash,
                    { connectionRetries: 1, timeout: 8 }
                );

                try {
                    // Race against a timeout
                    const connectWithTimeout = Promise.race([
                        client.connect(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Connection timeout")), 6000)
                        ),
                    ]);

                    await connectWithTimeout;
                    console.log("TG Connected");

                    const entity: any = await client.getEntity(cleanUsername);
                    console.log("Entity Resolved:", entity.id?.toString());

                    const telegramId = entity.id.toString();
                    const name = entity.title || entity.firstName || cleanUsername;
                    const finalUsername = entity.username || cleanUsername;

                    const channel = await prisma.channel.upsert({
                        where: { telegramId },
                        update: { username: finalUsername, name, isActive: true },
                        create: { telegramId, username: finalUsername, name, isActive: true },
                    });

                    await client.disconnect();
                    return NextResponse.json(channel);
                } catch (err: any) {
                    console.warn("TG resolve failed, saving as pending:", err.message);
                    try {
                        await client.disconnect();
                    } catch (_) { }

                    // Fallback: save with username only (telegramId = username as placeholder)
                    const fallbackId = `pending_${cleanUsername}_${Date.now()}`;
                    const channel = await prisma.channel.create({
                        data: {
                            telegramId: fallbackId,
                            username: cleanUsername,
                            name: cleanUsername,
                            isActive: true,
                        },
                    });
                    return NextResponse.json({ ...channel, _pending: true });
                }
            } else {
                // No session — save directly with username anyway
                const fallbackId = `pending_${cleanUsername}_${Date.now()}`;
                const channel = await prisma.channel.create({
                    data: {
                        telegramId: fallbackId,
                        username: cleanUsername,
                        name: cleanUsername,
                        isActive: true,
                    },
                });
                return NextResponse.json({ ...channel, _pending: true });
            }
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    } catch (error: any) {
        console.error("API POST Error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}

// PATCH: Toggle status (dedicated endpoint kept for clarity)
export async function PATCH(req: Request) {
    try {
        const { id, isActive } = await req.json();
        if (!id || isActive === undefined)
            return NextResponse.json({ error: "id and isActive required" }, { status: 400 });

        const channel = await prisma.channel.update({
            where: { id },
            data: { isActive: !!isActive },
        });
        return NextResponse.json(channel);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove channel from monitoring list
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.channel.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
    }
}
