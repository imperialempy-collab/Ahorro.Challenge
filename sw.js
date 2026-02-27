// 1. Cargamos el motor de OneSignal
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2. Cargamos el motor para que la AppWeb se pueda instalar (PWA)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
