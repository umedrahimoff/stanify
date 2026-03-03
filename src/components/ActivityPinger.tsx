"use client";

import { useEffect, useRef } from "react";

const PING_INTERVAL_MS = 60 * 1000;

export function ActivityPinger() {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const ping = () => fetch("/api/auth/ping", { method: "POST" }).catch(() => {});

        ping();
        intervalRef.current = setInterval(ping, PING_INTERVAL_MS);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return null;
}
