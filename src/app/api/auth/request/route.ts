import { NextResponse } from "next/server";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { prisma } from "@/lib/prisma";
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
        await client.sendMessage("umedrahimoff", {
            message: `🔐 *Stanify Login Code:*\n\nYour code is: \`${code}\`\n\n_Expires in 5 minutes._`
        });
        await client.disconnect();

        return NextResponse.json({ success: true, message: "Code sent to @umedrahimoff" });
    } catch (error: any) {
        console.error("Auth Request Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
