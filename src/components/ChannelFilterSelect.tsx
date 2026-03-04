"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { filterClasses } from "@/components/FilterCard";
import { cn } from "@/lib/cn";

interface Channel {
    id: string;
    name: string | null;
    username: string | null;
}

interface ChannelFilterSelectProps {
    value: string;
    onChange: (channelId: string) => void;
    placeholder?: string;
}

const MAX_RESULTS = 10;

export function ChannelFilterSelect({ value, onChange, placeholder = "Search channel..." }: ChannelFilterSelectProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: channels = [] } = useSWR<Channel[]>("/api/channels", fetcher);

    const selected = channels.find((c) => c.id === value);
    const displayValue = selected ? selected.name || selected.username || selected.id : "";

    const filtered = query.trim()
        ? channels.filter((c) => {
              const q = query.toLowerCase();
              const name = (c.name || "").toLowerCase();
              const username = (c.username || "").toLowerCase();
              const id = c.id.toLowerCase();
              return name.includes(q) || username.includes(q) || id.includes(q);
          }).slice(0, MAX_RESULTS)
        : channels.slice(0, MAX_RESULTS);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setHighlight(0);
    }, [query, open]);

    const handleSelect = (ch: Channel) => {
        onChange(ch.id);
        setQuery("");
        setOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setQuery("");
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!open) {
            if (e.key === "Enter" || e.key === "ArrowDown") {
                setOpen(true);
                e.preventDefault();
            }
            return;
        }
        if (e.key === "Escape") {
            setOpen(false);
            e.preventDefault();
            return;
        }
        if (e.key === "ArrowDown") {
            setHighlight((h) => Math.min(h + 1, filtered.length));
            e.preventDefault();
            return;
        }
        if (e.key === "ArrowUp") {
            setHighlight((h) => Math.max(h - 1, 0));
            e.preventDefault();
            return;
        }
        if (e.key === "Enter") {
            if (highlight === 0 && filtered[0]) {
                handleSelect(filtered[0]);
            } else if (filtered[highlight]) {
                handleSelect(filtered[highlight]);
            }
            e.preventDefault();
        }
    };

    return (
        <div className={filterClasses.field} ref={containerRef} style={{ minWidth: "160px" }}>
            <label className={filterClasses.label}>Channel</label>
            <div className="relative">
                <input
                    type="text"
                    className={cn("input-field", filterClasses.input, "min-w-[160px]")}
                        placeholder={placeholder}
                        value={open ? query : (value ? displayValue : "")}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                />
                {value && (
                    <button
                            type="button"
                            onClick={handleClear}
                            title="Clear"
                            style={{
                                position: "absolute",
                                right: "6px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                fontSize: "1rem",
                                lineHeight: 1,
                                padding: "0.2rem",
                            }}
                    >
                        ×
                    </button>
                )}
                {open && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: "0.25rem",
                            background: "rgba(26,26,46,0.98)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            maxHeight: "220px",
                            overflowY: "auto",
                            zIndex: 50,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{
                                display: "block",
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                textAlign: "left",
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.6)",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            All channels
                        </button>
                        {filtered.map((ch, i) => (
                            <button
                                key={ch.id}
                                type="button"
                                onClick={() => handleSelect(ch)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "0.5rem 0.75rem",
                                    textAlign: "left",
                                    background: highlight === i ? "rgba(0,163,255,0.15)" : "transparent",
                                    border: "none",
                                    color: "rgba(255,255,255,0.9)",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() => setHighlight(i)}
                            >
                                {ch.name || ch.username || ch.id}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: "0.75rem", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                                No channels found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
