"use client";

import { useState, useEffect } from "react";
import { Activity, Bell, Radio, Hash, ArrowUpRight, Loader2 } from "lucide-react";
import axios from "axios";

interface Stats {
    totalAlerts: number;
    activeChannels: number;
    activeKeywords: number;
    systemHealth: string;
    recentAlerts: any[];
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get("/api/stats");
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex justify-center p-12 h-full items-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    const cards = [
        { title: "Total Alerts", value: stats.totalAlerts, icon: Bell, color: "#00A3FF" },
        { title: "Active Channels", value: stats.activeChannels, icon: Radio, color: "#00FF75" },
        { title: "Keywords Monitor", value: stats.activeKeywords, icon: Hash, color: "#BF5AF2" },
        { title: "System Health", value: stats.systemHealth, icon: Activity, color: "#FF9F0A" },
    ];

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Overview</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Instant performance overview of your Stanify monitoring network.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {cards.map((card) => (
                    <div key={card.title} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div style={{ background: `${card.color}15`, padding: '0.75rem', borderRadius: '12px' }}>
                                <card.icon color={card.color} size={24} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#00FF75', fontWeight: 600 }}>+12%</div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{card.value}</div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{card.title}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Real-time Feed</h2>
                        <button style={{ fontSize: '0.8rem', color: '#00A3FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>
                    {stats.recentAlerts.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            Waiting for matches. Add some keywords to start.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats.recentAlerts.map((alert, i) => (
                                <div key={i} style={{
                                    padding: '1.25rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{alert.channelName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                                            Matched: <span style={{ color: '#00A3FF' }}>{alert.matchedWord}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(alert.createdAt).toLocaleTimeString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>System Status</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF75', marginTop: '6px' }}></div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Telegram Node</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Status: Active, Data Center: DC2</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF75', marginTop: '6px' }}></div>
                            <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Database Stream</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Status: Operational, Last Sync: 1m ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
