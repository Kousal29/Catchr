/// <reference lib="webworker" />

const CACHE_NAME = 'catchr-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/create'];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ============================================
// PUSH NOTIFICATION HANDLER — The Heart of Catchr
// ============================================
self.addEventListener('push', (event) => {
  let data = { title: 'Catchr', body: 'Your bus is approaching!', routeNumber: '', stopName: '', stopsAway: 0, reminderId: '' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    // fallback to default
  }

  const options = {
    body: data.body || `${data.routeNumber} is ${data.stopsAway} stop${data.stopsAway > 1 ? 's' : ''} away from ${data.stopName}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: `catchr-${data.reminderId || 'alert'}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300, 100, 600],
    data: {
      reminderId: data.reminderId,
      routeNumber: data.routeNumber,
      stopName: data.stopName,
      stopsAway: data.stopsAway,
      url: `/alarm?rid=${data.reminderId}&route=${data.routeNumber}&stop=${encodeURIComponent(data.stopName)}&away=${data.stopsAway}`
    },
    actions: [
      { action: 'boarding', title: "🚌 I'm Boarding" },
      { action: 'snooze', title: '⏰ Snooze 5 min' },
      { action: 'dismiss', title: '✕ Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Catchr — Bus Alert!', options)
  );
});

// Notification click: open alarm page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { action } = event;
  const { url } = event.notification.data || {};

  if (action === 'dismiss') return;
  if (action === 'boarding') {
    // Mark reminder as completed
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BOARDING', reminderId: event.notification.data?.reminderId });
        });
      })
    );
    return;
  }
  if (action === 'snooze') {
    // Re-fire in 5 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification('Catchr — Snooze Reminder', {
            body: 'Your bus alert was snoozed. Check your bus status!',
            icon: '/icons/icon-192.png',
            tag: 'catchr-snooze',
            requireInteraction: true,
            vibrate: [300, 100, 300, 100, 600],
            data: event.notification.data
          }).then(resolve);
        }, 5 * 60 * 1000);
      })
    );
    return;
  }

  // Default: open or focus the alarm page
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/alarm') && 'focus' in client) {
          return client.focus();
        }
      }
      if (url && self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
