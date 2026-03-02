"use client";

import { Loader2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Alert {
    id: string;
    channelName: string;
    content: string;
    matchedWord: string;
    postLink: string | null;
    createdAt: string;
}

export default function AlertsHistoryPage() {
    const { data: alerts = [], isLoading } = useSWR<Alert[]>("/api/alerts", fetcher, {
        refreshInterval: 10000,
    });

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Alerts History</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Historical record of all keyword matches.</p>
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
                                            {alert.postLink ? (
                                                <a href={alert.postLink} target="_blank" rel="noopener noreferrer" className="btn-link">
                                                    View Post
                                                </a>
                                            ) : (
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>N/A</span>
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
        </div>
    );
}
