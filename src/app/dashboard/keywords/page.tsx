"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Hash, Plus, Loader2, Trash2, Radio, AlertCircle, Pencil } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";
import Link from "next/link";

interface KeywordGroup {
    text: string;
    channels: { id: string; name: string | null; username: string | null }[];
    ids: string[];
}

interface Channel {
    id: string;
    name: string | null;
    username: string | null;
}

export default function KeywordsPage() {
    const [keywordInput, setKeywordInput] = useState("");
    const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
    const [adding, setAdding] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [showChannelPicker, setShowChannelPicker] = useState(false);
    const [editKw, setEditKw] = useState<KeywordGroup | null>(null);
    const [editChannelIds, setEditChannelIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (showChannelPicker && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowChannelPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showChannelPicker]);

    const { data, isLoading, mutate } = useSWR<{ keywords: KeywordGroup[] }>("/api/keywords", fetcher);
    const { data: channels = [] } = useSWR<Channel[]>("/api/channels", fetcher);
    const { mutate: mutateStats } = useSWRConfig();

    const keywords = data?.keywords ?? [];
    const activeChannels = channels.filter((c) => c.id);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const toggleChannel = (id: string) => {
        setSelectedChannelIds((s) => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    };

    const openEdit = (kw: KeywordGroup) => {
        setEditKw(kw);
        setEditChannelIds(new Set(kw.channels.map((ch) => ch.id)));
    };

    const toggleEditChannel = (id: string) => {
        setEditChannelIds((s) => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    };

    const saveEdit = async () => {
        if (!editKw) return;
        if (editChannelIds.size === 0) {
            if (!confirm("Remove this keyword from all channels?")) return;
            try {
                await axios.delete("/api/keywords", { data: { ids: editKw.ids } });
                mutate();
                mutateStats("/api/stats");
                setEditKw(null);
                showToast("Removed");
            } catch {
                showToast("Failed to remove", "error");
            }
            return;
        }
        setSaving(true);
        try {
            const currentIds = new Set(editKw.channels.map((ch) => ch.id));
            const toRemove = editKw.channels.filter((ch) => !editChannelIds.has(ch.id));
            const toAdd = Array.from(editChannelIds).filter((id) => !currentIds.has(id));
            const idsToDelete = toRemove.map((ch) => editKw.ids[editKw.channels.findIndex((c) => c.id === ch.id)]);
            if (idsToDelete.length) {
                await axios.delete("/api/keywords", { data: { ids: idsToDelete } });
            }
            if (toAdd.length) {
                await axios.post("/api/keywords", {
                    texts: [editKw.text],
                    channelIds: toAdd,
                });
            }
            mutate();
            mutateStats("/api/stats");
            setEditKw(null);
            showToast("Updated");
        } catch {
            showToast("Failed to update", "error");
        } finally {
            setSaving(false);
        }
    };

    const parseAndAdd = () => {
        const texts = [...new Set(keywordInput.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
        if (!texts.length || !selectedChannelIds.size) return;
        setAdding(true);
        axios
            .post("/api/keywords", {
                texts,
                channelIds: Array.from(selectedChannelIds),
            })
            .then((res) => {
                mutate();
                mutateStats("/api/stats");
                setKeywordInput("");
                setSelectedChannelIds(new Set());
                showToast(`Added ${res.data.keywords} keyword(s) to ${res.data.channels} channel(s)`);
            })
            .catch((e) => showToast(e.response?.data?.error || "Failed to add", "error"))
            .finally(() => setAdding(false));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            parseAndAdd();
        }
    };

    const deleteKeyword = async (ids: string[]) => {
        if (!confirm("Remove this keyword from selected channels?")) return;
        try {
            await axios.delete("/api/keywords", { data: { ids } });
            mutate();
            mutateStats("/api/stats");
            showToast("Removed");
        } catch {
            showToast("Failed to remove", "error");
        }
    };

    const toastColor = toast?.type === "error" ? "#FF4545" : "#00FF75";

    return (
        <div className="animate-fade">
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "1.5rem",
                        right: "1.5rem",
                        background: "#1a1a2e",
                        border: `1px solid ${toastColor}44`,
                        color: toastColor,
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
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Keywords</h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                    Add keywords and select which channels they trigger in.
                </p>
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>Add keyword</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <label className="text-[0.75rem] text-white/40" style={{ display: "block", marginBottom: "0.35rem" }}>
                            Keyword (comma-separated)
                        </label>
                        <input
                            ref={inputRef}
                            className="input-field"
                            placeholder="crypto, nft, defi..."
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{ height: "36px", fontSize: "0.85rem" }}
                        />
                    </div>
                    <div style={{ position: "relative" }} ref={pickerRef}>
                        <label className="text-[0.75rem] text-white/40" style={{ display: "block", marginBottom: "0.35rem" }}>
                            Channels
                        </label>
                        <button
                            onClick={() => setShowChannelPicker(!showChannelPicker)}
                            className="input-field"
                            style={{
                                height: "36px",
                                fontSize: "0.85rem",
                                minWidth: "180px",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.5rem",
                            }}
                        >
                            <span>
                                {selectedChannelIds.size === 0
                                    ? "Select channels..."
                                    : `${selectedChannelIds.size} selected`}
                            </span>
                            <Radio size={14} color="rgba(255,255,255,0.4)" />
                        </button>
                        {showChannelPicker && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    marginTop: "0.25rem",
                                    background: "rgba(26,26,46,0.98)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "8px",
                                    maxHeight: "240px",
                                    overflowY: "auto",
                                    zIndex: 100,
                                    padding: "0.5rem",
                                }}
                            >
                                {activeChannels.map((c) => (
                                    <label
                                        key={c.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.4rem 0.5rem",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            borderRadius: "6px",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedChannelIds.has(c.id)}
                                            onChange={() => toggleChannel(c.id)}
                                        />
                                        {c.name || c.username || c.id}
                                    </label>
                                ))}
                                {activeChannels.length === 0 && (
                                    <p style={{ padding: "0.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                                        No channels. Add channels first.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={parseAndAdd}
                        disabled={adding || !keywordInput.trim() || !selectedChannelIds.size}
                        className="btn-primary"
                        style={{
                            height: "36px",
                            padding: "0 1rem",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                        }}
                    >
                        {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {adding ? "Adding…" : "Add"}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: "0" }}>
                {isLoading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        Loading...
                    </div>
                ) : keywords.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No keywords yet. Add keywords above and select channels.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Keyword</th>
                                    <th>Channels</th>
                                    <th style={{ width: "100px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {keywords.map((kw) => (
                                    <tr key={kw.text}>
                                        <td>
                                            <span
                                                style={{
                                                    background: "rgba(0,163,255,0.1)",
                                                    color: "#00A3FF",
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "100px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {kw.text}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                                {kw.channels.map((ch) => (
                                                    <Link
                                                        key={ch.id}
                                                        href={`/dashboard/channels/${ch.id}`}
                                                        style={{
                                                            fontSize: "0.8rem",
                                                            color: "rgba(255,255,255,0.7)",
                                                            textDecoration: "none",
                                                            padding: "0.15rem 0.5rem",
                                                            background: "rgba(255,255,255,0.06)",
                                                            borderRadius: "6px",
                                                            border: "1px solid rgba(255,255,255,0.08)",
                                                        }}
                                                    >
                                                        {ch.name || ch.username || ch.id}
                                                    </Link>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={() => openEdit(kw)}
                                                    title="Edit channels"
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "rgba(255,255,255,0.5)",
                                                        cursor: "pointer",
                                                        padding: "0.35rem",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteKeyword(kw.ids)}
                                                    title="Remove from all channels"
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {editKw && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9998,
                    }}
                    onClick={() => !saving && setEditKw(null)}
                >
                    <div
                        className="card"
                        style={{ padding: "1.25rem", minWidth: "360px", maxWidth: "90vw" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                            Edit keyword: <span style={{ color: "#00A3FF" }}>{editKw.text}</span>
                        </h3>
                        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
                            Add or remove channels for this keyword.
                        </p>
                        <div style={{ marginBottom: "1rem" }}>
                            <label className="text-[0.75rem] text-white/40" style={{ display: "block", marginBottom: "0.35rem" }}>
                                Channels ({editChannelIds.size} selected)
                            </label>
                            <div
                                style={{
                                    marginTop: "0.5rem",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "8px",
                                    padding: "0.5rem",
                                }}
                            >
                                {activeChannels.map((c) => (
                                    <label
                                        key={c.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.4rem 0.5rem",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            borderRadius: "6px",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={editChannelIds.has(c.id)}
                                            onChange={() => toggleEditChannel(c.id)}
                                        />
                                        {c.name || c.username || c.id}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => !saving && setEditKw(null)}
                                className="input-field"
                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="btn-primary"
                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                                {saving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
