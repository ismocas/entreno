// Service worker: guarda la app en el móvil para que funcione sin conexión.
// Al cambiar cualquier archivo de la app, sube el número de versión.
const VERSION = 'entreno-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/app.js', 'js/plan.js', 'js/engine.js', 'js/storage.js',
  'icons/kleos.svg', 'icons/kleos-192.png', 'icons/kleos-512.png', 'icons/kleos-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

// Primero la copia guardada (rápido y sin conexión); si no está, la red.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() => caches.match('index.html'))),
  );
});
