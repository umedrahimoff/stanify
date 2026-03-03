import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const NOTIFICATION_RECIPIENT_KEY = "notification_recipient";
const DEFAULT_RECIPIENT = "umedrahimoff";

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const row = await prisma.appSetting.findUnique({ where: { key: NOTIFICATION_RECIPIENT_KEY } });
        const value = row?.value ?? DEFAULT_RECIPIENT;
        const recipients = value
            .split(",")
            .map((s) => s.trim().replace(/^@/, ""))
            .filter(Boolean);
        return NextResponse.json({ notificationRecipients: recipients });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const recipients = body.notificationRecipients;
        const arr = Array.isArray(recipients)
            ? recipients
            : typeof recipients === "string"
                ? recipients.split(",").map((s: string) => s.trim().replace(/^@/, "")).filter(Boolean)
                : [];
        const value = arr.length > 0 ? arr.join(",") : DEFAULT_RECIPIENT;
        await prisma.appSetting.upsert({
            where: { key: NOTIFICATION_RECIPIENT_KEY },
            create: { key: NOTIFICATION_RECIPIENT_KEY, value },
            update: { value },
        });
        return NextResponse.json({ success: true, notificationRecipients: value.split(",") });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
