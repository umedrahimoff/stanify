"use client";

import { useState } from "react";
import { Plus, Radio, User, Activity, MoreVertical, Search, CheckCircle2 } from "lucide-react";

export default function ChannelsPage() {
    const [channels, setChannels] = useState([
        { id: "1", username: "@TechCrunch", title: "TechCrunch", status: "Joined", icon: <Radio size={20} color="#00A3FF" /> },
        { id: "2", username: "@BloombergMarkets", title: "Bloomberg Markets", status: "Joined", icon: <Radio size={20} color="#00A3FF" /> },
        { id: "3", username: "@CryptoNews", title: "Global Crypto News", status: "Joined", icon: <Radio size={20} color="#00A3FF" /> },
        { id: "4", username: "@Verge", title: "The Verge", status: "Waitlist", icon: <User size={20} color="rgba(255,255,255,0.4)" /> },
    ]);
    const [newChannel, setNewChannel] = useState("");

    const handleJoin = () => {
        if (newChannel) {
            setChannels([...channels, { id: Date.now().toString(), username: newChannel, title: newChannel, status: "Waitlist", icon: <User size={20} color="rgba(255,255,255,0.4)" /> }]);
            setNewChannel("");
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Channels</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Manage the Telegram channels you're subscribed to.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '400px', width: '100%' }}>
                    <input
                        className="input-field"
                        placeholder="Search channels..."
                        value={newChannel}
                        onChange={(e) => setNewChannel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    <button className="btn-primary" onClick={handleJoin}>
                        <Search size={20} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {channels.map((channel) => (
                    <div key={channel.id} className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
                                {channel.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{channel.title}</div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>{channel.username}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {channel.status === "Joined" ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#00FF94', fontSize: '0.8rem', fontWeight: 800, background: 'rgba(0, 255, 148, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '100px' }}>
                                    <CheckCircle2 size={14} />
                                    JOINED
                                </div>
                            ) : (
                                <button
                                    className="btn-secondary"
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        borderRadius: '100px'
                                    }}
                                >
                                    JOIN
                                </button>
                            )}
                            <button
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                            >
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                <div style={{
                    border: '2px dashed rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '120px'
                }}
                    className="card-hover-bright"
                >
                    <div style={{
                        background: 'rgba(0, 163, 255, 0.1)',
                        padding: '1rem',
                        borderRadius: '50%',
                        marginBottom: '1rem',
                        color: '#00A3FF'
                    }}>
                        <Plus size={24} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>Add new channel</div>
                </div>
            </div>
        </div>
    );
}
