"use client";

import { useState } from "react";
import { ExternalLink, Calendar, Radio, Hash } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { FilterCard, filterClasses } from "@/components/FilterCard";
import { cn } from "@/lib/cn";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatDate } from "@/lib/date";
import Link from "next/link";

interface Alert {
    id: string;
    channelName: string;
    channelId: string | null;
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

export default function ArchivePage() {
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
    const { data, isLoading } = useSWR<{ items: Alert[]; total: number; page: number; pageSize: number }>(alertsKey, fetcher);
    const alerts = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    const { data: channels = [] } = useSWR<Channel[]>("/api/channels", fetcher);

    const hasFilters = channelFilter || dateFrom || dateTo || keywordFilter.trim();

    const resetPage = () => setPage(1);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                    Archive
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>
                    Historical posts matched by keywords. Filter by date, channel, or keyword.
                </p>
            </div>

            <FilterCard>
                    <div className={filterClasses.field}>
                        <label className={filterClasses.label}>Channel</label>
                        <select
                            className={cn("input-field", filterClasses.input, "min-w-[180px]")}
                            value={channelFilter}
                            onChange={(e) => { setChannelFilter(e.target.value); resetPage(); }}
                        >
                            <option value="">All channels</option>
                            {channels.map((ch) => (
                                <option key={ch.id} value={ch.id}>
                                    {ch.name || ch.username || ch.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={filterClasses.field}>
                        <label className={filterClasses.label}>Date from</label>
                        <input
                            type="date"
                            className={cn("input-field", filterClasses.input)}
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
                        />
                    </div>
                    <div className={filterClasses.field}>
                        <label className={filterClasses.label}>Date to</label>
                        <input
                            type="date"
                            className={cn("input-field", filterClasses.input)}
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
                        />
                    </div>
                    <div className={filterClasses.field}>
                        <label className={filterClasses.label}>Keyword</label>
                        <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none shrink-0" />
                            <input
                                type="text"
                                className={cn("input-field", filterClasses.input, "pl-[2.5rem] min-w-[180px]")}
                                placeholder="Filter by keyword..."
                                value={keywordFilter}
                                onChange={(e) => { setKeywordFilter(e.target.value); resetPage(); }}
                            />
                        </div>
                    </div>
                    {hasFilters && (
                        <button onClick={() => { setChannelFilter(""); setDateFrom(""); setDateTo(""); setKeywordFilter(""); setPage(1); }} className={filterClasses.clearBtn}>
                            Clear
                        </button>
                    )}
                </FilterCard>

            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
                {total > 0
                    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                    : "0 posts"}
            </p>

            <div className="card" style={{ padding: "0" }}>
                {isLoading ? (
                    <TableSkeleton columns={4} rows={15} />
                ) : alerts.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                        {hasFilters ? "No posts match the filters." : "No posts in archive yet. Matches will appear here."}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Source</th>
                                    <th>Keyword</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert) => (
                                    <tr key={alert.id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Calendar size={14} color="rgba(255,255,255,0.4)" />
                                                {formatDate(alert.createdAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                                                <Radio size={14} color="#00A3FF" />
                                                {alert.channelName}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="keyword-badge">{alert.matchedWord}</span>
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
        </div>
    );
}
