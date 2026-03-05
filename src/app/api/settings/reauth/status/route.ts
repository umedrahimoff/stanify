import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPendingReauth } from "@/lib/reauthState";

export async function GET() {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const state = getPendingReauth();
    if (!state) {
        return NextResponse.json({ status: "idle" });
    }
    return NextResponse.json({
        status: state.status,
        qrUrl: state.qrUrl,
        hint: state.hint,
        error: state.error,
    });
}
