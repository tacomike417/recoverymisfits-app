self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Keep it simple: no caching (avoids weird stale blog pages)
self.addEventListener("fetch", () => {});
