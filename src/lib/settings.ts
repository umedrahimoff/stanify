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

export async function addNotificationRecipient(username: string): Promise<void> {
    const u = String(username ?? "").trim().replace(/^@/, "").toLowerCase();
    if (!u) return;
    const current = await getNotificationRecipients();
    if (current.includes(u)) return;
    const value = [...current, u].join(",");
    await prisma.appSetting.upsert({
        where: { key: NOTIFICATION_RECIPIENT_KEY },
        create: { key: NOTIFICATION_RECIPIENT_KEY, value },
        update: { value },
    });
}
