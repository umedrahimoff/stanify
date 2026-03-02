import { TelegramManager } from "../lib/telegram";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const tg = TelegramManager.getInstance();

async function startMonitoring() {
    console.log("🚀 Starting Stanify Monitor...");

    // 1. Get Session from DB
    const session = await prisma.session.findFirst({
        where: { isActive: true }
    });

    if (!session) {
        console.error("❌ No active Telegram session found. Please login via Dashboard first.");
        return;
    }

    // 2. Initialize Telegram Client
    await tg.initialize(session.sessionStr);
    console.log("✅ Telegram Client Connected");

    // 3. Load Keywords & Channels
    const keywords = await prisma.keyword.findMany({ where: { isActive: true } });
    const keywordList = keywords.map(k => k.text);

    const channels = await prisma.channel.findMany({ where: { isActive: true } });
    console.log(`📡 Monitoring ${channels.length} channels for ${keywordList.length} keywords.`);

    // 4. Setup Listener
    await tg.setupListener(keywordList, async (msg, keyword) => {
        console.log(`🔔 Match found! Keyword: [${keyword}]`);

        // Save Alert to DB
        await prisma.alert.create({
            data: {
                channelName: msg.peerId?.username || "Unknown",
                content: msg.text,
                matchedWord: keyword
            }
        });

        // Optional: Send notification via Bot or Webhook
        // sendNotification(msg, keyword);
    });

    console.log("🟢 Listener active. Waiting for messages...");
}

startMonitoring().catch(console.error);
