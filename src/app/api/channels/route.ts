import { NextResponse } from "next/server";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

// GET all channels (newest first) with last activity from alerts
export async function GET() {
    try {
        const channels = await prisma.channel.findMany({
            orderBy: { createdAt: "desc" },
        });

        const lastActivities = await prisma.alert.groupBy({
            by: ["channelName"],
            _max: { createdAt: true },
        });
        const activityMap = Object.fromEntries(
            lastActivities.map((a) => [a.channelName, a._max.createdAt])
        );

        const channelsWithActivity = channels.map((c) => ({
            ...c,
            lastActivityAt: (c.username && activityMap[c.username]) ?? null,
        }));

        return NextResponse.json(channelsWithActivity);
    } catch (error) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }
}

// POST: Add new channel OR Toggle status of existing
export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("POST Body:", body);

        // ── Case 1: Toggle status of existing channel ──────────────────────────
        if (body.id && body.isActive !== undefined) {
            const channel = await prisma.channel.update({
                where: { id: body.id },
                data: { isActive: !!body.isActive },
            });
            return NextResponse.json(channel);
        }

        // ── Case 2: Add new channel by username/link ───────────────────────────
        if (body.username) {
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

            console.log("Resolving + Joining channel:", cleanUsername);

            // Get active Telegram session
            const sessionEntry = await prisma.session.findFirst({ where: { isActive: true } });
            if (!sessionEntry) {
                return NextResponse.json({ error: "No active Telegram session found." }, { status: 401 });
            }

            const client = new TelegramClient(
                new StringSession(sessionEntry.sessionStr),
                apiId,
                apiHash,
                { connectionRetries: 2 }
            );

            try {
                await client.connect();
                console.log("TG Connected");

                // 1. Resolve the entity (get channel info)
                let entity: any;
                try {
                    entity = await client.getEntity(cleanUsername);
                    console.log("Entity resolved:", entity.id?.toString(), entity.title);
                } catch (err: any) {
                    await client.disconnect();
                    return NextResponse.json(
                        { error: `Channel not found: ${err.message}` },
                        { status: 404 }
                    );
                }

                const telegramId = entity.id.toString();
                const name = entity.title || entity.firstName || cleanUsername;
                const finalUsername = entity.username || cleanUsername;
                const channelType = (entity as any).broadcast ? "channel" : "group";

                // 2. Check if already exists in DB — if so, just re-activate
                const existing = await prisma.channel.findUnique({
                    where: { telegramId },
                });
                if (existing) {
                    const updated = await prisma.channel.update({
                        where: { id: existing.id },
                        data: { isActive: true, name, username: finalUsername, type: channelType },
                    });
                    await client.disconnect();
                    return NextResponse.json(updated);
                }

                // 3. Join the channel so the account can receive its messages
                //    and so it appears in getDialogs() during sync
                let joinError: string | null = null;
                try {
                    await client.invoke(
                        new Api.channels.JoinChannel({ channel: cleanUsername })
                    );
                    console.log("✅ Joined channel:", cleanUsername);
                } catch (err: any) {
                    // For private groups/channels JoinChannel may fail — that's OK,
                    // we still save it. The monitor worker handles private chats too.
                    joinError = err.message;
                    console.warn("⚠️ Could not join (likely private/supergroup):", err.message);
                }

                // 4. Save to DB
                const channel = await prisma.channel.create({
                    data: {
                        telegramId,
                        username: finalUsername,
                        name,
                        type: channelType,
                        isActive: true,
                    },
                });

                await client.disconnect();
                return NextResponse.json({
                    ...channel,
                    ...(joinError ? { _warning: `Joined with warning: ${joinError}` } : {}),
                });
            } catch (err: any) {
                console.error("TG error:", err.message);
                try { await client.disconnect(); } catch (_) { }
                return NextResponse.json({ error: err.message || "Telegram error" }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    } catch (error: any) {
        console.error("API POST Error:", error);
        return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
    }
}

// DELETE: Remove channel from monitoring list and leave it in Telegram
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const channel = await prisma.channel.findUnique({ where: { id } });
        if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

        // Try to leave the channel in Telegram as well
        if (channel.username && !channel.telegramId.startsWith("pending_")) {
            try {
                const sessionEntry = await prisma.session.findFirst({ where: { isActive: true } });
                if (sessionEntry) {
                    const client = new TelegramClient(
                        new StringSession(sessionEntry.sessionStr),
                        apiId,
                        apiHash,
                        { connectionRetries: 1 }
                    );
                    await client.connect();
                    await client.invoke(
                        new Api.channels.LeaveChannel({ channel: channel.username })
                    );
                    await client.disconnect();
                    console.log("✅ Left channel:", channel.username);
                }
            } catch (err: any) {
                // Not critical — just log it
                console.warn("⚠️ Could not leave channel in TG:", err.message);
            }
        }

        await prisma.channel.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
    }
}
