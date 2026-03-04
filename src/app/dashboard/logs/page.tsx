"use client";

import { useState } from "react";
import { FileText, Calendar, Hash, Radio, User, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { TableSkeleton } from "@/components/TableSkeleton";
import { FilterCard, filterClasses } from "@/components/FilterCard";
import { cn } from "@/lib/cn";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { formatDate } from "@/lib/date";
import Link from "next/link";

interface LogEntry {
    id: string;
    type: string;
    keyword: string;
    sourceChannel: string;
    recipient: string;
    success: boolean;
    errorMessage: string | null;
    alertId: string | null;
    contentPreview: string | null;
    postLink: string | null;
    createdAt: string;
}

const PAGE_SIZE = 30;

export default function LogsPage() {
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [recipientFilter, setRecipientFilter] = useState<string>("");
    const [keywordFilter, setKeywordFilter] = useState<string>("");
    const [channelFilter, setChannelFilter] = useState<string>("");
    const [successFilter, setSuccessFilter] = useState<string>("");
    const [page, setPage] = useState(1);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (typeFilter) params.set("type", typeFilter);
    if (recipientFilter.trim()) params.set("recipient", recipientFilter.trim());
    if (keywordFilter.trim()) params.set("keyword", keywordFilter.trim());
    if (channelFilter.trim()) params.set("sourceChannel", channelFilter.trim());
    if (successFilter) params.set("success", successFilter);

    const logsKey = `/api/logs?${params.toString()}`;
    const { data, isLoading } = useSWR<{ items: LogEntry[]; total: number; page: number; pageSize: number }>(logsKey, fetcher, { refreshInterval: 10000 });
    const logs = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    const hasFilters = dateFrom || dateTo || typeFilter || recipientFilter.trim() || keywordFilter.trim() || channelFilter.trim() || successFilter;

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setDateFrom("");
        setDateTo("");
        setTypeFilter("");
        setRecipientFilter("");
        setKeywordFilter("");
        setChannelFilter("");
        setSuccessFilter("");
        setPage(1);
    };

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                    Notification Logs
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                    All outgoing Telegram notifications. Filter by recipient, keyword, channel, type, and status.
                </p>
            </div>

            <FilterCard>
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
                    <label className={filterClasses.label}>Type</label>
                    <select
                        className={cn("input-field", filterClasses.input)}
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); resetPage(); }}
                    >
                        <option value="">All</option>
                        <option value="channel">Channel</option>
                        <option value="global">Global</option>
                    </select>
                </div>
                <div className={filterClasses.field}>
                    <label className={filterClasses.label}>Recipient</label>
                    <div className="relative">
                        <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none shrink-0" />
                        <input
                            type="text"
                            className={cn("input-field", filterClasses.input, filterClasses.inputWithIcon, "min-w-[120px]")}
                            placeholder="@username"
                            value={recipientFilter}
                            onChange={(e) => { setRecipientFilter(e.target.value); resetPage(); }}
                        />
                    </div>
                </div>
                <div className={filterClasses.field}>
                    <label className={filterClasses.label}>Keyword</label>
                    <div className="relative">
                        <Hash size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none shrink-0" />
                        <input
                            type="text"
                            className={cn("input-field", filterClasses.input, filterClasses.inputWithIcon, "min-w-[100px]")}
                            placeholder="Keyword..."
                            value={keywordFilter}
                            onChange={(e) => { setKeywordFilter(e.target.value); resetPage(); }}
                        />
                    </div>
                </div>
                <div className={filterClasses.field}>
                    <label className={filterClasses.label}>Source channel</label>
                    <div className="relative">
                        <Radio size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none shrink-0" />
                        <input
                            type="text"
                            className={cn("input-field", filterClasses.input, filterClasses.inputWithIcon, "min-w-[120px]")}
                            placeholder="Channel name..."
                            value={channelFilter}
                            onChange={(e) => { setChannelFilter(e.target.value); resetPage(); }}
                        />
                    </div>
                </div>
                <div className={filterClasses.field}>
                    <label className={filterClasses.label}>Status</label>
                    <select
                        className={cn("input-field", filterClasses.input)}
                        value={successFilter}
                        onChange={(e) => { setSuccessFilter(e.target.value); resetPage(); }}
                    >
                        <option value="">All</option>
                        <option value="true">Success</option>
                        <option value="false">Failed</option>
                    </select>
                </div>
                {hasFilters && (
                    <button onClick={clearFilters} className={filterClasses.clearBtn}>
                        Clear
                    </button>
                )}
            </FilterCard>

            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>
                {total > 0
                    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                    : "0 logs"}
            </p>

            <div className="card" style={{ padding: "0" }}>
                {isLoading ? (
                    <TableSkeleton columns={7} rows={15} />
                ) : logs.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                        {hasFilters ? "No logs match the filters." : "No notification logs yet. Logs appear when alerts are sent."}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Keyword</th>
                                    <th>Source</th>
                                    <th>Recipient</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Calendar size={14} color="rgba(255,255,255,0.4)" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    padding: "0.2rem 0.5rem",
                                                    borderRadius: "6px",
                                                    background: log.type === "global" ? "rgba(191,90,242,0.15)" : "rgba(0,163,255,0.15)",
                                                    color: log.type === "global" ? "#BF5AF2" : "#00A3FF",
                                                }}
                                            >
                                                {log.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="keyword-badge">{log.keyword}</span>
                                        </td>
                                        <td style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)" }}>
                                            {log.sourceChannel}
                                        </td>
                                        <td>
                                            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                <User size={14} color="rgba(255,255,255,0.4)" />
                                                @{log.recipient}
                                            </span>
                                        </td>
                                        <td>
                                            {log.success ? (
                                                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#00FF75" }}>
                                                    <CheckCircle size={14} />
                                                    Sent
                                                </span>
                                            ) : (
                                                <span
                                                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#FF4545", cursor: "help" }}
                                                    title={log.errorMessage ? `Error: ${log.errorMessage}` : "Delivery failed"}
                                                >
                                                    <XCircle size={14} />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                                                {log.alertId && (
                                                    <Link
                                                        href={`/dashboard/archive/${log.alertId}`}
                                                        className="btn-link"
                                                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                                    >
                                                        View <ExternalLink size={12} />
                                                    </Link>
                                                )}
                                                {log.postLink && (
                                                    <a
                                                        href={log.postLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-link"
                                                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                                                    >
                                                        Post
                                                    </a>
                                                )}
                                            </div>
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
