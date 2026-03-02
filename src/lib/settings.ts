import { prisma } from "./prisma";

const NOTIFICATION_RECIPIENT_KEY = "notification_recipient";
const DEFAULT_RECIPIENT = "umedrahimoff";

function parseRecipients(value: string): string[] {
    if (!value?.trim()) return [DEFAULT_RECIPIENT];
    return value
        .split(",")
        .map((s) => s.trim().replace(/^@/, ""))
        .filter(Boolean);
}

export async function getNotificationRecipients(): Promise<string[]> {
    const row = await prisma.appSetting.findUnique({ where: { key: NOTIFICATION_RECIPIENT_KEY } });
    return parseRecipients(row?.value ?? DEFAULT_RECIPIENT);
}
