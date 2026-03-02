"use client";

import { useState } from "react";
import { Key, Phone, ShieldCheck, Mail, Save, Fingerprint, Activity } from "lucide-react";

export default function SettingsPage() {
    const [phone, setPhone] = useState("");
    const [code, setCode] = useState("");
    const [apiId, setApiId] = useState("");
    const [apiHash, setApiHash] = useState("");
    const [step, setStep] = useState(1); // 1 = API Info, 2 = Phone, 3 = Code (UI only, аккаунт уже подключён)

    // Telegram‑аккаунт уже подключён через CLI‑скрипты,
    // поэтому настройки делаем только для просмотра.
    const isTelegramAccountLocked = true;

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Settings</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Configure your Telegram user account and monitoring settings.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <Fingerprint size={28} color="#00A3FF" />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Telegram Account</h2>
                    </div>

                    {isTelegramAccountLocked && (
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
                            Telegram аккаунт уже подключён через серверную конфигурацию и не может быть изменён из админки.
                        </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Step 1: API Information */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>API ID</label>
                            <div style={{ display: 'flex', position: 'relative' }}>
                                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field"
                                    value={apiId}
                                    onChange={(e) => setApiId(e.target.value)}
                                    placeholder="Enter your API ID"
                                    style={{ paddingLeft: '3rem' }}
                                    disabled={isTelegramAccountLocked}
                                    readOnly={isTelegramAccountLocked}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>API HASH</label>
                            <div style={{ display: 'flex', position: 'relative' }}>
                                <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field"
                                    value={apiHash}
                                    onChange={(e) => setApiHash(e.target.value)}
                                    placeholder="Enter your API HASH"
                                    style={{ paddingLeft: '3rem' }}
                                    disabled={isTelegramAccountLocked}
                                    readOnly={isTelegramAccountLocked}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Phone Number</label>
                            <div style={{ display: 'flex', position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    className="input-field"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 234 567 890"
                                    style={{ paddingLeft: '3rem' }}
                                    disabled={isTelegramAccountLocked}
                                    readOnly={isTelegramAccountLocked}
                                />
                            </div>
                        </div>

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Verification Code</label>
                                <div style={{ display: 'flex', position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        className="input-field"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="12345"
                                        style={{ paddingLeft: '3rem' }}
                                        disabled={isTelegramAccountLocked}
                                        readOnly={isTelegramAccountLocked}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <Activity size={28} color="#00FF94" />
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Notification Settings</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Instant Alerts</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Notify as soon as a match is found.</div>
                                </div>
                                <div style={{ width: '48px', height: '24px', background: '#00A3FF', borderRadius: '100px', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer', transition: 'all 0.4s' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', marginLeft: 'auto' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Browser Notifications</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Show system notifications in your browser.</div>
                                </div>
                                <div style={{ width: '48px', height: '24px', background: 'rgba(255,255,255,0.08)', borderRadius: '100px', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer', transition: 'all 0.4s' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%' }}></div>
                                </div>
                            </div>
                        </div>

                        <button className="btn-secondary" style={{ width: '100%', marginTop: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} />
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
