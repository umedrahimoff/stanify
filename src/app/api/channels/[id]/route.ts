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

        if (typeof body.saveAllPosts !== "boolean") {
            return NextResponse.json({ error: "saveAllPosts (boolean) required" }, { status: 400 });
        }

        const channel = await prisma.channel.update({
            where: { id },
            data: { saveAllPosts: body.saveAllPosts },
        });
        return NextResponse.json(channel);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
    }
}
