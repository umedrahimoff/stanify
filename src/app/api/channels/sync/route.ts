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

        // Collect all telegramIds currently in the user's dialogs
        const activeTelegramIds = new Set<string>();
        let upsertCount = 0;

        for (const dialog of dialogs) {
            if ((dialog.isChannel || dialog.isGroup) && dialog.id) {
                const telegramId = dialog.id.toString();
                const title = dialog.title || "Unknown Title";
                const username = (dialog.entity as any)?.username || null;

                activeTelegramIds.add(telegramId);

                await prisma.channel.upsert({
                    where: { telegramId },
                    update: { name: title, username },
                    create: {
                        telegramId,
                        username,
                        name: title,
                        isActive: false,
                    },
                });
                upsertCount++;
            }
        }

        // 4. Find channels in DB that are NO LONGER in user's dialogs
        //    (i.e., user has left/was kicked from them)
        //    Only consider real channels (not pending_ ones added manually)
        const allDbChannels = await prisma.channel.findMany({
            select: { id: true, telegramId: true, name: true },
        });

        const leftChannels = allDbChannels.filter(
            (ch) => !ch.telegramId.startsWith("pending_") && !activeTelegramIds.has(ch.telegramId)
        );

        let removedCount = 0;
        if (leftChannels.length > 0) {
            console.log(`🚪 Removing ${leftChannels.length} channels user has left:`, leftChannels.map((c) => c.name));
            await prisma.channel.deleteMany({
                where: {
                    id: { in: leftChannels.map((c) => c.id) },
                },
            });
            removedCount = leftChannels.length;
        }

        await client.disconnect();
        console.log(`✅ Sync finished. ${upsertCount} upserted, ${removedCount} removed.`);

        return NextResponse.json({
            success: true,
            upserted: upsertCount,
            removed: removedCount,
        });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
