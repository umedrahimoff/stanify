"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Key, Phone, ShieldCheck, Mail, Fingerprint, Activity, Database, Download, Trash2, AlertTriangle, Users, History } from "lucide-react";
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
    const isTelegramAccountLocked = true;
    const { data: me } = useSWR<{ role: string }>("/api/auth/me", fetcher);
    const { data: dataStats, mutate: mutateData } = useSWR<{ count: number; mb: number; limitMb: number; limitReached: boolean }>(
        me?.role === "admin" ? "/api/data" : null,
        fetcher,
        { refreshInterval: 30000 }
    );
    const { data: settings, mutate: mutateSettings } = useSWR<{ parserEnabled?: boolean }>(
        me?.role === "admin" ? "/api/settings" : null,
        fetcher
    );
    const [clearing, setClearing] = useState(false);
    const [savingParser, setSavingParser] = useState(false);

    useEffect(() => {
        if (me && me.role !== "admin") router.replace("/dashboard");
    }, [me, router]);

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
                            <History size={18} color="#BF5AF2" />
                            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Parser</h2>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                            Parse old messages (backfill) — scan historical messages for channels. When disabled, the feature is hidden from the UI.
                        </p>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input
                                type="checkbox"
                                checked={settings?.parserEnabled !== false}
                                disabled={savingParser}
                                onChange={async (e) => {
                                    setSavingParser(true);
                                    try {
                                        await axios.post('/api/settings', { parserEnabled: e.target.checked });
                                        mutateSettings();
                                    } catch {
                                        alert('Error');
                                    } finally {
                                        setSavingParser(false);
                                    }
                                }}
                                style={{ accentColor: '#BF5AF2' }}
                            />
                            Parser enabled
                        </label>
                    </div>

                    <div className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Activity size={18} color="#00FF94" />
                            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Notification Settings</h2>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                            Only users in the Users list receive alerts. Add users there and configure per-user channels and keywords per user.
                        </p>
                        <Link
                            href="/dashboard/users"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(0,163,255,0.15)', border: '1px solid rgba(0,163,255,0.3)', borderRadius: '8px', color: '#00A3FF', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, width: 'fit-content' }}
                        >
                            <Users size={16} />
                            Manage Users
                        </Link>
                    </div>

                    <div className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Database size={18} color="#BF5AF2" />
                            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Post Storage</h2>
                        </div>
                        {dataStats && (
                            <>
                                <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600 }}>{dataStats.count.toLocaleString()}</span> posts · <span style={{ fontWeight: 600 }}>{dataStats.mb.toFixed(2)} MB</span> / {dataStats.limitMb} MB
                                </div>
                                {dataStats.limitReached && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,159,10,0.15)', borderRadius: '10px', marginBottom: '1rem', color: '#FF9F0A', fontSize: '0.85rem' }}>
                                        <AlertTriangle size={18} />
                                        Limit reached. Export data to CSV and clear storage.
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <a
                                        href="/api/data/export"
                                        download
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', background: 'rgba(0,163,255,0.15)', border: '1px solid rgba(0,163,255,0.3)', borderRadius: '8px', color: '#00A3FF', textDecoration: 'none', cursor: 'pointer' }}
                                    >
                                        <Download size={14} />
                                        Export CSV
                                    </a>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Delete all saved posts? This will free up space. Alerts will not be affected.')) return;
                                            setClearing(true);
                                            try {
                                                await axios.post('/api/data/clear');
                                                mutateData();
                                            } catch (e) {
                                                alert('Error');
                                            } finally {
                                                setClearing(false);
                                            }
                                        }}
                                        disabled={clearing}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', fontSize: '0.85rem', background: 'rgba(255,69,69,0.15)', border: '1px solid rgba(255,69,69,0.3)', borderRadius: '8px', color: '#FF4545', cursor: clearing ? 'not-allowed' : 'pointer' }}
                                    >
                                        <Trash2 size={14} />
                                        {clearing ? '…' : 'Clear'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
