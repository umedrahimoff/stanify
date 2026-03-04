import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function norm(u: string) {
    return String(u).trim().replace(/^@/, "").toLowerCase();
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const data: { name?: string; members?: { deleteMany: object; create: { username: string }[] } } = {};
        if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
        if (Array.isArray(body.members)) {
            const usernames = body.members.map((u: string) => norm(u)).filter(Boolean);
            data.members = { deleteMany: {}, create: usernames.map((u: string) => ({ username: u })) };
        }

        const updated = await prisma.recipientGroup.update({
            where: { id },
            data,
            include: { members: { select: { username: true } } },
        });
        return NextResponse.json({ id: updated.id, name: updated.name, members: updated.members.map((m) => m.username) });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        await prisma.recipientGroup.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
