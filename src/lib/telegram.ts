import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";

export class TelegramManager {
    private static instance: TelegramManager;
    private client?: TelegramClient;

    private constructor() { }

    public static getInstance(): TelegramManager {
        if (!TelegramManager.instance) {
            TelegramManager.instance = new TelegramManager();
        }
        return TelegramManager.instance;
    }

    public async initialize(sessionStr: string = "") {
        if (this.client) return this.client;

        const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
        const apiHash = process.env.TELEGRAM_API_HASH || "";

        if (!apiId || !apiHash) {
            throw new Error("TELEGRAM_API_ID or TELEGRAM_API_HASH is not set in environment");
        }

        const session = new StringSession(sessionStr);
        this.client = new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 5,
        });

        await this.client.connect();
        await this.client.getMe();
        return this.client;
    }

    public async setupListener(
        getKeywordsForMessage: (msg: any) => string[],
        onMatch: (msg: any, keyword: string) => void,
        onScan?: (msg: any) => void | Promise<void>,
        chatIds?: (string | number)[]
    ) {
        if (!this.client) throw new Error("Client not initialized");

        const eventFilter = chatIds?.length
            ? new NewMessage({ incoming: true, chats: chatIds })
            : new NewMessage({ incoming: true });

        this.client.addEventHandler(async (event) => {
            const message = event.message;
            const textRaw = message?.text ?? message?.message ?? "";
            if (!message || !textRaw) return;

            const keywords = getKeywordsForMessage(message);
            if (keywords.length === 0) return;

            onScan?.(message);

            const text = String(textRaw).toLowerCase();
            for (const keyword of keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    onMatch(message, keyword);
                    break;
                }
            }
        }, eventFilter);
    }

    public async getPeerInfo(identifier: string) {
        if (!this.client) throw new Error("Client not initialized");
        try {
            return await this.client.getEntity(identifier);
        } catch (e) {
            console.error("Error getting peer info:", e);
            return null;
        }
    }

    public async getEntityByPeer(peer: any) {
        if (!this.client || !peer) return null;
        try {
            return await this.client.getEntity(peer);
        } catch (e) {
            return null;
        }
    }

    public async joinChannel(channelUsername: string) {
        if (!this.client) throw new Error("Client not initialized");
        try {
            await this.client.invoke(new Api.channels.JoinChannel({
                channel: channelUsername
            }));
            return true;
        } catch (e) {
            console.error("Error joining channel:", e);
            return false;
        }
    }

    public async sendMessage(to: string, text: string, parseMode: "html" | "md" = "html") {
        if (!this.client) throw new Error("Client not initialized");
        try {
            await this.client.sendMessage(to, { message: text, parseMode });
            return true;
        } catch (e) {
            console.error("Error sending message:", e);
            return false;
        }
    }

    public getSession(): string {
        return (this.client?.session as StringSession).save() || "";
    }
}
