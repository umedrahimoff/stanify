const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

dotenv.config();

const prisma = new PrismaClient();

const apiId = 36224229;
const apiHash = "e719d6f1fab9fedd3d7b2f09f08c508c";

async function syncChannels() {
    console.log("🔄 Fetching your Telegram channels and groups...");

    const session = await prisma.session.findFirst({
        where: { isActive: true }
    });

    if (!session) {
        console.error("❌ No active session found. Please authenticate first.");
        process.exit(1);
    }

    const client = new TelegramClient(new StringSession(session.sessionStr), apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.connect();
    console.log("✅ Managed to connect to Telegram.");

    try {
        const dialogs = await client.getDialogs();
        console.log(`📦 Found ${dialogs.length} total dialogs.`);

        let count = 0;
        for (const dialog of dialogs) {
            if (dialog.isChannel || dialog.isGroup) {
                const title = dialog.title || "Unknown Title";
                const telegramId = dialog.id.toString();
                const username = dialog.entity?.username || null;

                await prisma.channel.upsert({
                    where: { telegramId: telegramId },
                    update: {
                        name: title,
                        username: username
                    },
                    create: {
                        name: title,
                        username: username,
                        telegramId: telegramId,
                        isActive: false // Default to false, user will enable in dashboard
                    }
                });
                count++;
            }
        }

        console.log(`✅ Successfully synced ${count} channels/groups to the database!`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Sync failed:", error.message);
        process.exit(1);
    }
}

syncChannels();
