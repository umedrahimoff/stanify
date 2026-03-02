"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Hash, Radio, Bell, Settings, LogOut } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { name: "Overview", icon: <LayoutDashboard size={20} />, href: "/dashboard" },
        { name: "Keywords", icon: <Hash size={20} />, href: "/dashboard/keywords" },
        { name: "Channels", icon: <Radio size={20} />, href: "/dashboard/channels" },
        { name: "Alerts", icon: <Bell size={20} />, href: "/dashboard/alerts" },
        { name: "Settings", icon: <Settings size={20} />, href: "/dashboard/settings" },
    ];

    return (
        <aside className="glass" style={{
            width: '260px',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            zIndex: 100
        }}>
            <div style={{ padding: '0 0.5rem' }}>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #00A3FF, #00D1FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    STANIFY
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    Telegram Monitor v1.0
                </p>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`card`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            textDecoration: 'none',
                            color: pathname === link.href ? 'white' : 'rgba(255,255,255,0.6)',
                            background: pathname === link.href ? 'rgba(255,255,255,0.08)' : 'transparent',
                            borderColor: pathname === link.href ? 'rgba(255,255,255,0.15)' : 'transparent',
                            fontWeight: pathname === link.href ? 600 : 400,
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {link.icon}
                        {link.name}
                    </Link>
                ))}
            </nav>

            <button className="btn-secondary" style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                width: '100%',
                justifyContent: 'flex-start'
            }}>
                <LogOut size={20} />
                Log Out
            </button>
        </aside>
    );
}
