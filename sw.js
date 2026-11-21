// Service worker ringan: cache file statis agar web cepat & bisa dibuka offline.
const V = 'kas-kelas-v2';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'manifest.json',
  'img/bg-menu.webp', 'img/bg-intro.webp', 'img/icon-192.png', 'img/favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // API Google & font: biarkan lewat jaringan biasa
  if (u.origin !== location.origin) return;
  // stale-while-revalidate
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: true });
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : clients.openWindow('./#/bayar')));
});
