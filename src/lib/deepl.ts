const DEEPL_FREE = "https://api-free.deepl.com/v2/translate";
const DEEPL_PRO = "https://api.deepl.com/v2/translate";

export async function translateToRussian(text: string): Promise<string> {
    const key = process.env.DEEPL_API_KEY?.trim();
    if (!key || text.length < 2) return text;

    const isFree = key.endsWith(":fx");
    const url = isFree ? DEEPL_FREE : DEEPL_PRO;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `DeepL-Auth-Key ${key}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                text: text.slice(0, 50000),
                target_lang: "RU",
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.warn("DeepL error:", res.status, err);
            return text;
        }

        const data = await res.json();
        const translated = data.translations?.[0]?.text;
        return translated || text;
    } catch (e) {
        console.warn("DeepL translate failed:", e);
        return text;
    }
}
