// Protection par mot de passe.
// DASHBOARD_PASSWORD : accès complet.
// DASHBOARD_PASSWORD_LIMITED (optionnel) : accès limité aux challenges de DASHBOARD_LIMITED_CHALLENGES (ids séparés par des virgules).
export const config = { matcher: '/((?!_vercel|api/snapshot).*)' };

const deny = () => new Response('Accès protégé', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Dashboard"' } });

export default function middleware(req) {
  const full = process.env.DASHBOARD_PASSWORD;
  if (!full) return;
  const limited = process.env.DASHBOARD_PASSWORD_LIMITED;
  const user = process.env.DASHBOARD_USER || 'alegria';
  const [, b64] = (req.headers.get('authorization') || '').split(' ');
  const [u, ...rest] = b64 ? atob(b64).split(':') : [];
  const pass = rest.join(':');
  if (u !== user) return deny();
  if (pass === full) return;
  if (!limited || pass !== limited) return deny();

  // Accès limité
  const allowed = (process.env.DASHBOARD_LIMITED_CHALLENGES || '').split(',').map(s => s.trim()).filter(Boolean);
  const url = new URL(req.url);
  const c = url.searchParams.get('c');
  const path = url.pathname;
  if ((path === '/' || path === '/index.html') && allowed.length) {
    return Response.redirect(new URL(`/challenge.html?c=${encodeURIComponent(allowed[0])}`, url), 302);
  }
  if ((path === '/challenge.html' || path === '/challenge' || path === '/api/report') && allowed.includes(c)) return;
  return new Response('Accès non autorisé', { status: 403 });
}
