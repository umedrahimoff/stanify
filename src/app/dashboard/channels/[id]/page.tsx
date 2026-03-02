"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Radio, Calendar, ExternalLink, Plus, X, Hash, Trash2 } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import axios from "axios";

function parseTags(input: string): string[] {
    return [...new Set(input.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

interface Channel {
    id: string;
    name: string | null;
    username: string | null;
    telegramId: string;
    isActive: boolean;
    createdAt: string;
}

interface Alert {
    id: string;
    channelName: string;
    content: string;
    matchedWord: string;
    postLink: string | null;
    createdAt: string;
}

interface ChannelKeyword {
    id: string;
    text: string;
}

export default function ChannelDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { mutate: mutateStats } = useSWRConfig();

    const [inputValue, setInputValue] = useState("");
    const [pendingTags, setPendingTags] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: channels = [] } = useSWR<Channel[]>(id ? "/api/channels" : null, fetcher);
    const currentChannel = channels.find((c) => c.id === id);

    const { data: keywords = [], isLoading: keywordsLoading, mutate } = useSWR<ChannelKeyword[]>(
        id ? `/api/channels/${id}/keywords` : null,
        fetcher
    );

    const { data: alerts = [], isLoading: alertsLoading } = useSWR<Alert[]>(
        id ? `/api/alerts?limit=200&channelId=${id}` : null,
        fetcher
    );

    const addTag = (tag: string) => {
        const t = tag.trim().toLowerCase();
        if (t && !pendingTags.includes(t)) setPendingTags((p) => [...p, t]);
    };

    const removePendingTag = (idx: number) => setPendingTags((p) => p.filter((_, i) => i !== idx));

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "," || e.key === "Enter") {
            e.preventDefault();
            const fromInput = parseTags(inputValue);
            if (fromInput.length) fromInput.forEach(addTag);
            else if (inputValue.trim()) addTag(inputValue);
            setInputValue("");
        } else if (e.key === "Backspace" && !inputValue && pendingTags.length) {
            removePendingTag(pendingTags.length - 1);
        }
    };

    const handleInputChange = (v: string) => {
        if (v.endsWith(",")) {
            parseTags(v.slice(0, -1)).forEach(addTag);
            setInputValue("");
        } else setInputValue(v);
    };

    const handleAdd = async () => {
        const toAdd = inputValue.trim() ? [...pendingTags, ...parseTags(inputValue)] : [...pendingTags];
        const unique = [...new Set(toAdd)].filter(Boolean);
        if (!unique.length) return;
        setAdding(true);
        try {
            await axios.post(`/api/channels/${id}/keywords`, { texts: unique });
            setPendingTags([]);
            setInputValue("");
            mutate();
            mutateStats("/api/stats");
        } catch (e) {
            console.error("Failed to add keywords:", e);
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (kwId: string) => {
        try {
            await axios.delete(`/api/channels/${id}/keywords`, { data: { ids: [kwId] } });
            mutate(keywords.filter((k) => k.id !== kwId), false);
            setSelectedIds((s) => {
                const next = new Set(s);
                next.delete(kwId);
                return next;
            });
            mutateStats("/api/stats");
        } catch (e) {
            console.error("Failed to remove keyword:", e);
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/channels/${id}/keywords`, { data: { ids } });
            mutate(keywords.filter((k) => !ids.includes(k.id)), false);
            setSelectedIds(new Set());
            mutateStats("/api/stats");
        } catch (e) {
            console.error("Failed to delete keywords:", e);
        } finally {
            setDeleting(false);
        }
    };

    const tagInputHasContent = pendingTags.length > 0 || inputValue.trim().length > 0;

    if (!id) {
        return (
            <div className="animate-fade">
                <p style={{ color: "rgba(255,255,255,0.5)" }}>Invalid channel.</p>
                <Link href="/dashboard/channels" style={{ color: "#00A3FF", textDecoration: "none", marginTop: "1rem", display: "inline-block" }}>
                    ← Back to Channels
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <Link
                href="/dashboard/channels"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.9rem",
                    marginBottom: "2rem",
                    textDecoration: "none",
                }}
            >
                <ArrowLeft size={18} /> Back to Channels
            </Link>

            {!currentChannel ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: "0", marginBottom: "2rem" }}>
                        <div style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, rgba(0,163,255,0.2), rgba(0,163,255,0.05))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    color: "#00A3FF",
                                    fontSize: "1.2rem",
                                }}
                            >
                                {currentChannel.name ? currentChannel.name[0].toUpperCase() : "?"}
                            </div>
                            <div>
                                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                                    {currentChannel.name || "Unknown"}
                                </h1>
                                <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
                                    {currentChannel.username ? `@${currentChannel.username}` : `ID: ${currentChannel.telegramId}`}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                                    <Calendar size={14} />
                                    Added {new Date(currentChannel.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Keywords (triggers for this channel)</h2>
                        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                            <div
                                className="input-field tag-input-wrapper"
                                style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", minHeight: "44px", flex: 1, minWidth: "200px", cursor: "text" }}
                                onClick={() => inputRef.current?.focus()}
                            >
                                {pendingTags.map((tag, idx) => (
                                    <span key={`${tag}-${idx}`} style={{ background: "rgba(0,163,255,0.15)", color: "#00A3FF", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                        {tag}
                                        <button type="button" onClick={(e) => { e.stopPropagation(); removePendingTag(idx); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={pendingTags.length ? "" : "keyword1, keyword2..."}
                                    value={inputValue}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    disabled={adding}
                                    style={{ flex: 1, minWidth: "100px", background: "none", border: "none", outline: "none", color: "inherit", fontSize: "inherit" }}
                                />
                            </div>
                            <button className="btn-primary" onClick={handleAdd} disabled={adding || !tagInputHasContent} style={{ width: "48px", minWidth: "48px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {adding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                            </button>
                        </div>
                        {keywordsLoading ? (
                            <div className="flex justify-center py-6"><Loader2 className="animate-spin" size={24} color="#00A3FF" /></div>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                                {keywords.length > 0 && (
                                    <>
                                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginRight: "0.5rem" }}>
                                            <input type="checkbox" checked={selectedIds.size === keywords.length} onChange={() => setSelectedIds(selectedIds.size === keywords.length ? new Set() : new Set(keywords.map((k) => k.id)))} />
                                            Select all
                                        </label>
                                        {selectedIds.size > 0 && (
                                            <button onClick={handleBulkDelete} disabled={deleting} style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                {deleting ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                                                Delete ({selectedIds.size})
                                            </button>
                                        )}
                                    </>
                                )}
                                {keywords.length === 0 ? (
                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No keywords. Add triggers above.</span>
                                ) : (
                                    keywords.map((kw) => (
                                        <div key={kw.id} style={{ background: "rgba(255,255,255,0.05)", padding: "0.4rem 0.8rem", borderRadius: "100px", display: "flex", alignItems: "center", gap: "0.4rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                                            <input type="checkbox" checked={selectedIds.has(kw.id)} onChange={() => setSelectedIds((s) => { const n = new Set(s); if (n.has(kw.id)) n.delete(kw.id); else n.add(kw.id); return n; })} style={{ cursor: "pointer" }} />
                                            <Hash size={12} color="#00A3FF" />
                                            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{kw.text}</span>
                                            <button onClick={() => handleRemove(kw.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 0, display: "flex" }}><X size={12} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
                        Posts ({alerts.length})
                    </h2>

                    <div className="card" style={{ padding: "0" }}>
                        {alertsLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="animate-spin text-blue-500" size={40} />
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                No posts yet.
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table className="table-dashboard">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Keyword</th>
                                            <th>Preview</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.map((alert) => (
                                            <tr key={alert.id}>
                                                <td style={{ color: "rgba(255,255,255,0.7)" }}>
                                                    {new Date(alert.createdAt).toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className="keyword-badge">{alert.matchedWord}</span>
                                                </td>
                                                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {alert.content || "(no text)"}
                                                </td>
                                                <td className="td-right">
                                                    <Link href={`/dashboard/archive/${alert.id}`} className="btn-link">
                                                        View <ExternalLink size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
