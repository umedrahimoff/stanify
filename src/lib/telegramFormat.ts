/**
 * Convert Telegram message text + entities to HTML for sending.
 * Entity types: bold, italic, code, pre, text_url, underline, strikethrough
 */
function escapeHtml(s: string): string {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getEntityType(e: any): string {
    return e?.className || e?.constructor?.name || "";
}

export function messageToHtml(text: string, entities?: any[]): string {
    if (!text) return "";
    if (!entities?.length) return escapeHtml(text);

    const parts: { start: number; end: number; html: string }[] = [];
    const sorted = [...entities].sort((a, b) => (a.offset || 0) - (b.offset || 0));

    for (const e of sorted) {
        const start = Math.min(e.offset ?? 0, text.length);
        const end = Math.min((e.offset ?? 0) + (e.length ?? 0), text.length);
        if (start >= end) continue;
        const slice = text.slice(start, end);
        const type = getEntityType(e);
        let html = escapeHtml(slice);
        if (type.includes("Bold")) html = `<b>${html}</b>`;
        else if (type.includes("Italic")) html = `<i>${html}</i>`;
        else if (type.includes("Underline")) html = `<u>${html}</u>`;
        else if (type.includes("Strike")) html = `<s>${html}</s>`;
        else if (type.includes("Code") && !type.includes("Pre")) html = `<code>${html}</code>`;
        else if (type.includes("Pre")) html = `<pre>${html}</pre>`;
        else if ((type.includes("TextUrl") || type.includes("url")) && e.url)
            html = `<a href="${escapeHtml(e.url)}">${html}</a>`;
        parts.push({ start, end, html });
    }

    if (parts.length === 0) return escapeHtml(text);

    let result = "";
    let pos = 0;
    for (const p of parts) {
        if (pos < p.start) result += escapeHtml(text.slice(pos, p.start));
        result += p.html;
        pos = p.end;
    }
    if (pos < text.length) result += escapeHtml(text.slice(pos));
    return result;
}

/**
 * Strip Telegram markdown symbols from text (*, **, _, __, ~~, `)
 */
export function stripMarkdown(text: string): string {
    if (!text) return "";
    return String(text)
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/__/g, "")
        .replace(/_/g, "")
        .replace(/~~/g, "")
        .replace(/`/g, "");
}

/**
 * Convert Telegram-style markdown in plain text to HTML for display.
 * Handles: **bold**, *italic*, __underline__, ~~strikethrough~~, `code`, [text](url)
 */
export function markdownToHtml(text: string, opts?: { breakLines?: boolean }): string {
    if (!text) return "";
    let s = escapeHtml(text);
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, "<b>$1</b>");
    s = s.replace(/__([\s\S]+?)__/g, "<u>$1</u>");
    s = s.replace(/~~([\s\S]+?)~~/g, "<s>$1</s>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*([\s\S]+?)\*/g, "<i>$1</i>");
    s = s.replace(/_([\s\S]+?)_/g, "<i>$1</i>");
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, t, u) => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    if (opts?.breakLines !== false) s = s.replace(/\n/g, "<br/>");
    return s;
}
