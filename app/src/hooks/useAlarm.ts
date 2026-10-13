'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useAlarm() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [oscillatorNode, setOscillatorNode] = useState<OscillatorNode | null>(null);

  const playAlarm = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      // Create alarm pattern: beep-beep-beep
      const now = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        const t = now + i * 0.6;
        osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.setValueAtTime(0.3, t + 0.15);
        gain.gain.setValueAtTime(0, t + 0.2);
        osc.frequency.setValueAtTime(1046, t + 0.3);
        gain.gain.setValueAtTime(0.3, t + 0.3);
        gain.gain.setValueAtTime(0.3, t + 0.45);
        gain.gain.setValueAtTime(0, t + 0.5);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 12);

      setAudioCtx(ctx);
      setOscillatorNode(osc);
      setIsPlaying(true);

      // Also try vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 300, 200, 600]);
      }
    } catch {
      console.warn('Could not play alarm sound');
    }
  }, []);

  const stopAlarm = useCallback(() => {
    try {
      oscillatorNode?.stop();
      audioCtx?.close();
    } catch {
      // already stopped
    }
    setIsPlaying(false);
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, [audioCtx, oscillatorNode]);

  useEffect(() => {
    return () => {
      try { oscillatorNode?.stop(); audioCtx?.close(); } catch {}
    };
  }, [audioCtx, oscillatorNode]);

  return { isPlaying, playAlarm, stopAlarm };
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        setSwRegistration(reg);
        return reg.pushManager.getSubscription();
      }).then(sub => {
        if (sub) setSubscription(sub);
      }).catch(console.error);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const sendTestNotification = useCallback(() => {
    if (swRegistration && permission === 'granted') {
      swRegistration.showNotification('Catchr Test 🚌', {
        body: 'Notifications are working! You\'ll get alerts when your bus approaches.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: 'catchr-test',
      } as any);
    }
  }, [swRegistration, permission]);

  const registerDevice = useCallback(async () => {
    if (!swRegistration) return false;
    
    try {
      let sub = await swRegistration.pushManager.getSubscription();
      if (!sub) {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("VAPID public key not found");
          return false;
        }
        
        // Convert base64 VAPID key to Uint8Array
        const padding = '='.repeat((4 - vapidPublicKey.length % 4) % 4);
        const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        sub = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
        setSubscription(sub);
      }

      // Save to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session && sub) {
        await supabase.from('devices').upsert({
          user_id: session.user.id,
          push_subscription: JSON.parse(JSON.stringify(sub))
        }, { onConflict: 'user_id' });
      }

      return true;
    } catch (err) {
      console.error('Failed to subscribe device', err);
      return false;
    }
  }, [swRegistration]);

  return { permission, subscription, requestPermission, sendTestNotification, swRegistration, registerDevice };
}
