"use client";

import { useState, useEffect } from "react";
import { Search, Radio, Loader2, Link as LinkIcon, Plus, X, ListFilter, Trash2 } from "lucide-react";
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
    const [newChannel, setNewChannel] = useState("");
    const [adding, setAdding] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showOnlyActive, setShowOnlyActive] = useState(false);

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

    const handleSync = async () => {
        setSyncing(true);
        try {
            await axios.post("/api/channels/sync");
            await fetchChannels();
            alert("Channels synced successfully!");
        } catch (error) {
            console.error("Sync failed:", error);
            alert("Sync failed. Check console.");
        } finally {
            setSyncing(false);
        }
    };

    const handleAdd = async () => {
        if (!newChannel.trim()) return;
        setAdding(true);
        try {
            const cleanSource = newChannel.trim();
            const res = await axios.post("/api/channels", {
                username: cleanSource
            });
            setChannels([res.data, ...channels]);
            setNewChannel("");
        } catch (error: any) {
            console.error("Failed to add channel:", error);
            alert(error.response?.data?.error || "Failed to add channel");
        } finally {
            setAdding(false);
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

    const deleteChannel = async (id: string) => {
        if (!confirm("Are you sure you want to hide this channel from the list?")) return;
        try {
            await axios.delete("/api/channels", { data: { id } });
            setChannels(channels.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete channel:", error);
        }
    };

    const filteredChannels = channels.filter(c => {
        const matchesSearch = (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.username?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesActive = !showOnlyActive || c.isActive;
        return matchesSearch && matchesActive;
    });

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Source Channels</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Manage and monitor your Telegram network.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <LinkIcon
                            size={18}
                            color="rgba(255,255,255,0.3)"
                            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            placeholder="Add @username or Link..."
                            value={newChannel}
                            onChange={(e) => setNewChannel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                    </div>
                    <button className="btn-primary" onClick={handleAdd} disabled={adding} style={{ width: '80px' }}>
                        {adding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                    <Search
                        size={16}
                        color="rgba(255,255,255,0.3)"
                        style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.9rem' }}
                        placeholder="Quick search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setShowOnlyActive(!showOnlyActive)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        background: showOnlyActive ? 'rgba(0,163,255,0.1)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: showOnlyActive ? 'rgba(0,163,255,0.3)' : 'rgba(255,255,255,0.1)',
                        color: showOnlyActive ? '#00A3FF' : 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        transition: '0.2s'
                    }}
                >
                    <ListFilter size={16} />
                    {showOnlyActive ? "Showing: Active Only" : "Showing: All Sources"}
                </button>

                <button
                    onClick={handleSync}
                    disabled={syncing}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer',
                        transition: '0.2s'
                    }}
                >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                    Sync from Telegram
                </button>
            </div>

            <div className="card" style={{ padding: '0.5rem' }}>
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.25rem' }}>
                            <thead>
                                <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontWeight: 600 }}>Channel / Group Name</th>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontWeight: 600 }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChannels.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.2)' }}>
                                            No channels found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredChannels.map((c) => (
                                        <tr key={c.id} className="table-row-hover" style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        color: c.isActive ? '#00A3FF' : 'rgba(255,255,255,0.3)',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        {c.name ? c.name[0].toUpperCase() : "?"}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name || "Unknown"}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            {c.username ? `@${c.username}` : `ID: ${c.telegramId}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        background: c.isActive ? '#00FF75' : 'rgba(255,255,255,0.1)',
                                                        boxShadow: c.isActive ? '0 0 10px rgba(0,255,117,0.5)' : 'none'
                                                    }} />
                                                    <span style={{
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                        color: c.isActive ? '#00FF75' : 'rgba(255,255,255,0.2)'
                                                    }}>
                                                        {c.isActive ? 'Monitoring' : 'Paused'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => toggleStatus(c.id, c.isActive)}
                                                        className={c.isActive ? 'btn-secondary' : 'btn-primary'}
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: '32px' }}
                                                    >
                                                        {c.isActive ? 'Pause' : 'Follow'}
                                                    </button>
                                                    {!c.isActive && (
                                                        <button
                                                            onClick={() => deleteChannel(c.id)}
                                                            className="remove-btn"
                                                            style={{
                                                                color: 'rgba(255,69,69,0.5)',
                                                                padding: '6px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(255,69,69,0.05)',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                display: 'flex'
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
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
                .remove-btn:hover {
                    color: #FF4545 !important;
                    background: rgba(255,69,69,0.1) !important;
                }
            `}</style>
        </div>
    );
}
