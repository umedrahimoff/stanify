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

        // Find channel to link (by username)
        const channel = channelName !== "Private/Group"
            ? await prisma.channel.findFirst({ where: { username: channelName } })
            : null;

        // Save Alert to DB (linked to channel when found)
        await prisma.alert.create({
            data: {
                channelName: channelName,
                channelId: channel?.id ?? null,
                content: msg.text,
                matchedWord: keyword,
                postLink: postLink
            }
        });

        // Send Notification to @umedrahimoff (HTML format, escaped)
        const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const content = esc(msg.text ?? "");
        const contentPreview = content.length > 400 ? content.slice(0, 400) + "…" : content;
        const linkHtml = postLink ? `<a href="${esc(postLink)}">Open post</a>` : "Private";
        const notificationText = [
            "🔔 <b>Stanify Alert</b>",
            "",
            `📍 <b>Source:</b> ${esc(channelName)}`,
            `🔑 <b>Keyword:</b> ${esc(keyword)}`,
            "",
            `📝 <b>Content:</b>`,
            contentPreview,
            "",
            `🔗 ${linkHtml}`,
        ].join("\n");
        await tg.sendMessage("umedrahimoff", notificationText);
        console.log(`🚀 Alert with link sent to @umedrahimoff`);
    });

    console.log("🟢 Listener active. Waiting for messages...");
}

async function cleanupOldAlerts() {
    console.log("🧹 Running database cleanup...");
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

    try {
        const deleted = await prisma.alert.deleteMany({
            where: {
                createdAt: {
                    lt: threeMonthsAgo
                }
            }
        });
        console.log(`✅ Cleanup finished: Deleted ${deleted.count} old alerts.`);
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
    }
}

// Run cleanup every 24 hours
setInterval(cleanupOldAlerts, 24 * 60 * 60 * 1000);
// Also run once on startup
cleanupOldAlerts();

startMonitoring().catch(console.error);
