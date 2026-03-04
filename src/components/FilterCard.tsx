"use client";

import { Filter } from "lucide-react";
import { cn } from "@/lib/cn";

export function FilterCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="card filter-card w-full">
            <div className="flex items-center gap-2 mb-3 text-[0.8rem] font-semibold text-white/70">
                <Filter size={14} />
                Filters
            </div>
            <div className="flex flex-wrap gap-4 items-end w-full">{children}</div>
        </div>
    );
}

export const filterClasses = {
    field: "flex flex-col gap-0.5 flex-1 min-w-[100px]",
    label: "text-[0.75rem] text-white/40",
    input: "px-3 py-1.5 h-8 text-[0.875rem] w-full min-w-[120px] leading-normal rounded-lg",
    actions: "flex items-center gap-2 shrink-0 flex-nowrap",
    clearBtn: "inline-flex items-center justify-center gap-x-2 flex-nowrap whitespace-nowrap text-[0.8rem] leading-normal px-3 h-8 min-h-[32px] min-w-[72px] bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-pointer hover:bg-white/10 shrink-0 [&>svg]:shrink-0 [&>span]:shrink-0",
} as const;
