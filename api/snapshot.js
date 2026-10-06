// Cron horaire : à minuit (Paris), enregistre les totaux d'inscrits de la journée écoulée pour le challenge en cours.
import challenges from '../lib/challenges.js';
import { getSignups } from '../lib/compute.js';
import { saveDaily } from '../lib/store.js';

export const config = { maxDuration: 60 };
const paris = (d, opts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', ...opts }).format(d);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();
  const now = new Date();
  const force = new URL(req.url, 'http://x').searchParams.has('force');
  if (!force && Number(paris(now, { hour: 'numeric', hour12: false })) % 24 !== 0) return res.status(200).json({ skipped: true });

  const day = paris(new Date(now.getTime() - 30 * 60e3)); // journée qui vient de se terminer
  const live = challenges.filter(c => c.status === 'live' && day >= c.startDate && day <= c.endDate);
  const out = [];
  for (const ch of live) {
    const s = await getSignups(ch.suffix, ch.overrides || []);
    const channels = Object.fromEntries(s.channels.map(c => [c.key, c.total]));
    await saveDaily(ch.id, day, { date: day, takenAt: now.toISOString(), total: s.total, meta: channels.META ?? 0, channels });
    out.push({ id: ch.id, day, total: s.total });
  }
  res.status(200).json({ saved: out });
}
