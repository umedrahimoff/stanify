import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        const data: { isActive?: boolean; recipientGroupId?: string | null; recipients?: { deleteMany: object; create: { username: string }[] } } = {};
        if (typeof body.isActive === "boolean") data.isActive = body.isActive;
        if (body.recipientGroupId !== undefined) data.recipientGroupId = body.recipientGroupId || null;
        if (Array.isArray(body.recipients)) {
            const usernames = body.recipients
                .map((u: string) => String(u).trim().replace(/^@/, "").toLowerCase())
                .filter(Boolean);
            data.recipients = { deleteMany: {}, create: usernames.map((u: string) => ({ username: u })) };
            if (data.recipientGroupId === undefined) data.recipientGroupId = null;
        }

        const updated = await prisma.globalKeyword.update({
            where: { id },
            data,
            include: {
                recipients: { select: { username: true } },
                recipientGroup: { include: { members: { select: { username: true } } } },
            },
        });

        const recipients = updated.recipientGroup?.members?.length
            ? updated.recipientGroup.members.map((r) => r.username)
            : updated.recipients.map((r) => r.username);
        return NextResponse.json({ id: updated.id, text: updated.text, isActive: updated.isActive, recipients });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
