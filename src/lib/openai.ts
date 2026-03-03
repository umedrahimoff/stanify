import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
    if (!client) {
        const key = process.env.OPENAI_API_KEY;
        if (!key) throw new Error("OPENAI_API_KEY is not set");
        client = new OpenAI({ apiKey: key });
    }
    return client;
}

export async function suggestKeywords(content: string, existingKeywords: string[]): Promise<string[]> {
    const text = content.slice(0, 6000);
    const existing = existingKeywords.length ? `Уже есть: ${existingKeywords.join(", ")}.` : "";
    const res = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "Ты помощник для мониторинга Telegram-каналов. Отвечай только списком ключевых слов через запятую, без нумерации и пояснений. Слова на том же языке, что и контент.",
            },
            {
                role: "user",
                content: `На основе текстов постов предложи 5-10 ключевых слов для мониторинга. ${existing}\n\nТексты:\n${text}`,
            },
        ],
        max_tokens: 150,
    });
    const raw = res.choices[0]?.message?.content?.trim() || "";
    return [...new Set(raw.split(/[,，\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

export async function detectLanguage(content: string): Promise<string> {
    const text = content.slice(0, 3000);
    if (!text.trim()) return "Неизвестно";
    const res = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "Определи язык текста. Ответь одним словом: русский, английский, узбекский, казахский и т.д. Если смешанный — укажи основной.",
            },
            { role: "user", content: text },
        ],
        max_tokens: 20,
    });
    return res.choices[0]?.message?.content?.trim() || "Неизвестно";
}
