const CACHE = 'brief-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
self.addEventListener('push', e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch { data = { title: 'The Brief', body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(data.title || 'The Brief', {
    body: data.body || 'Your daily brief is ready',
    icon: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs => {
    if (cs.length > 0) { cs[0].focus(); return; }
    clients.openWindow('/');
  }));
});
