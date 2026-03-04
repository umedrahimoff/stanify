import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id } = await params;
        if (id.startsWith("cp-")) {
            const postId = id.slice(3);
            const post = await prisma.channelPost.findUnique({
                where: { id: postId },
                include: { channel: true },
            });
            if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
            return NextResponse.json({
                id: `cp-${post.id}`,
                channelName: post.channel.name ?? post.channel.username ?? "?",
                channelId: post.channelId,
                content: post.content,
                matchedWord: "—",
                postLink: post.postLink,
                translatedContent: null,
                source: "channel",
                createdAt: post.createdAt,
            });
        }
        const alert = await prisma.alert.findUnique({ where: { id } });
        if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        return NextResponse.json(alert);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id } = await params;
        if (id.startsWith("cp-")) {
            const postId = id.slice(3);
            const post = await prisma.channelPost.findUnique({ where: { id: postId } });
            if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
            await prisma.channelPost.delete({ where: { id: postId } });
            return NextResponse.json({ success: true });
        }
        const alert = await prisma.alert.findUnique({ where: { id } });
        if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        await prisma.alert.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
