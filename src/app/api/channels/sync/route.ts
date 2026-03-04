import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

export async function POST() {
    try {
        console.log("🔄 Starting Channel Sync via API...");

        // 1. Get Session from DB
        const session = await prisma.session.findFirst({
            where: { isActive: true },
        });

        if (!session) {
            return NextResponse.json({ error: "No active Telegram session found." }, { status: 401 });
        }

        // 2. Initialize Telegram Client
        const client = new TelegramClient(new StringSession(session.sessionStr), apiId, apiHash, {
            connectionRetries: 3,
        });

        await client.connect();

        // 3. Get Dialogs (Groups & Channels) from Telegram
        const dialogs = await client.getDialogs();

        // Build a map: telegramId → { name, username, type }
        const dialogMap = new Map<string, { name: string; username: string | null; type: string }>();

        for (const dialog of dialogs) {
            if ((dialog.isChannel || dialog.isGroup) && dialog.id) {
                const entity = dialog.entity as any;
                const channelType = entity?.broadcast ? "channel" : "group";
                dialogMap.set(dialog.id.toString(), {
                    name: dialog.title || "Unknown",
                    username: entity?.username || null,
                    type: channelType,
                });
            }
        }

        console.log(`📦 Found ${dialogMap.size} channels/groups in Telegram`);

        // 4. Sync each dialog into DB:
        //    - If telegramId exists → update name/username
        //    - If not → create new record (username can be null, no upsert to avoid unique clash)
        let upsertCount = 0;
        for (const [telegramId, info] of dialogMap.entries()) {
            try {
                const existing = await prisma.channel.findUnique({ where: { telegramId } });

                if (existing) {
                    await prisma.channel.update({
                        where: { telegramId },
                        data: { name: info.name, username: info.username, type: info.type },
                    });
                } else {
                    // Create only if no other record has the same username (to be safe)
                    const usernameConflict = info.username
                        ? await prisma.channel.findUnique({ where: { username: info.username } })
                        : null;

                    if (usernameConflict) {
                        await prisma.channel.update({
                            where: { username: info.username! },
                            data: { telegramId, name: info.name, type: info.type },
                        });
                    } else {
                        await prisma.channel.create({
                            data: {
                                telegramId,
                                username: info.username,
                                name: info.name,
                                type: info.type,
                                isActive: false,
                            },
                        });
                    }
                }
                upsertCount++;
            } catch (err: any) {
                // Skip individual failures so one bad entry doesn't abort the whole sync
                console.warn(`⚠️ Skipped channel ${telegramId} (${info.name}):`, err.message);
            }
        }

        // 5. Find DB channels that are no longer in Telegram dialogs
        //    (user has left / been kicked) and remove them.
        //    Skip pending_ records (manually added, not yet synced).
        const allDbChannels = await prisma.channel.findMany({
            select: { id: true, telegramId: true, name: true },
        });

        const leftChannels = allDbChannels.filter(
            (ch: { id: string; telegramId: string; name: string | null }) =>
                !ch.telegramId.startsWith("pending_") &&
                !dialogMap.has(ch.telegramId)
        );

        let removedCount = 0;
        if (leftChannels.length > 0) {
            console.log(`🚪 Removing ${leftChannels.length} channels no longer in dialogs`);
            await prisma.channel.deleteMany({
                where: { id: { in: leftChannels.map((c: { id: string }) => c.id) } },
            });
            removedCount = leftChannels.length;
        }

        await client.disconnect();

        // Backfill lastActivityAt from alerts + channelPosts for channels that have null
        const [byChannelId, byChannelName, postsByChannel] = await Promise.all([
            prisma.alert.groupBy({ by: ["channelId"], where: { channelId: { not: null } }, _max: { createdAt: true } }),
            prisma.alert.groupBy({ by: ["channelName"], _max: { createdAt: true } }),
            prisma.channelPost.groupBy({ by: ["channelId"], _max: { createdAt: true } }),
        ]);
        const activityById = Object.fromEntries(byChannelId.map((a) => [a.channelId!, a._max.createdAt]));
        const activityByName = Object.fromEntries(byChannelName.map((a) => [a.channelName, a._max.createdAt]));
        const postActivityById = Object.fromEntries(postsByChannel.map((p) => [p.channelId, p._max.createdAt]));
        const toUpdate = await prisma.channel.findMany({ where: { lastActivityAt: null }, select: { id: true, username: true, name: true } });
        for (const ch of toUpdate) {
            const fromAlerts = activityById[ch.id] ?? (ch.username && activityByName[ch.username]) ?? (ch.name && activityByName[ch.name]);
            const fromPosts = postActivityById[ch.id];
            const dates = [fromAlerts, fromPosts].filter((d): d is Date => d instanceof Date);
            const at = dates.length ? dates.sort((a, b) => b.getTime() - a.getTime())[0] : null;
            if (at) await prisma.channel.update({ where: { id: ch.id }, data: { lastActivityAt: at } });
        }

        console.log(`✅ Sync done. Updated: ${upsertCount}, Removed: ${removedCount}`);

        return NextResponse.json({
            success: true,
            updated: upsertCount,
            removed: removedCount,
        });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
