"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Radio, Loader2, Link as LinkIcon, Plus, ListFilter, Trash2, AlertCircle, Calendar, Activity, ChevronRight, Hash, Users } from "lucide-react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import { formatDate } from "@/lib/date";

interface Channel {
    id: string;
    telegramId: string;
    username: string | null;
    name: string | null;
    type?: "channel" | "group";
    isActive: boolean;
    createdAt: string;
    lastActivityAt: string | null;
    _pending?: boolean;
    _count?: { keywords: number };
}

export default function ChannelsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [newChannel, setNewChannel] = useState("");
    const [adding, setAdding] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showOnlyActive, setShowOnlyActive] = useState(true);
    const [typeFilter, setTypeFilter] = useState<"all" | "channel" | "group">("all");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warn" } | null>(null);
    const [page, setPage] = useState(1);

    const PAGE_SIZE = 20;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    params.set("showOnlyActive", String(showOnlyActive));
    params.set("typeFilter", typeFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    const channelsKey = `/api/channels?${params.toString()}`;
    const { data, isLoading, mutate } = useSWR<{ items: Channel[]; total: number; page: number; pageSize: number }>(channelsKey);
    const channels = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

    useEffect(() => setPage(1), [searchQuery, showOnlyActive, typeFilter]);
    const { mutate: mutateStats } = useSWRConfig();

    const showToast = (msg: string, type: "success" | "error" | "warn" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await axios.post("/api/channels/sync");
            mutate();
            mutateStats("/api/stats");
            showToast("Channels synced successfully!");
        } catch (error) {
            console.error("Sync failed:", error);
            showToast("Sync failed. Check console.", "error");
        } finally {
            setSyncing(false);
        }
    };

    const handleAdd = async () => {
        if (!newChannel.trim()) return;
        setAdding(true);
        try {
            const cleanSource = newChannel.trim();
            const res = await axios.post("/api/channels", { username: cleanSource });
            setNewChannel("");
            mutate();
            mutateStats("/api/stats");
            if (res.data._warning) {
                showToast(`Added (private channel — join may be limited)`, "warn");
            } else {
                showToast("Channel added and joined successfully!");
            }
        } catch (error: any) {
            console.error("Failed to add channel:", error);
            showToast(error.response?.data?.error || "Failed to add channel", "error");
        } finally {
            setAdding(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await axios.post("/api/channels", { id, isActive: !currentStatus });
            mutate();
            mutateStats("/api/stats");
        } catch (error) {
            console.error("Failed to toggle channel status:", error);
            showToast("Failed to update status", "error");
        }
    };

    const deleteChannel = async (id: string) => {
        if (!confirm("Are you sure you want to remove this channel?")) return;
        try {
            await axios.delete("/api/channels", { data: { id } });
            mutate();
            mutateStats("/api/stats");
            showToast("Channel removed.");
        } catch (error) {
            console.error("Failed to delete channel:", error);
            showToast("Failed to remove channel", "error");
        }
    };

    const toastColor =
        toast?.type === "error"
            ? "#FF4545"
            : toast?.type === "warn"
                ? "#FF9F0A"
                : "#00FF75";

    return (
        <div className="animate-fade">
            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: "fixed",
                    top: "1.5rem",
                    right: "1.5rem",
                    background: "#1a1a2e",
                    border: `1px solid ${toastColor}44`,
                    color: toastColor,
                    padding: "0.9rem 1.4rem",
                    borderRadius: "12px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    zIndex: 9999,
                    boxShadow: `0 4px 24px ${toastColor}22`,
                    maxWidth: "360px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    animation: "fadeIn 0.3s ease"
                }}>
                    <AlertCircle size={16} />
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Source Channels</h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>Manage and monitor your Telegram network.</p>
                </div>

                <div style={{ display: "flex", gap: "1rem", width: "100%", maxWidth: "500px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                        <LinkIcon
                            size={18}
                            color="rgba(255,255,255,0.3)"
                            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}
                        />
                        <input
                            className="input-field"
                            style={{ paddingLeft: "3rem" }}
                            placeholder="Add @username or Link..."
                            value={newChannel}
                            onChange={(e) => setNewChannel(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !adding && handleAdd()}
                            disabled={adding}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleAdd}
                        disabled={adding || !newChannel.trim()}
                        style={{ width: "60px", minWidth: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        {adding ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
                <div style={{ position: "relative", maxWidth: "300px", width: "100%" }}>
                    <Search
                        size={16}
                        color="rgba(255,255,255,0.3)"
                        style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                        className="input-field"
                        style={{ paddingLeft: "2.5rem", height: "40px", fontSize: "0.9rem" }}
                        placeholder="Quick search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as "all" | "channel" | "group")}
                        style={{
                            fontSize: "0.85rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.9)",
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All</option>
                        <option value="channel">Channels</option>
                        <option value="group">Groups</option>
                    </select>
                    <button
                        onClick={() => setShowOnlyActive(!showOnlyActive)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.85rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "10px",
                            background: showOnlyActive ? "rgba(0,163,255,0.1)" : "rgba(255,255,255,0.05)",
                            border: "1px solid",
                            borderColor: showOnlyActive ? "rgba(0,163,255,0.3)" : "rgba(255,255,255,0.1)",
                            color: showOnlyActive ? "#00A3FF" : "rgba(255,255,255,0.6)",
                            cursor: "pointer",
                            transition: "0.2s",
                        }}
                    >
                        <ListFilter size={16} />
                        {showOnlyActive ? "Active Only" : "All Sources"}
                    </button>
                </div>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.85rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: syncing ? "#00A3FF" : "rgba(255,255,255,0.6)",
                        cursor: syncing ? "not-allowed" : "pointer",
                        transition: "0.2s",
                    }}
                >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                    {syncing ? "Syncing..." : "Sync from Telegram"}
                </button>

                <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>
                    {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}` : "0 channels"}
                </span>
            </div>

            <div className="card" style={{ padding: "0.5rem" }}>
                {isLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                        <Loader2 className="animate-spin" size={40} color="#00A3FF" />
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th style={{ width: "1%", whiteSpace: "nowrap" }}>Kw</th>
                                    <th>Added</th>
                                    <th>Last Activity</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {channels.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>
                                            No channels found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    channels.map((c) => {
                                        const isPending = c.telegramId?.startsWith("pending_");
                                        return (
                                            <tr key={c.id}>
                                                <td>
                                                    <Link
                                                        href={`/dashboard/channels/${c.id}`}
                                                        style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "0.8rem" }}
                                                    >
                                                        <div style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            borderRadius: "10px",
                                                            background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                                                            border: `1px solid ${isPending ? "rgba(255,159,10,0.3)" : "rgba(255,255,255,0.05)"}`,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: 700,
                                                            color: isPending ? "#FF9F0A" : c.isActive ? "#00A3FF" : "rgba(255,255,255,0.3)",
                                                            fontSize: "0.8rem",
                                                        }}>
                                                            {c.name ? c.name[0].toUpperCase() : "?"}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                                {c.name || "Unknown"}
                                                                <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                                                                {isPending && (
                                                                    <span style={{ fontSize: "0.7rem", color: "#FF9F0A", background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.2)", padding: "0.1rem 0.4rem", borderRadius: "6px" }}>
                                                                        PENDING SYNC
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                                                                {c.username ? `@${c.username}` : `ID: ${c.telegramId}`}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.35rem",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        padding: "0.2rem 0.6rem",
                                                        borderRadius: "100px",
                                                        background: (c.type || "channel") === "channel" ? "rgba(0,163,255,0.1)" : "rgba(0,255,117,0.1)",
                                                        color: (c.type || "channel") === "channel" ? "#00A3FF" : "#00FF75",
                                                    }}>
                                                        {(c.type || "channel") === "channel" ? <Hash size={12} /> : <Users size={12} />}
                                                        {(c.type || "channel") === "channel" ? "Channel" : "Group"}
                                                    </span>
                                                </td>
                                                <td style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                                                    {c._count?.keywords ?? 0}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Calendar size={14} color="rgba(255,255,255,0.4)" />
                                                        {formatDate(c.createdAt)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <Activity size={14} color="rgba(255,255,255,0.4)" />
                                                        {c.lastActivityAt
                                                            ? formatDate(c.lastActivityAt)
                                                            : "—"}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{
                                                            width: "6px",
                                                            height: "6px",
                                                            borderRadius: "50%",
                                                            background: c.isActive ? "#00FF75" : "rgba(255,255,255,0.1)",
                                                            boxShadow: c.isActive ? "0 0 10px rgba(0,255,117,0.5)" : "none",
                                                        }} />
                                                        <span style={{
                                                            fontSize: "0.8rem",
                                                            fontWeight: 500,
                                                            color: c.isActive ? "#00FF75" : "rgba(255,255,255,0.2)",
                                                        }}>
                                                            {c.isActive ? "Monitoring" : "Paused"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="td-right">
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.35rem", alignItems: "center" }}>
                                                        <button
                                                            onClick={() => toggleStatus(c.id, c.isActive)}
                                                            title={c.isActive ? "Pause" : "Follow"}
                                                            style={{
                                                                padding: "0.35rem 0.5rem",
                                                                fontSize: "0.7rem",
                                                                height: "28px",
                                                                minWidth: "auto",
                                                                borderRadius: "6px",
                                                                background: c.isActive ? "rgba(255,255,255,0.06)" : "rgba(0,163,255,0.2)",
                                                                border: `1px solid ${c.isActive ? "rgba(255,255,255,0.1)" : "rgba(0,163,255,0.3)"}`,
                                                                color: c.isActive ? "rgba(255,255,255,0.6)" : "#00A3FF",
                                                                cursor: "pointer",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {c.isActive ? "Pause" : "Follow"}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteChannel(c.id)}
                                                            title="Remove"
                                                            className="remove-btn"
                                                            style={{
                                                                color: "rgba(255,69,69,0.5)",
                                                                padding: "0.35rem",
                                                                borderRadius: "6px",
                                                                background: "rgba(255,69,69,0.05)",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginTop: "1rem" }}>
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={{
                            padding: "0.35rem 0.6rem",
                            fontSize: "0.8rem",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px",
                            color: page <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                            cursor: page <= 1 ? "not-allowed" : "pointer",
                        }}
                    >
                        ←
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p: number;
                        if (totalPages <= 5) p = i + 1;
                        else if (page <= 3) p = i + 1;
                        else if (page >= totalPages - 2) p = totalPages - 4 + i;
                        else p = page - 2 + i;
                        return (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                style={{
                                    padding: "0.35rem 0.6rem",
                                    fontSize: "0.8rem",
                                    minWidth: "32px",
                                    background: page === p ? "rgba(0,163,255,0.2)" : "rgba(255,255,255,0.05)",
                                    border: `1px solid ${page === p ? "rgba(0,163,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                                    borderRadius: "6px",
                                    color: page === p ? "#00A3FF" : "rgba(255,255,255,0.7)",
                                    cursor: "pointer",
                                }}
                            >
                                {p}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        style={{
                            padding: "0.35rem 0.6rem",
                            fontSize: "0.8rem",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px",
                            color: page >= totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                            cursor: page >= totalPages ? "not-allowed" : "pointer",
                        }}
                    >
                        →
                    </button>
                </div>
            )}

            <style>{`
                .remove-btn:hover {
                    color: #FF4545 !important;
                    background: rgba(255,69,69,0.1) !important;
                }
            `}</style>
        </div>
    );
}
