"use client";

import { Filter } from "lucide-react";
import { cn } from "@/lib/cn";

export function FilterCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card filter-card">
            <div className="flex items-center gap-2 mb-4 text-[0.9rem] font-semibold text-white/70">
                <Filter size={18} />
                Filters
            </div>
            <div className="flex flex-wrap gap-4 items-end">{children}</div>
        </div>
    );
}

export const filterClasses = {
    field: "flex flex-col gap-1",
    label: "text-[0.75rem] text-white/40",
    input: "px-4 py-2 h-10 text-[0.9rem] min-w-[150px]",
    clearBtn: "text-[0.85rem] px-4 py-2 h-10 bg-white/5 border border-white/10 rounded-[10px] text-white/60 cursor-pointer hover:bg-white/10",
} as const;
