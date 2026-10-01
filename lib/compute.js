// Calcul des données d'un challenge (ActiveCampaign + Meta, en direct).
const env = process.env;
const LEAD_ACTION = env.META_LEAD_ACTION || 'lead';
const META_VERSION = env.META_API_VERSION || 'v23.0';
const CHANNEL_LABELS = { META: 'Meta', YOUTUBE: 'YouTube', ORGANIQUE: 'Organique', EMAIL: 'Emailing', AFFILIATION: 'Affiliation' };
// [CH] META-18102026 | [CH] META CARLOS-18102026 | [CH] ORGANIQUE-linkedin-18102026
const TAG_RE = /^\[CH\]\s+([A-ZÀ-Ÿ]+)(?:[\s-](.+?))?-(\d{8})$/u;

// ---------- ActiveCampaign (5 req/s max) ----------
let nextSlot = 0;
async function ac(path) {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 220;
  if (wait) await new Promise(r => setTimeout(r, wait));
  const r = await fetch(env.AC_BASE_URL.replace(/\/$/, '') + '/api/3' + path, {
    headers: { 'Api-Token': env.AC_API_KEY, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`ActiveCampaign ${r.status} sur ${path.split('?')[0]}`);
  return r.json();
}

const pretty = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const normKey = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function getSignups(suffix, overrideRules = []) {
  const tags = [];
  for (let offset = 0; ; offset += 100) {
    const j = await ac(`/tags?search=${encodeURIComponent(suffix)}&limit=100&offset=${offset}`);
    tags.push(...(j.tags || []));
    if (!j.tags || j.tags.length < 100) break;
  }
  const parsed = tags.map(t => {
    const m = t.tag.trim().match(TAG_RE);
    if (!m || m[3] !== suffix) return null;
    let channel = m[1].toUpperCase();
    if (channel === 'EMAILS') channel = 'EMAIL';
    return { id: t.id, tag: t.tag, channel, source: m[2] ? m[2].trim() : null };
  }).filter(Boolean);
  if (!parsed.length) throw new Error(`Aucun tag [CH] trouvé pour le suffixe ${suffix}`);

  const counts = await Promise.all(parsed.map(p => ac(`/contacts?tagid=${p.id}&limit=1`).then(j => Number(j.meta?.total || 0))));

  const overrides = overrideRules.filter(o => o.tag && o.to)
    .map(o => ({ tag: o.tag.trim().toLowerCase(), to: o.to.toUpperCase(), name: o.name, from: o.from ? o.from.toUpperCase() : null }));

  let totalTag = null;
  const ch = {};
  const get = k => (ch[k] ??= { global: null, sources: {}, extra: {} });
  const moved = [];
  parsed.forEach((p, i) => {
    const ov = overrides.find(o => o.tag === p.tag.trim().toLowerCase());
    if (ov) { moved.push({ ov, count: counts[i], fallback: p.source || p.channel }); return; }
    if (p.channel === 'TOTAL') { if (!p.source) totalTag = counts[i]; return; }
    const c = get(p.channel);
    if (p.source) c.sources[p.source] = (c.sources[p.source] || 0) + counts[i];
    else c.global = counts[i];
  });
  moved.forEach(({ ov, count, fallback }) => {
    const name = ov.name || fallback;
    const t = get(ov.to);
    t.extra[name] = (t.extra[name] || 0) + count;
    if (ov.from && ch[ov.from]?.global != null) ch[ov.from].global = Math.max(ch[ov.from].global - count, 0);
  });

  const channels = Object.entries(ch).map(([key, c]) => {
    const sources = Object.entries(c.sources).map(([name, count]) => ({ name: pretty(name), key: normKey(name), count }));
    const extras = Object.entries(c.extra).map(([name, count]) => ({ name: pretty(name), key: normKey(name), count }));
    const sum = sources.reduce((a, s) => a + s.count, 0);
    const extraSum = extras.reduce((a, s) => a + s.count, 0);
    const total = (c.global ?? sum) + extraSum;
    if (c.global != null && c.global - sum > 0) sources.push({ name: 'Sans sous-source', key: '', count: c.global - sum, rest: true });
    sources.push(...extras);
    sources.sort((a, b) => (a.rest ? 1 : b.rest ? -1 : b.count - a.count));
    return { key, label: CHANNEL_LABELS[key] || pretty(key), total, sources };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const sumChannels = channels.reduce((a, c) => a + c.total, 0);
  return { total: totalTag ?? sumChannels, totalFromTag: totalTag != null, channels };
}

async function getEmails(prefix, startDate, emailSources) {
  const minDate = new Date(new Date(startDate).getTime() - 45 * 864e5);
  const list = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const j = await ac(`/campaigns?orders[sdate]=DESC&limit=100&offset=${offset}`);
    const page = j.campaigns || [];
    list.push(...page);
    const last = page[page.length - 1];
    if (page.length < 100 || (last?.sdate && new Date(last.sdate) < minDate)) break;
  }
  const pfx = prefix.toLowerCase();
  const camps = list.filter(c => (c.name || '').toLowerCase().startsWith(pfx) && Number(c.send_amt) > 0);

  return Promise.all(camps.map(async c => {
    let subject = null;
    try {
      const cm = await ac(`/campaigns/${c.id}/campaignMessage`);
      const msg = Array.isArray(cm.campaignMessage) ? cm.campaignMessage[0] : cm.campaignMessage;
      subject = msg?.subject || null;
      if (!subject && msg?.messageid) subject = (await ac(`/messages/${msg.messageid}`)).message?.subject || null;
    } catch { /* objet non disponible */ }
    const short = c.name.slice(prefix.length).replace(/^[\s\-–—]+/, '');
    const num = (short.match(/#\s*(\d+)/) || [])[1] || null;
    const sent = Number(c.send_amt) || 0;
    const delivered = Math.max(sent - (Number(c.hardbounces) || 0) - (Number(c.softbounces) || 0), 0);
    const src = emailSources.find(s => s.key && s.key === normKey(short));
    return {
      id: c.id, name: short || c.name, number: num ? Number(num) : null, subject,
      sentAt: c.sdate, sent, delivered,
      uniqueOpens: Number(c.uniqueopens) || 0, uniqueClicks: Number(c.uniquelinkclicks) || 0,
      deliverability: sent ? delivered / sent : null,
      openRate: delivered ? (Number(c.uniqueopens) || 0) / delivered : null,
      clickRate: delivered ? (Number(c.uniquelinkclicks) || 0) / delivered : null,
      signups: src ? src.count : null,
    };
  })).then(rows => rows.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)));
}

// ---------- Meta ----------
async function metaRows(id, since, until, daily) {
  const params = { fields: 'spend,actions', level: 'account', limit: '100',
    time_range: JSON.stringify({ since, until }), access_token: env.META_ACCESS_TOKEN };
  if (daily) params.time_increment = '1';
  let url = `https://graph.facebook.com/${META_VERSION}/${id}/insights?` + new URLSearchParams(params);
  const rows = [];
  while (url) {
    const j = await (await fetch(url)).json();
    if (j.error) throw new Error(j.error.message);
    rows.push(...(j.data || []));
    url = j.paging?.next || null;
  }
  return rows;
}

async function getMeta(since, until, warnings) {
  const ids = (env.META_AD_ACCOUNT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const byDay = {};
  let failed = 0;
  const accounts = await Promise.all(ids.map(async id => {
    let rows;
    try {
      rows = await metaRows(id, since, until, true);
    } catch (e1) {
      // Meta renvoie parfois une erreur sur un compte sans diffusion : on vérifie sans découpage par jour.
      try {
        const total = await metaRows(id, since, until, false);
        if (!total.length || !Number(total[0].spend)) return { id, spend: 0, leads: 0, inactive: true };
        rows = await metaRows(id, since, until, true);
      } catch (e2) {
        failed++;
        warnings.push(`Compte Meta ${id} ignoré (${e2.message}) : sa dépense n'est pas comptée.`);
        return { id, spend: 0, leads: 0, failed: true };
      }
    }
    let spend = 0, leads = 0;
    for (const row of rows) {
      const s = Number(row.spend) || 0;
      const l = Number((row.actions || []).find(a => a.action_type === LEAD_ACTION)?.value) || 0;
      spend += s; leads += l;
      const d = (byDay[row.date_start] ??= { date: row.date_start, spend: 0, leads: 0 });
      d.spend += s; d.leads += l;
    }
    return { id, spend, leads, inactive: spend === 0 };
  }));
  if (ids.length && failed === ids.length) throw new Error('Aucun compte Meta n\'a répondu');
  const daily = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, cpl: d.leads ? d.spend / d.leads : null }));
  const spend = accounts.reduce((a, x) => a + x.spend, 0);
  const leads = accounts.reduce((a, x) => a + x.leads, 0);
  return { spend, leads, cplMeta: leads ? spend / leads : null, accounts, daily };
}

const parisToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());

export async function compute(ch) {
  const today = parisToday();
  const until = ch.endDate && ch.endDate < today ? ch.endDate : today;
  const errors = [];
  const warnings = [];

  const [signups, meta] = await Promise.all([
    getSignups(ch.suffix, ch.overrides || []).catch(e => (errors.push(e.message), null)),
    getMeta(ch.startDate, until, warnings).catch(e => (errors.push(e.message), null)),
  ]);
  const emailChannel = signups?.channels.find(c => c.key === 'EMAIL');
  const emails = await getEmails(ch.campaignPrefix, ch.startDate, emailChannel?.sources || [])
    .catch(e => (errors.push(e.message), null));

  const metaSignups = signups?.channels.find(c => c.key === 'META')?.total ?? null;
  if (meta) {
    meta.signupsAC = metaSignups;
    meta.cplReel = meta.spend && metaSignups ? meta.spend / metaSignups : null;
  }
  return {
    generatedAt: new Date().toISOString(),
    challenge: { id: ch.id, name: ch.name, suffix: ch.suffix, startDate: ch.startDate, until, status: ch.status },
    signups, meta, emails, errors, warnings,
  };
}

export function summary(d) {
  return {
    total: d.signups?.total ?? null,
    spend: d.meta?.spend ?? null,
    cplReel: d.meta?.cplReel ?? null,
    cplMeta: d.meta?.cplMeta ?? null,
  };
}
