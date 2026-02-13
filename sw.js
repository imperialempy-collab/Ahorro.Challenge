self.addEventListener('fetch', (event) => {
  // Este código permite que la app funcione offline y sea instalable
  event.respondWith(fetch(event.request));
});
