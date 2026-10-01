/* SHARING INTO THE APP, the fallback (1 Oct 2026). The phone's service worker
 * (sw.js) normally catches a share before it gets here. If it didn't (the app was
 * just installed, or the worker was busy updating), the share can't be kept, so this
 * sends people to the Porch with a note to share it again. */
export function onRequest({ request }) {
  return Response.redirect(new URL('/feed/porch.html?shared=0', request.url).toString(), 303);
}
