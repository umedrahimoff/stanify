"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, Shield, UserCog, AlertCircle, Pause, Play, Settings } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";
import { formatDate } from "@/lib/date";

interface AppUser {
    id: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    lastActivityAt: string | null;
}

export default function UsersPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [adding, setAdding] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const { data: me } = useSWR<{ role: string }>("/api/auth/me", fetcher);
    const { data: users = [], isLoading, mutate, error } = useSWR<AppUser[]>(
        me?.role === "admin" ? "/api/users" : null,
        fetcher,
        { refreshInterval: 15000 }
    );

    useEffect(() => {
        if (me && me.role !== "admin") router.replace("/dashboard");
    }, [me, router]);
    const { mutate: mutateMe } = useSWRConfig();

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const addUser = async () => {
        const u = username.trim().replace(/^@/, "").toLowerCase();
        if (!u) return;
        setAdding(true);
        try {
            await axios.post("/api/users", { username: u });
            mutate();
            showToast(`Added @${u} as moderator`);
            setUsername("");
        } catch (e: any) {
            showToast(e.response?.data?.error || "Failed to add", "error");
        } finally {
            setAdding(false);
        }
    };

    const suspendUser = async (id: string, u: AppUser) => {
        if (!confirm(`Suspend @${u.username}? They won't be able to log in or receive alerts.`)) return;
        try {
            await axios.delete("/api/users", { data: { id } });
            mutate();
            mutateMe("/api/auth/me");
            showToast("User suspended");
        } catch (e: any) {
            showToast(e.response?.data?.error || "Error", "error");
        }
    };

    const restoreUser = async (id: string, u: AppUser) => {
        try {
            await axios.patch("/api/users", { id, isActive: true });
            mutate();
            mutateMe("/api/auth/me");
            showToast(`@${u.username} restored`);
        } catch (e: any) {
            showToast(e.response?.data?.error || "Error", "error");
        }
    };
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
    const isOnline = (lastActivityAt: string | null) =>
        lastActivityAt && Date.now() - new Date(lastActivityAt).getTime() < ONLINE_THRESHOLD_MS;

    return (
        <div className="animate-fade">
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "1.5rem",
                        right: "1.5rem",
                        background: "#1a1a2e",
                        border: `1px solid ${toast.type === "error" ? "#FF454544" : "#00FF7544"}`,
                        color: toast.type === "error" ? "#FF4545" : "#00FF75",
                        padding: "0.9rem 1.4rem",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                    }}
                >
                    <AlertCircle size={16} />
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Users</h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                    Add moderators. Only users in this list receive alerts. Use the gear icon to set channels and keywords per user.
                </p>
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Add moderator</h2>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <label className="text-[0.75rem] text-white/40" style={{ display: "block", marginBottom: "0.35rem" }}>
                            Telegram username
                        </label>
                        <input
                            className="input-field"
                            placeholder="@username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addUser()}
                            style={{ height: "36px", fontSize: "0.85rem" }}
                        />
                    </div>
                    <button
                        onClick={addUser}
                        disabled={adding || !username.trim()}
                        className="btn-primary"
                        style={{ height: "36px", padding: "0 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                        {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {adding ? "Adding…" : "Add"}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: "0" }}>
                {!me ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</div>
                ) : me.role !== "admin" ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Redirecting...</div>
                ) : isLoading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "#FF4545" }}>Access denied</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Last login</th>
                                    <th>Status</th>
                                    <th style={{ width: "120px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                                        <td>
                                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>@{u.username}</span>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "100px",
                                                    background: u.role === "admin" ? "rgba(191,90,242,0.15)" : "rgba(0,163,255,0.1)",
                                                    color: u.role === "admin" ? "#BF5AF2" : "#00A3FF",
                                                }}
                                            >
                                                {u.role === "admin" ? <Shield size={12} /> : <UserCog size={12} />}
                                                {u.role === "admin" ? "Admin" : "Moderator"}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                                            {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                                        </td>
                                        <td>
                                            {u.isActive ? (
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.35rem",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        color: isOnline(u.lastActivityAt) ? "#00FF75" : "rgba(255,255,255,0.4)",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: "6px",
                                                            height: "6px",
                                                            borderRadius: "50%",
                                                            background: isOnline(u.lastActivityAt) ? "#00FF75" : "rgba(255,255,255,0.2)",
                                                            boxShadow: isOnline(u.lastActivityAt) ? "0 0 6px rgba(0,255,117,0.5)" : "none",
                                                        }}
                                                    />
                                                    {isOnline(u.lastActivityAt) ? "Online" : "Offline"}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "0.75rem", color: "rgba(255,159,10,0.9)", fontWeight: 600 }}>
                                                    Suspended
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                <Link
                                                    href={`/dashboard/users/${u.id}`}
                                                    title="Preferences"
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "rgba(0,163,255,0.8)",
                                                        cursor: "pointer",
                                                        padding: "0.35rem",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    <Settings size={14} />
                                                </Link>
                                                {u.role !== "admin" &&
                                                    (u.isActive ? (
                                                        <button
                                                            onClick={() => suspendUser(u.id, u)}
                                                            title="Suspend"
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "rgba(255,159,10,0.8)",
                                                                cursor: "pointer",
                                                                padding: "0.35rem",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Pause size={14} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => restoreUser(u.id, u)}
                                                            title="Restore"
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "rgba(0,255,117,0.8)",
                                                                cursor: "pointer",
                                                                padding: "0.35rem",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Play size={14} />
                                                        </button>
                                                    ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
