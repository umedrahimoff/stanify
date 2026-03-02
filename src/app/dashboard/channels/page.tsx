"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Radio, Loader2, Link as LinkIcon, Plus, ListFilter, Trash2, AlertCircle, Calendar, Activity, ChevronRight } from "lucide-react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";

interface Channel {
    id: string;
    telegramId: string;
    username: string | null;
    name: string | null;
    isActive: boolean;
    createdAt: string;
    lastActivityAt: string | null;
    _pending?: boolean;
}

export default function ChannelsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [newChannel, setNewChannel] = useState("");
    const [adding, setAdding] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showOnlyActive, setShowOnlyActive] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "warn" } | null>(null);

    const { data: channels = [], isLoading, mutate } = useSWR<Channel[]>("/api/channels");
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
            mutate([{ ...res.data, lastActivityAt: null }, ...channels], false);
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
            mutate(channels.map((c) => (c.id === id ? { ...res.data, lastActivityAt: c.lastActivityAt } : c)), false);
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
            mutate(channels.filter((c) => c.id !== id), false);
            mutateStats("/api/stats");
            showToast("Channel removed.");
        } catch (error) {
            console.error("Failed to delete channel:", error);
            showToast("Failed to remove channel", "error");
        }
    };

    const filteredChannels = channels.filter((c) => {
        const matchesSearch =
            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.username?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesActive = !showOnlyActive || c.isActive;
        return matchesSearch && matchesActive;
    });

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
                    {showOnlyActive ? "Showing: Active Only" : "Showing: All Sources"}
                </button>

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
                    {filteredChannels.length} / {channels.length} channels
                </span>
            </div>

            <div className="card" style={{ padding: "0.5rem" }}>
                {isLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                        <Loader2 className="animate-spin" size={40} color="#00A3FF" />
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.25rem" }}>
                            <thead>
                                <tr style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Channel / Group Name</th>
                                    <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Added</th>
                                    <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Last Activity</th>
                                    <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Status</th>
                                    <th style={{ textAlign: "right", padding: "1rem 1.5rem", fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChannels.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)" }}>
                                            No channels found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredChannels.map((c) => {
                                        const isPending = c.telegramId?.startsWith("pending_");
                                        return (
                                            <tr
                                                key={c.id}
                                                className="table-row-hover"
                                                style={{ background: "rgba(255,255,255,0.02)", transition: "background 0.2s" }}
                                            >
                                                <td style={{ padding: "1rem 1.5rem" }}>
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
                                                <td style={{ padding: "1rem 1.5rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                                                        <Calendar size={14} color="rgba(255,255,255,0.4)" />
                                                        {new Date(c.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "1rem 1.5rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                                                        <Activity size={14} color="rgba(255,255,255,0.4)" />
                                                        {c.lastActivityAt
                                                            ? new Date(c.lastActivityAt).toLocaleDateString()
                                                            : "—"}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "1rem 1.5rem" }}>
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
                                                <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", alignItems: "center" }}>
                                                        <button
                                                            onClick={() => toggleStatus(c.id, c.isActive)}
                                                            className={c.isActive ? "btn-secondary" : "btn-primary"}
                                                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", height: "32px" }}
                                                        >
                                                            {c.isActive ? "Pause" : "Follow"}
                                                        </button>
                                                        <button
                                                            onClick={() => deleteChannel(c.id)}
                                                            className="remove-btn"
                                                            style={{
                                                                color: "rgba(255,69,69,0.5)",
                                                                padding: "6px",
                                                                borderRadius: "8px",
                                                                background: "rgba(255,69,69,0.05)",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
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

            <style>{`
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.05) !important;
                }
                .remove-btn:hover {
                    color: #FF4545 !important;
                    background: rgba(255,69,69,0.1) !important;
                }
            `}</style>
        </div>
    );
}
