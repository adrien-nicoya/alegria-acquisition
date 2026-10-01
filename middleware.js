// Protection par mot de passe (active seulement si DASHBOARD_PASSWORD est défini).
export const config = { matcher: '/((?!_vercel).*)' };

export default function middleware(req) {
  const pwd = process.env.DASHBOARD_PASSWORD;
  if (!pwd) return;
  const auth = req.headers.get('authorization') || '';
  const [, b64] = auth.split(' ');
  const pass = b64 ? atob(b64).split(':').slice(1).join(':') : '';
  if (pass === pwd) return;
  return new Response('Accès protégé', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Dashboard Alegria"' },
  });
}
