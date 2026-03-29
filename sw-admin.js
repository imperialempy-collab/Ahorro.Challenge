const CACHE_NAME = 'ac-admin-v1';

// Instalación
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch (mínimo necesario para PWA installable)
self.addEventListener('fetch', (event) => {
  // Simplemente deja pasar la petición a la red
  event.respondWith(fetch(event.request));
});
