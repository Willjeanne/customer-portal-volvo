# Volvo Customer Portal

Portail B2B Volvo indépendant, compte cible `volvoemea`, démonstration WanderGarage. Le périmètre et les six tranches restent dans [START.md](START.md). Cette première livraison démarre la tranche 1 ; elle ne termine pas la couverture My Account.

## Démarrer en local

Node 24, npm. Depuis ce dossier :

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Ouvrir **http://127.0.0.1:3000**. Utiliser cette origine exacte pour les contrôles CSRF. Le serveur écoute uniquement sur la boucle locale.

- **Local preview** : sessions séparées Buyer/Admin/Approver/Procurement, données et droits synthétiques explicitement signalés. Le changement Dallas/Chicago teste le contexte et efface le véhicule précédent ; il ne décrit pas les appartenances VTEX réelles.
- **VTEX sign-in** : adaptateur expérimental local vers le login B2B Authenticator déjà déployé. Saisir les accès dans le navigateur. Aucun secret dans un fichier ou la conversation. L’adaptateur vise authentification, accès Buyer Portal, unité et contrat ; validation avec un compte réel encore attendue.
- Profil et organisation : lecture du contexte de session seulement. Édition du profil, droits effectifs et services métier restent à connecter.
- Les autres destinations affichent explicitement leur tranche à venir. Les commandes, devis, listes, paiements et claims ne sont pas implémentés.

## Vérification

```sh
npm run typecheck
npm run lint
npm test
# Avec npm run dev actif, test HTTP local supplémentaire :
PORTAL_INTEGRATION_TESTS=true npm test
npm run build
```

Le build production est vérifié, mais la connexion est volontairement désactivée hors du mode développement : cette première version ne doit pas être déployée pour un usage connecté. Les sessions locales expirent après 30 minutes et disparaissent au redémarrage. La déconnexion révoque la session du portail, pas celle d’un autre site VTEX.

## Structure

- `src/app` : pages Next.js et endpoints BFF strictement limités.
- `src/domain` : contexte, navigation et fixtures de démonstration.
- `src/server` : sessions, contrôles d’origine et adaptateur B2B local.
- `src/components` : interface Volvo responsive.
- `tests` : contrôles de permissions, sessions et API locale.
- `docs/SUIVI_REALISATION.md` : état réel, preuves, limites et prochaines étapes.

## GitHub et Vercel

Origine : https://github.com/Willjeanne/customer-portal-volvo.git. Dépôt accessible et vide au démarrage. Le remote est configuré localement ; aucun push n’a été effectué.

Vercel CLI est connecté à `willjeanne` : Codex pourra créer et lier le projet lors de la phase de publication. Il reste à choisir l’équipe cible si nécessaire, qualifier l’authentification HTTPS et remplacer le stockage de session local. Aucun projet/domaine/déploiement Vercel créé.

## Sources visuelles

Maquette de l’accueil : `Design/assets/screens/01-home-buyer.png`. Tokens provisoires du pack conservés ; navigation du cadrage actif prioritaire. Wordmark fourni localement dans `Downloads/volvo logo.png`, copié dans `public/assets`. Camion illustratif généré pour cet aperçu, sans valeur de preuve de flotte ou de fitment. Icônes Phosphor, police Inter fournie par `@fontsource/inter`.
