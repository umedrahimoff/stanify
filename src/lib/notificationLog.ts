import { prisma } from "./prisma";

export async function logNotification(params: {
    type: "channel" | "global";
    keyword: string;
    sourceChannel: string;
    recipient: string;
    success: boolean;
    errorMessage?: string | null;
    alertId?: string | null;
    contentPreview?: string | null;
    postLink?: string | null;
}) {
    try {
        await prisma.notificationLog.create({
            data: {
                type: params.type,
                keyword: params.keyword,
                sourceChannel: params.sourceChannel,
                recipient: params.recipient,
                success: params.success,
                errorMessage: params.errorMessage ?? null,
                alertId: params.alertId ?? null,
                contentPreview: params.contentPreview ? params.contentPreview.slice(0, 500) : null,
                postLink: params.postLink ?? null,
            },
        });
    } catch (e) {
        console.warn("Failed to write notification log:", e);
    }
}
