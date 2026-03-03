import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const adminUsername = (process.env.ADMIN_USERNAME || "umedrahimoff").trim().replace(/^@/, "").toLowerCase();

    const existing = await prisma.appUser.findUnique({ where: { username: adminUsername } });
    if (existing) {
        console.log(`Admin @${adminUsername} already exists`);
        return;
    }

    await prisma.appUser.create({
        data: { username: adminUsername, role: "admin" },
    });
    console.log(`Created admin @${adminUsername}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
