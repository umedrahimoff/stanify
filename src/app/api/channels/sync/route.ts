import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const prisma = new PrismaClient();
const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

export async function POST() {
    try {
        console.log("🔄 Starting Channel Sync via API...");

        // 1. Get Session from DB
        const session = await prisma.session.findFirst({
            where: { isActive: true }
        });

        if (!session) {
            return NextResponse.json({ error: "No active Telegram session found." }, { status: 401 });
        }

        // 2. Initialize Telegram Client
        const client = new TelegramClient(new StringSession(session.sessionStr), apiId, apiHash, {
            connectionRetries: 3,
        });

        await client.connect();

        // 3. Get Dialogs (Groups & Channels)
        const dialogs = await client.getDialogs();
        let count = 0;

        for (const dialog of dialogs) {
            if ((dialog.isChannel || dialog.isGroup) && dialog.id) {
                const title = dialog.title || "Unknown Title";
                const telegramId = dialog.id.toString();
                const username = (dialog.entity as any)?.username || null;

                await prisma.channel.upsert({
                    where: { telegramId: telegramId },
                    update: {
                        name: title,
                        username: username
                    },
                    create: {
                        name: title,
                        username: username,
                        telegramId: telegramId,
                        isActive: false
                    }
                });
                count++;
            }
        }

        await client.disconnect();
        console.log(`✅ Sync finished. ${count} channels updated.`);

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
