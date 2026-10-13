'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchRoutes, getRouteDetails } from '@/lib/bmtc-client';
import { useReminders } from '@/hooks/useReminders';
import { usePushNotifications } from '@/hooks/useAlarm';
import { addRecentRoute, getRecentRoutes } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { THRESHOLD_OPTIONS, RECURRENCE_OPTIONS } from '@/lib/constants';
import type { BMTCRoute, BMTCRouteDetails, BMTCStop } from '@/types';

export default function CreateReminderPage() {
  const router = useRouter();
  const { createReminder } = useReminders();
  const { permission, requestPermission, registerDevice } = usePushNotifications();

  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [routes, setRoutes] = useState<BMTCRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BMTCRoute | null>(null);
  const [routeDetails, setRouteDetails] = useState<BMTCRouteDetails | null>(null);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [selectedStop, setSelectedStop] = useState<BMTCStop | null>(null);
  const [threshold, setThreshold] = useState(2);
  const [fromTime, setFromTime] = useState('07:00');
  const [toTime, setToTime] = useState('09:00');
  const [recurrence, setRecurrence] = useState('once');
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [recentRoutes, setRecentRoutes] = useState<string[]>([]);
  const [created, setCreated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setMounted(true);
      }
    });
    setRecentRoutes(getRecentRoutes());
  }, [router]);

  // Debounced search
  useEffect(() => {
    if (query.length < 1) { setRoutes([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchRoutes(query);
      setRoutes(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectRoute = useCallback(async (route: BMTCRoute) => {
    setSelectedRoute(route);
    setLoadingDetails(true);
    addRecentRoute(route.routeno);
    const details = await getRouteDetails(route.routeid, route.routeno);
    setRouteDetails(details);
    setLoadingDetails(false);
    setStep(2);
  }, []);

  const selectDirection = (dir: 'up' | 'down') => {
    setDirection(dir);
    setStep(3);
  };

  const selectStop = (stop: BMTCStop) => {
    setSelectedStop(stop);
    setStep(4);
  };

  const handleCreate = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (granted) await registerDevice();
    } else {
      await registerDevice();
    }
    
    if (!selectedRoute || !selectedStop) return;

    const dirLabel = direction === 'up'
      ? `${routeDetails?.fromstation} → ${routeDetails?.tostation}`
      : `${routeDetails?.tostation} → ${routeDetails?.fromstation}`;

    createReminder({
      route_number: selectedRoute.routeno,
      route_name: selectedRoute.routename,
      direction_label: dirLabel,
      stop_name: selectedStop.stationname,
      threshold_stops: threshold,
      active_from_time: fromTime,
      active_to_time: toTime,
      recurrence_rule: recurrence,
      status: 'idle',
      is_favorite: false,
      last_notified_at: undefined,
      last_candidate_vehicle_id: undefined,
      notification_cooldown_minutes: 5,
    });

    setCreated(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  const stops = routeDetails ? (direction === 'up' ? routeDetails.upstops : routeDetails.downstops) : [];

  if (!mounted) return null;

  return (
    <div className="page-container">
      <div className="page-content" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Link href="/" className="btn btn-ghost btn-icon" style={{ fontSize: 20 }}>←</Link>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Reminder</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* Step Indicator */}
        <div className="step-indicator" style={{ marginBottom: 32 }}>
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`step-dot ${s === step ? 'active' : s < step ? 'completed' : ''}`} />
          ))}
        </div>

        {/* Success State */}
        {created && (
          <div className="animate-fade-in-up" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Reminder Set!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>We&apos;ll alert you when {selectedRoute?.routeno} approaches {selectedStop?.stationname}</p>
          </div>
        )}

        {/* Step 1: Route Search */}
        {!created && step === 1 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Which bus route?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>Search by route number</p>

            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                type="text"
                className="input"
                placeholder="e.g. 500D, 335E, 401K..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                style={{ paddingLeft: 44, fontSize: '1.05rem' }}
              />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.5 }}>🔍</span>
              {searching && <div className="animate-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--cyan)', borderRadius: '50%' }} />}
            </div>

            {/* Recent Routes */}
            {query.length === 0 && recentRoutes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {recentRoutes.map(r => (
                    <button key={r} className="btn btn-secondary btn-sm" onClick={() => setQuery(r)} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Route Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {routes.map((r, i) => (
                <button key={r.routeid} onClick={() => selectRoute(r)} className="solid-card animate-fade-in-up" style={{ padding: '16px 20px', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--border)', animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span className="route-chip">{r.routeno}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.fromstation} → {r.tostation}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.distance} km</div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Direction */}
        {!created && step === 2 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Which direction?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              Route <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>{selectedRoute?.routeno}</span>
            </p>

            {loadingDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => selectDirection('up')} className="glass-card" style={{ padding: 24, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>↑</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{routeDetails?.fromstation}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>→ {routeDetails?.tostation}</div>
                  </div>
                </button>
                <button onClick={() => selectDirection('down')} className="glass-card" style={{ padding: 24, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>↓</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{routeDetails?.tostation}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>→ {routeDetails?.fromstation}</div>
                  </div>
                </button>
              </div>
            )}
            <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ marginTop: 16, width: '100%' }}>← Back to routes</button>
          </div>
        )}

        {/* Step 3: Stop Selection */}
        {!created && step === 3 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Your boarding stop</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>Select where you board the bus</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: 15, top: 24, bottom: 24, width: 2, background: 'var(--bg-elevated)' }} />

              {stops.map((stop, i) => (
                <button key={stop.stationid} onClick={() => selectStop(stop)} className="animate-fade-in-up" style={{
                  padding: '14px 16px 14px 44px', textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  position: 'relative', transition: 'all 0.2s ease', animationDelay: `${i * 0.03}s`, borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-sans)',
                }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    width: i === 0 || i === stops.length - 1 ? 12 : 8,
                    height: i === 0 || i === stops.length - 1 ? 12 : 8,
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--green)' : i === stops.length - 1 ? 'var(--red)' : 'var(--bg-elevated)',
                    border: i === 0 || i === stops.length - 1 ? 'none' : '2px solid var(--text-muted)',
                    zIndex: 1,
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: i === 0 || i === stops.length - 1 ? 700 : 400 }}>
                      {stop.stationname}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{i + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ marginTop: 16, width: '100%' }}>← Back</button>
          </div>
        )}

        {/* Step 4: Threshold + Time */}
        {!created && step === 4 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>When to alert you?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 28 }}>
              Boarding at <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{selectedStop?.stationname}</span>
            </p>

            {/* Threshold */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Alert Threshold
              </div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '3rem', fontWeight: 800, color: 'var(--cyan)' }}>{threshold}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginLeft: 8 }}>stops away</span>
              </div>
              <input type="range" className="threshold-slider" min={1} max={4} value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {THRESHOLD_OPTIONS.map(o => (
                  <span key={o.value} style={{ fontSize: '0.7rem', color: threshold === o.value ? 'var(--cyan)' : 'var(--text-muted)', fontWeight: threshold === o.value ? 600 : 400 }}>
                    {o.label}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 12, textAlign: 'center' }}>
                {THRESHOLD_OPTIONS.find(o => o.value === threshold)?.description}
              </p>
            </div>

            {/* Time Window */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Monitor Between
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="time" className="input" value={fromTime} onChange={e => setFromTime(e.target.value)} style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
                <input type="time" className="input" value={toTime} onChange={e => setToTime(e.target.value)} style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }} />
              </div>
            </div>

            {/* Recurrence */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Repeat
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {RECURRENCE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setRecurrence(o.value)} className="btn btn-sm" style={{
                    flex: 1, background: recurrence === o.value ? 'var(--bg-elevated)' : 'transparent',
                    border: `1px solid ${recurrence === o.value ? 'var(--cyan)' : 'var(--border)'}`,
                    color: recurrence === o.value ? 'var(--cyan)' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                  }}>
                    {o.icon} {o.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(5)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Review Reminder →
            </button>
            <button onClick={() => setStep(3)} className="btn btn-ghost" style={{ marginTop: 8, width: '100%' }}>← Back</button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {!created && step === 5 && (
          <div className="animate-fade-in-up">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>Confirm your reminder</h2>

            <div className="border-gradient" style={{ borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span className="route-chip" style={{ fontSize: '1rem', padding: '8px 18px' }}>{selectedRoute?.routeno}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {direction === 'up' ? routeDetails?.fromstation : routeDetails?.tostation} → {direction === 'up' ? routeDetails?.tostation : routeDetails?.fromstation}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Boarding Stop', value: selectedStop?.stationname, icon: '📍' },
                  { label: 'Alert When', value: `${threshold} stops away`, icon: '🎯' },
                  { label: 'Time Window', value: `${fromTime} – ${toTime}`, icon: '🕐' },
                  { label: 'Repeat', value: RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label, icon: '🔄' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {permission !== 'granted' && (
              <div className="glass-card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'rgba(251,191,36,0.3)' }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--amber)' }}>
                  Notifications are needed to alert you. We&apos;ll ask for permission next.
                </div>
              </div>
            )}

            <button onClick={handleCreate} className="btn btn-primary btn-lg" style={{ width: '100%', fontSize: '1.05rem' }}>
              🔔 Activate Reminder
            </button>
            <button onClick={() => setStep(4)} className="btn btn-ghost" style={{ marginTop: 8, width: '100%' }}>← Back</button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: 480, margin: '0 auto', padding: '4px 0' }}>
          {[
            { id: 'home', icon: '🏠', label: 'Home', href: '/' },
            { id: 'create', icon: '➕', label: 'New', href: '/create' },
            { id: 'dashboard', icon: '📋', label: 'Alerts', href: '/dashboard' },
          ].map(item => (
            <Link key={item.id} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 20px',
              textDecoration: 'none', color: item.id === 'create' ? 'var(--cyan)' : 'var(--text-muted)',
              fontSize: '0.7rem', fontWeight: item.id === 'create' ? 700 : 400,
              position: 'relative',
            }}>
              {item.id === 'create' && <div style={{ position: 'absolute', top: 0, width: 20, height: 3, borderRadius: 2, background: 'var(--cyan)' }} />}
              <span style={{ fontSize: item.id === 'create' ? 22 : 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
