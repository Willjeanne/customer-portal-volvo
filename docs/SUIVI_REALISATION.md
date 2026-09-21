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

## 20 septembre — atomicité du brouillon et coordination

Ajout serveur synchrone draft-add, sauvegarde complète avec révision, refus de dépassement sans mutation, invalidation de préparation, verrou UI du picker et protection pendant opération panier. Textes catalogue en cours de modification par Claude conservés ; aucun formatage global du fichier partagé. TypeScript/lint réussis, 43 tests unitaires et scénario HTTP séparé réussis ; le scénario couvre 8 ajouts concurrents et conflit de révision. Tableau de coordination/contrats/recette dans COORDINATION.md. Checkout/devis attendent le retour manuel William ; pas de nouvel essai navigateur ni modification VTEX.

## 20 septembre — clôture revue Claude et décision checkout intégré

Lot 3 relu dans le code et handoff ; corrections acceptées, recette navigateur encore à faire. PartsPicker conserve l’ajout atomique Codex avec les textes publics Claude. Les 43 tests unitaires + HTTP séparé du dernier contrôle couvraient l’état combiné ; pas de répétition durant cette revue documentaire. William valide la cible checkout intégré et création de devis depuis le panier. Plan/décisions/coordination mis à jour ; redirection externe désormais transitoire. Catalogue maintenu à 12/page, limites explicites. Aucun développement paiement ou écriture devis effectué dans cette mise à jour.


## 20 septembre — checkout A intégré

Écran local panier/adresses enregistrées/options de livraison et totaux VTEX, transport serveur existant réutilisé. Droits, appartenance et révision recontrôlés avant écriture shippingData. Redirection de Quick Order remplacée par navigation interne. 45 tests réussis, 1 HTTP sauté ; typecheck/build réussis. Pas de recette navigateur automatisée ni commande passée. Paiement, confirmation et création devis restent à réaliser ; recette adresse/livraison confiée à William.


## Continuité de navigation et coordination XLSX

Shell déplacé de la page vers le layout des sections ; fallback contenu dans le cadre. Next Form évite la navigation document complète lors des recherches pièces et filtres devis. Aucun changement Quick Order de ce lot. 45 tests réussis, 1 HTTP sauté ; lint réussi. Types Next régénérés après ajout du layout (premier typecheck bloqué par les types de routes générés obsolètes). Recette visuelle attendue de William.

Création devis : source FastStore relue, POST Master Data authentifié par clé applicative. Pas de preuve de droit d’écriture shopper, aucun appel distant d’écriture ni nouveau bouton de création. Coordination XLSX réservée à l’autre codeur, checkout en attente du flag rapporté, sans diagnostic inventé.


## Qualification réelle des devis — 20 septembre

Connexion WanderGarage réussie ; authentication.storeUserId correspond au compte. POST /api/sessions retourne HTTP 201, mais profile est vide : profile.email absent. Confirmation avec le transport à cookies conservés : POST puis PATCH sur session existante, même absence. Aucune clé applicative utilisée, aucun panier ni devis créé.

Le périmètre organisation est donc indisponible avant même la lecture Master Data. Les droits de lecture/écriture quotes restent NON TESTÉS ; ne pas confondre ce résultat avec un refus Master Data ni avec le flag checkout non identifié. Pas de substitution par customerId ou email acheteur : le contrat existant stocke person.email dans organizationId.

Correctif local : absence de contexte reconnue comme QUOTE_ORGANIZATION_MISSING (409), message explicite au lieu de CUSTOM_QUOTES_FORMAT. Test ciblé réussi : aucun appel quotes sans organisation ; isolation utilisateur/organisation et refus API toujours couverts.

Question technique à transmettre : « Pour volvoemea / WanderGarage, le login B2B est valide mais /api/sessions ne fournit pas profile.email, même après POST puis PATCH avec cookies conservés et X-FORWARDED-HOST www.emeafaststore.com. Le parcours create-quote utilise person.email comme organizationId. Quelle étape initialise ce champ, ou quelle source serveur fournit exactement la même valeur ? Le flag checkout conditionne-t-il cette transformation de session ? »


### Recette Excel et correction tableau prix/disponibilité

William confirme via le handoff de l’autre codeur que l’import Excel fonctionne. Codex a borné la largeur du nom de pièce à 260px et autorisé son repli uniquement dans le tableau Price & availability check (classe availability-table). Les autres cellules conservent nowrap ; les autres tableaux et les zones d’import restent inchangés. Défilement de secours conservé sur petit écran. Recette visuelle du correctif à confirmer avec un nom long, par exemple la référence 21811707.


## 21 septembre — qualification réelle des listes

Source locale comparée : replenishmentApi.ts utilise bien getLists/getListItems et provider vtex.replenishment-service@1.x, comme le portail. Authentification WanderGarage réussie. Requête portail complète puis minimale getLists { id } : HTTP 400 GraphQL validation failed sur www.emeafaststore.com. Même requête minimale sur volvoemea.myvtex.com : même erreur. Aucun appel d’écriture, aucune modification d’installation.

Conclusion bornée : le contrat appelé n’est pas accepté sur les deux chemins testés. Ce n’est pas une liste vide ni un refus d’accès établi. L’absence d’installation, une version différente ou un problème de composition du schéma ne sont pas distinguables avec cette réponse sans détail. Ne pas remplacer les listes par l’entité historique PL ou un accès Master Data administratif.

Correctif : code LISTS_CONTRACT_UNAVAILABLE et message expliquant la vérification du contrat nécessaire, au lieu d’une invitation générique à réessayer. JSON invalide traité en LISTS_RESPONSE. Tests ciblés distinguent contrat rejeté, refus 403 et réponse invalide.

À transmettre à l’équipe VTEX : « Sur volvoemea, avec WanderGarage authentifié, POST /_v/private/graphql/v1 et query { getLists @context(provider: "vtex.replenishment-service@1.x") { id } } renvoient HTTP 400 GraphQL validation failed, sur www.emeafaststore.com et volvoemea.myvtex.com. Pouvez-vous confirmer l’app/version active, le workspace et le contrat de lecture des listes, ou fournir une requête fonctionnelle du parcours ? »


## 21 septembre — My Organization : première tranche

Adaptateur organisation ajouté et écran raccordé : sous-unités et première page utilisateurs de l’unité active, appels séparés avec refus explicites, aucun identifiant d’unité accepté du navigateur. Sources : plugin Buyer Portal 2.0.27 OrgUnitClient (children), UsersClient (users?page=1&search=). Données réelles uniquement, pas de liste vide substituée en cas d’erreur.

Qualification réelle avec WanderGarage buyer : GET unité, children et users retournent tous HTTP 403. L’authentification et la lecture du contexte propre restent valides ; administration non autorisée pour ces appels. Compte organisation administrateur nécessaire pour qualifier une lecture réussie et ensuite les mutations. Aucun utilisateur/unité créé ou modifié. Tests ciblés et typecheck réussis.

Centres de coût : le plugin les expose sous contrats / accountingFieldId=cost-centers (ContractInformationLayout), distincts des unités. Raccordement de leur liste et CRUD encore ouvert, comme création utilisateurs/rôles et unités. Ne pas présenter cette première tranche comme administration complète. Import XLSX de l’autre codeur inchangé.


## 21 septembre — centres de coût et création utilisateurs

Recette William via capture : trois sous-unités et deux utilisateurs visibles avec son compte autorisé. Lecture organisation validée pour ce compte ; ne pas généraliser le refus constaté avec buyer.

Nouveau lot codé : liste première page des valeurs cost-centers sous le contrat/unité courants ; création d’une valeur (code/description) ; rôles disponibles via roles/ids et formulaire de création utilisateur v3 (login, nom, email, rôle). Sources : AccountingValuesClient, RolesClient, UsersClient du plugin Buyer Portal 2.0.27. Contrat et unité dérivés serveur, corps stricts, rôle recontrôlé, session revalidée à chaque mutation ; VTEX reste autorité d’écriture. Aucune clé admin ni token de création envoyé au navigateur. Pas de relance automatique ; formulaire bloqué après succès ou résultat incertain, actualisation de la liste après succès.

Validation : TypeScript et deux tests organisation réussis (scope, rôle invalide, refus, absence de fuite token). Pas de création distante par Codex. Recette William : ouvrir My Organization avec le compte autorisé, vérifier centres/rôles, puis créer explicitement un centre et un utilisateur de démonstration si souhaité et vérifier leur présence après actualisation. Une erreur de lecture après succès ne doit pas conduire à soumettre une seconde création.

Restent ouverts : modification des rôles des utilisateurs existants, édition/suppression centres, pagination au-delà première page, création unités. Les formulaires de création sont codés, pas encore validés contre VTEX en écriture. Import XLSX inchangé.


## 21 septembre — navigation administrative dans les unités

Sous-unités cliquables et fil d’Ariane dans My Organization, jusqu’aux niveaux descendants (ex. Fleet Operations → Chicago Depot). Équipe, rôles et formulaire utilisateur suivent l’unité sélectionnée et affichent son nom. Le serveur vérifie chaque lien parent/enfant auprès de VTEX avant lecture du périmètre et à nouveau avant création ; un chemin périmé/étranger est refusé. Aucun changement de session, panier ou localisation d’achat. Centres de coût maintenus dans le périmètre comptable initial, avec unité explicitement nommée.

Typecheck et trois tests organisation réussis, dont création sur petit-enfant, refus après retrait de la hiérarchie et conservation de l’unité d’achat. Recette visuelle William attendue : ouvrir Fleet Operations puis Chicago Depot, vérifier titre Team et cible du formulaire, revenir par le fil d’Ariane. Aucune création distante effectuée. Pagination utilisateurs et édition des rôles restent ouvertes.


## Priorité courante — démo Volvo (décision William, 21 septembre)

My Organization est suffisant visuellement pour la démo Volvo : conserver les écrans actuels, ne pas poursuivre ce chantier avant la démo. La recette des créations utilisateur/centre de coût et toute validation d’écriture sont reportées après la démo, avant partage aux autres SEs VTEX. Aucun succès d’écriture réel ne doit être annoncé. Restent dans le backlog : modification des rôles, création sous-unités, édition/suppression centres de coût, pagination complète et recette par rôle. Ce report ne retire aucune fonction du périmètre.

Priorités actives :
1. Consolider le parcours de démonstration déjà utilisable : accueil → recherche référence ou flotte/véhicule → préparation Quick Order (saisie/CSV/Excel) → contrôle prix/disponibilité → panier. Corriger seulement les défauts qui gênent la démo, conserver les wireframes et éviter les vérifications navigateur répétées ; courte recette par William.
2. Checkout : obtenir le nom/la portée du flag B2B, puis qualifier adresse/livraison et raccorder paiement/confirmation si débloqué. Ne pas annoncer une finalisation d’achat opérationnelle avant recette.
3. Devis : obtenir la source autorisée équivalente à person.email/profile.email pour l’organisation, puis qualifier accès, création et relecture.
4. Listes : confirmer app/version/workspace et requête GraphQL fonctionnelle avant raccordement ; les appels minimaux restent rejetés.
5. Préparer le script final de démo et le point de sauvegarde local avec distinction données réelles/fixtures/parcours non validés. Pas de push ni déploiement demandé dans cette décision.

Après la démo / préparation au partage SEs : reprendre My Organization et sa recette, puis qualification du déploiement et des autres fonctions restantes selon priorités convenues. La disponibilité des intégrations détermine l’ordre entre checkout, devis et listes ; aucune nouvelle série de sondages identiques sans information nouvelle.


## Adaptation Vercel — sessions partagées

Projet customer-portal-volvo lié au dossier. Stockage partagé Upstash Redis REST implémenté pour production ; local conserve la Map. Cookie opaque HttpOnly/Secure, expiration 30 minutes, conservation serveur des cookies VTEX et brouillon/panier. Verrou Redis de 180 secondes pour les requêtes API d’une même session, sauvegarde conditionnée au propriétaire du verrou, révocation sans résurrection ; durée route limitée à 120 secondes. Pas de relance automatique des opérations distantes. Origine exacte customer-portal-volvo.vercel.app autorisée, aperçu interdit en production, limite login partagée par IP.

Déploiement fonctionnel en attente de configuration stockage : UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN absents du projet Vercel inspecté. Connexion bloquée tant qu’ils manquent. Connecter une base Upstash Redis au projet en Production, configurer PORTAL_ORIGIN=https://customer-portal-volvo.vercel.app, PORTAL_ENABLE_VTEX_LOGIN=true et PORTAL_ENABLE_PREVIEW=false, puis redéployer. Aucune base temporaire ou facturable créée. Recette réelle production (login/navigation/logout) à faire après raccordement.

Tests ajoutés : persistance entre requêtes, exclusion concurrente, sauvegarde après erreur, révocation, configuration production et refus origine étrangère. Documentation technique REST de référence : https://upstash.com/docs/redis/features/restapi .
