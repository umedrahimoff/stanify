"use client";

import { useState } from "react";
import { Plus, X, Hash, Search } from "lucide-react";

export default function KeywordsPage() {
    const [keywords, setKeywords] = useState([
        "crypto", "bitcoin", "ethereum", "fintech", "market", "startup", "invest", "ai", "machine learning"
    ]);
    const [newKeyword, setNewKeyword] = useState("");

    const handleAdd = () => {
        if (newKeyword && !keywords.includes(newKeyword)) {
            setKeywords([...keywords, newKeyword]);
            setNewKeyword("");
        }
    };

    const handleRemove = (kw: string) => {
        setKeywords(keywords.filter(k => k !== kw));
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
                    />
                    <button className="btn-primary" onClick={handleAdd}>
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {keywords.length === 0 ? (
                        <div style={{ color: 'rgba(255,255,255,0.2)', padding: '2rem', textAlign: 'center', width: '100%' }}>
                            No keywords added yet. Start by adding one above.
                        </div>
                    ) : (
                        keywords.map((kw) => (
                            <div
                                key={kw}
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
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{kw}</span>
                                <button
                                    onClick={() => handleRemove(kw)}
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
            </div>

            <div style={{ marginTop: '2rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                    Tip: Monitoring is case-insensitive. Each keyword counts towards global limits.
                </p>
            </div>
        </div>
    );
}
