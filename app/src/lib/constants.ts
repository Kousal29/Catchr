export const APP_NAME = 'Catchr';
export const APP_TAGLINE = 'Stop checking. Start catching.';
export const APP_DESCRIPTION = 'Get notified when your BMTC bus is approaching your stop. No more repeated checking.';

export const BMTC_API_BASE = process.env.NEXT_PUBLIC_BMTC_API_BASE || 'https://bmtcmobileapistaging.amnex.com/WebAPI';

export const THRESHOLD_OPTIONS = [
  { value: 1, label: '1 stop', description: 'Very close — leave immediately' },
  { value: 2, label: '2 stops', description: 'Recommended — enough time to walk' },
  { value: 3, label: '3 stops', description: 'Comfortable buffer' },
  { value: 4, label: '4 stops', description: 'Extra early heads-up' },
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; bgClass: string }> = {
  idle: { label: 'Ready', color: 'var(--text-muted)', bgClass: 'badge-idle' },
  monitoring: { label: 'Monitoring', color: 'var(--amber)', bgClass: 'badge-monitoring' },
  candidate: { label: 'Bus Approaching', color: 'var(--green)', bgClass: 'badge-candidate' },
  notified: { label: 'Alert Sent', color: 'var(--red)', bgClass: 'badge-notified' },
  completed: { label: 'Completed', color: 'var(--cyan)', bgClass: 'badge-completed' },
  paused: { label: 'Paused', color: 'var(--text-secondary)', bgClass: 'badge-paused' },
  expired: { label: 'Expired', color: 'var(--text-muted)', bgClass: 'badge-expired' },
};

export const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'One-time', icon: '1️⃣' },
  { value: 'weekdays', label: 'Weekdays', icon: '📅' },
  { value: 'daily', label: 'Every day', icon: '🔄' },
];

export const POLL_INTERVALS = {
  LOW_URGENCY: 45000,
  MEDIUM_URGENCY: 25000,
  HIGH_URGENCY: 15000,
};
