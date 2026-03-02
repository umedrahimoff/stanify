import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const keywords = await prisma.keyword.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(keywords);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

        const keyword = await prisma.keyword.create({
            data: { text: text.toLowerCase(), isActive: true }
        });
        return NextResponse.json(keyword);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.keyword.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 });
    }
}
