"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeywordsRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/dashboard/channels");
    }, [router]);
    return (
        <div className="animate-fade" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem" }}>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Redirecting...</p>
        </div>
    );
}
