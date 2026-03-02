"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

interface Alert {
    id: string;
    channelName: string;
    content: string;
    matchedWord: string;
    postLink: string | null;
    createdAt: string;
}

const PAGE_SIZE = 20;

export default function AlertsHistoryPage() {
    const [page, setPage] = useState(1);
    const alertsKey = `/api/alerts?page=${page}&pageSize=${PAGE_SIZE}`;
    const { data, isLoading } = useSWR<{ items: Alert[]; total: number; page: number; pageSize: number }>(alertsKey, fetcher, {
        refreshInterval: 10000,
    });
    const alerts = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Alerts History</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>
                        {total > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}` : "Historical record of all keyword matches."}
                    </p>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No alerts detected yet. Monitoring is active.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
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
                                            {new Date(alert.createdAt).toLocaleString()}
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
