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

        // Build a map: telegramId → { name, username }
        const dialogMap = new Map<string, { name: string; username: string | null }>();

        for (const dialog of dialogs) {
            if ((dialog.isChannel || dialog.isGroup) && dialog.id) {
                dialogMap.set(dialog.id.toString(), {
                    name: dialog.title || "Unknown",
                    // Only store username if it's non-empty, else null
                    username: (dialog.entity as any)?.username || null,
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
                    // Update name & username in-place
                    await prisma.channel.update({
                        where: { telegramId },
                        data: { name: info.name, username: info.username },
                    });
                } else {
                    // Create only if no other record has the same username (to be safe)
                    const usernameConflict = info.username
                        ? await prisma.channel.findUnique({ where: { username: info.username } })
                        : null;

                    if (usernameConflict) {
                        // If username conflict: update that record's telegramId instead
                        await prisma.channel.update({
                            where: { username: info.username },
                            data: { telegramId, name: info.name },
                        });
                    } else {
                        await prisma.channel.create({
                            data: {
                                telegramId,
                                username: info.username,
                                name: info.name,
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
            (ch) =>
                !ch.telegramId.startsWith("pending_") &&
                !dialogMap.has(ch.telegramId)
        );

        let removedCount = 0;
        if (leftChannels.length > 0) {
            console.log(`🚪 Removing ${leftChannels.length} channels no longer in dialogs`);
            await prisma.channel.deleteMany({
                where: { id: { in: leftChannels.map((c) => c.id) } },
            });
            removedCount = leftChannels.length;
        }

        await client.disconnect();
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
