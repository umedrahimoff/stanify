import dotenv from "dotenv";
dotenv.config();
import { TelegramManager } from "../lib/telegram";
import { getNotificationRecipients } from "../lib/settings";
import { messageToHtml } from "../lib/telegramFormat";
import { PrismaClient } from "@prisma/client";
import { utils } from "telegram";

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

    // 3. Load Channels with their Keywords
    const channels = await prisma.channel.findMany({
        where: { isActive: true },
        include: { keywords: { where: { isActive: true } } },
    });

    const channelMapByUsername = new Map<string, { id: string; keywords: string[] }>();
    const channelMapByTelegramId = new Map<string, { id: string; keywords: string[] }>();
    for (const ch of channels) {
        const kw = ch.keywords.map((k: { text: string }) => k.text);
        if (ch.username) channelMapByUsername.set(ch.username.toLowerCase(), { id: ch.id, keywords: kw });
        channelMapByTelegramId.set(ch.telegramId, { id: ch.id, keywords: kw });
        const rawId = ch.telegramId.replace(/^-100/, "");
        if (rawId !== ch.telegramId) channelMapByTelegramId.set(rawId, { id: ch.id, keywords: kw });
        channelMapByTelegramId.set("-100" + rawId, { id: ch.id, keywords: kw });
    }
    const totalKeywords = channels.reduce((s, c) => s + c.keywords.length, 0);
    const channelsWithKeywords = channels.filter((c) => c.keywords.length > 0);
    const chatIdsForListener: (string | number)[] = [];
    for (const ch of channels) {
        if (ch.username) chatIdsForListener.push(ch.username);
        else if (ch.telegramId && !ch.telegramId.startsWith("pending_")) {
            const num = parseInt(ch.telegramId, 10);
            if (!isNaN(num)) chatIdsForListener.push(num);
        }
    }
    console.log(`📡 Monitoring ${channels.length} channels, ${totalKeywords} keywords total.`);
    if (channelsWithKeywords.length === 0) {
        console.warn("⚠️ No channels have keywords! Add keywords to channels in the dashboard.");
    } else {
        console.log(`   Channels with keywords: ${channelsWithKeywords.map((c) => c.name || c.username || c.id).join(", ")}`);
    }
    if (chatIdsForListener.length > 0) {
        console.log(`   Listening to chats: ${chatIdsForListener.slice(0, 5).join(", ")}${chatIdsForListener.length > 5 ? "..." : ""}`);
    }

    const getKeywordsForMessage = (msg: any): string[] => {
        const peer = msg.peerId || {};
        const username = (peer.username || "").toLowerCase();
        let entry = username ? channelMapByUsername.get(username) : null;
        if (!entry && peer) {
            try {
                const fullId = utils.getPeerId(peer);
                const raw = String(fullId).replace(/^-100/, "");
                entry = channelMapByTelegramId.get(String(fullId))
                    || channelMapByTelegramId.get(raw)
                    || channelMapByTelegramId.get("-100" + raw);
            } catch (_) {
                const chatId = msg.chatId?.toString?.() || peer.channelId?.toString?.() || peer.chatId?.toString?.();
                if (chatId) {
                    const raw = chatId.replace(/^-100/, "");
                    entry = channelMapByTelegramId.get(chatId)
                        || channelMapByTelegramId.get(raw)
                        || channelMapByTelegramId.get("-100" + raw);
                }
            }
        }
        return entry?.keywords ?? [];
    };

    const recordScan = () => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        prisma.dailyScanStats.upsert({
            where: { date: today },
            create: { date: today, count: 1 },
            update: { count: { increment: 1 } },
        }).catch((e) => console.warn("Failed to record scan:", e.message));
    };

    // 4. Setup Listener
    await tg.setupListener(getKeywordsForMessage, async (msg, keyword) => {
        const peer = msg.peerId || {};
        let channelName = peer.username || "Private/Group";
        let channelIdForLink: string | null = null;

        if (!peer.username && peer.channelId) {
            const entity = await tg.getEntityByPeer(msg.peerId);
            if (entity && (entity as any).username) channelName = (entity as any).username;
            else if (entity && (entity as any).title) channelName = (entity as any).title;
            channelIdForLink = peer.channelId.toString().replace(/^-100/, "");
        }

        console.log(`🔔 Match found in ${channelName}! Keyword: [${keyword}]`);

        let postLink = "";
        const messageId = msg.id;
        if (peer.username) {
            postLink = `https://t.me/${peer.username}/${messageId}`;
        } else if (channelIdForLink) {
            postLink = `https://t.me/c/${channelIdForLink}/${messageId}`;
        }

        const channel = await prisma.channel.findFirst({
            where: {
                isActive: true,
                OR: [
                    { username: channelName },
                    { telegramId: peer.channelId?.toString() },
                    { telegramId: "-100" + (peer.channelId?.toString() || "").replace(/^-100/, "") },
                ],
            },
        });

        if (!channel) {
            console.log(`⏭️ Skipping match from unsubscribed/paused channel: ${channelName}`);
            return;
        }

        // Save Alert to DB (linked to channel when found)
        const content = msg.text ?? msg.message ?? "";
        await prisma.alert.create({
            data: {
                channelName: channelName,
                channelId: channel?.id ?? null,
                content,
                matchedWord: keyword,
                postLink: postLink
            }
        });

        const recipients = await getNotificationRecipients();
        const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const contentFormatted = messageToHtml(content, (msg as any).entities);
        const contentPreview = contentFormatted.length > 400 ? contentFormatted.slice(0, 400) + "…" : contentFormatted;
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
        for (const r of recipients) {
            try {
                await tg.sendMessage(r, notificationText);
            } catch (e) {
                console.warn(`Failed to send to @${r}:`, e);
            }
        }
        console.log(`🚀 Alert sent to ${recipients.map((r) => "@" + r).join(", ")}`);
    }, recordScan, chatIdsForListener.length > 0 ? chatIdsForListener : undefined);

    tg.startReconnectInterval?.();

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
