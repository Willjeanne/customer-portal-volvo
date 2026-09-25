## Ajout de pièces aux listes et publication — 25 septembre

Ajout de Save parts to a replenishment list dans Quick Order et dans le détail d’une commande. Sélection d’une liste active accessible à l’acheteur ; résolution exacte références/SKU et productId catalogue avant toute écriture ; quantités fusionnées puis additionnées à celles existantes (plafond 9999). Les commandes sources sont relues via OMS sous l’identité acheteur. Mutations natives addListItem/updateListItem, puis relecture pour confirmer les quantités. Résultat partiel explicite en cas d’échec ; pas de relance automatique. Le service ne fournit pas ici une transaction multi-lignes : éviter les éditions simultanées de la même liste depuis plusieurs interfaces.

Validation : typecheck/lint/build et six tests listes réussis, couvrant résolution, augmentation, refus de liste étrangère et erreur partielle. Recette des écritures réelles de remplissage encore attendue ; création de liste déjà validée par William. Utilisation : Quick Order ou détail commande → Choose a list → Add parts to list → Review saved list contents → contrôle prix/stock habituel. Une fréquence de liste ne déclenche pas de commande automatique.

William demande la publication de tous les changements sur GitHub et Vercel. Inclus : checkout Promissory et diagnostics, affichage dynamique des autres moyens (non raccordés à la soumission), listes création/remplissage, documentation. Carte et véritable bank transfer restent ouverts. Aucune transaction réelle supplémentaire effectuée par Codex.

## Création de listes — 25 septembre

La liste Oil replenishment for truck 123 & 147 est visible selon la capture William : lecture réelle confirmée. Ajout local d’un bouton Create a list sur /lists et formulaire nom (80 caractères), description (280), fréquence none/weekly/biweekly/monthly. Mutation native createList(input: CreateListInput!) du même provider que FastStore ; identité acheteur serveur, validation stricte et contrôle de session/origine existants. Rafraîchissement de la liste après succès ; doubles clics bloqués et échec ambigu signalé sans relance automatique.

Limite explicite : crée une liste vide. Ajout de pièces, création depuis commandes/draft et édition restent ouverts ; ne pas présenter ces parcours comme réalisés. Aucun changement du contrat ou du budget. Typecheck/lint et trois tests listes réussis. Création réelle non exécutée par Codex ; recette William attendue. Non publié.

## Listes de réapprovisionnement — lecture débloquée, 25 septembre

William confirme que la nouvelle commande apparaît maintenant dans Orders : retirer le point de visibilité en attente pour cette commande.

Comparaison effectuée avec src/features/replenishment-lists/lib/replenishmentApi.ts du FastStore Volvo : même endpoint /_v/private/graphql/v1, même provider vtex.replenishment-service@1.x et getLists/getListItems. Nouvelle lecture réelle depuis /lists local 3001, connecté en wandergarage-buyer : succès, tableau getLists vide. Le blocage GraphQL historique n’est plus reproduit. Aucune modification d’API nécessaire pour ce résultat.

La capture William montre le formulaire Name & Create, avant création ; elle ne prouve pas une liste enregistrée. Nom de liste créée et login FastStore demandés afin de qualifier la visibilité avec la même identité. Ne pas conclure absence de listes dans toute l’organisation à partir du seul résultat de ce buyer. Lecture et préparation depuis une liste déjà codées ; création/édition dans le Customer Portal restent à raccorder, pas déclarées acquises. Prochaine étape : confirmer la liste source et tester son contenu → préparation sous l’identité autorisée, puis tranche de création conservant le service FastStore.

## Paiements et commande confirmée — 25 septembre

William fournit une capture OMS de 1664170500031-01 : 956 USD, Promissory, transaction autorisée, fenêtre d’annulation. Création réelle confirmée par sa capture, sans attribuer ce résultat aux tests automatisés. La liste portail fournie ne contient pas cette référence : visibilité/relecture à qualifier, ne pas déclarer toute la chaîne validée.

Nouvelle demande : afficher les moyens du compte sans filtre Promissory. L’écran liste désormais tous les paymentSystems reçus pour le panier avec les libellés/descriptions VTEX. Les moyens non raccordés sont visibles et signalés, mais non sélectionnables pour éviter de les envoyer comme Promissory. Aucun libellé Bank transfer inventé, aucun identifiant de moyen fixé. La soumission reste limitée à Promissory ; prochaine tranche : qualifier le véritable contrat Bank transfer et brancher le parcours carte (données carte directement vers VTEX), puis recette et visibilité OMS dans Orders. Ce raccordement reste ouvert, pas présenté comme terminé.

## Diagnostic du 25 septembre — échec du clic Place order

Cause retrouvée dans les logs du serveur local 3001 : POST checkout-payment 401, POST checkout-place-order 401, GET checkout-order-status 401. La session locale avait expiré ; la soumission a été refusée avant la création de transaction VTEX. Aucun indice de refus budgétaire sur cette tentative. William ne voyait rien car les erreurs étaient en haut du long écran, hors de la zone du bouton.

Correctifs : erreur affichée près de la confirmation, message de session expirée avec lien Sign in again et soumission désactivée, attente visible et délais bornés pour la soumission/réconciliation. Les futures erreurs de transaction/paiement/processing conservent étape, statut HTTP et code machine VTEX borné, sans réponse brute. Les tentatives incertaines restent verrouillées sans resoumission automatique. Typecheck/lint et 7 tests checkout paiement réussis. Aucun achat envoyé, aucun push.

Suite : se reconnecter, reconstituer/revoir le panier (la session locale précédente n’est pas récupérable automatiquement), puis recette finale William. Si VTEX refuse ensuite pour budget/approbation, examiner le code exact avec le profil courant. Source lecture budgets repérée dans FastStore getBudgets : /_v/store-front/customers/{customerId}/units/{contextId}/budgets ; aucune lecture réelle ni modification de budget effectuée. Ne pas confondre budget et permission PlaceOrders ; ne pas changer de profil pour contourner le refus.

## Recette du 24 septembre — checkout réel avant soumission

Codex a testé dans le navigateur local 3001 : connexion wandergarage-buyer, référence 3095196 → SKU 1437, quantité 1, prix 1 516,39 USD, transfert panier, adresse existante WanderGarage, livraison Standard à 5 USD / 3bd, sélection et sauvegarde Promissory. Total confirmé : 1 521,39 USD. Paiement et livraison persistent après rechargement. La case de confirmation active le bouton Place order ; elle a été décochée ensuite. Aucune transaction/commande réelle n’a été soumise. Le panier de test reste ouvert pour William.

Défaut trouvé et corrigé : React Strict Mode lançait deux lectures concurrentes au montage du checkout, provoquant CART_BUSY. La promesse de lecture complète est maintenant réutilisée lors du rejeu de l’effet ; deux chargements navigateur après correction réussis.

Validation technique : 62 tests automatisés réussis ; le test HTTP jusque-là sauté a été exécuté séparément et réussi sur 3001 (isolation, CSRF, permissions, logout). Son origine est désormais configurable par PORTAL_TEST_ORIGIN, par défaut 3000. Typecheck et lint passent. Reste à valider : transaction réelle, réponse gateway et affichage de confirmation avec une commande effectivement soumise. Promissory est confirmé disponible ; Net 60 n’est pas affiché par la réponse observée. Aucun push.

## Checkout Promissory — 24 septembre 2026

Décision William : terminer le checkout dans le Customer Portal, Promissory seul pour la démo Volvo ; carte bancaire reportée. La capture montre Notes Payable / Net 60 actif, mais ce libellé n’est pas imposé au panier : le portail utilise uniquement les méthodes/conditions effectivement retournées par VTEX, sans présenter Promissory comme un virement déjà effectué.

**Codé localement, recette réelle encore attendue :** sélection et sauvegarde du paiement, récapitulatif adresse/articles/total, confirmation explicite puis transaction → paiement Promissory → gatewayCallback, écran de confirmation dans le shell Volvo et lien Orders. Prix, livraison et autorisation d’achat sont relus avant la soumission. Les cartes et paiements mixtes ne passent pas dans ce parcours. Le checkout livraison conserve sa limite actuelle : adresses déjà disponibles et livraison non planifiée.

Protection contre les doubles achats : réservation par panier persistée dans Redis avant l’appel de transaction (mémoire uniquement en développement), sans expiration automatique. Un timeout/crash/refus après cette réservation bloque toute nouvelle soumission du même panier et montre un état à confirmer, jamais « payé ». Les tentatives incertaines nécessitent vérification dans VTEX ; pas de suppression automatique de leur verrou. Après succès, le prochain transfert prépare un nouveau panier. Aucun identifiant de transaction n’est échangé entre deux requêtes du navigateur : les trois étapes Promissory se déroulent dans une seule requête serveur, sans données carte.

Validation : typecheck, lint et build réussis ; suite existante 60 réussis / 1 scénario HTTP sauté, puis deux tests supplémentaires ciblés réussis (échec paiement et persistance Redis). Six tests de paiement au total. Aucune commande ni paiement réel envoyé, aucune recette navigateur longue. Contrat et disponibilité Promissory du panier Volvo restent à qualifier en réel ; aucune garantie de paiement acquitté. Pas de push/déploiement pour ce lot à ce stade.

Prochaine action William : Quick Order → panier → Checkout → adresse → livraison → Save payment method → vérifier le total → confirmation → Place order. Vérifier la référence et sa présence dans Orders. Si Promissory est absent ou un statut incertain apparaît, transmettre le message/la référence avant toute autre tentative. My Organization reste gelé ; devis/listes gardent leurs dépendances ; l’onglet IA reste au collègue CX.

Sources techniques : https://developers.vtex.com/docs/guides/creating-a-regular-order-from-an-existing-cart et https://developers.vtex.com/docs/guides/orderform-fields.

# Coordination du portail — source de suivi commune

## Priorité courante — démo Volvo (décision William, 21 septembre)

My Organization est suffisant visuellement pour la démo Volvo : conserver les écrans actuels, ne pas poursuivre ce chantier avant la démo. La recette des créations utilisateur/centre de coût et toute validation d’écriture sont reportées après la démo, avant partage aux autres SEs VTEX. Aucun succès d’écriture réel ne doit être annoncé. Restent dans le backlog : modification des rôles, création sous-unités, édition/suppression centres de coût, pagination complète et recette par rôle. Ce report ne retire aucune fonction du périmètre.

Priorités actives :
1. Consolider le parcours de démonstration déjà utilisable : accueil → recherche référence ou flotte/véhicule → préparation Quick Order (saisie/CSV/Excel) → contrôle prix/disponibilité → panier. Corriger seulement les défauts qui gênent la démo, conserver les wireframes et éviter les vérifications navigateur répétées ; courte recette par William.
2. Checkout : obtenir le nom/la portée du flag B2B, puis qualifier adresse/livraison et raccorder paiement/confirmation si débloqué. Ne pas annoncer une finalisation d’achat opérationnelle avant recette.
3. Devis : obtenir la source autorisée équivalente à person.email/profile.email pour l’organisation, puis qualifier accès, création et relecture.
4. Listes : confirmer app/version/workspace et requête GraphQL fonctionnelle avant raccordement ; les appels minimaux restent rejetés.
5. Préparer le script final de démo et le point de sauvegarde local avec distinction données réelles/fixtures/parcours non validés. Pas de push ni déploiement demandé dans cette décision.

Après la démo / préparation au partage SEs : reprendre My Organization et sa recette, puis qualification du déploiement et des autres fonctions restantes selon priorités convenues. La disponibilité des intégrations détermine l’ordre entre checkout, devis et listes ; aucune nouvelle série de sondages identiques sans information nouvelle.


Mise à jour : 20 septembre 2026. Codex tient le plan global ; Claude livre une tranche bornée ; William valide les parcours. Aucun nouveau chantier avant d’avoir terminé ou nommé le blocage du chantier actif. Design et périmètre convenus conservés.

| Responsable | Chantier | État / prochaine preuve |
|---|---|---|
| Codex | Ajout atomique et sauvegarde du brouillon | Codé, contrôles automatisés réussis ; recette multi-onglets William à faire |
| Claude | VIN/facettes, pagination, référence exacte, offres publiques | Terminé ; handoff lot 3 reçu et code relu par Codex, intégré avec recette navigateur William en attente |
| Codex + William | Checkout intégré | Autorisé par William ; remplace la cible externe qui redemande une connexion. Checkout A codé (panier/adresse/livraison), recette William attendue ; paiement/confirmation ensuite |
| Codex + William | Devis personnalisés | Source quotes confirmée et lecture filtrée codée ; accès réel à vérifier avant détail/création/actions |
| Codex | Revue commune / snapshot | Handoff Claude reçu, fichier partagé relu ; sauvegarde commune après mise à jour du plan |

## Propriété des fichiers

**Claude** : find-parts.tsx, domain/parts.ts, server/parts.ts, fleet/[vehicleId]/page.tsx, volvo-models.ts au besoin, tests fleet/parts/find-parts, HANDOFF-FLOTTE.md ; seulement ses blocs CSS existants.

**Codex** : route API partagée, session-store, server/draft.ts, replenishment.tsx (passage de révision du brouillon), quick-order, cart, purchase-permission, custom-quotes, quotes, tests draft/cart/permissions/devis/API et documentation globale.

**Exception parts-picker.tsx** : Claude = texte d’offre/devise ; Codex = ajout, verrou, quantités et message de résultat. Modifications ciblées sur le fichier courant, pas de remplacement depuis une ancienne copie ni de formatage global. Relecture commune avant commit de ce fichier. Ne pas commiter les travaux en cours de l’autre comme une livraison validée.

## Contrat brouillon mis à jour par Codex

- GET `/api/portal/draft` → `{lines, revision}`.
- POST `/api/portal/draft-add` avec `{line:{sku,quantity}}` → `{added,sku,total,revision}` ; ajoute au contenu courant atomiquement dans le processus local. Pas de GET préalable côté picker.
- POST `/api/portal/draft` avec `{lines,revision}` → `{saved:true,revision}` ; HTTP 409 si la version a changé. Une page ancienne ne peut plus écraser les ajouts faits ailleurs.
- Limites : 200 références distinctes, 9 999 unités par référence, dépassement refusé intégralement. Pas d’écrêtage silencieux. Ajouts bloqués pendant une vérification/transfert de panier en cours ; toute modification sauvegardée invalide la préparation précédente.
- Changement d’unité : brouillon vidé, révision incrémentée pour invalider les anciennes pages.
- Atomicité valable pour le stockage local monoprocessus ; à traduire en transaction/contrôle de version avec le stockage partagé avant Vercel.

## Ordre des prochaines actions

1. William vérifie les parcours courts ci-dessous ; Claude termine son lot et son handoff.
2. Codex traite les retours brouillon/checkout/devis et relit le lot Claude sans reprendre toute l’analyse.
3. Snapshot commun cohérent puis détail/création des devis, une fois la lecture et la portée validées. Aucun accès élargi ni nouveau référentiel pour contourner un refus.

## Recette William

1. Ouvrir Quick Order dans un onglet A, puis ajouter une pièce depuis Parts dans un onglet B. Revenir à A et Save draft : conflit explicite attendu, pas d’écrasement. Restore saved draft doit retrouver la pièce.
2. Ajouter deux pièces depuis deux onglets Parts : les deux doivent être dans Quick Order après restauration/rechargement. Aucune quantité perdue.
3. Depuis un panier non vide, Continue to checkout : mêmes articles/quantités attendus. S’arrêter avant de passer commande ; rapporter le message exact en cas d’échec.
4. Ouvrir Quotes : confirmer liste/vide ou transmettre le message exact. Une erreur ne doit pas être assimilée à zéro devis.

Derniers contrôles Codex : TypeScript/lint réussis, 43 tests unitaires réussis et 1 test HTTP sauté dans la suite ; ce test HTTP exécuté séparément a réussi, dont 8 ajouts concurrents, refus de sauvegarde périmée et dépassement de quantité. Aucun navigateur agent utilisé. Les tests de Claude présents à cet instant sont inclus, sans remplacer sa revue finale.

## Pilotage après réception du lot 3

Claude : tranche terminée, pas de nouveau lot automatiquement lancé. Codex : checkout intégré et création/relecture devis, dans cet ordre de qualification ; conserve plan global et interfaces partagées. William : recette recherche/flotte selon le handoff. Les anciennes consignes de recette du checkout externe ci-dessus sont remplacées par cette décision ; ne plus demander de reconnexion au site pour valider la cible finale.

Preuve utilisateurs : reconnexion demandée sur checkout externe, Quotes du site vide. Ce n’est pas une confirmation du checkout intégré ni de la lecture Master Data du portail. Catalogue maintenu à 12/page pour l’instant, limite de profondeur explicitée.


### Checkout A — état du 20 septembre

Codex a ajouté /checkout, domain/checkout.ts, server/checkout.ts, components/checkout.tsx et tests/checkout.test.ts ; transport checkout partagé réutilisé. API GET checkout et POST checkout-shipping sous validation de session et verrou panier. Adresses et SLA proviennent exclusivement du panier VTEX courant ; révision périmée refusée. Aucun fichier réservé à Claude modifié.

Recette William : Quick Order → transfert → Continue to checkout → adresse enregistrée → livraison → total. Si aucune adresse ou option n’est disponible, transmettre le message affiché. Pas de paiement ni commande à ce stade. Tests : 45 réussis, 1 HTTP sauté ; build/typecheck réussis. Prochaine tranche Codex : qualifier paiement B2B puis confirmation ; création/relecture devis toujours ouverte.


## Répartition courante — navigation/devis et import XLSX

William transmet le lot XLSX à l’autre codeur. Périmètre réservé : module d’import dédié, tests ciblés, fichier exemple et uniquement sélecteur/branchement import dans src/components/quick-order.tsx ; package.json/lock si dépendance nécessaire à documenter. Ne pas modifier API, session, panier, checkout, permissions, devis, navigation ou CSS global. Livrable docs/HANDOFF-XLSX.md. Codex n’intervient pas sur ces zones pendant le lot.

Codex : cadre Volvo déplacé dans [section]/layout.tsx, au-dessus du chargement ; recherche pièces et filtres devis via Next Form pour navigation interne. Contrôles de session conservés dans les pages. Recette William : ouvrir Find Parts, rechercher 1521910 puis changer un filtre ; le menu et le cadre doivent rester visibles. Aucun changement de wireframe.

Checkout : attente signalée par William d’un flag B2B, nom et portée non confirmés ; ne pas attribuer ce blocage aux devis sans preuve. Devis : lecture du resolver source confirme POST Master Data quotes avec clé applicative, organisation de session et corps fourni par le client. Avant création portail : qualifier transport autorisé, dériver identité/organisation/prix côté serveur et relire le document créé. Aucun droit d’écriture réel établi dans ce lot, aucune écriture distante tentée.


Devis — qualification réelle effectuée : contexte profile.email absent malgré identité valide (POST puis PATCH session). Attente du contrat d’initialisation ou source équivalente de person.email ; droits Master Data non testés. Correction du diagnostic et test ciblé terminés. Import XLSX reste réservé à l’autre codeur, aucune modification de ses fichiers par Codex.


### Recette Excel et correction tableau prix/disponibilité

William confirme via le handoff de l’autre codeur que l’import Excel fonctionne. Codex a borné la largeur du nom de pièce à 260px et autorisé son repli uniquement dans le tableau Price & availability check (classe availability-table). Les autres cellules conservent nowrap ; les autres tableaux et les zones d’import restent inchangés. Défilement de secours conservé sur petit écran. Recette visuelle du correctif à confirmer avec un nom long, par exemple la référence 21811707.


### 21 septembre — listes qualifiées, raccordement en attente

Trois sondages réels : requête complète et minimale sur le site, minimale sur domaine VTEX ; tous HTTP 400 GraphQL validation failed. Contrat local conforme au code source du site mais rejeté par le service actif. Installation/version/workspace restent à confirmer, sans affirmer une app absente. Diagnostic spécifique ajouté, tests ciblés ; aucune écriture ni liste simulée. Message équipe VTEX dans SOURCES_PARCOURS.md. Devis et checkout conservent leurs dépendances séparées ; import Excel validé par William.


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


## Adaptation Vercel — sessions partagées

Projet customer-portal-volvo lié au dossier. Stockage partagé Upstash Redis REST implémenté pour production ; local conserve la Map. Cookie opaque HttpOnly/Secure, expiration 30 minutes, conservation serveur des cookies VTEX et brouillon/panier. Verrou Redis de 180 secondes pour les requêtes API d’une même session, sauvegarde conditionnée au propriétaire du verrou, révocation sans résurrection ; durée route limitée à 120 secondes. Pas de relance automatique des opérations distantes. Origine exacte customer-portal-volvo.vercel.app autorisée, aperçu interdit en production, limite login partagée par IP.

Déploiement fonctionnel en attente de configuration stockage : UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN absents du projet Vercel inspecté. Connexion bloquée tant qu’ils manquent. Connecter une base Upstash Redis au projet en Production, configurer PORTAL_ORIGIN=https://customer-portal-volvo.vercel.app, PORTAL_ENABLE_VTEX_LOGIN=true et PORTAL_ENABLE_PREVIEW=false, puis redéployer. Aucune base temporaire ou facturable créée. Recette réelle production (login/navigation/logout) à faire après raccordement.

Tests ajoutés : persistance entre requêtes, exclusion concurrente, sauvegarde après erreur, révocation, configuration production et refus origine étrangère. Documentation technique REST de référence : https://upstash.com/docs/redis/features/restapi .


## 22 septembre — connexion Vercel validée

Redis Marketplace connecté sous KV_REST_API_URL / KV_REST_API_TOKEN ; aliases pris en charge par 243fe63. Paramètres non secrets Production recréés : origine HTTPS exacte, VTEX login true, preview false. Redéploiement CU3dHmnvzGEU3vkZtSYu9UtZ4Z6e prêt et alias public actif. Test HTTP réel WanderGarage : login 200, contexte 200, home 200, organization 200, logout 200 puis ancienne session refusée 401. Aucun achat, création utilisateur ou centre de coût effectué. La recette des fonctions métier reste inchangée.


## 22 septembre — scénarios flotte pour la démo

Truck 147 : alerte usure → Brakes/FH13 Classic/référence 3095196. Truck 203 : nouvelle alerte illustrative entretien filtre à air → Filters/FM13 New/21337557MOBIT. CTA Find suggested parts sur panneau et fiche véhicule ; bandeau de contexte et retour à toutes les pièces. Catalogue réel, fixtures et absence de certification VIN explicites. Script dans docs/DEMO-VOLVO.md. Recette navigateur William attendue ; aucune écriture métier.
