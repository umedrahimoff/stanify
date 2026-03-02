import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "stanify_token";
const EXPIRY_DAYS = 7;

function getSecret(): Uint8Array {
    const secret =
        process.env.AUTH_SECRET ||
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET, JWT_SECRET or NEXTAUTH_SECRET (min 32 chars) required");
    }
    return new TextEncoder().encode(secret);
}

export async function createAuthToken(sub: string): Promise<string> {
    const secret = getSecret();
    const exp = new Date();
    exp.setDate(exp.getDate() + EXPIRY_DAYS);
    return new SignJWT({ sub })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(exp)
        .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<{ sub: string } | null> {
    try {
        const secret = getSecret();
        const { payload } = await jwtVerify(token, secret);
        const sub = payload.sub as string;
        return sub ? { sub } : null;
    } catch {
        return null;
    }
}

export { COOKIE_NAME };
