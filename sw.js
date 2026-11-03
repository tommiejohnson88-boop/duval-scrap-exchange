const CACHE_NAME = 'duval-scrap-v6';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// OS-Level Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'Duval Scrap Alert',
    body: 'New live scrap rates posted in Jacksonville.',
    tag: 'duval-alert',
    url: './'
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" rx="36" fill="%2307090e"/%3E%3Cg fill="none" stroke="%23f59e0b" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" transform="translate(16, 16)"%3E%3Cpath d="m128 128 24-64 24 64c-7 5.2-15.3 8-24 8s-17-2.8-24-8Z" fill="%23f59e0b" fill-opacity="0.25"/%3E%3Cpath d="m16 128 24-64 24 64c-7 5.2-15.3 8-24 8s-17-2.8-24-8Z" fill="%23f59e0b" fill-opacity="0.25"/%3E%3Cpath d="M56 168h48" stroke-width="12"/%3E%3Cpath d="M80 24v144" stroke-width="12"/%3E%3Cpath d="M24 56h112" stroke-width="12"/%3E%3Ccircle cx="80" cy="24" r="6" fill="%23f59e0b"/%3E%3C/g%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" rx="36" fill="%2307090e"/%3E%3Cpath d="M80 24v144M24 56h112" stroke="%23f59e0b" stroke-width="16" stroke-linecap="round"/%3E%3C/svg%3E',
    vibrate: [200, 100, 200, 100, 250],
    tag: data.tag || 'duval-general',
    renotify: true,
    data: { url: data.url || './' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click action on system notification: Focus existing window or open new
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('duval-scrap') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
