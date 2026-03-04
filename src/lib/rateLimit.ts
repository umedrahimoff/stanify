const store = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
    return (
        (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

export function checkRateLimit(
    req: Request,
    key: string,
    maxRequests: number,
    windowMs: number
): { ok: boolean; retryAfter?: number } {
    const ip = getClientIp(req);
    const fullKey = `${key}:${ip}`;
    const now = Date.now();

    let entry = store.get(fullKey);
    if (!entry || now > entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs };
        store.set(fullKey, entry);
        return { ok: true };
    }

    entry.count++;
    if (entry.count > maxRequests) {
        return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { ok: true };
}
