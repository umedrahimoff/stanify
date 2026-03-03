"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Shield, UserCog, AlertCircle } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

interface AppUser {
    id: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [adding, setAdding] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const { data: me } = useSWR<{ role: string }>("/api/auth/me", fetcher);
    const { data: users = [], isLoading, mutate, error } = useSWR<AppUser[]>(
        me?.role === "admin" ? "/api/users" : null,
        fetcher
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

    const removeUser = async (id: string, u: AppUser) => {
        if (!confirm(`Remove @${u.username}?`)) return;
        try {
            await axios.delete("/api/users", { data: { id } });
            mutate();
            mutateMe("/api/auth/me");
            showToast("User removed");
        } catch (e: any) {
            showToast(e.response?.data?.error || "Failed to remove", "error");
        }
    };

    const activeUsers = users.filter((u) => u.isActive);

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
                    Add moderators. They can access the dashboard via username + one-time code.
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
                                    <th style={{ width: "80px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.map((u) => (
                                    <tr key={u.id}>
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
                                        <td>
                                            {u.role !== "admin" && (
                                                <button
                                                    onClick={() => removeUser(u.id, u)}
                                                    title="Remove"
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "rgba(255,69,69,0.6)",
                                                        cursor: "pointer",
                                                        padding: "0.35rem",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
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
