import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPendingReauth } from "@/lib/reauthState";

export async function POST(req: Request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? "").trim();
    if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

    const state = getPendingReauth();
    if (!state || state.status !== "password" || !state.passwordResolver) {
        return NextResponse.json({ error: "Not waiting for password" }, { status: 400 });
    }

    state.passwordResolver(password);
    state.passwordResolver = undefined;
    return NextResponse.json({ ok: true });
}
