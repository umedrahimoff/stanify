import { prisma } from "./prisma";

/** Returns usernames of active AppUsers — only users in the list can receive alerts */
export async function getNotificationRecipients(): Promise<string[]> {
    const users = await prisma.appUser.findMany({
        where: { isActive: true },
        select: { username: true },
    });
    return users.map((u) => u.username.toLowerCase());
}

/** @deprecated Kept for backward compat when adding user. Recipients now come from AppUser only. */
export async function addNotificationRecipient(_username: string): Promise<void> {
    // No-op: recipients are managed via Users list only
}
