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
                                                {new Date(alert.createdAt).toLocaleDateString()}
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
        </div>
    );
}
