"use client";

import { useState } from "react";
import { UserPlus, Plus, Loader2, Trash2, Pencil, AlertCircle } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

interface RecipientGroup {
    id: string;
    name: string;
    members: string[];
}

export default function GroupsPage() {
    const [nameInput, setNameInput] = useState("");
    const [membersInput, setMembersInput] = useState("");
    const [adding, setAdding] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [editGroup, setEditGroup] = useState<RecipientGroup | null>(null);
    const [editMembers, setEditMembers] = useState("");
    const [saving, setSaving] = useState(false);

    const { data: groups = [], isLoading, mutate } = useSWR<RecipientGroup[]>("/api/recipient-groups", fetcher);
    const { mutate: mutateStats } = useSWRConfig();

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const parseMembers = (s: string) =>
        [...new Set(s.split(",").map((x) => x.trim().replace(/^@/, "").toLowerCase()).filter(Boolean))];

    const addGroup = async () => {
        const name = nameInput.trim();
        const members = parseMembers(membersInput);
        if (!name) {
            showToast("Enter group name", "error");
            return;
        }
        setAdding(true);
        try {
            await axios.post("/api/recipient-groups", { name, members });
            mutate();
            mutateStats("/api/channels");
            setNameInput("");
            setMembersInput("");
            showToast(`Added group "${name}"`);
        } catch (e: any) {
            showToast(e.response?.data?.error || "Failed to add", "error");
        } finally {
            setAdding(false);
        }
    };

    const saveEdit = async () => {
        if (!editGroup) return;
        const members = parseMembers(editMembers);
        setSaving(true);
        try {
            await axios.patch(`/api/recipient-groups/${editGroup.id}`, { members });
            mutate();
            mutateStats("/api/channels");
            setEditGroup(null);
            showToast("Updated");
        } catch {
            showToast("Failed to update", "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteGroup = async (id: string) => {
        if (!confirm("Delete this group? Channels using it will fall back to default recipients.")) return;
        try {
            await axios.delete(`/api/recipient-groups/${id}`);
            mutate();
            mutateStats("/api/channels");
            setEditGroup(null);
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
                    Recipient Groups
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                    Create groups and assign them to channels. Each group receives only alerts from its channels.
                </p>
            </div>

            <div className="card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 120px", minWidth: "120px" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.35rem" }}>
                            Group name
                        </label>
                        <input
                            className="input-field"
                            style={{ width: "100%", height: "36px", fontSize: "0.85rem" }}
                            placeholder="e.g. crypto"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: "2 1 200px", minWidth: "200px" }}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "0.35rem" }}>
                            Members (@usernames)
                        </label>
                        <input
                            className="input-field"
                            style={{ width: "100%", height: "36px", fontSize: "0.85rem" }}
                            placeholder="@user1, @user2..."
                            value={membersInput}
                            onChange={(e) => setMembersInput(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={addGroup}
                        disabled={adding || !nameInput.trim()}
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
                ) : groups.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                        No groups yet. Create one above, then assign to channels on their detail pages.
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="table-dashboard">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Members</th>
                                    <th style={{ width: "100px" }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map((g) => (
                                    <tr key={g.id}>
                                        <td>
                                            <span
                                                style={{
                                                    background: "rgba(0,163,255,0.1)",
                                                    color: "#00A3FF",
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "100px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: 600,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                }}
                                            >
                                                <UserPlus size={12} />
                                                {g.name}
                                            </span>
                                        </td>
                                        <td>
                                            {editGroup?.id === g.id ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <input
                                                        className="input-field"
                                                        style={{ flex: 1, minWidth: "120px", height: "28px", fontSize: "0.8rem" }}
                                                        placeholder="@user1, @user2"
                                                        value={editMembers}
                                                        onChange={(e) => setEditMembers(e.target.value)}
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
                                                        onClick={() => setEditGroup(null)}
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
                                                    {g.members.map((u) => `@${u}`).join(", ") || "—"}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                                                {editGroup?.id !== g.id && (
                                                    <button
                                                        onClick={() => {
                                                            setEditGroup(g);
                                                            setEditMembers(g.members.map((u) => `@${u}`).join(", "));
                                                        }}
                                                        title="Edit members"
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
                                                    onClick={() => deleteGroup(g.id)}
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
