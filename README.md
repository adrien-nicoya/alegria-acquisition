# Dashboard acquisition — Challenges Alegria

- `/` : liste des challenges. `/challenge.html?c=<id>` : dashboard d'un challenge.
- Challenge `live` : données lues en direct (ActiveCampaign + Meta) au chargement et via « Mettre à jour ».
- Challenge `done` : bouton « Figer les données » → instantané enregistré dans Vercel Blob, affiché ensuite sans appel API.

Ajouter un challenge : un bloc dans `lib/challenges.js`, puis push. En fin de challenge : passer `status` à `"done"`, pousser, puis « Figer les données ».

Variables Vercel : voir `.env.example`.
