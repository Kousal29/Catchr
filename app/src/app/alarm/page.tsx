'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAlarm } from '@/hooks/useAlarm';
import { updateReminderStatus } from '@/lib/storage';

export default function AlarmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { playAlarm, stopAlarm, isPlaying } = useAlarm();
  const [mounted, setMounted] = useState(false);

  const reminderId = searchParams.get('rid');
  const route = searchParams.get('route') || 'Bus';
  const stop = searchParams.get('stop') || 'your stop';
  const away = searchParams.get('away') || 'approaching';

  useEffect(() => {
    setMounted(true);
    // Automatically play alarm on mount (browser permitting)
    // Most browsers require user interaction, but since they clicked the notification, 
    // it counts as an interaction and AudioContext should be allowed.
    playAlarm();
    
    // Auto stop after 30 seconds if no interaction
    const timeout = setTimeout(() => {
      stopAlarm();
    }, 30000);

    return () => {
      stopAlarm();
      clearTimeout(timeout);
    };
  }, [playAlarm, stopAlarm]);

  const handleBoarding = () => {
    stopAlarm();
    if (reminderId) {
      updateReminderStatus(reminderId, 'completed');
    }
    router.push('/dashboard');
  };

  const handleSnooze = () => {
    stopAlarm();
    if (reminderId) {
      updateReminderStatus(reminderId, 'monitoring');
    }
    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <div className="page-container alarm-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 0 }}>
      {isPlaying && <div className="alarm-ring-circle" />}
      {isPlaying && <div className="alarm-ring-circle" style={{ animationDelay: '0.6s' }} />}
      {isPlaying && <div className="alarm-ring-circle" style={{ animationDelay: '1.2s' }} />}

      <div className="page-content" style={{ textAlign: 'center', zIndex: 10, width: '100%' }}>
        <div className={`animate-fade-in-up ${isPlaying ? 'animate-alarm-ring' : ''}`} style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--red), var(--red-dim))', boxShadow: 'var(--shadow-glow-red)', fontSize: 36 }}>
            🚌
          </div>
        </div>

        <h1 className="animate-fade-in-up delay-100" style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: 'var(--text-primary)', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
          Bus Approaching
        </h1>

        <div className="animate-fade-in-up delay-200" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 48 }}>
          <span style={{ fontWeight: 700, color: 'white' }}>{route}</span> is {away} {away === '1' ? 'stop' : 'stops'} away from <span style={{ fontWeight: 700, color: 'white' }}>{stop}</span>.
        </div>

        <div className="animate-slide-up delay-300" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 320, margin: '0 auto' }}>
          <button onClick={handleBoarding} className="btn btn-lg" style={{ width: '100%', background: 'linear-gradient(135deg, var(--green), var(--green-dim))', color: 'white', boxShadow: 'var(--shadow-glow-green)', fontSize: '1.2rem' }}>
            ✓ I&apos;m Boarding
          </button>
          
          <button onClick={handleSnooze} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
            ⏰ Snooze 5 min
          </button>
        </div>
      </div>
    </div>
  );
}
