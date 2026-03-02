"use client";

import { useState } from "react";
import { Bell, Search, ExternalLink, Calendar, Hash, MoreVertical, Trash2 } from "lucide-react";

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([
        { id: "1", channel: "@TechInsider", content: "Bitcoin hits new all-time high of $75,000 as institutional interest surges.", keyword: "bitcoin", time: "2 hours ago", date: "Oct 24, 2026" },
        { id: "2", channel: "@Bloomberg", content: "Federal Reserve signals potential rate cut in December meeting.", keyword: "market", time: "4 hours ago", date: "Oct 24, 2026" },
        { id: "3", channel: "@CryptoNews", content: "Ethereum foundation clarifies staking roadmap updates for Q4.", keyword: "ethereum", time: "6 hours ago", date: "Oct 24, 2026" },
        { id: "4", channel: "@MarketMojo", content: "New AI startup raises $50M in Series A led by top tier VCs.", keyword: "startup", time: "1 day ago", date: "Oct 23, 2026" },
        { id: "5", channel: "@Verge", content: "Apple announces GPT-4o integration into Siri for upcoming iOS update.", keyword: "ai", time: "1 day ago", date: "Oct 23, 2026" },
    ]);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Alerts</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Browse the history of matched news items.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '400px', width: '100%' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input className="input-field" placeholder="Search alerts..." style={{ paddingLeft: '3rem' }} />
                    </div>
                    <button className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Trash2 size={18} />
                        Clear
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.map((alert) => (
                    <div key={alert.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', background: 'rgba(0, 163, 255, 0.1)', borderRadius: '0.75rem', color: '#00A3FF' }}>
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{alert.channel}</span>
                                        <span style={{ height: '4px', width: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}></span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00D1FF', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(0, 209, 255, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>
                                            <Hash size={12} />
                                            {alert.keyword.toUpperCase()}
                                        </div>
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} />
                                        {alert.date}
                                        <span style={{ padding: '0 0.5rem' }}>|</span>
                                        {alert.time}
                                    </div>
                                </div>
                            </div>
                            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            padding: '1.25rem',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {alert.content}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-secondary"
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600
                                }}
                            >
                                <ExternalLink size={16} />
                                Open Message
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
