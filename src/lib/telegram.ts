import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";

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

        const session = new StringSession(sessionStr);
        this.client = new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 5,
        });

        await this.client.connect();
        return this.client;
    }

    public async setupListener(keywords: string[], onMatch: (msg: any, keyword: string) => void) {
        if (!this.client) throw new Error("Client not initialized");

        this.client.addEventHandler(async (event) => {
            const message = event.message;
            if (!message || !message.text) return;

            const text = message.text.toLowerCase();
            for (const keyword of keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    onMatch(message, keyword);
                    break;
                }
            }
        }, new NewMessage({}));
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

    public getSession(): string {
        return (this.client?.session as StringSession).save() || "";
    }
}
