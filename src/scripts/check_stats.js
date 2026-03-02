const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
    const keywords = await prisma.channelKeyword.count();
    const channels = await prisma.channel.count();
    console.log("-----------------------------------------");
    console.log(`🔑 Channel keywords: ${keywords}`);
    console.log(`📺 Channels: ${channels}`);
    console.log("-----------------------------------------");
    process.exit(0);
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
