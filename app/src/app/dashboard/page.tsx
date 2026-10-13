'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReminders } from '@/hooks/useReminders';
import { STATUS_CONFIG } from '@/lib/constants';
import type { Reminder } from '@/types';

import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const { reminders, loading, updateStatus, remove, togglePause, refresh } = useReminders();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setMounted(true);
      }
    });
  }, [router]);

  if (!mounted || loading) {
    return (
      <div className="page-container">
        <div className="page-content" style={{ paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 60 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        </div>
      </div>
    );
  }

  const filtered = filter === 'all' ? reminders : reminders.filter(r => r.status === filter);
  const activeCount = reminders.filter(r => ['idle', 'monitoring', 'candidate'].includes(r.status)).length;

  return (
    <div className="page-container">
      <div className="page-content" style={{ paddingTop: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Your Alerts</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {activeCount > 0 ? `${activeCount} active reminder${activeCount > 1 ? 's' : ''}` : 'No active reminders'}
            </p>
          </div>
          <Link href="/create" className="btn btn-primary btn-sm btn-pill">
            + New
          </Link>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, marginBottom: 8 }}>
          {['all', 'idle', 'monitoring', 'candidate', 'notified', 'completed', 'paused'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn btn-sm btn-pill" style={{
              background: filter === f ? 'var(--bg-elevated)' : 'transparent',
              border: `1px solid ${filter === f ? 'var(--cyan)' : 'var(--border)'}`,
              color: filter === f ? 'var(--cyan)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap', fontSize: '0.75rem', padding: '6px 14px',
            }}>
              {f === 'all' ? `All (${reminders.length})` : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {reminders.length === 0 && (
          <div className="animate-fade-in-up" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🚌</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>No reminders yet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              Create your first reminder and never miss a bus again.
            </p>
            <Link href="/create" className="btn btn-primary btn-lg btn-pill">
              + Set Your First Reminder
            </Link>
          </div>
        )}

        {/* Reminder Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((reminder, i) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              index={i}
              onTogglePause={() => togglePause(reminder.id)}
              onActivate={() => updateStatus(reminder.id, 'monitoring')}
              onComplete={() => updateStatus(reminder.id, 'completed')}
              onDelete={() => setDeleteId(reminder.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && reminders.length > 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No reminders with this status
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="solid-card animate-slide-up" style={{ width: '100%', maxWidth: 480, padding: 24, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Delete Reminder?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => { remove(deleteId); setDeleteId(null); }} className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

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
              textDecoration: 'none', color: item.id === 'dashboard' ? 'var(--cyan)' : 'var(--text-muted)',
              fontSize: '0.7rem', fontWeight: item.id === 'dashboard' ? 700 : 400, position: 'relative',
            }}>
              {item.id === 'dashboard' && <div style={{ position: 'absolute', top: 0, width: 20, height: 3, borderRadius: 2, background: 'var(--cyan)' }} />}
              <span style={{ fontSize: item.id === 'create' ? 22 : 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ReminderCard({ reminder, index, onTogglePause, onActivate, onComplete, onDelete }: {
  reminder: Reminder; index: number;
  onTogglePause: () => void; onActivate: () => void; onComplete: () => void; onDelete: () => void;
}) {
  const config = STATUS_CONFIG[reminder.status] || STATUS_CONFIG.idle;
  const isActive = ['monitoring', 'candidate'].includes(reminder.status);

  return (
    <div
      className={`solid-card animate-fade-in-up ${isActive ? 'animate-pulse-glow' : ''}`}
      style={{
        padding: '20px',
        animationDelay: `${index * 0.05}s`,
        borderColor: isActive ? 'var(--border-active)' : 'var(--border)',
      }}
    >
      {/* Top Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="route-chip">{reminder.route_number}</span>
          <span className={`badge ${config.bgClass}`}>
            {isActive && <span className="status-dot status-dot-active" style={{ width: 6, height: 6 }} />}
            {config.label}
          </span>
        </div>
        <button onClick={onDelete} className="btn btn-ghost btn-icon btn-sm" style={{ opacity: 0.5, fontSize: 16 }}>✕</button>
      </div>

      {/* Details */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 2 }}>📍 {reminder.stop_name}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{reminder.direction_label}</div>
      </div>

      {/* Meta Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <span>🎯 {reminder.threshold_stops} stops away</span>
        <span>🕐 {reminder.active_from_time} – {reminder.active_to_time}</span>
        <span>🔄 {reminder.recurrence_rule}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {reminder.status === 'idle' && (
          <button onClick={onActivate} className="btn btn-primary btn-sm" style={{ flex: 1 }}>▶ Start Monitoring</button>
        )}
        {['monitoring', 'candidate'].includes(reminder.status) && (
          <button onClick={onComplete} className="btn btn-sm" style={{ flex: 1, background: 'rgba(52,211,153,0.15)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.3)' }}>
            ✓ I&apos;m Boarding
          </button>
        )}
        <button onClick={onTogglePause} className="btn btn-secondary btn-sm">
          {reminder.status === 'paused' ? '▶' : '⏸'}
        </button>
      </div>
    </div>
  );
}
