"use client";

import { useState } from "react";
import { Globe, Plus, Loader2, Trash2, Pencil, AlertCircle } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

interface GlobalKeyword {
    id: string;
    text: string;
    isActive: boolean;
    createdAt: string;
    recipients: string[];
}

export default function GlobalKeywordsPage() {
    const [keywordInput, setKeywordInput] = useState("");
    const [recipientsInput, setRecipientsInput] = useState("");
    const [adding, setAdding] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [editKw, setEditKw] = useState<GlobalKeyword | null>(null);
    const [editRecipients, setEditRecipients] = useState("");
    const [saving, setSaving] = useState(false);

    const { data: keywords = [], isLoading, mutate } = useSWR<GlobalKeyword[]>("/api/global-keywords", fetcher);
    const { mutate: mutateStats } = useSWRConfig();

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const parseRecipients = (s: string) =>
        [...new Set(s.split(",").map((x) => x.trim().replace(/^@/, "").toLowerCase()).filter(Boolean))];

    const addKeyword = async () => {
        const text = keywordInput.trim().toLowerCase();
        const recipients = parseRecipients(recipientsInput);
        if (!text) {
            showToast("Enter a keyword", "error");
            return;
        }
        if (!recipients.length) {
            showToast("Add at least one recipient", "error");
            return;
        }
        setAdding(true);
        try {
            await axios.post("/api/global-keywords", { text, recipients });
            mutate();
            mutateStats("/api/stats");
            setKeywordInput("");
            setRecipientsInput("");
            showToast(`Added global keyword "${text}"`);
        } catch (e: any) {
            showToast(e.response?.data?.error || "Failed to add", "error");
        } finally {
            setAdding(false);
        }
    };

    const toggleActive = async (kw: GlobalKeyword) => {
        try {
            await axios.patch(`/api/global-keywords/${kw.id}`, { isActive: !kw.isActive });
            mutate();
            mutateStats("/api/stats");
            showToast(kw.isActive ? "Paused" : "Enabled");
        } catch {
            showToast("Failed to update", "error");
        }
    };

    const saveEdit = async () => {
        if (!editKw) return;
        const recipients = parseRecipients(editRecipients);
        if (!recipients.length) {
            showToast("At least one recipient required", "error");
            return;
        }
        setSaving(true);
        try {
            await axios.patch(`/api/global-keywords/${editKw.id}`, { recipients });
            mutate();
            setEditKw(null);
            showToast("Updated");
        } catch {
            showToast("Failed to update", "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteKeyword = async (id: string) => {
        if (!confirm("Delete this global keyword?")) return;
        try {
            await axios.delete("/api/global-keywords", { data: { id } });
            mutate();
            mutateStats("/api/stats");
            setEditKw(null);
            showToast("Deleted");
        } catch {
            showToast("Failed to delete", "error");
        }
    };

    return (
        <div className="animate-fade">
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        top: "1.5rem",
                        right: "1.5rem",
                        background: "#1a1a2e",
                        border: `1px solid ${toast.type === "error" ? "#FF4545" : "#00FF75"}44`,
                        color: toast.type === "error" ? "#FF4545" : "#00FF75",
                        padding: "0.9rem 1.4rem",
                        borderRadius: "12px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                    }}
                >
                    <AlertCircle size={16} />
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                    Global Keywords
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                    Keywords searched across all channels. Notifications go only to selected recipients.
                </p>
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 140px", minWidth: "140px" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.35rem" }}>
                            Keyword
                        </label>
                        <input
                            className="input-field"
                            style={{ width: "100%", height: "36px", fontSize: "0.85rem" }}
                            placeholder="e.g. crypto"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                        />
                    </div>
                    <div style={{ flex: "2 1 200px", minWidth: "200px" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.35rem" }}>
                            Recipients (Telegram @usernames)
                        </label>
                        <input
                            className="input-field"
                            style={{ width: "100%", height: "36px", fontSize: "0.85rem" }}
                            placeholder="@user1, @user2..."
                            value={recipientsInput}
                            onChange={(e) => setRecipientsInput(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={addKeyword}
                        disabled={adding || !keywordInput.trim()}
                        className="btn-primary"
                        style={{ height: "36px", padding: "0 1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                    >
                        {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {adding ? "Adding…" : "Add"}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: "0" }}>
                {isLoading ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        Loading...
                    </div>
                ) : keywords.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No global keywords yet. Add one above.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Keyword</th>
                                    <th>Recipients</th>
                                    <th>Status</th>
                                    <th style={{ width: "100px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {keywords.map((kw) => (
                                    <tr key={kw.id}>
                                        <td>
                                            <span
                                                style={{
                                                    background: "rgba(191,90,242,0.15)",
                                                    color: "#BF5AF2",
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "100px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                }}
                                            >
                                                <Globe size={12} />
                                                {kw.text}
                                            </span>
                                        </td>
                                        <td>
                                            {editKw?.id === kw.id ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <input
                                                        className="input-field"
                                                        style={{ flex: 1, minWidth: "120px", height: "28px", fontSize: "0.8rem" }}
                                                        placeholder="@user1, @user2"
                                                        value={editRecipients}
                                                        onChange={(e) => setEditRecipients(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={saveEdit}
                                                        disabled={saving}
                                                        style={{
                                                            padding: "0.25rem 0.5rem",
                                                            fontSize: "0.75rem",
                                                            background: "rgba(0,255,117,0.2)",
                                                            border: "1px solid rgba(0,255,117,0.3)",
                                                            borderRadius: "6px",
                                                            color: "#00FF75",
                                                            cursor: saving ? "not-allowed" : "pointer",
                                                        }}
                                                    >
                                                        {saving ? "…" : "Save"}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditKw(null)}
                                                        style={{
                                                            padding: "0.25rem 0.5rem",
                                                            fontSize: "0.75rem",
                                                            background: "rgba(255,255,255,0.05)",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "6px",
                                                            color: "rgba(255,255,255,0.6)",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                                                    {kw.recipients.map((u) => `@${u}`).join(", ") || "—"}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleActive(kw)}
                                                style={{
                                                    padding: "0.2rem 0.5rem",
                                                    fontSize: "0.75rem",
                                                    borderRadius: "6px",
                                                    background: kw.isActive ? "rgba(0,255,117,0.15)" : "rgba(255,255,255,0.05)",
                                                    border: `1px solid ${kw.isActive ? "rgba(0,255,117,0.3)" : "rgba(255,255,255,0.1)"}`,
                                                    color: kw.isActive ? "#00FF75" : "rgba(255,255,255,0.4)",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {kw.isActive ? "Active" : "Paused"}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                                                {editKw?.id !== kw.id && (
                                                    <button
                                                        onClick={() => {
                                                            setEditKw(kw);
                                                            setEditRecipients(kw.recipients.map((u) => `@${u}`).join(", "));
                                                        }}
                                                        title="Edit recipients"
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "rgba(255,255,255,0.5)",
                                                            cursor: "pointer",
                                                            padding: "0.35rem",
                                                            display: "flex",
                                                        }}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteKeyword(kw.id)}
                                                    title="Delete"
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "rgba(255,69,69,0.6)",
                                                        cursor: "pointer",
                                                        padding: "0.35rem",
                                                        display: "flex",
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
