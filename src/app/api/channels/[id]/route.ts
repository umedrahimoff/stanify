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

        const data: { saveAllPosts?: boolean; recipientGroupId?: string | null } = {};
        if (typeof body.saveAllPosts === "boolean") data.saveAllPosts = body.saveAllPosts;
        if (body.recipientGroupId !== undefined) data.recipientGroupId = body.recipientGroupId || null;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const channel = await prisma.channel.update({
            where: { id },
            data,
        });
        return NextResponse.json(channel);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
    }
}
