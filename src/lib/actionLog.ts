import { prisma } from "./prisma";

export async function logAction(params: {
    action: string;
    actorId: string;
    actorUsername: string;
    targetType?: string;
    targetId?: string;
    details?: string;
}) {
    try {
        await prisma.actionLog.create({
            data: {
                action: params.action,
                actorId: params.actorId,
                actorUsername: params.actorUsername,
                targetType: params.targetType ?? null,
                targetId: params.targetId ?? null,
                details: params.details ? params.details.slice(0, 500) : null,
            },
        });
    } catch (e) {
        console.warn("Failed to write action log:", e);
    }
}
