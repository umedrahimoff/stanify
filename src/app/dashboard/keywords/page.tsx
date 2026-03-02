"use client";

import { useState } from "react";
import { Plus, X, Hash, Loader2 } from "lucide-react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";

interface Keyword {
    id: string;
    text: string;
}

export default function KeywordsPage() {
    const [newKeyword, setNewKeyword] = useState("");
    const [adding, setAdding] = useState(false);
    const { data: keywords = [], isLoading, mutate } = useSWR<Keyword[]>("/api/keywords");
    const { mutate: mutateStats } = useSWRConfig();

    const handleAdd = async () => {
        if (!newKeyword.trim()) return;
        setAdding(true);
        try {
            const res = await axios.post("/api/keywords", { text: newKeyword });
            setNewKeyword("");
            mutate([res.data, ...keywords], false);
            mutateStats("/api/stats");
        } catch (error) {
            console.error("Failed to add keyword:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await axios.delete("/api/keywords", { data: { id } });
            mutate(keywords.filter((k) => k.id !== id), false);
            mutateStats("/api/stats");
        } catch (error) {
            console.error("Failed to remove keyword:", error);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Keywords</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Manage keywords that trigger immediate notifications.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '400px', width: '100%' }}>
                    <input
                        className="input-field"
                        placeholder="Add keyword..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        disabled={adding}
                    />
                    <button
                        className="btn-primary"
                        onClick={handleAdd}
                        disabled={adding}
                        style={{ width: "60px", minWidth: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        {adding ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {keywords.length === 0 ? (
                            <div style={{ color: 'rgba(255,255,255,0.2)', padding: '2rem', textAlign: 'center', width: '100%' }}>
                                No keywords added yet. Start by adding one above.
                            </div>
                        ) : (
                            keywords.map((kw) => (
                                <div
                                    key={kw.id}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '0.6rem 1rem',
                                        borderRadius: '100px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Hash size={14} color="#00A3FF" />
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{kw.text}</span>
                                    <button
                                        onClick={() => handleRemove(kw.id)}
                                        className="remove-btn"
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '2px'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                    Tip: English and Russian keywords supported. Case-insensitive.
                </p>
            </div>
        </div>
    );
}
