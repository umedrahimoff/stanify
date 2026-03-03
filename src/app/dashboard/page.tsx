"use client";

import { useState } from "react";
import { Activity, Bell, Radio, Hash, ArrowUpRight, BarChart3, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { formatDate } from "@/lib/date";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";

type Period = "all" | "24h" | "3d" | "7d" | "30d";

interface Stats {
    totalAlerts: number;
    totalPostsScanned: number;
    activeChannels: number;
    activeKeywords: number;
    systemHealth: string;
    recentAlerts: any[];
    alertsByWeek: { week: string; count: number }[];
    alertsByChannel: { name: string; count: number }[];
    alertsByKeyword: { keyword: string; count: number }[];
    alertsByDay: { day: string; count: number }[];
    lastScan: { date: string; count: number } | null;
}

function DashboardSkeleton() {
    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "1.5rem" }}>
                <div className="skeleton" style={{ width: "160px", height: "1.5rem", marginBottom: "0.5rem" }} />
                <div className="skeleton" style={{ width: "320px", maxWidth: "100%", height: "0.9rem" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.25rem", width: "100%" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="card" style={{ padding: "1rem" }}>
                        <div className="skeleton" style={{ width: "40px", height: "40px", borderRadius: "10px", marginBottom: "0.75rem" }} />
                        <div className="skeleton" style={{ width: "60%", height: "1.25rem", marginBottom: "0.35rem" }} />
                        <div className="skeleton" style={{ width: "80%", height: "0.8rem" }} />
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <div className="skeleton" style={{ width: "18px", height: "18px", borderRadius: "4px" }} />
                    <div className="skeleton" style={{ width: "120px", height: "1rem" }} />
                </div>
                <div className="skeleton" style={{ width: "100%", height: "220px", borderRadius: "8px" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "1rem" }}>
                <div className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", alignItems: "center" }}>
                        <div className="skeleton" style={{ width: "100px", height: "1rem" }} />
                        <div className="skeleton" style={{ width: "60px", height: "0.8rem" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} style={{ padding: "0.9rem 1rem", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div className="skeleton" style={{ width: "40%", height: "0.9rem", marginBottom: "0.4rem" }} />
                                <div className="skeleton" style={{ width: "60%", height: "0.8rem" }} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card" style={{ padding: "1rem" }}>
                    <div className="skeleton" style={{ width: "110px", height: "1rem", marginBottom: "1rem" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {[1, 2].map((i) => (
                            <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                <div className="skeleton" style={{ width: "8px", height: "8px", borderRadius: "50%", marginTop: "0.4rem", flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: "70%", height: "0.9rem", marginBottom: "0.35rem" }} />
                                    <div className="skeleton" style={{ width: "100%", height: "0.75rem" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "24h", label: "24 часа" },
    { value: "3d", label: "3 дня" },
    { value: "7d", label: "7 дней" },
    { value: "30d", label: "Месяц" },
    { value: "all", label: "Всё время" },
];

export default function Dashboard() {
    const [period, setPeriod] = useState<Period>("7d");
    const statsKey = period === "all" ? "/api/stats" : `/api/stats?period=${period}`;
    const { data: stats, error, isLoading } = useSWR<Stats>(statsKey);

    if (isLoading || error || !stats) {
        return <DashboardSkeleton />;
    }

    const cards = [
        { title: "Posts Scanned", value: (stats.totalPostsScanned ?? 0).toLocaleString(), icon: Eye, color: "#00D1FF" },
        { title: "Total Alerts", value: stats.totalAlerts, icon: Bell, color: "#00A3FF" },
        { title: "Active Channels", value: stats.activeChannels, icon: Radio, color: "#00FF75" },
        { title: "Keywords Monitor", value: stats.activeKeywords, icon: Hash, color: "#BF5AF2" },
        { title: "System Health", value: stats.systemHealth, icon: Activity, color: "#FF9F0A" },
    ];

    return (
        <div className="animate-fade" style={{ width: "100%" }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Overview</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Instant performance overview of your Stanify monitoring network.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="rgba(255,255,255,0.4)" />
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as Period)}
                        className="input-field"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', height: 'auto', minWidth: '140px' }}
                    >
                        {PERIOD_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="dashboard-cards" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.25rem", width: "100%" }}>
                {cards.map((card) => (
                    <div key={card.title} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ background: `${card.color}15`, padding: '0.5rem', borderRadius: '10px' }}>
                                <card.icon color={card.color} size={20} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.15rem' }}>{card.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{card.title}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <BarChart3 size={18} color="#00A3FF" />
                        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Posts per week</h2>
                    </div>
                    <div style={{ width: "100%", height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.alertsByWeek ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} allowDecimals={false} />
                                <Bar dataKey="count" fill="#00A3FF" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card" style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Activity size={18} color="#00FF75" />
                        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{period === "24h" ? "Alerts по часам" : "Alerts по дням"}</h2>
                    </div>
                    <div style={{ width: "100%", height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.alertsByDay ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} allowDecimals={false} />
                                <Line type="monotone" dataKey="count" stroke="#00FF75" strokeWidth={2} dot={{ fill: "#00FF75", r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Radio size={18} color="#BF5AF2" />
                        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Top channels</h2>
                    </div>
                    <div style={{ width: "100%", height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.alertsByChannel ?? []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} width={100} />
                                <Bar dataKey="count" fill="#BF5AF2" radius={[0, 4, 4, 0]} maxBarSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card" style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <Hash size={18} color="#FF9F0A" />
                        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Top keywords</h2>
                    </div>
                    <div style={{ width: "100%", height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.alertsByKeyword ?? []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="keyword" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} width={100} />
                                <Bar dataKey="count" fill="#FF9F0A" radius={[0, 4, 4, 0]} maxBarSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "1rem" }}>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Real-time Feed</h2>
                        <Link href="/dashboard/archive" style={{ fontSize: '0.8rem', color: '#00A3FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                            View All <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    {stats.recentAlerts.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                            Add keywords to channels to start matching.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {stats.recentAlerts.map((alert) => (
                                <Link
                                    key={alert.id}
                                    href={`/dashboard/archive/${alert.id}`}
                                    style={{
                                        padding: '0.9rem 1rem',
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

                <div className="card" style={{ padding: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>System Status</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF75', marginTop: '6px' }}></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Database</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Connected</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stats.lastScan ? '#00FF75' : 'rgba(255,255,255,0.2)', marginTop: '6px' }}></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Worker</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                    {stats.lastScan
                                        ? `Last scan: ${formatDate(stats.lastScan.date)} (${stats.lastScan.count.toLocaleString()} posts)`
                                        : "No scan data yet"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
