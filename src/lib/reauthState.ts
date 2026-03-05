export type ReauthState = {
    status: "starting" | "qr" | "password" | "done" | "error";
    qrUrl?: string;
    hint?: string;
    error?: string;
    passwordResolver?: (pwd: string) => void;
};

let pendingReauth: ReauthState | null = null;

export function getPendingReauth() {
    return pendingReauth;
}

export function setPendingReauth(state: ReauthState | null) {
    pendingReauth = state;
}
