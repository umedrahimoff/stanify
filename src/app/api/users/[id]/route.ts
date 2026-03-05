import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAction } from "@/lib/actionLog";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const user = await prisma.appUser.findUnique({
        where: { id },
        include: {
            userChannels: { include: { channel: { select: { id: true, username: true, name: true } } } },
            userKeywords: { select: { id: true, keyword: true } },
        },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
        ...user,
        channels: user.userChannels.map((uc) => ({ id: uc.channel.id, username: uc.channel.username, name: uc.channel.name })),
        keywords: user.userKeywords.map((uk) => ({ id: uk.id, keyword: uk.keyword })),
    });
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const user = await prisma.appUser.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ error: "Cannot modify admin" }, { status: 400 });

    const body = await req.json();

    const updates: { isActive?: boolean; canAccessAdmin?: boolean } = {};
    if (typeof body?.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body?.canAccessAdmin === "boolean") updates.canAccessAdmin = body.canAccessAdmin;
    if (Object.keys(updates).length > 0) {
        await prisma.appUser.update({ where: { id }, data: updates });
        await logAction({ action: "user_edit", actorId: admin.id, actorUsername: admin.username, targetType: "user", targetId: id, details: `@${user.username} ${JSON.stringify(updates)}` });
    }

    let edited = false;
    if (Array.isArray(body?.channelIds)) {
        await prisma.userChannel.deleteMany({ where: { userId: id } });
        const validIds = body.channelIds.filter((c: unknown) => typeof c === "string");
        if (validIds.length > 0) {
            await prisma.userChannel.createMany({
                data: validIds.map((channelId: string) => ({ userId: id, channelId })),
                skipDuplicates: true,
            });
        }
        edited = true;
    }

    if (Array.isArray(body?.keywords)) {
        await prisma.userKeyword.deleteMany({ where: { userId: id } });
        const validKeywords = (body.keywords as unknown[])
            .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
            .map((k) => k.trim().toLowerCase());
        const unique = [...new Set(validKeywords)] as string[];
        if (unique.length > 0) {
            await prisma.userKeyword.createMany({
                data: unique.map((keyword) => ({ userId: id, keyword })),
                skipDuplicates: true,
            });
        }
        edited = true;
    }
    if (edited) {
        await logAction({ action: "user_edit", actorId: admin.id, actorUsername: admin.username, targetType: "user", targetId: id, details: `@${user.username} channels/keywords` });
    }

    const updated = await prisma.appUser.findUnique({
        where: { id },
        include: {
            userChannels: { include: { channel: { select: { id: true, username: true, name: true } } } },
            userKeywords: { select: { id: true, keyword: true } },
        },
    });
    return NextResponse.json({
        ...updated,
        channels: updated?.userChannels.map((uc) => ({ id: uc.channel.id, username: uc.channel.username, name: uc.channel.name })) ?? [],
        keywords: updated?.userKeywords.map((uk) => ({ id: uk.id, keyword: uk.keyword })) ?? [],
    });
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    if (id === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

    const user = await prisma.appUser.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ error: "Cannot delete admin" }, { status: 400 });

    await prisma.appUser.delete({ where: { id } });
    await logAction({ action: "user_delete", actorId: admin.id, actorUsername: admin.username, targetType: "user", targetId: id, details: `@${user.username}` });
    return NextResponse.json({ success: true });
}
