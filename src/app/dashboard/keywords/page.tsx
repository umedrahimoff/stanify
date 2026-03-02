"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KeywordsRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/dashboard/channels");
    }, [router]);
    return (
        <div className="animate-fade flex justify-center items-center p-12">
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Redirecting...</p>
        </div>
    );
}
