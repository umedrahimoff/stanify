"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Calendar, ExternalLink, Hash } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { formatDate } from "@/lib/date";

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

    const { data: channels = [] } = useSWR<Channel[]>(id ? "/api/channels" : null, fetcher);
    const currentChannel = channels.find((c) => c.id === id);

    const { data: keywords = [], isLoading: keywordsLoading } = useSWR<ChannelKeyword[]>(
        id ? `/api/channels/${id}/keywords` : null,
        fetcher
    );

    const [alertsPage, setAlertsPage] = useState(1);
    const ALERTS_PAGE_SIZE = 15;
    const { data: alertsData, isLoading: alertsLoading } = useSWR<{ items: Alert[]; total: number }>(
        id ? `/api/alerts?page=${alertsPage}&pageSize=${ALERTS_PAGE_SIZE}&channelId=${id}` : null,
        fetcher
    );
    const alerts = alertsData?.items ?? [];
    const alertsTotal = alertsData?.total ?? 0;
    const alertsTotalPages = Math.ceil(alertsTotal / ALERTS_PAGE_SIZE) || 1;

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
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.35rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                                    <Calendar size={14} />
                                    Added {formatDate(currentChannel.createdAt)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Keywords</h2>
                            <Link
                                href="/dashboard/keywords"
                                style={{ fontSize: "0.8rem", color: "#00A3FF", textDecoration: "none", fontWeight: 500 }}
                            >
                                Manage in Keywords →
                            </Link>
                        </div>
                        {keywordsLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}><Loader2 className="animate-spin" size={20} color="#00A3FF" /></div>
                        ) : keywords.length === 0 ? (
                            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>No keywords. Add them in the Keywords section.</span>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {keywords.map((kw) => (
                                    <span key={kw.id} style={{ background: "rgba(0,163,255,0.1)", color: "#00A3FF", padding: "0.25rem 0.6rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                        <Hash size={12} />
                                        {kw.text}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                        Posts ({alertsTotal})
                    </h2>

                    <div className="card" style={{ padding: "0" }}>
                        {alertsLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                                <Loader2 className="animate-spin" size={28} color="#00A3FF" />
                            </div>
                        ) : alerts.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
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
                                                    {formatDate(alert.createdAt)}
                                                </td>
                                                <td>
                                                    <span className="keyword-badge">{alert.matchedWord}</span>
                                                </td>
                                                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {alert.content || "(no text)"}
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

                    {alertsTotalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", marginTop: "1rem" }}>
                            <button
                                onClick={() => setAlertsPage((p) => Math.max(1, p - 1))}
                                disabled={alertsPage <= 1}
                                style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: alertsPage <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: alertsPage <= 1 ? "not-allowed" : "pointer" }}
                            >
                                ←
                            </button>
                            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", padding: "0 0.5rem" }}>
                                {alertsPage} / {alertsTotalPages}
                            </span>
                            <button
                                onClick={() => setAlertsPage((p) => Math.min(alertsTotalPages, p + 1))}
                                disabled={alertsPage >= alertsTotalPages}
                                style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: alertsPage >= alertsTotalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: alertsPage >= alertsTotalPages ? "not-allowed" : "pointer" }}
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
