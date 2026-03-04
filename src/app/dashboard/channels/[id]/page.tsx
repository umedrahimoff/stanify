"use client";

import { useState, KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Calendar, ExternalLink, Hash, Plus, X, Sparkles, Languages, History } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { markdownToHtml } from "@/lib/telegramFormat";
import Link from "next/link";
import axios from "axios";
import { formatDate } from "@/lib/date";

interface Channel {
    id: string;
    name: string | null;
    username: string | null;
    telegramId: string;
    isActive: boolean;
    saveAllPosts?: boolean;
    language: string | null;
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

interface ChannelPost {
    id: string;
    content: string;
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

    const { data: channels = [], mutate: mutateChannels } = useSWR<Channel[]>(id ? "/api/channels" : null, fetcher);
    const currentChannel = channels.find((c) => c.id === id);

    const { data: keywords = [], isLoading: keywordsLoading, mutate: mutateKeywords } = useSWR<ChannelKeyword[]>(
        id ? `/api/channels/${id}/keywords` : null,
        fetcher
    );
    const { data: parserSettings } = useSWR<{ parserEnabled: boolean }>("/api/settings/parser", fetcher);
    const { mutate: mutateStats } = useSWRConfig();
    const [keywordInput, setKeywordInput] = useState("");
    const [addingKw, setAddingKw] = useState(false);

    const parseKeywords = (s: string) =>
        [...new Set(s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean))];

    const addKeyword = async () => {
        const texts = parseKeywords(keywordInput);
        if (!texts.length || !id) return;
        setAddingKw(true);
        try {
            await axios.post(`/api/channels/${id}/keywords`, { texts });
            setKeywordInput("");
            mutateKeywords();
            mutateStats("/api/stats");
        } catch (e) {
            console.error("Failed to add keyword:", e);
        } finally {
            setAddingKw(false);
        }
    };

    const removeKeyword = async (kwId: string) => {
        try {
            await axios.delete(`/api/channels/${id}/keywords`, { data: { ids: [kwId] } });
            mutateKeywords();
            mutateStats("/api/stats");
        } catch (e) {
            console.error("Failed to remove keyword:", e);
        }
    };

    const suggestKeywords = async () => {
        setSuggesting(true);
        setSuggestedKeywords([]);
        try {
            const { data } = await axios.post<{ keywords: string[] }>(`/api/channels/${id}/suggest-keywords`);
            setSuggestedKeywords(data.keywords ?? []);
        } catch (e: any) {
            alert(e.response?.data?.error || "Error");
        } finally {
            setSuggesting(false);
        }
    };

    const detectLanguage = async () => {
        setDetectingLang(true);
        try {
            await axios.post(`/api/channels/${id}/detect-language`);
            mutateStats("/api/channels");
        } catch (e: any) {
            alert(e.response?.data?.error || "Error");
        } finally {
            setDetectingLang(false);
        }
    };

    const toggleSaveAllPosts = async () => {
        if (!id) return;
        try {
            await axios.patch(`/api/channels/${id}`, { saveAllPosts: !currentChannel?.saveAllPosts });
            mutateChannels();
            mutateStats("/api/channels");
            mutateStats("/api/data");
        } catch (e: any) {
            alert(e.response?.data?.error || "Failed to update");
        }
    };

    const addSuggestedKeyword = async (kw: string) => {
        try {
            await axios.post(`/api/channels/${id}/keywords`, { texts: [kw] });
            setSuggestedKeywords((prev) => prev.filter((k) => k !== kw));
            mutateKeywords();
            mutateStats("/api/stats");
        } catch (e) {
            console.error("Failed to add:", e);
        }
    };

    const runBackfill = async () => {
        if (!id) return;
        const body: Record<string, unknown> = { sendNotifications: backfillNotify, saveAll: backfillSaveAll };
        if (backfillMode === "date") {
            if (!backfillFrom || !backfillTo) {
                alert("Select date range");
                return;
            }
            body.dateFrom = backfillFrom;
            body.dateTo = backfillTo;
        } else {
            const n = parseInt(backfillLimit, 10);
            if (isNaN(n) || n < 1) {
                alert("Enter number of messages (1–5000)");
                return;
            }
            body.limit = n;
        }
        setBackfilling(true);
        try {
            const res = await axios.post(`/api/channels/${id}/backfill`, body);
            mutateStats("/api/stats");
            mutateStats(`/api/alerts?channelId=${id}`);
            mutateStats(`/api/channels/${id}/posts`);
            alert(`Parsed ${res.data.totalScanned} messages, ${res.data.totalMatches} matches`);
        } catch (e: any) {
            alert(e.response?.data?.error || "Backfill failed");
        } finally {
            setBackfilling(false);
        }
    };

    const [suggesting, setSuggesting] = useState(false);
    const [detectingLang, setDetectingLang] = useState(false);
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    const [backfillMode, setBackfillMode] = useState<"date" | "limit">("limit");
    const [backfillFrom, setBackfillFrom] = useState("");
    const [backfillTo, setBackfillTo] = useState("");
    const [backfillLimit, setBackfillLimit] = useState("100");
    const [backfillNotify, setBackfillNotify] = useState(false);
    const [backfillSaveAll, setBackfillSaveAll] = useState(true);
    const [backfilling, setBackfilling] = useState(false);
    const [postsMode, setPostsMode] = useState<"all" | "matched">("all");
    const [postsPage, setPostsPage] = useState(1);
    const POSTS_PAGE_SIZE = 15;
    const alertsKey = id && postsMode === "matched" ? `/api/alerts?page=${postsPage}&pageSize=${POSTS_PAGE_SIZE}&channelId=${id}` : null;
    const channelPostsKey = id && postsMode === "all" ? `/api/channels/${id}/posts?page=${postsPage}&pageSize=${POSTS_PAGE_SIZE}` : null;
    const { data: alertsData, isLoading: alertsLoading } = useSWR<{ items: Alert[]; total: number }>(alertsKey, fetcher);
    const { data: postsData, isLoading: postsLoading } = useSWR<{ items: ChannelPost[]; total: number }>(channelPostsKey, fetcher);
    const alerts = alertsData?.items ?? [];
    const channelPosts = postsData?.items ?? [];
    const alertsTotal = alertsData?.total ?? 0;
    const postsTotal = postsData?.total ?? 0;
    const total = postsMode === "all" ? postsTotal : alertsTotal;
    const totalPages = Math.ceil(total / POSTS_PAGE_SIZE) || 1;

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
                    gap: "0.4rem",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    textDecoration: "none",
                }}
            >
                <ArrowLeft size={16} /> Back to Channels
            </Link>

            {!currentChannel ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <Loader2 className="animate-spin" size={28} color="#00A3FF" />
                </div>
            ) : (
                <>
                    <div className="card" style={{ padding: "0", marginBottom: "1rem" }}>
                        <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, rgba(0,163,255,0.2), rgba(0,163,255,0.05))",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    color: "#00A3FF",
                                    fontSize: "1rem",
                                }}
                            >
                                {currentChannel.name ? currentChannel.name[0].toUpperCase() : "?"}
                            </div>
                            <div>
                                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.15rem" }}>
                                    {currentChannel.name || "Unknown"}
                                </h1>
                                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                                    {currentChannel.username ? `@${currentChannel.username}` : `ID: ${currentChannel.telegramId}`}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", flexWrap: "wrap" }}>
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                        <Calendar size={14} />
                                        Added {formatDate(currentChannel.createdAt)}
                                    </span>
                                    <button
                                        onClick={toggleSaveAllPosts}
                                        title={currentChannel.saveAllPosts ? "Saving all posts to archive. Click to save only keyword matches." : "Saving only keyword matches. Click to save all posts."}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.35rem",
                                            padding: "0.2rem 0.5rem",
                                            borderRadius: "6px",
                                            background: currentChannel.saveAllPosts ? "rgba(0,255,117,0.15)" : "rgba(255,255,255,0.05)",
                                            border: `1px solid ${currentChannel.saveAllPosts ? "rgba(0,255,117,0.3)" : "rgba(255,255,255,0.1)"}`,
                                            color: currentChannel.saveAllPosts ? "#00FF75" : "rgba(255,255,255,0.5)",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {currentChannel.saveAllPosts ? "Full archive" : "Keywords only"}
                                    </button>
                                    {currentChannel.language && (
                                        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "rgba(191,90,242,0.15)", color: "#BF5AF2", padding: "0.15rem 0.5rem", borderRadius: "100px", fontWeight: 600 }}>
                                            <Languages size={12} />
                                            {currentChannel.language}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Keywords</h2>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <button
                                    onClick={suggestKeywords}
                                    disabled={suggesting}
                                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: "rgba(191,90,242,0.15)", border: "1px solid rgba(191,90,242,0.3)", borderRadius: "8px", color: "#BF5AF2", cursor: suggesting ? "not-allowed" : "pointer" }}
                                >
                                    {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    Suggest
                                </button>
                                <button
                                    onClick={detectLanguage}
                                    disabled={detectingLang}
                                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: "rgba(191,90,242,0.15)", border: "1px solid rgba(191,90,242,0.3)", borderRadius: "8px", color: "#BF5AF2", cursor: detectingLang ? "not-allowed" : "pointer" }}
                                >
                                    {detectingLang ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                                    Language
                                </button>
                                <Link
                                    href="/dashboard/keywords"
                                    style={{ fontSize: "0.8rem", color: "#00A3FF", textDecoration: "none", fontWeight: 500 }}
                                >
                                    Manage in Keywords →
                                </Link>
                            </div>
                        </div>
                        {suggestedKeywords.length > 0 && (
                            <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>Suggestions:</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                    {suggestedKeywords.map((kw) => (
                                        <button
                                            key={kw}
                                            onClick={() => addSuggestedKeyword(kw)}
                                            style={{ background: "rgba(191,90,242,0.2)", color: "#BF5AF2", padding: "0.2rem 0.5rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, border: "1px solid rgba(191,90,242,0.4)", cursor: "pointer" }}
                                        >
                                            + {kw}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                            <input
                                className="input-field"
                                placeholder="keyword1, keyword2..."
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                                style={{ flex: 1, minWidth: "180px", height: "36px", fontSize: "0.85rem" }}
                            />
                            <button
                                onClick={addKeyword}
                                disabled={addingKw || !keywordInput.trim()}
                                className="btn-primary"
                                style={{ height: "36px", padding: "0 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                                {addingKw ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Add
                            </button>
                        </div>
                        {keywordsLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}><Loader2 className="animate-spin" size={20} color="#00A3FF" /></div>
                        ) : keywords.length === 0 ? (
                            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>No keywords. Add above or in Keywords section.</span>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {keywords.map((kw) => (
                                    <span key={kw.id} style={{ background: "rgba(0,163,255,0.1)", color: "#00A3FF", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem", border: "1px solid rgba(0,163,255,0.2)" }}>
                                        <Hash size={12} />
                                        {kw.text}
                                        <button
                                            onClick={() => removeKeyword(kw.id)}
                                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex", opacity: 0.7 }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {parserSettings?.parserEnabled === true && (
                        <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                <History size={18} color="#BF5AF2" />
                                <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Parse old messages</h2>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.75rem" }}>
                                Scan historical messages for this channel. Matches saved to Archive.
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}>
                                        <input type="radio" name="backfillMode" checked={backfillMode === "limit"} onChange={() => setBackfillMode("limit")} style={{ accentColor: "#BF5AF2" }} />
                                        Last N messages
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}>
                                        <input type="radio" name="backfillMode" checked={backfillMode === "date"} onChange={() => setBackfillMode("date")} style={{ accentColor: "#BF5AF2" }} />
                                        Date range
                                    </label>
                                </div>
                                {backfillMode === "limit" ? (
                                    <div>
                                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>Messages</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={5000}
                                            className="input-field"
                                            value={backfillLimit}
                                            onChange={(e) => setBackfillLimit(e.target.value)}
                                            placeholder="100"
                                            style={{ width: "100px", height: "36px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>From</label>
                                            <input type="date" className="input-field" value={backfillFrom} onChange={(e) => setBackfillFrom(e.target.value)} style={{ height: "36px", fontSize: "0.85rem" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.25rem" }}>To</label>
                                            <input type="date" className="input-field" value={backfillTo} onChange={(e) => setBackfillTo(e.target.value)} style={{ height: "36px", fontSize: "0.85rem" }} />
                                        </div>
                                    </>
                                )}
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}>
                                        <input type="radio" name="backfillSave" checked={backfillSaveAll} onChange={() => setBackfillSaveAll(true)} style={{ accentColor: "#BF5AF2" }} />
                                        All posts
                                    </label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}>
                                        <input type="radio" name="backfillSave" checked={!backfillSaveAll} onChange={() => setBackfillSaveAll(false)} style={{ accentColor: "#BF5AF2" }} />
                                        Only keywords
                                    </label>
                                </div>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                                    <input type="checkbox" checked={backfillNotify} onChange={(e) => setBackfillNotify(e.target.checked)} style={{ accentColor: "#BF5AF2" }} />
                                    Send to Telegram
                                </label>
                                <button
                                    onClick={runBackfill}
                                    disabled={backfilling || (backfillMode === "date" && (!backfillFrom || !backfillTo)) || (backfillMode === "limit" && (!backfillLimit.trim() || parseInt(backfillLimit, 10) < 1))}
                                    className="btn-primary"
                                    style={{ height: "36px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                                >
                                    {backfilling ? <Loader2 size={16} className="animate-spin" /> : <History size={16} />}
                                    {backfilling ? "Scanning…" : "Run"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>
                            Posts ({total})
                        </h2>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                            <button
                                onClick={() => { setPostsMode("all"); setPostsPage(1); }}
                                title="All posts, with or without keywords"
                                style={{
                                    padding: "0.35rem 0.75rem",
                                    fontSize: "0.8rem",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    background: postsMode === "all" ? "rgba(0,163,255,0.15)" : "transparent",
                                    borderColor: postsMode === "all" ? "rgba(0,163,255,0.4)" : "rgba(255,255,255,0.1)",
                                    color: postsMode === "all" ? "#00A3FF" : "rgba(255,255,255,0.5)",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                All
                            </button>
                            <button
                                onClick={() => { setPostsMode("matched"); setPostsPage(1); }}
                                title="Only posts that matched keywords"
                                style={{
                                    padding: "0.35rem 0.75rem",
                                    fontSize: "0.8rem",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    background: postsMode === "matched" ? "rgba(0,163,255,0.15)" : "transparent",
                                    borderColor: postsMode === "matched" ? "rgba(0,163,255,0.4)" : "rgba(255,255,255,0.1)",
                                    color: postsMode === "matched" ? "#00A3FF" : "rgba(255,255,255,0.5)",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                }}
                            >
                                Matched
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: "0" }}>
                        {(postsMode === "all" ? postsLoading : alertsLoading) ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                                <Loader2 className="animate-spin" size={28} color="#00A3FF" />
                            </div>
                        ) : postsMode === "all" ? (
                            channelPosts.length === 0 ? (
                                <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                                    No saved posts. Enable Full archive and run backfill to save all posts.
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table className="table-dashboard">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Preview</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {channelPosts.map((post) => (
                                                <tr key={post.id}>
                                                    <td style={{ color: "rgba(255,255,255,0.7)" }}>{formatDate(post.createdAt)}</td>
                                                    <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        <span dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content || "(no text)", { breakLines: false }) }} />
                                                    </td>
                                                    <td className="td-right">
                                                        {post.postLink ? (
                                                            <a href={post.postLink} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}>
                                                                Open <ExternalLink size={12} />
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : alerts.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                                No keyword matches yet.
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
                                                <td style={{ color: "rgba(255,255,255,0.7)" }}>{formatDate(alert.createdAt)}</td>
                                                <td><span className="keyword-badge">{alert.matchedWord}</span></td>
                                                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    <span dangerouslySetInnerHTML={{ __html: markdownToHtml(alert.content || "(no text)", { breakLines: false }) }} />
                                                </td>
                                                <td className="td-right">
                                                    <Link href={`/dashboard/archive/${alert.id}`} className="btn-link" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}>
                                                        View <ExternalLink size={12} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginTop: "1rem" }}>
                            <button
                                onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                                disabled={postsPage <= 1}
                                style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: postsPage <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: postsPage <= 1 ? "not-allowed" : "pointer" }}
                            >
                                ←
                            </button>
                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", padding: "0 0.5rem" }}>
                                {postsPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPostsPage((p) => Math.min(totalPages, p + 1))}
                                disabled={postsPage >= totalPages}
                                style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: postsPage >= totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: postsPage >= totalPages ? "not-allowed" : "pointer" }}
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
