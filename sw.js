/* RECOVERY MISFITS — SERVICE WORKER

   THIS WORKER'S JOB IS TO GET OUT OF THE WAY, AND TO CLEAN UP AFTER ANY
   WORKER THAT CAME BEFORE IT.

   The app does no offline caching on purpose -- it reads today's reading from
   the network and a stale copy is worse than none. But a worker installed on
   somebody's phone months ago does not disappear when the site changes: it
   keeps running, keeps serving whatever it cached, and can hand an old page
   to a browser that is asking for a new one. Inside the Play Store app that
   looks like a splash screen that never goes away, because the shell is
   waiting on a page the old worker is still deciding about.

   So this one claims control immediately and deletes every cache it can find,
   including caches it did not create. After one load, any older worker's
   leftovers are gone.

   It deliberately does NOT register a fetch handler. A worker with no fetch
   handler is skipped entirely by the browser, which is faster and safer than
   one that intercepts every request to do nothing with it. */

const VERSION = "reset-2026-09-18";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    /* Everything, not just ours: the point is to undo whatever an earlier
       version of this site left behind on people's phones. */
    try {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    } catch (e) { /* a browser that will not list caches has none to clear */ }

    await self.clients.claim();

    /* A page that is already open is still running against the old worker's
       rules. Telling it to reload is the difference between "fixed next time"
       and "fixed now" -- which matters when somebody is staring at a splash
       screen. Guarded so it can only ever happen once per page. */
    try {
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.postMessage({ type: "rm-sw-reset", version: VERSION }));
    } catch (e) {}
  })());
});
