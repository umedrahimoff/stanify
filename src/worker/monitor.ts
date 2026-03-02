import dotenv from "dotenv";
dotenv.config();
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
    const keywordList = keywords.map((k: any) => k.text);

    const channels = await prisma.channel.findMany({ where: { isActive: true } });
    console.log(`📡 Monitoring ${channels.length} channels for ${keywordList.length} keywords.`);

    // 4. Setup Listener
    await tg.setupListener(keywordList, async (msg, keyword) => {
        const channelName = msg.peerId?.username || "Private/Group";
        console.log(`🔔 Match found in ${channelName}! Keyword: [${keyword}]`);

        // Calculate Post Link
        let postLink = "";
        const messageId = msg.id;

        if (msg.peerId?.username) {
            postLink = `https://t.me/${msg.peerId.username}/${messageId}`;
        } else if (msg.peerId?.channelId) {
            const rawId = msg.peerId.channelId.toString().replace("-100", "");
            postLink = `https://t.me/c/${rawId}/${messageId}`;
        }

        // Save Alert to DB
        await prisma.alert.create({
            data: {
                channelName: channelName,
                content: msg.text,
                matchedWord: keyword,
                postLink: postLink
            }
        });

        // Send Notification to @umedrahimoff
        const notificationText = `🔔 *Stanify Alert!*\n\n📍 *Source:* ${channelName}\n🔑 *Keyword:* #${keyword}\n\n📝 *Content:* ${msg.text}\n\n🔗 *Link:* ${postLink || "Private"}`;
        await tg.sendMessage("umedrahimoff", notificationText);
        console.log(`🚀 Alert with link sent to @umedrahimoff`);
    });

    console.log("🟢 Listener active. Waiting for messages...");
}

startMonitoring().catch(console.error);
