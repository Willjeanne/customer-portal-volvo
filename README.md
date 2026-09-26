# Volvo Customer Portal

Portail B2B Volvo indépendant : Next.js 16.3.5, React 19.3, TypeScript et BFF intégré. Compte VTEX `volvoemea`, démonstration WanderGarage. [État fonctionnel](docs/MATRICE_CAPACITES_VOLVO.md) · [Plan](docs/CADRAGE_PORTAIL_VOLVO.md) · [Démo](docs/DEMO-VOLVO.md).

## Démarrer en local

Node **24**, npm. À la première installation seulement :

```sh
npm ci
# Seulement si .env.local n’existe pas déjà :
cp .env.example .env.local
```

Puis lancer le portail sur le port de travail 3001 :

```sh
PORTAL_ORIGIN=http://127.0.0.1:3001 npx next dev --hostname 127.0.0.1 --port 3001
```

Ouvrir http://127.0.0.1:3001/login et saisir les accès dans le navigateur. `npm run dev` et `.env.example` conservent leur défaut **3000** : la commande ci-dessus remplace explicitement le port et l’origine. Ne pas mélanger `localhost` et `127.0.0.1`, ni les ports. Le port 3000 peut être utilisé par un autre projet.

Local preview fournit des personas/données synthétiques ; la connexion VTEX utilise l’identité réelle. Les sessions ont une durée de quatre heures, sous réserve de validité de la session VTEX. Sessions, paniers référencés et dossiers de démo locaux en mémoire peuvent être perdus au redémarrage/rechargement serveur.

## Configuration

| Variable | Usage |
|---|---|
| `PORTAL_ORIGIN` | Origine exacte du portail pour les mutations |
| `PORTAL_ENABLE_VTEX_LOGIN` | Activer la connexion VTEX (`true`) |
| `PORTAL_ENABLE_PREVIEW` | Aperçu synthétique local ; `false` en production |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Stockage partagé production, jeton lecture/écriture |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Alias acceptés pour l’intégration Redis Marketplace |
| `NEXT_PUBLIC_WENI_CHANNEL_UUID` | Canal public WWC de l’AI Assistant |
| `NEXT_PUBLIC_WENI_SOCKET_URL` | WebSocket Weni |
| `NEXT_PUBLIC_WENI_FLOWS_ORIGIN` | Origine Flows Weni |

Les origines du portail doivent être autorisées côté canal Weni. Les variables `NEXT_PUBLIC_*` sont intégrées au build. Ne pas recopier de secrets dans les documents ; les valeurs du projet se configurent dans l’environnement local/Vercel.

## Vérification

```sh
npm run typecheck
npm run lint
npm test
npm run build
# Test HTTP optionnel, avec le serveur 3001 actif :
PORTAL_TEST_ORIGIN=http://127.0.0.1:3001 PORTAL_INTEGRATION_TESTS=true npm test
```

Choisir les tests selon le lot ; ne pas refaire une recette navigateur complète à chaque modification. Le [suivi](docs/SUIVI_REALISATION.md) distingue tests, captures utilisateur et parcours restant à recetter.

## GitHub et Vercel

Repo : https://github.com/Willjeanne/customer-portal-volvo. Projet Vercel : `customer-portal-volvo`, équipe `williams-projects-5f41c690`. Production : https://customer-portal-volvo.vercel.app.

La connexion production fonctionne avec Redis. Configurer l’origine HTTPS exacte, login `true`, preview `false`, puis les variables Redis REST dans Vercel. Un push sur la branche de production déclenche le déploiement Git lié ; contrôler son état Ready et son commit avant d’annoncer une publication. Une modification locale n’est pas automatiquement en production. Dernier état publié confirmé : `2146772` ; voir [CLAUDE.md](CLAUDE.md) pour les différences locales.

## Purchasing Insights

Nouvel écran local `/insights`, à la place de Contracts & Services. Analyse des achats, remises traçables, détails catalogue et comparaison d’offres. [Qualification, calculs et recette](docs/PURCHASING-INSIGHTS.md). Pas encore publié.

## Structure et limites

- `src/app` : pages et endpoint BFF `/api/portal/[operation]`.
- `src/domain` : schémas, règles, protocoles et fixtures.
- `src/server` : services VTEX, sessions et stockage des dossiers de démo.
- `src/components` : interface Volvo, checkout et AI Assistant.
- `tests` : tests automatisés ; `Design` : références ; `docs` : état et sources.

Checkout intégré : soumission Promissory ; autres moyens retournés par VTEX visibles mais non raccordés à la soumission. Claims : dossiers internes de démonstration, sans service SAV connecté. Devis : lecture filtrée codée, qualification du contexte encore ouverte ; aucune création/conversion. Liste exhaustive dans la matrice.

## Dépannage rapide

- Site inaccessible : vérifier le processus et le port 3001 ; un terminal fermé peut arrêter le serveur.
- `This request did not originate from the local portal` : aligner l’URL du navigateur et `PORTAL_ORIGIN`, puis redémarrer le serveur avec la commande ci-dessus.
- `Local validation is not enabled on this deployment` : vérifier l’origine de production et les variables Redis REST ; ne pas activer l’aperçu pour contourner le problème.
- Session expirée : se reconnecter ; une erreur de session n’est pas une preuve de blocage budgétaire.
- Commande incertaine : vérifier son état avant une nouvelle tentative ; ne pas contourner le verrou de soumission.
