import { prisma } from "./prisma";

export interface RecipientFilter {
    channelId: string | null;
    channelName: string;
    matchedKeyword: string;
}

/**
 * Returns usernames of active AppUsers who should receive this alert.
 * - Only users in the list (AppUser, isActive) can receive
 * - If user has UserChannels: only receive from those channels
 * - If user has UserKeywords: only receive when matchedKeyword in their list
 * - Empty preferences = receive all
 */
export async function getFilteredRecipients(filter: RecipientFilter): Promise<string[]> {
    const users = await prisma.appUser.findMany({
        where: { isActive: true },
        include: {
            userChannels: { select: { channelId: true } },
            userKeywords: { select: { keyword: true } },
        },
    });

    const kwLower = filter.matchedKeyword.toLowerCase();

    return users
        .filter((u) => {
            const hasChannels = u.userChannels.length > 0;
            const hasKeywords = u.userKeywords.length > 0;

            if (hasChannels && filter.channelId) {
                const allowed = u.userChannels.some((uc) => uc.channelId === filter.channelId);
                if (!allowed) return false;
            }

            if (hasKeywords) {
                const allowed = u.userKeywords.some((uk) => uk.keyword.toLowerCase() === kwLower);
                if (!allowed) return false;
            }

            return true;
        })
        .map((u) => u.username.toLowerCase());
}
