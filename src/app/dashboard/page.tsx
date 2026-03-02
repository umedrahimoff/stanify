"use client";

import { Activity, Hash, Radio, Bell } from "lucide-react";

export default function Dashboard() {
    const stats = [
        { title: "Channels", value: 12, icon: <Radio size={24} color="#00A3FF" />, change: "+2 today" },
        { title: "Keywords", value: 85, icon: <Hash size={24} color="#00D1FF" />, change: "Active" },
        { title: "Alerts", value: 432, icon: <Bell size={24} color="#FFD600" />, change: "+12 new" },
        { title: "Status", value: "Online", icon: <Activity size={24} color="#00FF94" />, change: "Active 4d" },
    ];

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Overview</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Welcome back to your Telegram monitoring dashboard.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                {stats.map((stat) => (
                    <div key={stat.title} className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 600 }}>
                            {stat.title}
                            {stat.icon}
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: stat.change.includes('+') ? '#00FF94' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{stat.change}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '0.5rem',
                                borderLeft: '4px solid #00A3FF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>@TechInsider</div>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Matched keyword: "crypto"</div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{i * 5}m ago</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>System Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>MTProto Session</span>
                            <span style={{ color: '#00FF94', fontWeight: 600 }}>Active</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>CPU Usage</span>
                            <span style={{ fontWeight: 600 }}>12%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>RAM Usage</span>
                            <span style={{ fontWeight: 600 }}>256MB</span>
                        </div>
                        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button className="btn-primary" style={{ width: '100%' }}>Restart Monitor</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
