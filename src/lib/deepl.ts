const DEEPL_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_PRO = "https://api.deepl.com/v2/translate";

async function deeplTranslate(text: string, targetLang: string, sourceLang?: string): Promise<string | null> {
    const key = process.env.DEEPL_API_KEY?.trim();
    if (!key || text.length < 2) return null;

    const isFree = key.endsWith(":fx");
    const url = isFree ? DEEPL_FREE : DEEPL_PRO;

    const params: Record<string, string> = {
        text: text.slice(0, 50000),
        target_lang: targetLang,
    };
    if (sourceLang) params.source_lang = sourceLang;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `DeepL-Auth-Key ${key}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
    });

    if (!res.ok) {
        const err = await res.text();
        console.warn("DeepL error:", res.status, err);
        return null;
    }

    const data = await res.json();
    return data.translations?.[0]?.text ?? null;
}

/** Translate to Russian. Tries direct RU first; falls back to EN→RU for languages without direct RU support (e.g. Turkish, Uzbek). */
export async function translateToRussian(text: string): Promise<string> {
    const key = process.env.DEEPL_API_KEY?.trim();
    if (!key || text.length < 2) {
        if (text.length >= 2 && !key) console.warn("DEEPL_API_KEY not set — translation skipped");
        return text;
    }

    try {
        const direct = await deeplTranslate(text, "RU");
        if (direct) return direct;

        const toEn = await deeplTranslate(text, "EN");
        if (toEn) {
            const toRu = await deeplTranslate(toEn, "RU", "EN");
            if (toRu) return toRu;
        }
    } catch (e) {
        console.warn("DeepL translate failed:", e);
    }
    return text;
}
