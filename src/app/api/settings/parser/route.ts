import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PARSER_ENABLED_KEY = "parser_enabled";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const row = await prisma.appSetting.findUnique({ where: { key: PARSER_ENABLED_KEY } });
        const parserEnabled = row?.value !== "false";
        return NextResponse.json({ parserEnabled });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
