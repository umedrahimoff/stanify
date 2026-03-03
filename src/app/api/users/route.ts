import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { addNotificationRecipient } from "@/lib/settings";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await prisma.appUser.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
}

export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const username = String(body?.username ?? "").trim().replace(/^@/, "").toLowerCase();
    if (!username) return NextResponse.json({ error: "Username is required" }, { status: 400 });

    const existing = await prisma.appUser.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const user = await prisma.appUser.create({
        data: { username, role: "moderator" },
    });
    await addNotificationRecipient(username);
    return NextResponse.json(user);
}

export async function DELETE(req: Request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "User id is required" }, { status: 400 });

    const user = await prisma.appUser.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });

    await prisma.appUser.update({
        where: { id },
        data: { isActive: false },
    });
    return NextResponse.json({ success: true });
}
