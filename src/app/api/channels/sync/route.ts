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

        // Map of telegramId -> { name, username } for all current dialogs
        const dialogMap = new Map<string, { name: string; username: string | null }>();

        for (const dialog of dialogs) {
            if ((dialog.isChannel || dialog.isGroup) && dialog.id) {
                dialogMap.set(dialog.id.toString(), {
                    name: dialog.title || "Unknown Title",
                    username: (dialog.entity as any)?.username || null,
                });
            }
        }

        console.log(`📦 Found ${dialogMap.size} channels/groups in Telegram dialogs`);

        // 4. Upsert all dialogs into DB (update name/username, create if new)
        let upsertCount = 0;
        for (const [telegramId, info] of dialogMap.entries()) {
            await prisma.channel.upsert({
                where: { telegramId },
                update: { name: info.name, username: info.username },
                create: {
                    telegramId,
                    username: info.username,
                    name: info.name,
                    isActive: false,
                },
            });
            upsertCount++;
        }

        // 5. Find DB channels that are NOT in current dialogs
        //    → user has left / been kicked from them
        //    Only process real channels (not pending_ ones)
        const allDbChannels = await prisma.channel.findMany({
            select: { id: true, telegramId: true, name: true, isActive: true },
        });

        const leftChannels = allDbChannels.filter(
            (ch) =>
                !ch.telegramId.startsWith("pending_") &&
                !dialogMap.has(ch.telegramId)
        );

        let removedCount = 0;
        if (leftChannels.length > 0) {
            console.log(
                `🚪 Channels no longer in dialogs (removing): `,
                leftChannels.map((c) => c.name)
            );
            await prisma.channel.deleteMany({
                where: { id: { in: leftChannels.map((c) => c.id) } },
            });
            removedCount = leftChannels.length;
        }

        await client.disconnect();
        console.log(`✅ Sync done. Upserted: ${upsertCount}, Removed: ${removedCount}`);

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
