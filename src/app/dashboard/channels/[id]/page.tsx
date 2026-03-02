"use client";

import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Radio, Calendar, ExternalLink } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

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

export default function ChannelDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { data: channels = [] } = useSWR<Channel[]>(id ? "/api/channels" : null, fetcher);
    const currentChannel = channels.find((c) => c.id === id);

    const { data: alerts = [], isLoading: alertsLoading } = useSWR<Alert[]>(
        id ? `/api/alerts?limit=200&channelId=${id}` : null,
        fetcher
    );

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
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Date</th>
                                            <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Keyword</th>
                                            <th style={{ textAlign: "left", padding: "1rem 1.5rem", fontWeight: 600 }}>Preview</th>
                                            <th style={{ textAlign: "right", padding: "1rem 1.5rem", fontWeight: 600 }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.map((alert) => (
                                            <tr key={alert.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }} className="channel-row">
                                                <td style={{ padding: "1rem 1.5rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>
                                                    {new Date(alert.createdAt).toLocaleString()}
                                                </td>
                                                <td style={{ padding: "1rem 1.5rem" }}>
                                                    <span style={{ background: "rgba(0,163,255,0.1)", color: "#00A3FF", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                        {alert.matchedWord}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {alert.content || "(no text)"}
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
                        .channel-row:hover { background: rgba(255,255,255,0.02); }
                    `}</style>
                </>
            )}
        </div>
    );
}
