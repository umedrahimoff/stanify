"use client";

import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Radio, Hash, Calendar, ExternalLink } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { formatDate } from "@/lib/date";
import { markdownToHtml } from "@/lib/telegramFormat";

interface Alert {
    id: string;
    channelName: string;
    content: string;
    matchedWord: string;
    postLink: string | null;
    createdAt: string;
}

export default function ArchiveDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const { data: alert, error, isLoading } = useSWR<Alert>(
        id ? `/api/alerts/${id}` : null,
        fetcher
    );

    if (isLoading || error) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem", height: "100%", alignItems: "center" }}>
                <Loader2 className="animate-spin" size={32} color="#00A3FF" />
            </div>
        );
    }

    if (!alert) {
        return (
            <div className="animate-fade">
                <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
                    Post not found.
                </p>
                <Link
                    href="/dashboard/archive"
                    style={{
                        color: "#00A3FF",
                        textDecoration: "none",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <ArrowLeft size={18} /> Back to Archive
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <Link
                href="/dashboard/archive"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                    textDecoration: "none",
                    transition: "color 0.2s",
                }}
            >
                <ArrowLeft size={16} /> Back to Archive
            </Link>

            <div className="card" style={{ padding: "1rem" }}>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1rem",
                        paddingBottom: "1rem",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} color="rgba(255,255,255,0.4)" />
                        <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                            {formatDate(alert.createdAt)}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Radio size={14} color="#00A3FF" />
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                            {alert.channelName}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Hash size={14} color="#00FF75" />
                        <span
                            style={{
                                background: "rgba(0,163,255,0.1)",
                                color: "#00A3FF",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "100px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                            }}
                        >
                            {alert.matchedWord}
                        </span>
                    </div>
                    {alert.postLink && (
                        <a
                            href={alert.postLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                color: "#00A3FF",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                border: "1px solid rgba(0,163,255,0.3)",
                                padding: "0.3rem 0.6rem",
                                borderRadius: "8px",
                                transition: "all 0.2s",
                            }}
                        >
                            Open in Telegram <ExternalLink size={12} />
                        </a>
                    )}
                </div>

                <div>
                    <h3
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.5)",
                            marginBottom: "0.5rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        Full Post Text
                    </h3>
                    <div
                        style={{
                            fontSize: "0.85rem",
                            lineHeight: 1.5,
                            color: "rgba(255,255,255,0.9)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                        dangerouslySetInnerHTML={{
                            __html: markdownToHtml(alert.content || "(No text)"),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
