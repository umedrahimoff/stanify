"use client";

import { useState } from "react";
import { Loader2, ExternalLink, Calendar, Radio, Filter } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
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

export default function ArchivePage() {
    const [channelFilter, setChannelFilter] = useState<string>("");

    const alertsKey = channelFilter
        ? `/api/alerts?limit=200&channelId=${channelFilter}`
        : "/api/alerts?limit=200";
    const { data: alerts = [], isLoading } = useSWR<Alert[]>(alertsKey, fetcher);
    const { data: channels = [] } = useSWR<Channel[]>("/api/channels", fetcher);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Archive
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>
                        Historical posts matched by keywords. Click View to see full content.
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "220px" }}>
                    <Filter size={18} color="rgba(255,255,255,0.4)" />
                    <select
                        className="input-field"
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                        style={{ padding: "0.5rem 1rem", height: "40px", fontSize: "0.9rem" }}
                    >
                        <option value="">All channels</option>
                        {channels.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                                {ch.name || ch.username || ch.id}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: "0" }}>
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No posts in archive yet. Matches will appear here.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                                        color: "rgba(255,255,255,0.4)",
                                        fontSize: "0.8rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "1rem 1.5rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Date
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "1rem 1.5rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Source
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "left",
                                            padding: "1rem 1.5rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Keyword
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "right",
                                            padding: "1rem 1.5rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert) => (
                                    <tr
                                        key={alert.id}
                                        style={{
                                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                                            transition: "background 0.2s",
                                        }}
                                        className="archive-row"
                                    >
                                        <td style={{ padding: "1rem 1.5rem" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    fontSize: "0.9rem",
                                                    color: "rgba(255,255,255,0.7)",
                                                }}
                                            >
                                                <Calendar size={14} color="rgba(255,255,255,0.4)" />
                                                {new Date(alert.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem 1.5rem" }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    fontWeight: 600,
                                                    fontSize: "0.9rem",
                                                }}
                                            >
                                                <Radio size={14} color="#00A3FF" />
                                                {alert.channelName}
                                            </div>
                                        </td>
                                        <td style={{ padding: "1rem 1.5rem" }}>
                                            <span
                                                style={{
                                                    background: "rgba(0,163,255,0.1)",
                                                    color: "#00A3FF",
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "100px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {alert.matchedWord}
                                            </span>
                                        </td>
                                        <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                                            <Link
                                                href={`/dashboard/archive/${alert.id}`}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.4rem",
                                                    padding: "0.4rem 0.9rem",
                                                    borderRadius: "8px",
                                                    background: "rgba(0,163,255,0.1)",
                                                    color: "#00A3FF",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                    textDecoration: "none",
                                                    border: "1px solid rgba(0,163,255,0.2)",
                                                    transition: "all 0.2s",
                                                }}
                                            >
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

            <style>{`
                .archive-row:hover {
                    background: rgba(255,255,255,0.02);
                }
            `}</style>
        </div>
    );
}
