"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Loader2 } from "lucide-react";
import axios from "axios";

interface Alert {
    id: string;
    channelName: string;
    content: string;
    matchedWord: string;
    postLink: string | null;
    createdAt: string;
}

export default function AlertsHistoryPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await axios.get("/api/alerts");
                setAlerts(res.data);
            } catch (error) {
                console.error("Failed to fetch alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();

        // Refresh alerts every 10 seconds
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Alerts History</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Historical record of all keyword matches.</p>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No alerts detected yet. Monitoring is active.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                    <th style={{ textAlign: 'left', padding: '1.5rem', fontWeight: 600 }}>Source Channel</th>
                                    <th style={{ textAlign: 'left', padding: '1.5rem', fontWeight: 600 }}>Keyword</th>
                                    <th style={{ textAlign: 'left', padding: '1.5rem', fontWeight: 600 }}>Message Snippet</th>
                                    <th style={{ textAlign: 'right', padding: '1.5rem', fontWeight: 600 }}>Link</th>
                                    <th style={{ textAlign: 'right', padding: '1.5rem', fontWeight: 600 }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert) => (
                                    <tr key={alert.id} className="alert-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.channelName}</div>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <span style={{
                                                background: 'rgba(0,163,255,0.1)',
                                                color: '#00A3FF',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '100px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                {alert.matchedWord}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.5rem' }}>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'rgba(255,255,255,0.7)',
                                                maxWidth: '300px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {alert.content}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                            {alert.postLink ? (
                                                <a
                                                    href={alert.postLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: '#00A3FF',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        textDecoration: 'none',
                                                        border: '1px solid rgba(0,163,255,0.3)',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    View Post
                                                </a>
                                            ) : (
                                                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>N/A</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.5rem', textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .alert-row:hover {
                    background: rgba(255,255,255,0.02);
                }
            `}</style>
        </div>
    );
}
