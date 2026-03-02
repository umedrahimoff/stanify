import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_RECIPIENT_KEY = "notification_recipient";
const DEFAULT_RECIPIENT = "umedrahimoff";

async function getSetting(key: string): Promise<string> {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? (key === NOTIFICATION_RECIPIENT_KEY ? DEFAULT_RECIPIENT : "");
}

export async function GET() {
    try {
        const notificationRecipient = await getSetting(NOTIFICATION_RECIPIENT_KEY);
        return NextResponse.json({ notificationRecipient });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { notificationRecipient } = body;
        if (typeof notificationRecipient !== "string") {
            return NextResponse.json({ error: "notificationRecipient is required" }, { status: 400 });
        }
        const value = notificationRecipient.trim().replace(/^@/, "") || DEFAULT_RECIPIENT;
        await prisma.appSetting.upsert({
            where: { key: NOTIFICATION_RECIPIENT_KEY },
            create: { key: NOTIFICATION_RECIPIENT_KEY, value },
            update: { value },
        });
        return NextResponse.json({ success: true, notificationRecipient: value });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
