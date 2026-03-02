"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Plus, X, Hash, Loader2, Trash2 } from "lucide-react";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";

interface Keyword {
    id: string;
    text: string;
}

function parseTags(input: string): string[] {
    return input
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

export default function KeywordsPage() {
    const [inputValue, setInputValue] = useState("");
    const [pendingTags, setPendingTags] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { data: keywords = [], isLoading, mutate } = useSWR<Keyword[]>("/api/keywords");
    const { mutate: mutateStats } = useSWRConfig();

    const addTag = (tag: string) => {
        const t = tag.trim().toLowerCase();
        if (t && !pendingTags.includes(t)) setPendingTags((p) => [...p, t]);
    };

    const removePendingTag = (idx: number) => {
        setPendingTags((p) => p.filter((_, i) => i !== idx));
    };

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "," || e.key === "Enter") {
            e.preventDefault();
            const fromInput = parseTags(inputValue);
            if (fromInput.length) {
                fromInput.forEach(addTag);
                setInputValue("");
            } else if (inputValue.trim()) {
                addTag(inputValue);
                setInputValue("");
            }
            return;
        }
        if (e.key === "Backspace" && !inputValue && pendingTags.length) {
            removePendingTag(pendingTags.length - 1);
        }
    };

    const handleInputChange = (v: string) => {
        if (v.endsWith(",")) {
            const before = v.slice(0, -1);
            parseTags(before).forEach(addTag);
            setInputValue("");
        } else {
            setInputValue(v);
        }
    };

    const handleAdd = async () => {
        const toAdd = inputValue.trim()
            ? [...pendingTags, ...parseTags(inputValue)]
            : [...pendingTags];
        const unique = [...new Set(toAdd)].filter(Boolean);
        if (!unique.length) return;
        setAdding(true);
        try {
            await axios.post("/api/keywords", { texts: unique });
            setPendingTags([]);
            setInputValue("");
            mutate();
            mutateStats("/api/stats");
        } catch (error) {
            console.error("Failed to add keywords:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await axios.delete("/api/keywords", { data: { ids: [id] } });
            mutate(keywords.filter((k) => k.id !== id), false);
            setSelectedIds((s) => {
                const next = new Set(s);
                next.delete(id);
                return next;
            });
            mutateStats("/api/stats");
        } catch (error) {
            console.error("Failed to remove keyword:", error);
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (!ids.length) return;
        setDeleting(true);
        try {
            await axios.delete("/api/keywords", { data: { ids } });
            mutate(keywords.filter((k) => !ids.includes(k.id)), false);
            setSelectedIds(new Set());
            mutateStats("/api/stats");
        } catch (error) {
            console.error("Failed to delete keywords:", error);
        } finally {
            setDeleting(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((s) => {
            const next = new Set(s);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === keywords.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(keywords.map((k) => k.id)));
        }
    };

    const hasSelection = selectedIds.size > 0;
    const tagInputHasContent = pendingTags.length > 0 || inputValue.trim().length > 0;

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Keywords</h1>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.1rem" }}>Manage keywords that trigger immediate notifications.</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", maxWidth: "500px", width: "100%", flex: 1, minWidth: 0 }}>
                    <div
                        className="input-field tag-input-wrapper"
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 1rem",
                            minHeight: "48px",
                            cursor: "text"
                        }}
                        onClick={() => inputRef.current?.focus()}
                    >
                        {pendingTags.map((tag, idx) => (
                            <span
                                key={`${tag}-${idx}`}
                                style={{
                                    background: "rgba(0,163,255,0.15)",
                                    color: "#00A3FF",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "6px",
                                    fontSize: "0.85rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.35rem"
                                }}
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removePendingTag(idx);
                                    }}
                                    style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex" }}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={pendingTags.length ? "" : "keyword1, keyword2, keyword3..."}
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            disabled={adding}
                            style={{
                                flex: 1,
                                minWidth: "120px",
                                background: "none",
                                border: "none",
                                outline: "none",
                                color: "inherit",
                                fontSize: "inherit"
                            }}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleAdd}
                        disabled={adding || !tagInputHasContent}
                        style={{ width: "60px", minWidth: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        {adding ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: "2rem" }}>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <>
                        {keywords.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === keywords.length && keywords.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                    Select all
                                </label>
                                {hasSelection && (
                                    <button
                                        className="btn-primary"
                                        onClick={handleBulkDelete}
                                        disabled={deleting}
                                        style={{
                                            background: "rgba(239,68,68,0.2)",
                                            color: "#ef4444",
                                            border: "1px solid rgba(239,68,68,0.4)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.5rem 1rem"
                                        }}
                                    >
                                        {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                        Delete selected ({selectedIds.size})
                                    </button>
                                )}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            {keywords.length === 0 ? (
                                <div style={{ color: "rgba(255,255,255,0.2)", padding: "2rem", textAlign: "center", width: "100%" }}>
                                    No keywords added yet. Add keywords above (comma-separated).
                                </div>
                            ) : (
                                keywords.map((kw) => (
                                    <div
                                        key={kw.id}
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            padding: "0.6rem 1rem",
                                            borderRadius: "100px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            transition: "all 0.2s"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(kw.id)}
                                            onChange={() => toggleSelect(kw.id)}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <Hash size={14} color="#00A3FF" />
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{kw.text}</span>
                                        <button
                                            onClick={() => handleRemove(kw.id)}
                                            className="remove-btn"
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "rgba(255,255,255,0.3)",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "2px"
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            <div style={{ marginTop: "2rem" }}>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
                    Tip: Enter keywords separated by commas. Backspace removes last tag. Select multiple to bulk delete.
                </p>
            </div>
        </div>
    );
}
