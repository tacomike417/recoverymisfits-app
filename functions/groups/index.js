/* recoverymisfits.org/groups -> the GROUPS tab on the Porch (2 Oct 2026). */
export function onRequestGet({ request }) {
  return Response.redirect(new URL('/feed/porch.html?groups=1', request.url).href, 302);
}
