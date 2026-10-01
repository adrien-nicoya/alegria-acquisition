# Dashboard acquisition — Challenge Alegria

Page statique + une fonction Vercel (`/api/report`) qui lit ActiveCampaign et Meta en direct à chaque chargement et à chaque clic sur « Mettre à jour ».

1. Pousser ce dossier sur un repo GitHub, l'importer dans Vercel (Framework preset : Other).
2. Renseigner les variables de `.env.example` dans Vercel → Settings → Environment Variables, puis redéployer.
3. Pour tester sur septembre : utiliser les valeurs commentées « Test sur septembre ».

Conventions :
- Tags AC : `[CH] CANAL-<suffixe>` (total du canal), `[CH] CANAL SOURCE-<suffixe>` ou `[CH] CANAL-source-<suffixe>` (sous-source), `[CH] TOTAL-<suffixe>` (total dédoublonné).
- Emails : nom de campagne commençant par `CAMPAIGN_PREFIX` (ex. `CH 10/2026 - INV #3`). Les inscriptions d'un email sont lues sur le tag `[CH] EMAIL-INV3-<suffixe>` (la sous-source doit reprendre le nom après le préfixe, sans espaces ni #).
