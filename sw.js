/* KaisPilot service worker: yalnızca push bildirimi */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'KaisPilot', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'KaisPilot', { body: d.body || '', tag: d.tag || 'kp', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ('focus' in c) return c.focus(); } return self.clients.openWindow(url); }));
});

/* Çevrimdışı: uygulama kabuğunu önbelleğe al (önce ağ, olmazsa önbellek) */
const KP_C = 'kp-shell-v1';
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url); if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate' || u.pathname === '/' || u.pathname.endsWith('.html')) {
    e.respondWith(fetch(r).then((x) => { const c = x.clone(); caches.open(KP_C).then((k) => k.put(r, c)); return x; }).catch(() => caches.match(r).then((m) => m || caches.match('/'))));
  } else if (/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then((m) => { const f = fetch(r).then((x) => { const c = x.clone(); caches.open(KP_C).then((k) => k.put(r, c)); return x; }).catch(() => m); return m || f; }));
  }
});
