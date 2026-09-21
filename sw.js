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

   IT NOW DOES ONE MORE THING: it makes sure a page request gets the page
   that is actually on the server.

   21 Sep 2026. A fix went live, the server had it, and the phone kept
   showing the old page through refresh after refresh. GitHub Pages tells
   browsers an .html file is good for ten minutes, so a refresh inside that
   window is answered out of the phone's own cache without ever asking. The
   scripts around it had already updated, which is the worst version of this
   -- the page looks current and is not, and there is no way to tell from
   the outside.

   So page requests now go to the network, every time. Asset requests are
   left alone. If the network is slow or gone, it falls straight back to
   normal browser behavior after four seconds, so this can never be the
   reason somebody is staring at a blank screen. */

const VERSION = "fresh-pages-2026-09-21";

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

/* PAGES COME FROM THE NETWORK. Only navigations -- images, scripts and CSS
   are fingerprinted or rarely changed and are better off cached. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;      /* not a page: browser handles it */

  event.respondWith((async () => {
    try {
      /* cache: "reload" is the part that matters -- it tells the browser to
         skip its own copy and go ask the server. */
      return await Promise.race([
        fetch(req, { cache: "reload" }),
        new Promise((_, no) => setTimeout(function () { no(new Error("slow")); }, 4000))
      ]);
    } catch (e) {
      /* Offline, or a bad signal. Hand it back to the browser and let it do
         whatever it would have done -- including serving its own copy, which
         is the right answer when there is no network to check against. */
      try { return await fetch(req); } catch (e2) { return Response.error(); }
    }
  })());
});
