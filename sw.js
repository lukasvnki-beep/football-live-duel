// Minimal service worker: lets phones install the app full screen. It does not cache anything,
// so every open always gets the latest version and live data.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
