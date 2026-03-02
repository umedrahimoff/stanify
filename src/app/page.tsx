import Link from "next/link";
import { Shield, Zap, Search, Bell } from "lucide-react";

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div className="glass" style={{
        padding: '4rem',
        maxWidth: '800px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        animation: 'fadeIn 0.8s ease'
      }}>
        <div>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 900,
            background: 'linear-gradient(45deg, #00A3FF, #00D1FF, #00FF94)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            STANIFY
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto' }}>
            Elite Telegram Monitoring Tool. Track channels from a human perspective, identify keywords, and receive instant alerts.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          {[
            { icon: <Shield color="#00A3FF" />, label: "Human Auth" },
            { icon: <Zap color="#FFD600" />, label: "Instant News" },
            { icon: <Search color="#00FF94" />, label: "Smart Filters" },
            { icon: <Bell color="#FF5C00" />, label: "Push Alerts" }
          ].map((feature, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem' }}>{feature.icon}</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{feature.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            Enter Dashboard
          </Link>
          <button className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
            Documentation
          </button>
        </div>
      </div>

      <div style={{ marginTop: '3rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>
        Powerful MTProto Engine &bull; Vercel Ready &bull; Industrial Grade
      </div>
    </div>
  );
}
