// Un bloc par challenge. status : "live" (temps réel) ou "done" (terminé, peut être figé).
// overrides : réaffecte un tag vers un autre canal { tag, to, name, from } (from = canal dont on le déduit).
export default [
  {
    id: 'juillet-2026',
    name: 'Challenge Juillet 2026',
    suffix: '20072026',
    startDate: '2026-07-10',
    endDate: '2026-07-20',
    campaignPrefix: 'CH 07/2026',
    status: 'done',
    overrides: [],
  },
  {
    id: 'septembre-2026',
    name: 'Challenge Septembre 2026',
    suffix: '06092026',
    startDate: '2026-08-21',
    endDate: '2026-09-08',
    campaignPrefix: 'CH 09/2026',
    status: 'done',
    overrides: [
      { tag: '[CH] EMAILS DELPHINE-06092026', to: 'AFFILIATION', name: 'Delphine', from: 'ORGANIQUE' },
    ],
  },
  {
    id: 'octobre-2026',
    name: 'Challenge Octobre 2026',
    suffix: '18102026',
    startDate: '2026-10-08',
    endDate: '2026-10-20',
    campaignPrefix: 'CH 10/2026',
    status: 'live',
    overrides: [],
  },
];
