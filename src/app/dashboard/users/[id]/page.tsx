"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Radio, Hash, Loader2, Save, X, AlertCircle } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

interface Channel {
    id: string;
    username: string | null;
    name: string | null;
}

interface UserWithPrefs {
    id: string;
    username: string;
    role: string;
    isActive: boolean;
    channels: Channel[];
    keywords: { id: string; keyword: string }[];
}

export default function UserEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [saving, setSaving] = useState(false);
    const [channelIds, setChannelIds] = useState<string[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestDebounce = useCallback(
        (() => {
            let t: ReturnType<typeof setTimeout>;
            return (q: string) => {
                clearTimeout(t);
                t = setTimeout(async () => {
                    if (!q.trim()) {
                        setKeywordSuggestions([]);
                        return;
                    }
                    try {
                        const data = await fetcher(`/api/users/suggest-keywords?q=${encodeURIComponent(q)}&limit=15`) as { keywords?: string[] };
                        setKeywordSuggestions(data?.keywords ?? []);
                    } catch {
                        setKeywordSuggestions([]);
                    }
                }, 200);
            };
        })(),
        []
    );

    const { data: me } = useSWR<{ role: string }>("/api/auth/me", fetcher);
    const { data: user, isLoading, mutate } = useSWR<UserWithPrefs>(me?.role === "admin" && id ? `/api/users/${id}` : null, fetcher);

    useEffect(() => {
        if (me && me.role !== "admin") router.replace("/dashboard");
    }, [me, router]);

    useEffect(() => {
        if (user) {
            setChannelIds(user.channels.map((c) => c.id));
            setKeywords(user.keywords.map((k) => k.keyword));
        }
    }, [user]);

    useEffect(() => {
        suggestDebounce(keywordInput);
    }, [keywordInput, suggestDebounce]);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const save = async () => {
        setSaving(true);
        try {
            await axios.patch(`/api/users/${id}`, { channelIds, keywords });
            mutate();
            showToast("Saved");
        } catch (e: any) {
            showToast(e.response?.data?.error || "Failed to save", "error");
        } finally {
            setSaving(false);
        }
    };

    const addKeyword = (kw: string) => {
        const k = kw.trim().toLowerCase();
        if (k && !keywords.includes(k)) setKeywords((prev) => [...prev, k]);
        setKeywordInput("");
        setShowSuggestions(false);
    };

    const removeKeyword = (kw: string) => setKeywords((prev) => prev.filter((k) => k !== kw));

    const { data: channelsData } = useSWR<{ items: { id: string; username: string | null; name: string | null; isActive: boolean }[] }>(
        me?.role === "admin" ? "/api/channels?pageSize=200&showOnlyActive=false" : null,
        fetcher
    );
    const allChannels = channelsData?.items ?? [];

    if (!me || me.role !== "admin") return null;
    if (isLoading || !user) {
        return (
            <div className="animate-fade" style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                Loading...
            </div>
        );
    }

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

            <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <Link href="/dashboard/users" style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", textDecoration: "none" }}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>@{user.username}</h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                        Personalize alerts. Empty = receive all. Set channels/keywords to filter.
                    </p>
                </div>
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Radio size={18} color="#BF5AF2" />
                    Channels
                </h2>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem" }}>
                    Only receive alerts from these channels. Leave empty to receive from all.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {allChannels.map((ch) => (
                        <label
                            key={ch.id}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "8px",
                                background: channelIds.includes(ch.id) ? "rgba(191,90,242,0.2)" : "rgba(255,255,255,0.05)",
                                border: `1px solid ${channelIds.includes(ch.id) ? "rgba(191,90,242,0.4)" : "rgba(255,255,255,0.1)"}`,
                                cursor: "pointer",
                                fontSize: "0.85rem",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={channelIds.includes(ch.id)}
                                onChange={(e) =>
                                    setChannelIds((prev) =>
                                        e.target.checked ? [...prev, ch.id] : prev.filter((id) => id !== ch.id)
                                    )
                                }
                                style={{ accentColor: "#BF5AF2" }}
                            />
                            {ch.name || ch.username || ch.id}
                        </label>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Hash size={18} color="#FF9F0A" />
                    Keywords
                </h2>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem" }}>
                    Only receive alerts matching these keywords. Leave empty to receive all.
                </p>
                <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                    <input
                        className="input-field"
                        placeholder="Type to search existing keywords..."
                        value={keywordInput}
                        onChange={(e) => {
                            setKeywordInput(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && keywordInput.trim()) addKeyword(keywordInput);
                        }}
                        style={{ width: "100%", height: "36px", fontSize: "0.85rem" }}
                    />
                    {showSuggestions && keywordSuggestions.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                marginTop: 4,
                                background: "#1a1a2e",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                                maxHeight: 200,
                                overflowY: "auto",
                                zIndex: 10,
                            }}
                        >
                            {keywordSuggestions.map((kw) => (
                                <button
                                    key={kw}
                                    type="button"
                                    onClick={() => addKeyword(kw)}
                                    style={{
                                        width: "100%",
                                        padding: "0.5rem 0.75rem",
                                        textAlign: "left",
                                        background: "none",
                                        border: "none",
                                        color: "inherit",
                                        cursor: "pointer",
                                        fontSize: "0.85rem",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                                >
                                    {kw}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {keywords.map((kw) => (
                        <span
                            key={kw}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                padding: "0.35rem 0.6rem",
                                borderRadius: "8px",
                                background: "rgba(255,159,10,0.15)",
                                border: "1px solid rgba(255,159,10,0.3)",
                                fontSize: "0.85rem",
                            }}
                        >
                            {kw}
                            <button
                                type="button"
                                onClick={() => removeKeyword(kw)}
                                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={save} disabled={saving} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving…" : "Save"}
                </button>
                <Link href="/dashboard/users" className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                    Cancel
                </Link>
            </div>
        </div>
    );
}
