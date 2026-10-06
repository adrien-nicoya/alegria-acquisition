// Un bloc par challenge. status : "live" (temps réel) ou "done" (terminé, peut être figé).
// posthog : optionnel, affiche la section A/B test de la page d'inscription ({ projectId }).
// emailSignupsByDay : optionnel, inscrits du tag EMAIL par jour (export « Tendances de tag » AC).
//   Chaque email reçoit les inscrits de son jour d'envoi (si 2 emails le même jour : le premier).
// metaSignupsByDay : optionnel (challenges passés), inscrits du tag META global par jour → CPL réel par jour.
// excludeEmails : optionnel, numéros d'emails à masquer (ex. emails qui renvoient directement vers le live).
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
    emailSignupsByDay: {
      '2026-07-08': 1, '2026-07-10': 525, '2026-07-11': 162, '2026-07-12': 155, '2026-07-13': 197,
      '2026-07-14': 182, '2026-07-15': 181, '2026-07-16': 488, '2026-07-17': 173, '2026-07-18': 107,
      '2026-07-19': 226, '2026-07-20': 409,
    },
    excludeEmails: [12, 13, 14],
    metaSignupsByDay: {
      '2026-07-10': 1075, '2026-07-11': 1432, '2026-07-12': 1877, '2026-07-13': 1942, '2026-07-14': 2102,
      '2026-07-15': 1998, '2026-07-16': 2098, '2026-07-17': 2086, '2026-07-18': 2194, '2026-07-19': 2222,
      '2026-07-20': 1365,
    },
  },
  {
    id: 'septembre-2026',
    name: 'Challenge Septembre 2026',
    suffix: '06092026',
    startDate: '2026-08-21',
    endDate: '2026-09-06',
    campaignPrefix: 'CH 09/2026',
    status: 'done',
    overrides: [
      { tag: '[CH] EMAILS DELPHINE-06092026', to: 'AFFILIATION', name: 'Delphine', from: 'ORGANIQUE' },
    ],
    emailSignupsByDay: {
      '2026-08-28': 550, '2026-08-29': 405, '2026-08-30': 304, '2026-08-31': 250, '2026-09-01': 437,
      '2026-09-02': 218, '2026-09-03': 379, '2026-09-04': 175, '2026-09-05': 247, '2026-09-06': 268,
    },
    metaSignupsByDay: {
      '2026-08-22': 886, '2026-08-23': 1761, '2026-08-24': 1711, '2026-08-25': 1528, '2026-08-26': 1689,
      '2026-08-27': 2171, '2026-08-28': 2980, '2026-08-29': 2825, '2026-08-30': 2467, '2026-08-31': 2026,
      '2026-09-01': 1242, '2026-09-02': 1176, '2026-09-03': 1255, '2026-09-04': 1648, '2026-09-05': 2155,
      '2026-09-06': 2092,
    },
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
    posthog: { projectId: 'ID_DU_PROJET' },
  },
];
