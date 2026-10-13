import type { Reminder, SavedCommute } from '@/types';

const REMINDERS_KEY = 'catchr_reminders';
const COMMUTES_KEY = 'catchr_saved_commutes';
const RECENT_ROUTES_KEY = 'catchr_recent_routes';

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Reminders
export function getReminders(): Reminder[] {
  return getItem<Reminder[]>(REMINDERS_KEY, []);
}

export function saveReminder(reminder: Reminder) {
  const reminders = getReminders();
  const idx = reminders.findIndex(r => r.id === reminder.id);
  if (idx >= 0) {
    reminders[idx] = reminder;
  } else {
    reminders.unshift(reminder);
  }
  setItem(REMINDERS_KEY, reminders);
}

export function deleteReminder(id: string) {
  const reminders = getReminders().filter(r => r.id !== id);
  setItem(REMINDERS_KEY, reminders);
}

export function updateReminderStatus(id: string, status: Reminder['status']) {
  const reminders = getReminders();
  const r = reminders.find(r => r.id === id);
  if (r) {
    r.status = status;
    r.updated_at = new Date().toISOString();
    setItem(REMINDERS_KEY, reminders);
  }
}

// Saved Commutes
export function getSavedCommutes(): SavedCommute[] {
  return getItem<SavedCommute[]>(COMMUTES_KEY, []);
}

export function saveCommute(commute: SavedCommute) {
  const commutes = getSavedCommutes();
  commutes.unshift(commute);
  setItem(COMMUTES_KEY, commutes);
}

// Recent Routes
export function getRecentRoutes(): string[] {
  return getItem<string[]>(RECENT_ROUTES_KEY, []);
}

export function addRecentRoute(routeNumber: string) {
  const recent = getRecentRoutes().filter(r => r !== routeNumber);
  recent.unshift(routeNumber);
  setItem(RECENT_ROUTES_KEY, recent.slice(0, 10));
}
