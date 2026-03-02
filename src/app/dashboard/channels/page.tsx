"use client";

import { useState, useEffect } from "react";
import { Search, Radio, Loader2, Link as LinkIcon } from "lucide-react";
import axios from "axios";

interface Channel {
    id: string;
    telegramId: string;
    username: string | null;
    name: string | null;
    isActive: boolean;
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const res = await axios.get("/api/channels");
            setChannels(res.data);
        } catch (error) {
            console.error("Failed to fetch channels:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await axios.post("/api/channels", { id, isActive: !currentStatus });
            setChannels(channels.map(c => c.id === id ? res.data : c));
        } catch (error) {
            console.error("Failed to toggle channel status:", error);
        }
    };

    const filteredChannels = channels.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Source Channels</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Select which channels and groups to monitor.</p>
                </div>
                <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
                    <Search
                        size={18}
                        color="rgba(255,255,255,0.3)"
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                        className="input-field"
                        style={{ paddingLeft: '3rem' }}
                        placeholder="Search your channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                            <thead>
                                <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontWeight: 600 }}>Channel / Group Name</th>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChannels.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.2)' }}>
                                            No channels synced yet. Try syncing in Settings.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredChannels.map((c) => (
                                        <tr key={c.id} className="table-row-hover" style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, rgba(0,163,255,0.1), rgba(0,255,163,0.1))',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        color: '#00A3FF'
                                                    }}>
                                                        {c.name ? c.name[0].toUpperCase() : "?"}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.name || "Unknown"}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            {c.username ? `@${c.username}` : `ID: ${c.telegramId}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: c.isActive ? '#00FF75' : 'rgba(255,255,255,0.1)',
                                                        boxShadow: c.isActive ? '0 0 10px rgba(0,255,117,0.5)' : 'none'
                                                    }} />
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: 500,
                                                        color: c.isActive ? '#00FF75' : 'rgba(255,255,255,0.3)'
                                                    }}>
                                                        {c.isActive ? 'Active Monitoring' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                                <button
                                                    onClick={() => toggleStatus(c.id, c.isActive)}
                                                    className={c.isActive ? 'btn-secondary' : 'btn-primary'}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                                >
                                                    {c.isActive ? 'Disable' : 'Enable'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .table-row-hover:hover {
                    background: rgba(255,255,255,0.05) !important;
                }
            `}</style>
        </div>
    );
}
