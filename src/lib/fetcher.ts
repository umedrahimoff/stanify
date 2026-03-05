export const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (res.status === 401) {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};
