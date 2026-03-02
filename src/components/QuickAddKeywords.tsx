"use client";

import { useState } from "react";
import { Hash, Plus, Loader2, ChevronDown } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import axios from "axios";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/cn";

interface Channel {
    id: string;
    name: string | null;
    username: string | null;
    isActive: boolean;
}

function parseKeywords(input: string): string[] {
    return [...new Set(input.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export function QuickAddKeywords() {
    const [input, setInput] = useState("");
    const [channelIds, setChannelIds] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState(false);
    const [adding, setAdding] = useState(false);
    const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

    const { data: channels = [] } = useSWR<Channel[]>("/api/channels", fetcher);
    const { mutate: mutateStats } = useSWRConfig();
    const activeChannels = channels.filter((c) => c.isActive);

    const toggleChannel = (id: string) => {
        setChannelIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (channelIds.size === activeChannels.length) setChannelIds(new Set());
        else setChannelIds(new Set(activeChannels.map((c) => c.id)));
    };

    const handleAdd = async () => {
        const keywords = parseKeywords(input);
        if (!keywords.length) {
            setMsg({ text: "Enter keywords", ok: false });
            setTimeout(() => setMsg(null), 2000);
            return;
        }
        if (!channelIds.size) {
            setMsg({ text: "Select channels", ok: false });
            setTimeout(() => setMsg(null), 2000);
            return;
        }
        setAdding(true);
        setMsg(null);
        try {
            let ok = 0;
            let err = 0;
            for (const cid of channelIds) {
                try {
                    await axios.post(`/api/channels/${cid}/keywords`, { texts: keywords });
                    ok++;
                } catch {
                    err++;
                }
            }
            mutateStats("/api/stats");
            setInput("");
            setMsg({ text: err ? `Added to ${ok}, failed ${err}` : `Added to ${ok} channel(s)`, ok: err === 0 });
            setTimeout(() => setMsg(null), 3000);
        } catch (e) {
            setMsg({ text: "Failed", ok: false });
            setTimeout(() => setMsg(null), 2000);
        } finally {
            setAdding(false);
        }
    };

    if (!activeChannels.length) return null;

    return (
        <div className="card p-4 mb-6 border-[#00A3FF]/20 bg-[#00A3FF]/5">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-[0.9rem] font-semibold text-[#00A3FF]">
                    <Hash size={18} />
                    Quick Add
                </div>
                <div className="relative flex-1 min-w-[200px]">
                    <input
                        type="text"
                        className="input-field h-9 text-[0.9rem] pl-9"
                        placeholder="keyword1, keyword2, ..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="h-9 px-4 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-[0.85rem] hover:bg-white/10"
                    >
                        {channelIds.size ? `${channelIds.size} channels` : "Select channels"}
                        <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
                    </button>
                    {expanded && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setExpanded(false)} />
                            <div className="absolute top-full left-0 mt-1 z-20 w-64 max-h-60 overflow-auto rounded-lg bg-[#1a1a2e] border border-white/10 shadow-xl py-2">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="w-full px-4 py-2 text-left text-[0.8rem] text-[#00A3FF] hover:bg-white/5"
                                >
                                    {channelIds.size === activeChannels.length ? "Deselect all" : "Select all"}
                                </button>
                                {activeChannels.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => toggleChannel(c.id)}
                                        className={cn(
                                            "w-full px-4 py-2 text-left text-[0.85rem] flex items-center gap-2",
                                            channelIds.has(c.id) ? "bg-[#00A3FF]/15 text-[#00A3FF]" : "text-white/80 hover:bg-white/5"
                                        )}
                                    >
                                        <span className={cn("w-3 h-3 rounded border flex-shrink-0", channelIds.has(c.id) ? "bg-[#00A3FF] border-[#00A3FF]" : "border-white/30")} />
                                        {c.name || c.username || c.id}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={adding}
                    className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#00A3FF] text-white font-semibold text-[0.85rem] hover:bg-[#00A3FF]/90 disabled:opacity-50"
                >
                    {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Add
                </button>
                {msg && (
                    <span className={cn("text-[0.8rem]", msg.ok ? "text-[#00FF75]" : "text-[#FF4545]")}>
                        {msg.text}
                    </span>
                )}
            </div>
        </div>
    );
}
