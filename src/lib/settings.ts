import { prisma } from "./prisma";

const NOTIFICATION_RECIPIENT_KEY = "notification_recipient";
const DEFAULT_RECIPIENT = "umedrahimoff";

export async function getNotificationRecipient(): Promise<string> {
    const row = await prisma.appSetting.findUnique({ where: { key: NOTIFICATION_RECIPIENT_KEY } });
    return row?.value?.trim().replace(/^@/, "") || DEFAULT_RECIPIENT;
}
