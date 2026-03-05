import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/actionLog";

const NOTIFICATION_RECIPIENT_KEY = "notification_recipient";
const PARSER_ENABLED_KEY = "parser_enabled";
const DEFAULT_RECIPIENT = "umedrahimoff";

async function getParserEnabled(): Promise<boolean> {
    const row = await prisma.appSetting.findUnique({ where: { key: PARSER_ENABLED_KEY } });
    return row?.value !== "false";
}

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
        const parserEnabled = await getParserEnabled();
        return NextResponse.json({ notificationRecipients: recipients, parserEnabled });
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
        if (typeof body.parserEnabled === "boolean") {
            await prisma.appSetting.upsert({
                where: { key: PARSER_ENABLED_KEY },
                create: { key: PARSER_ENABLED_KEY, value: body.parserEnabled ? "true" : "false" },
                update: { value: body.parserEnabled ? "true" : "false" },
            });
        }
        const parserEnabled = await getParserEnabled();
        await logAction({ action: "settings_change", actorId: admin.id, actorUsername: admin.username, targetType: "settings", details: `parser=${parserEnabled} recipients=${value.split(",").length}` });
        return NextResponse.json({ success: true, notificationRecipients: value.split(","), parserEnabled });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
