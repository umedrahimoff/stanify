"use client";

import { useState } from "react";
import { Loader2, Filter, Hash } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatDate } from "@/lib/date";
import Link from "next/link";

interface Alert {
    id: string;
    channelName: string;
    content: string;
    matchedWord: string;
    postLink: string | null;
    createdAt: string;
}

interface Channel {
    id: string;
    name: string | null;
    username: string | null;
}

const PAGE_SIZE = 20;

export default function AlertsHistoryPage() {
    const [channelFilter, setChannelFilter] = useState<string>("");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [keywordFilter, setKeywordFilter] = useState<string>("");
    const [page, setPage] = useState(1);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (channelFilter) params.set("channelId", channelFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (keywordFilter.trim()) params.set("keyword", keywordFilter.trim());

    const alertsKey = `/api/alerts?${params.toString()}`;
    const { data, isLoading } = useSWR<{ items: Alert[]; total: number; page: number; pageSize: number }>(alertsKey, fetcher, {
        refreshInterval: 10000,
    });
    const alerts = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    const { data: channels = [] } = useSWR<Channel[]>("/api/channels", fetcher);

    const hasFilters = channelFilter || dateFrom || dateTo || keywordFilter.trim();
    const resetPage = () => setPage(1);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Alerts History</h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>
                    Historical record of all keyword matches. Filter by date, channel, or keyword.
                </p>
            </div>

            <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.9rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                    <Filter size={18} />
                    Filters
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Channel</label>
                        <select
                            className="input-field"
                            value={channelFilter}
                            onChange={(e) => { setChannelFilter(e.target.value); resetPage(); }}
                            style={{ padding: "0.5rem 1rem", height: "40px", fontSize: "0.9rem", minWidth: "180px" }}
                        >
                            <option value="">All channels</option>
                            {channels.map((ch) => (
                                <option key={ch.id} value={ch.id}>
                                    {ch.name || ch.username || ch.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Date from</label>
                        <input
                            type="date"
                            className="input-field"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
                            style={{ padding: "0.5rem 1rem", height: "40px", fontSize: "0.9rem", minWidth: "150px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Date to</label>
                        <input
                            type="date"
                            className="input-field"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
                            style={{ padding: "0.5rem 1rem", height: "40px", fontSize: "0.9rem", minWidth: "150px" }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Keyword</label>
                        <div style={{ position: "relative" }}>
                            <Hash size={16} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }} />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Filter by keyword..."
                                value={keywordFilter}
                                onChange={(e) => { setKeywordFilter(e.target.value); resetPage(); }}
                                style={{ padding: "0.5rem 1rem 0.5rem 2.5rem", height: "40px", fontSize: "0.9rem", minWidth: "180px" }}
                            />
                        </div>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setChannelFilter("");
                                setDateFrom("");
                                setDateTo("");
                                setKeywordFilter("");
                                setPage(1);
                            }}
                            style={{
                                fontSize: "0.85rem",
                                padding: "0.5rem 1rem",
                                height: "40px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                                color: "rgba(255,255,255,0.6)",
                                cursor: "pointer",
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}` : "0 alerts"}
            </p>

            <div className="card" style={{ padding: '0' }}>
                {isLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                        <Loader2 className="animate-spin" size={40} color="#00A3FF" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                        {hasFilters ? "No alerts match the filters." : "No alerts detected yet. Monitoring is active."}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Source Channel</th>
                                    <th>Keyword</th>
                                    <th>Message Snippet</th>
                                    <th className="th-right">Link</th>
                                    <th className="th-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert) => (
                                    <tr key={alert.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{alert.channelName}</div>
                                        </td>
                                        <td>
                                            <span className="keyword-badge">{alert.matchedWord}</span>
                                        </td>
                                        <td>
                                            <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {alert.content}
                                            </div>
                                        </td>
                                        <td className="td-right">
                                            <Link href={`/dashboard/archive/${alert.id}`} className="btn-link" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}>
                                                View
                                            </Link>
                                            {alert.postLink && (
                                                <a href={alert.postLink} target="_blank" rel="noopener noreferrer" className="btn-link" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", marginLeft: "0.35rem" }}>
                                                    ↗
                                                </a>
                                            )}
                                        </td>
                                        <td className="td-right" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                            {formatDate(alert.createdAt)}
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
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: page <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: page <= 1 ? "not-allowed" : "pointer" }}
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
                        style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: page >= totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
