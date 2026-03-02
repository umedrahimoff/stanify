import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";
import { getNotificationRecipients } from "@/lib/settings";
const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

export async function POST() {
    try {
        // 1. Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 2. Save to DB
        await prisma.verificationCode.create({
            data: { code, expiresAt }
        });

        // 3. Get Session
        const session = await prisma.session.findFirst({ where: { isActive: true } });
        if (!session) return NextResponse.json({ error: "No Telegram session active" }, { status: 500 });

        // 4. Send Code via Telegram
        const client = new TelegramClient(new StringSession(session.sessionStr), apiId, apiHash, {
            connectionRetries: 1,
        });

        await client.connect();
        const recipients = await getNotificationRecipients();
        const loginMsg = [
            "🔐 <b>Stanify Login Code</b>",
            "",
            `Your code is: <code>${code}</code>`,
            "",
            "<i>Expires in 5 minutes.</i>",
        ].join("\n");
        for (const r of recipients) {
            try {
                await client.sendMessage(r, { message: loginMsg, parseMode: "html" });
            } catch (e) {
                console.warn(`Failed to send code to @${r}:`, e);
            }
        }
        await client.disconnect();

        const recipientList = recipients.map((r) => "@" + r).join(", ");
        return NextResponse.json({ success: true, message: `Code sent to ${recipientList}` });
    } catch (error: any) {
        console.error("Auth Request Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
