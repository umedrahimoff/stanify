"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Key, Phone, ShieldCheck, Mail, Save, Fingerprint, Activity } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import axios from "axios";

export default function SettingsPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [apiId, setApiId] = useState("");
    const [apiHash, setApiHash] = useState("");
    const [step, setStep] = useState(1);
    const [inputValue, setInputValue] = useState("");
    const [recipients, setRecipients] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(null);

    const isTelegramAccountLocked = true;
    const { data: me } = useSWR<{ role: string }>("/api/auth/me", fetcher);
    const { data: settings, mutate } = useSWR<{ notificationRecipients: string[] }>(
        me?.role === "admin" ? "/api/settings" : null,
        fetcher
    );

    useEffect(() => {
        if (me && me.role !== "admin") router.replace("/dashboard");
    }, [me, router]);

    useEffect(() => {
        if (settings?.notificationRecipients?.length) setRecipients(settings.notificationRecipients);
    }, [settings]);

    const addRecipient = (v: string) => {
        const t = v.trim().replace(/^@/, "").toLowerCase();
        if (t && !recipients.includes(t)) setRecipients((r) => [...r, t]);
    };

    const parseAndAdd = (s: string) => {
        s.split(",").forEach((x) => addRecipient(x));
    };

    if (!me) return <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</div>;
    if (me.role !== "admin") return <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Redirecting...</div>;

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Settings</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Configure your Telegram user account and monitoring settings.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <Fingerprint size={18} color="#00A3FF" />
                        <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Telegram Account</h2>
                    </div>

                    {isTelegramAccountLocked && (
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                            Telegram account is already connected via server configuration and cannot be changed from the admin panel.
                        </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Step 1: API Information */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>API ID</label>
                            <div style={{ display: 'flex', position: 'relative' }}>
                                <Key size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field text-[0.85rem]"
                                    value={apiId}
                                    onChange={(e) => setApiId(e.target.value)}
                                    placeholder="Enter your API ID"
                                    style={{ paddingLeft: '2.25rem', height: '36px' }}
                                    disabled={isTelegramAccountLocked}
                                    readOnly={isTelegramAccountLocked}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>API HASH</label>
                            <div style={{ display: 'flex', position: 'relative' }}>
                                <ShieldCheck size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field text-[0.85rem]"
                                    value={apiHash}
                                    onChange={(e) => setApiHash(e.target.value)}
                                    placeholder="Enter your API HASH"
                                    style={{ paddingLeft: '2.25rem', height: '36px' }}
                                    disabled={isTelegramAccountLocked}
                                    readOnly={isTelegramAccountLocked}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Phone Number</label>
                            <div style={{ display: 'flex', position: 'relative' }}>
                                <Phone size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field text-[0.85rem]"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 234 567 890"
                                    style={{ paddingLeft: '2.25rem', height: '36px' }}
                                    disabled={isTelegramAccountLocked}
                                    readOnly={isTelegramAccountLocked}
                                />
                            </div>
                        </div>

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Verification Code</label>
                                <div style={{ display: 'flex', position: 'relative' }}>
                                    <Mail size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        className="input-field text-[0.85rem]"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="12345"
                                        style={{ paddingLeft: '2.25rem', height: '36px' }}
                                        disabled={isTelegramAccountLocked}
                                        readOnly={isTelegramAccountLocked}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => {
                                    if (!isTelegramAccountLocked) {
                                        setStep(step + 1);
                                    }
                                }}
                                disabled={isTelegramAccountLocked}
                            >
                                {isTelegramAccountLocked
                                    ? "Telegram account is already connected"
                                    : step === 1
                                    ? "Start Session"
                                    : step === 2
                                    ? "Send OTP"
                                    : "Complete Authentication"}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Activity size={18} color="#00FF94" />
                            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Notification Settings</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Telegram recipients</label>
                                <div
                                    className="input-field tag-input-wrapper text-[0.85rem]"
                                    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', minHeight: '36px', cursor: 'text' }}
                                    onClick={(e) => (e.target as HTMLElement).querySelector('input')?.focus()}
                                >
                                    {recipients.map((r, i) => (
                                        <span key={`${r}-${i}`} style={{ background: 'rgba(0,163,255,0.15)', color: '#00A3FF', padding: '0.2rem 0.4rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            @{r}
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setRecipients((x) => x.filter((_, j) => j !== i)); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                                <span style={{ opacity: 0.7 }}>×</span>
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        value={inputValue}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (v.endsWith(',')) { parseAndAdd(v.slice(0, -1)); setInputValue(''); }
                                            else setInputValue(v);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === ',' || e.key === 'Enter') {
                                                e.preventDefault();
                                                parseAndAdd(inputValue);
                                                setInputValue('');
                                            } else if (e.key === 'Backspace' && !inputValue && recipients.length) {
                                                setRecipients((x) => x.slice(0, -1));
                                            }
                                        }}
                                        placeholder={recipients.length ? '' : '@user1, @user2...'}
                                        style={{ flex: 1, minWidth: '120px', background: 'none', border: 'none', outline: 'none', color: 'inherit', fontSize: 'inherit' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                    Alerts and login codes will be sent to all listed users.
                                </p>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
                            onClick={async () => {
                                setSaving(true);
                                setSaveMsg(null);
                                try {
                                    const toSave = inputValue.trim() ? [...recipients, ...inputValue.split(',').map((s) => s.trim().replace(/^@/, '').toLowerCase()).filter(Boolean)] : recipients;
                                    const unique = [...new Set(toSave)];
                                    await axios.post("/api/settings", { notificationRecipients: unique.length ? unique : ['umedrahimoff'] });
                                    setRecipients(unique.length ? unique : ['umedrahimoff']);
                                    setInputValue('');
                                    mutate();
                                    setSaveMsg({ text: "Saved", ok: true });
                                } catch {
                                    setSaveMsg({ text: "Failed to save", ok: false });
                                } finally {
                                    setSaving(false);
                                    setTimeout(() => setSaveMsg(null), 3000);
                                }
                            }}
                            disabled={saving}
                        >
                            <Save size={16} />
                            {saving ? "Saving…" : "Save"}
                        </button>
                        {saveMsg && (
                            <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: saveMsg.ok ? "#00FF75" : "#ff4545" }}>
                                {saveMsg.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
