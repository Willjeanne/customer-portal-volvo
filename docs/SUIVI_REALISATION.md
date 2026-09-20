# Suivi de réalisation — 18 septembre 2026

## Autorisation et état

William a autorisé le démarrage du plan en local, puis l’usage du dépôt `Willjeanne/customer-portal-volvo` et de Vercel ultérieurement. Cette instruction remplace les restrictions de la phase documentaire dans les documents actifs et le pack design. Aucun service métier VTEX, donnée existante, routage, DNS ou déploiement n’a été modifié.

**Tranche 1 commencée, non terminée.** Socle local fonctionnel ; connexion authentifiée et unité réelle validées le 19 septembre ; droits effectifs et profil métier encore à compléter.

| Élément | État / preuve |
|---|---|
| Next.js/React/TypeScript, npm, Node 24 | Initialisés ; lockfile présent ; build, lint, typecheck réussis |
| Git local | Branche main et remote origin configurés ; aucun commit/push |
| Shell et accueil Volvo | Implémentés et ouverts dans le navigateur local ; visuel d’accueil, responsive |
| Navigation | 14 entrées canoniques, visibilité et refus de route selon permissions de fixtures |
| Session d’aperçu | Opaque, cookie HttpOnly/SameSite strict, durée 30 min, révocation serveur au logout |
| Changement de contexte | Testé sur fixtures : unité permise, remise à zéro du véhicule, refus d’unité étrangère et d’injection de droits |
| Profil / organisation | Consultation du contexte ; aucune édition persistante ni service de profil connecté |
| Connexion VTEX | Connexion réelle réussie dans le navigateur local ; unité WanderGarage chargée |
| Droits VTEX effectifs | Non qualifiés. Aucune permission d’achat/approbation déduite d’un nom de rôle ou claim JWT |
| Commandes/devis/listes/compte complet | Tranches suivantes ; pages d’attente explicites, aucune fausse soumission |
| Vercel | Identité CLI `willjeanne` confirmée en lecture ; aucun projet créé |

## Vérification d’authentification ciblée

Le 18 septembre, la page publique `https://www.emeafaststore.com/api/io/login` renvoie HTTP 200 et charge `vtex.login-alternative-key@1.11.3`. Ses scripts publics établissent les opérations suivantes :

1. `POST /api/authenticator/v1/pub/authentication/start`, formulaire `accountName`, `scope`, `returnUrl`, `user`.
2. `POST /api/authenticator/v1/bff/storefront/signin`, formulaire `login`, réponse `nextStep`.
3. Pour `PasswordLogin` : `POST /api/authenticator/v1/pub/authentication/classic/validate`, formulaire `login`, `password`.
4. `GET /api/authenticator/v1/pub/authentication/redirect`, finalisation de session.

L’adaptateur garde les cookies upstream côté serveur. Il n’expose qu’un identifiant de session portail aléatoire, ne suit pas une redirection arbitraire et ne stocke pas le mot de passe. Les méthodes SSO/récupération/création de mot de passe restent dans le login hébergé ; aucune notification de récupération n’est envoyée par le portail.

Le plugin local Buyer Portal 2.0.27 documente par son code les lectures `/_v/store-front/granted` et `/_v/store-front/users/{userId}/units` sur `volvoemea.myvtex.com`. Elles sont réutilisées comme piste de validation, sans garantie implicite de support hors FastStore. Les claims d’identité ne sont lus que depuis les cookies retournés par le login fixe VTEX, après validation backend de l’accès. Les droits granulaires restent vides/non vérifiés.

La documentation [VTEX ID](https://developers.vtex.com/docs/api-reference/vtex-id-api) exclut explicitement Buyer Portal ; ne pas substituer le flux OAuth générique à Authenticator sans vérification. Référence : [login alternative key](https://developers.vtex.com/docs/apps/vtex.login-alternative-key).

## Tests exécutés

Reprise du 19 septembre : serveur local confirmé HTTP 200 ; les 5 tests, dont l’intégration HTTP, réussissent à nouveau. ESLint est fixé à 9.39.5 : la version 10 provoque une erreur interne dans le plugin React fourni par la configuration Next.js. Cette version 9 est signalée hors support par npm ; montée de version à reprendre avec une configuration compatible. Audit npm : aucune vulnérabilité signalée.

- TypeScript strict et lint : réussis.
- Build Next.js : réussi.
- 5 tests réussis, dont un scénario HTTP contre le serveur local : absence de session, CSRF, cookie HttpOnly, refus d’unité étrangère, refus d’élévation de droits, séparation des sessions, suppression du véhicule lors du changement de site, refus d’approbation acheteur, logout et expiration.
- Navigateur : ouverture de l’aperçu, contexte Dallas → Chicago, véhicule remis à zéro, navigation responsive. Voir `design-qa.md`.
- Aucun achat, mutation métier ou appel authentifié VTEX validé à ce stade.

## Prochaine étape

Exécuter la connexion avec `wandergarage-buyer` saisi par William, vérifier les réponses Authenticator et Buyer Portal sans exposer de secrets, puis compléter le mapping unité/contrat/permissions effectives et le profil. Conserver les fonctions indépendantes en progression. Les prochaines tranches suivent le cadrage existant.

Avant Vercel : choisir le stockage de session partagé, qualifier le flux B2B supporté sur le domaine HTTPS, cookie Secure, révocation et expiration VTEX, contrôles de permissions par action ; désactiver les accès de démonstration. Aucun déploiement automatique du socle de validation locale.

## Résolution du blocage de connexion — 19 septembre

Le login Authenticator réussissait, mais notre garde `granted` refusait ensuite l’entrée. Ce contrôle des pages organisation ne doit pas conditionner le login général My Account. Il est remplacé par une lecture backend autorisée de la propre unité de la session, renouvelée lors des accès locaux ; un refus upstream reste bloquant. Le champ nullable `orgUnit.path.names` est accepté. Accueil local réellement connecté observé avec l’utilisateur acheteur et WanderGarage. Les affirmations antérieures d’absence de validation réelle sont historiques ; la prochaine étape est le profil et les permissions par action.

## Profil et historique connectés

Profil en lecture via le service `/api/sessions` utilisé par FastStore My Account : nom réel Buyer WanderGarage vérifié dans le navigateur. L’API d’administration `units/{unitId}/users/{userId}` refuse cet acheteur et n’est pas utilisée. Historique via `/api/oms/user/orders`, même endpoint que FastStore, avec session acheteur et pagination ; état vide réel (0 commande) vérifié. Tests ciblés ajoutés : identité étrangère refusée, session d’aperçu refusée pour appels réels, absence de cache et de clé administrative, pagination bornée. Les permissions effectives restent à qualifier.

## Détail, suivi et documents

Détail en lecture branché à `/api/oms/user/orders/{id}`, endpoint relevé dans le client commerce FastStore. Champs issus du contrat `userOrder.graphql` : items, storePreferencesData, packageAttachment.packages. Liens suivi/facture affichés uniquement pour des URL HTTPS sans identifiants embarqués. Tests de refus 403, absence 404, incohérence de numéro, identifiants invalides, URL exécutables et montants en centimes. Validation sur réponses simulées uniquement faute de commande visible pour l’acheteur réel.

## Lot préparation et listes

Saisie et CSV utilisables, import invalide non destructif vérifié visuellement, doublons 2+3 regroupés en 5. Export CSV, préremplissage depuis commande ou liste codés. Adaptateur GraphQL à requêtes fixes `getLists` et `getListItems` repris du site, sans mutation distante. Lecture réelle des listes indisponible : diagnostic encore ouvert, pas de faux état vide. Aucun transfert panier ni droits d’achat qualifiés. Suite de 15 tests avec HTTP réussie et build réussi.

## Devis

Lecture réelle `/api/quoting/quotes` validée dans le navigateur : 0 devis. Recherche par label, statut natif et pagination ajoutées. Validation des paramètres et conservation des montants vérifiées par test. Création et conversion restent à réaliser ; aucun devis créé pour les tests.

## Brouillons sauvegardés

API locale GET/POST draft, bornée à 200 lignes, protégée par session et Origin pour les écritures ; aucune mutation métier VTEX. Conservation dans la session serveur, invalidation au changement d’unité. Tests HTTP réussis. Devise des devis issue du service de session. Blocage listes précisé : HTTP 400 « GraphQL validation failed », également observé sans cookie ; cause exacte du schéma à investiguer.

## 20 septembre 2026 — lot préparation/panier, connexion partielle

Résolution catalogue exacte SKU/référence + vendeur, fusion des alias, simulation sous session acheteur et affichage prix/devise/quantité/issues livrés dans Quick Order. Cookies de session et propriété de panier conservés côté serveur ; correction des domaines de cookies issus de X-FORWARDED-HOST. Revalidation identité/unité avant les opérations. Préparation valable 5 min, transfert à usage unique avec verrou, permissions d’achat obligatoires et comparaison avant/après SKU/vendeur. Aucun achat ni panier réel modifié.

Preuve navigateur WanderGarage : SKU 1, Clutch Kit for Volvo Buses - Reman 85021811, prix 13 678,86 USD, withoutStock. Quantité disponible fixée à zéro pour ce statut. Transfert réel bloqué par permissionsVerified=false ; chemin testé sur réponses simulées, handoff non réalisé. Listes : requête minimale getLists { id } encore rejetée « GraphQL validation failed » ; schéma/service installé à qualifier, ne pas inférer un refus de droits.

Vérification : 20 tests passent (HTTP local inclus), TypeScript et lint réussis. Le premier essai HTTP a été bloqué par le sandbox localhost (EPERM), puis a réussi avec l’accès local autorisé. Référence simulation : https://developers.vtex.com/docs/guides/simulate-a-shopping-cart ; mécanismes cart/session également repris du code FastStore local en lecture seule.

CLAUDE.md consolidé en état actuel, remplaçant les sections historiques contradictoires. Suite : permissions effectives, qualification des listes, puis ajout réel et handoff du même panier.

Build de production final réussi le 20 septembre (compilation, TypeScript, génération des routes).

## 20 septembre 2026 — méthode révisée après feedback

Plan/cadrage, START.md et CLAUDE.md actualisés uniquement. Priorité à la confirmation des sources du lot, réutilisation avec contrôles de portée, premier point Git au prochain lot fonctionnel, recette manuelle confiée à William (3 à 5 actions), contrôles automatiques regroupés. Statut devis corrigé : API quoting répond, source attendue non confirmée. Commandes détaillées et transfert panier restent non validés sur données réelles. Pas de changement applicatif, de test, de commit ou d’action VTEX durant cette mise à jour documentaire.

## 20 septembre — sources et contrôle réel des droits branché

Point de sauvegarde initial d0fb2d3, sans push. Sources cartographiées dans SOURCES_PARCOURS.md. William confirme create-quote comme référence API des devis personnalisés ; les wireframes/look and feel restent la référence visuelle. Pas de lecture Master Data non filtrée ajoutée.

PlaceOrders confirmé dans la documentation officielle Storefront Roles, endpoint shopper BFF repris du client commerce FastStore. Vérification sans cache à la préparation et avant transfert, booléen strict, refus/indisponibilité distincts, aucune permission globale attribuée. Consultation du panier de la session via GET cart, sans création à la lecture ni exposition des cookies. Prettier installé et fichiers touchés formatés.

22 tests réussis dont intégration HTTP locale ; TypeScript, lint et build réussis. Aucun contrôle navigateur agent ni ajout réel effectué dans ce lot. Recette William : vérifier une référence disponible, lire le résultat permission/stock, transférer si autorisé puis Refresh portal cart ; rapporter le message exact sinon. Handoff checkout et raccordement des devis personnalisés restent à réaliser.

## Validation manuelle William — panier local

William répond « ça fonctionne » à la recette vérification articles → transfert → Refresh portal cart. Parcours validé par retour utilisateur ; références et quantités exactes non fournies. Aucune répétition navigateur agent. Cette validation ne couvre ni le passage de commande ni le handoff checkout ni les devis/listes. Prochaine étape : handoff du panier et raccordement des devis personnalisés, avec sources listes restant à qualifier.

## 20 septembre — revue intégrée des deux lots Claude

Relecture des contrats et chemins flotte/parts ; cinq changements acceptés, réserves et défauts concrets dans REVUE-FLOTTE-PARTS.md. Plan global mis à jour, scope non réduit. Mission proposée à Claude dans LOT-CLAUDE-SUIVANT.md, aucun envoi externe ni agent lancé. Contrôle ciblé : TypeScript réussi, 37 tests passés / 1 HTTP sauté. Aucun changement applicatif effectué dans cette revue, aucun parcours navigateur répété. Le dernier code checkout/devis Codex antérieur à la revue reste en attente de recette réelle.
