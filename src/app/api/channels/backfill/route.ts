import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TelegramManager } from "@/lib/telegram";
import { getFilteredRecipients } from "@/lib/userRecipients";
import { stripMarkdown } from "@/lib/telegramFormat";
import { translateToRussian } from "@/lib/deepl";
import { logNotification } from "@/lib/notificationLog";

/** POST /api/channels/backfill — parse old messages for date range. Body: { dateFrom, dateTo, sendNotifications?: boolean } */
export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body: { dateFrom?: string; dateTo?: string; sendNotifications?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const dateFrom = body.dateFrom ? new Date(body.dateFrom) : null;
    const dateTo = body.dateTo ? new Date(body.dateTo) : null;
    const sendNotifications = !!body.sendNotifications;

    if (!dateFrom || !dateTo || isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
        return NextResponse.json({ error: "dateFrom and dateTo required (ISO format)" }, { status: 400 });
    }
    if (dateFrom >= dateTo) {
        return NextResponse.json({ error: "dateFrom must be before dateTo" }, { status: 400 });
    }

    const session = await prisma.session.findFirst({ where: { isActive: true } });
    if (!session) return NextResponse.json({ error: "No active Telegram session" }, { status: 400 });

    const tg = TelegramManager.getInstance();
    await tg.initialize(session.sessionStr);

    const channels = await prisma.channel.findMany({
        where: { isActive: true },
        include: { keywords: { where: { isActive: true } } },
    });
    const globalKeywords = await prisma.globalKeyword.findMany({
        where: { isActive: true },
    });

    let totalScanned = 0;
    let totalMatches = 0;

    for (const ch of channels) {
        const entity = ch.username ?? (ch.telegramId && !ch.telegramId.startsWith("pending_") ? parseInt(ch.telegramId, 10) : null);
        if (!entity) continue;

        let offsetDate: Date | undefined = new Date(dateTo.getTime());
        let done = false;

        while (!done) {
            try {
                const messages = await tg.getMessages(entity, {
                    offsetDate,
                    limit: 100,
                });

                if (!messages || messages.length === 0) break;

                for (const msg of messages) {
                    const m = msg as { date?: Date | number };
                    const msgDate = m.date instanceof Date ? m.date : new Date((m.date ?? 0) * 1000);
                    if (msgDate < dateFrom) {
                        done = true;
                        break;
                    }
                    if (msgDate > dateTo) continue;

                    const content = (msg as any).message ?? (msg as any).text ?? "";
                    if (!content || typeof content !== "string") continue;

                    totalScanned++;
                    const contentLower = content.toLowerCase();

                    for (const kw of ch.keywords.map((k) => k.text)) {
                        if (contentLower.includes(kw.toLowerCase())) {
                            totalMatches++;
                            const channelName = ch.name ?? ch.username ?? "Private/Group";
                            let postLink = ch.username
                                ? `https://t.me/${ch.username}/${(msg as any).id}`
                                : `https://t.me/c/${ch.telegramId?.replace(/^-100/, "")}/${(msg as any).id}`;

                            const alert = await prisma.alert.create({
                                data: {
                                    channelName,
                                    channelId: ch.id,
                                    content,
                                    matchedWord: kw,
                                    postLink,
                                    source: "channel",
                                },
                            });

                            if (sendNotifications) {
                                const recipients = await getFilteredRecipients({
                                    channelId: ch.id,
                                    channelName,
                                    matchedKeyword: kw,
                                });
                                const contentPlain = stripMarkdown(content);
                                const contentPreview = contentPlain.length > 400 ? contentPlain.slice(0, 400) + "…" : contentPlain;
                                const contentTranslated = await translateToRussian(contentPreview);
                                const notificationText = [
                                    "🔔 Stanify Backfill Alert",
                                    "",
                                    `📍 Source: ${channelName}`,
                                    `🔑 Keyword: ${kw}`,
                                    "",
                                    "📝 Content:",
                                    contentTranslated,
                                    "",
                                    postLink ? `🔗 Open post: ${postLink}` : "🔗 Private",
                                ].join("\n");
                                for (const r of recipients) {
                                    try {
                                        await tg.sendMessage(r, notificationText);
                                        await logNotification({
                                            type: "channel",
                                            keyword: kw,
                                            sourceChannel: channelName,
                                            recipient: r,
                                            success: true,
                                            alertId: alert.id,
                                            contentPreview: contentTranslated,
                                            postLink,
                                        });
                                    } catch (e: any) {
                                        await logNotification({
                                            type: "channel",
                                            keyword: kw,
                                            sourceChannel: channelName,
                                            recipient: r,
                                            success: false,
                                            errorMessage: e?.message ?? String(e),
                                            alertId: alert.id,
                                            contentPreview: contentTranslated,
                                            postLink,
                                        });
                                    }
                                }
                            }
                            break;
                        }
                    }

                    for (const gk of globalKeywords) {
                        if (contentLower.includes(gk.text.toLowerCase())) {
                            totalMatches++;
                            const channelName = ch.name ?? ch.username ?? "Private/Group";
                            let postLink = ch.username
                                ? `https://t.me/${ch.username}/${(msg as any).id}`
                                : `https://t.me/c/${ch.telegramId?.replace(/^-100/, "")}/${(msg as any).id}`;

                            const globalAlert = await prisma.alert.create({
                                data: {
                                    channelName,
                                    channelId: ch.id,
                                    content,
                                    matchedWord: gk.text,
                                    postLink,
                                    source: "global",
                                    globalKeywordId: gk.id,
                                },
                            });

                            if (sendNotifications) {
                                const recipients = await getFilteredRecipients({
                                    channelId: ch.id,
                                    channelName,
                                    matchedKeyword: gk.text,
                                });
                                const contentPlain = stripMarkdown(content);
                                const contentPreview = contentPlain.length > 400 ? contentPlain.slice(0, 400) + "…" : contentPlain;
                                const contentTranslated = await translateToRussian(contentPreview);
                                const notificationText = [
                                    "🔔 Stanify Global Backfill Alert",
                                    "",
                                    `📍 Source: ${channelName}`,
                                    `🔑 Keyword: ${gk.text}`,
                                    "",
                                    "📝 Content:",
                                    contentTranslated,
                                    "",
                                    postLink ? `🔗 Open post: ${postLink}` : "🔗 Private",
                                ].join("\n");
                                for (const r of recipients) {
                                    try {
                                        await tg.sendMessage(r, notificationText);
                                        await logNotification({
                                            type: "global",
                                            keyword: gk.text,
                                            sourceChannel: channelName,
                                            recipient: r,
                                            success: true,
                                            alertId: globalAlert.id,
                                            contentPreview: contentTranslated,
                                            postLink,
                                        });
                                    } catch (e: any) {
                                        await logNotification({
                                            type: "global",
                                            keyword: gk.text,
                                            sourceChannel: channelName,
                                            recipient: r,
                                            success: false,
                                            errorMessage: e?.message ?? String(e),
                                            alertId: globalAlert.id,
                                            contentPreview: contentTranslated,
                                            postLink,
                                        });
                                    }
                                }
                            }
                            break;
                        }
                    }
                }

                if (done) break;
                const lastMsg = messages[messages.length - 1] as { date?: Date | number };
                const lastDate = lastMsg.date instanceof Date ? lastMsg.date : new Date((lastMsg.date ?? 0) * 1000);
                if (lastDate < dateFrom || messages.length < 100) break;
                offsetDate = lastDate;
            } catch (e: any) {
                console.error("Backfill error for", ch.username ?? ch.id, e);
                break;
            }
        }
    }

    return NextResponse.json({
        success: true,
        totalScanned,
        totalMatches,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        sendNotifications,
    });
}
