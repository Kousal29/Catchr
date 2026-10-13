'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePushNotifications } from '@/hooks/useAlarm';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { permission, requestPermission, sendTestNotification } = usePushNotifications();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    setMounted(true);
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt && 'prompt' in installPrompt) {
      (installPrompt as { prompt: () => void }).prompt();
    }
  };

  if (!mounted) return null;

  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      {/* Hero Section */}
      <section style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '-10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="page-content" style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 60 }}>
          {/* Logo */}
          <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)' }}>
              <span style={{ fontSize: 24 }}>🚌</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em' }}>CATCHR</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.03em' }}>
            Stop checking.<br />
            <span className="text-gradient">Start catching.</span>
          </h1>

          <p className="animate-fade-in-up delay-200" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 40px', fontWeight: 400 }}>
            Set a reminder for your BMTC bus. Close the app. We&apos;ll alert you like an alarm when it&apos;s time to leave.
          </p>

          {/* CTA */}
          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <Link href="/create" className="btn btn-primary btn-lg btn-pill" style={{ width: '100%', maxWidth: 320, fontSize: '1.05rem' }}>
              <BusIcon /> Set Your First Reminder
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-pill" style={{ fontSize: '0.9rem' }}>
              View Dashboard →
            </Link>
          </div>

          {/* Animated Bus Preview */}
          <div className="animate-fade-in-up delay-400" style={{ marginTop: 48, position: 'relative' }}>
            <div className="glass-card" style={{ padding: '20px 24px', textAlign: 'left', maxWidth: 360, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="route-chip">500D</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>→ Banashankari</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Silk Board Junction</div>
                  </div>
                </div>
                <span className="badge badge-candidate">
                  <span className="status-dot status-dot-active" style={{ width: 6, height: 6 }} />
                  2 stops
                </span>
              </div>

              {/* Mini stop timeline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '8px 0' }}>
                {['', '', 'bus', '', 'you', '', ''].map((item, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: item === 'bus' ? 20 : item === 'you' ? 12 : 6,
                      height: item === 'bus' ? 20 : item === 'you' ? 12 : 6,
                      borderRadius: '50%',
                      background: item === 'bus' ? 'var(--green)' : item === 'you' ? 'var(--cyan)' : 'var(--bg-elevated)',
                      boxShadow: item === 'bus' ? '0 0 12px var(--green-glow)' : item === 'you' ? '0 0 12px var(--cyan-glow)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                      transition: 'all 0.3s ease',
                    }}>
                      {item === 'bus' && '🚌'}
                    </div>
                    {i < 6 && (
                      <div style={{ position: 'absolute', width: `${100/7}%`, height: 2, background: i < 2 ? 'var(--green)' : 'var(--bg-elevated)', top: '50%' }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <span>🚌 Bus here</span>
                <span>📍 Your stop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '60px 0 80px', background: 'linear-gradient(180deg, transparent 0%, rgba(12,18,32,0.5) 100%)' }}>
        <div className="page-content">
          <h2 className="animate-fade-in-up" style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
            How it works
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 40, fontSize: '0.95rem' }}>
            Three taps to peace of mind
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '🔍', title: 'Pick your route & stop', desc: 'Search for your BMTC route number and select your boarding stop.', color: 'var(--cyan)' },
              { icon: '🎯', title: 'Set your threshold', desc: 'Choose when to be notified — 2, 3, or 4 stops before your stop.', color: 'var(--indigo)' },
              { icon: '🔔', title: 'Get alerted like an alarm', desc: 'Close the app. When a bus nears your stop, Catchr buzzes you.', color: 'var(--green)' },
            ].map((f, i) => (
              <div key={i} className="glass-card animate-fade-in-up" style={{ padding: '24px', animationDelay: `${0.1 + i * 0.1}s`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notification + Install Section */}
      <section style={{ padding: '40px 0 100px' }}>
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {permission !== 'granted' && (
            <button onClick={requestPermission} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
              🔔 Enable Notifications
            </button>
          )}
          {permission === 'granted' && (
            <button onClick={sendTestNotification} className="btn btn-secondary" style={{ width: '100%' }}>
              ✅ Notifications On — Send Test
            </button>
          )}
          {installPrompt && (
            <button onClick={handleInstall} className="btn btn-ghost btn-lg" style={{ width: '100%' }}>
              📲 Install Catchr App
            </button>
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <BottomNav active="home" />
    </div>
  );
}

function BusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6v6m7-6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
      <circle cx="7" cy="18" r="2" />
      <path d="M15 18h-4" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function BottomNav({ active }: { active: string }) {
  return (
    <nav className="bottom-nav">
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: 480, margin: '0 auto', padding: '4px 0' }}>
        {[
          { id: 'home', icon: '🏠', label: 'Home', href: '/' },
          { id: 'create', icon: '➕', label: 'New', href: '/create' },
          { id: 'dashboard', icon: '📋', label: 'Alerts', href: '/dashboard' },
        ].map(item => (
          <Link key={item.id} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 20px',
            textDecoration: 'none', color: active === item.id ? 'var(--cyan)' : 'var(--text-muted)',
            fontSize: '0.7rem', fontWeight: active === item.id ? 700 : 400,
            transition: 'all 0.2s ease', position: 'relative',
          }}>
            {active === item.id && (
              <div style={{ position: 'absolute', top: 0, width: 20, height: 3, borderRadius: 2, background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan-glow)' }} />
            )}
            <span style={{ fontSize: item.id === 'create' ? 22 : 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
