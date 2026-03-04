import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TelegramManager } from "@/lib/telegram";
import { getFilteredRecipients } from "@/lib/userRecipients";
import { stripMarkdown } from "@/lib/telegramFormat";
import { translateToRussian } from "@/lib/deepl";
import { logNotification } from "@/lib/notificationLog";

/** POST /api/channels/[id]/backfill — parse old messages for this channel. Body: { dateFrom?, dateTo?, limit?, sendNotifications? } */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const channel = await prisma.channel.findUnique({
        where: { id },
        include: { keywords: { where: { isActive: true } } },
    });
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const entity = channel.username ?? (channel.telegramId && !channel.telegramId.startsWith("pending_") ? parseInt(channel.telegramId, 10) : null);
    if (!entity) return NextResponse.json({ error: "Channel has no username or telegramId" }, { status: 400 });

    let body: { dateFrom?: string; dateTo?: string; limit?: number; sendNotifications?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const limit = typeof body.limit === "number" ? Math.min(Math.max(1, body.limit), 5000) : null;
    const dateFrom = body.dateFrom ? new Date(body.dateFrom) : null;
    const dateTo = body.dateTo ? new Date(body.dateTo) : null;
    const sendNotifications = !!body.sendNotifications;

    const useDateRange = dateFrom && dateTo && !isNaN(dateFrom.getTime()) && !isNaN(dateTo.getTime()) && dateFrom < dateTo;
    const useLimit = limit !== null;

    if (!useDateRange && !useLimit) {
        return NextResponse.json({ error: "Provide dateFrom+dateTo or limit (number of messages)" }, { status: 400 });
    }

    const session = await prisma.session.findFirst({ where: { isActive: true } });
    if (!session) return NextResponse.json({ error: "No active Telegram session" }, { status: 400 });

    const tg = TelegramManager.getInstance();
    await tg.initialize(session.sessionStr);

    const globalKeywords = await prisma.globalKeyword.findMany({ where: { isActive: true } });
    const channelName = channel.name ?? channel.username ?? "Private/Group";

    let totalScanned = 0;
    let totalMatches = 0;
    let offsetDate: Date | undefined = useDateRange ? new Date(dateTo!.getTime()) : undefined;
    let remainingLimit = useLimit ? limit! : Infinity;
    let done = false;

    while (!done && remainingLimit > 0) {
        try {
            const fetchLimit = Math.min(100, remainingLimit);
            const messages = await tg.getMessages(entity, {
                offsetDate,
                limit: useDateRange ? 100 : fetchLimit,
            });

            if (!messages || messages.length === 0) break;

            for (const msg of messages) {
                const m = msg as { date?: Date | number; message?: string; text?: string; id?: number };
                const msgDate = m.date instanceof Date ? m.date : new Date((m.date ?? 0) * 1000);

                if (useDateRange && msgDate < dateFrom!) {
                    done = true;
                    break;
                }
                if (useDateRange && msgDate > dateTo!) continue;

                const content = m.message ?? m.text ?? "";
                if (!content || typeof content !== "string") continue;

                totalScanned++;
                if (useLimit && totalScanned > limit!) break;

                const contentLower = content.toLowerCase();

                for (const kw of channel.keywords.map((k) => k.text)) {
                    if (contentLower.includes(kw.toLowerCase())) {
                        totalMatches++;
                        const postLink = channel.username
                            ? `https://t.me/${channel.username}/${m.id}`
                            : `https://t.me/c/${channel.telegramId?.replace(/^-100/, "")}/${m.id}`;

                        const alert = await prisma.alert.create({
                            data: {
                                channelName,
                                channelId: channel.id,
                                content,
                                matchedWord: kw,
                                postLink,
                                source: "channel",
                            },
                        });

                        if (sendNotifications) {
                            const recipients = await getFilteredRecipients({
                                channelId: channel.id,
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
                        const postLink = channel.username
                            ? `https://t.me/${channel.username}/${m.id}`
                            : `https://t.me/c/${channel.telegramId?.replace(/^-100/, "")}/${m.id}`;

                        const globalAlert = await prisma.alert.create({
                            data: {
                                channelName,
                                channelId: channel.id,
                                content,
                                matchedWord: gk.text,
                                postLink,
                                source: "global",
                                globalKeywordId: gk.id,
                            },
                        });

                        if (sendNotifications) {
                            const recipients = await getFilteredRecipients({
                                channelId: channel.id,
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
            if (useLimit && totalScanned >= limit!) break;
            if (messages.length < 100) break;

            const lastMsg = messages[messages.length - 1] as { date?: Date | number };
            const lastDate = lastMsg.date instanceof Date ? lastMsg.date : new Date((lastMsg.date ?? 0) * 1000);
            offsetDate = lastDate;
            remainingLimit -= messages.length;
        } catch (e: any) {
            console.error("Backfill error for", channel.username ?? channel.id, e);
            break;
        }
    }

    return NextResponse.json({
        success: true,
        totalScanned,
        totalMatches,
        channelId: channel.id,
        sendNotifications,
    });
}
