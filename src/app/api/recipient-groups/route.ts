import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function norm(u: string) {
    return String(u).trim().replace(/^@/, "").toLowerCase();
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const groups = await prisma.recipientGroup.findMany({
            orderBy: { name: "asc" },
            include: { members: { select: { username: true } } },
        });
        return NextResponse.json(
            groups.map((g) => ({
                id: g.id,
                name: g.name,
                members: g.members.map((m) => m.username),
            }))
        );
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const name = String(body.name ?? "").trim();
        const members: string[] = Array.isArray(body.members)
            ? body.members.map(norm).filter(Boolean)
            : body.member ? [norm(body.member)] : [];

        if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

        const existing = await prisma.recipientGroup.findUnique({ where: { name } });
        if (existing) return NextResponse.json({ error: "Group already exists" }, { status: 409 });

        const group = await prisma.recipientGroup.create({
            data: {
                name,
                members: members.length ? { create: members.map((u) => ({ username: u })) } : undefined,
            },
            include: { members: { select: { username: true } } },
        });
        return NextResponse.json({ id: group.id, name: group.name, members: group.members.map((m) => m.username) });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
}
