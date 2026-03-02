"use client";

import { Activity, Bell, Radio, Hash, ArrowUpRight, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { formatDate } from "@/lib/date";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface Stats {
    totalAlerts: number;
    activeChannels: number;
    activeKeywords: number;
    systemHealth: string;
    recentAlerts: any[];
    alertsByWeek: { week: string; count: number }[];
}

export default function Dashboard() {
    const { data: stats, error, isLoading } = useSWR<Stats>("/api/stats");

    if (isLoading || error || !stats) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem", height: "100%", alignItems: "center" }}>
                <Loader2 className="animate-spin" size={48} color="#00A3FF" />
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
                {cards.map((card) => (
                    <div key={card.title} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <div style={{ background: `${card.color}15`, padding: '0.75rem', borderRadius: '12px' }}>
                                <card.icon color={card.color} size={24} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{card.value}</div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{card.title}</div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    <BarChart3 size={20} color="#00A3FF" />
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Posts per week</h2>
                </div>
                <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.alertsByWeek ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="week"
                                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                            />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: "#1a1a2e",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "12px",
                                }}
                                labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                                formatter={(value) => [value ?? 0, "Posts"]}
                                labelFormatter={(label) => label}
                            />
                            <Bar dataKey="count" fill="#00A3FF" radius={[4, 4, 0, 0]} maxBarSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "1.5rem" }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Real-time Feed</h2>
                        <Link href="/dashboard/archive" style={{ fontSize: '0.8rem', color: '#00A3FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                            View All <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    {stats.recentAlerts.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                            Add keywords to channels to start matching.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats.recentAlerts.map((alert) => (
                                <Link
                                    key={alert.id}
                                    href={`/dashboard/archive/${alert.id}`}
                                    style={{
                                        padding: '1.25rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s, border-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(0,163,255,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{alert.channelName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                                            Matched: <span style={{ color: '#00A3FF' }}>{alert.matchedWord}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{formatDate(alert.createdAt)}</div>
                                </Link>
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
