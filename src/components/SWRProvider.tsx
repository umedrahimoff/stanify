"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

export function SWRProvider({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher,
                dedupingInterval: 5000,
                revalidateOnFocus: false,
                revalidateOnReconnect: true,
            }}
        >
            {children}
        </SWRConfig>
    );
}
