> Archive antérieure à la consolidation du 25 septembre 2026. Les états et consignes ci-dessous sont historiques ; voir [START](../../../START.md).

## Returns & Claims lot B — 25 septembre — état actuel

Implémenté localement : après Review request, Save draft enregistre le formulaire complet ; l’historique /claims permet de le reprendre. Submit demo request attribue une référence DEMO et fige le dossier ; détail avec lignes, motif, texte et résolution demandée. Ce sont des dossiers de démonstration internes au portail, sans transmission Volvo, autorisation de retour ni remboursement.

Stockage : Redis partagé en production (hors session, pas de TTL), mémoire du serveur en développement, limitée à 100 dossiers par utilisateur/unité/contrat. En local un redémarrage ou rechargement du module peut perdre les dossiers. Contrôle de version et empreinte de requête contre doublons/concurrence ; relecture OMS sous identité acheteur et contrôle des quantités à chaque sauvegarde. Pas de changement IA ni checkout.

Validation : typecheck, lint et 2 tests ciblés passent (validation formulaire, isolation utilisateur/unité, quantités relues, révision obsolète, soumission et répétition sans doublon). Branche Redis non recettée contre le service réel ; recette UI à faire par William. Aucun push/déploiement de ce lot.

Recette courte : /claims → commande → formulaire → Review request → Save draft → View request history → Resume draft → Review request → Submit demo request → View request history → View request. Vérifier le statut Submitted · Demo et les informations conservées.

Suite : lot C pièces jointes/échanges à cadrer, puis raccordement éventuel à un véritable outil SAV. Les limites « rien n’est sauvegardé » du lot A ci-dessous décrivent l’état précédent et sont remplacées par ce lot B.

## Accès local et statuts anglais — 25 septembre

Serveur 3001 arrêté constaté puis relancé. Les statuts de commande affichent désormais des libellés anglais à partir du code VTEX, et non statusDescription localisé en portugais. Appliqué à Orders, au détail commande et à la sélection Returns & Claims. Code inconnu : Status unavailable, sans supposer une progression. Typecheck et lint réussis. Modifications locales uniquement ; se reconnecter après redémarrage (sessions locales en mémoire).

## Returns & Claims lot A — 25 septembre

Implémenté localement : /claims lit les vraies commandes VTEX avec pagination ; entrée depuis le détail d’une commande ; détail relu sous identité acheteur. Formulaire sélection lignes/quantités, Return ou Claim, motifs par type, sujet, description, résolution souhaitée, récapitulatif et retour édition sans perdre la saisie. Contrôles : une ligne au minimum, index distincts/existants, quantités entières positives <= commandées, motif cohérent, description 10–3000 caractères. Éligibilité/garantie non présumées.

Limites affichées : préparation en mémoire du composant seulement, perdue en quittant la page ; aucun envoi, numéro de dossier, historique de demandes, fichier joint ou remboursement. Lot B persistance/soumission et lot C échanges restent à faire. UI reprend le shell et des panneaux espacés ; pas de modification IA. Typecheck/lint et test ciblé des cas valides/invalides réussis. Recette navigateur William attendue ; aucun push pour ce lot.

Recette : Returns & Claims → choisir une commande → une pièce/quantité → motif/sujet/description → Review request → Back to edit ; vérifier que les valeurs restent présentes et qu’aucun succès de soumission n’est annoncé.

## Ergonomie Lists et suite Returns & Claims — 25 septembre

Espacement local amélioré : 24 px entre blocs, cartes de listes séparées avec bordure et padding, 12 px entre contenus, action dégagée et formulaire de création aéré. Aucun changement IA ou logique métier.

Plan proposé Returns & Claims (pas encore implémenté) : 1) identifier le service de traitement et son contrat ; aucun raccordement trouvé dans les sources FastStore inspectées ; 2) tableau de demandes avec numéro, commande, type, date et statut, fiche avec chronologie ; 3) création depuis une commande accessible à l’acheteur, choix lignes/quantités, retour commercial ou réclamation, motif/commentaire et pièces justificatives selon stockage retenu ; 4) confirmation et suivi sous identité acheteur, contrôles des quantités et des règles d’éligibilité issues du système cible ; 5) courte recette William. Pour la démo sans service Volvo disponible, proposer explicitement un suivi démonstration persistant et isolé ; aucun remboursement/retour logistique/garantie réellement déclenché. Arbitrage sur source réelle ou simulation requis avant soumission externe.

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

@AGENTS.md

## Priorité courante — démo Volvo (décision William, 21 septembre)

My Organization est suffisant visuellement pour la démo Volvo : conserver les écrans actuels, ne pas poursuivre ce chantier avant la démo. La recette des créations utilisateur/centre de coût et toute validation d’écriture sont reportées après la démo, avant partage aux autres SEs VTEX. Aucun succès d’écriture réel ne doit être annoncé. Restent dans le backlog : modification des rôles, création sous-unités, édition/suppression centres de coût, pagination complète et recette par rôle. Ce report ne retire aucune fonction du périmètre.

Priorités actives :
1. Consolider le parcours de démonstration déjà utilisable : accueil → recherche référence ou flotte/véhicule → préparation Quick Order (saisie/CSV/Excel) → contrôle prix/disponibilité → panier. Corriger seulement les défauts qui gênent la démo, conserver les wireframes et éviter les vérifications navigateur répétées ; courte recette par William.
2. Checkout : obtenir le nom/la portée du flag B2B, puis qualifier adresse/livraison et raccorder paiement/confirmation si débloqué. Ne pas annoncer une finalisation d’achat opérationnelle avant recette.
3. Devis : obtenir la source autorisée équivalente à person.email/profile.email pour l’organisation, puis qualifier accès, création et relecture.
4. Listes : confirmer app/version/workspace et requête GraphQL fonctionnelle avant raccordement ; les appels minimaux restent rejetés.
5. Préparer le script final de démo et le point de sauvegarde local avec distinction données réelles/fixtures/parcours non validés. Pas de push ni déploiement demandé dans cette décision.

Après la démo / préparation au partage SEs : reprendre My Organization et sa recette, puis qualification du déploiement et des autres fonctions restantes selon priorités convenues. La disponibilité des intégrations détermine l’ordre entre checkout, devis et listes ; aucune nouvelle série de sondages identiques sans information nouvelle.


# Volvo Customer Portal — état de reprise

Mise à jour : **20 septembre 2026**. Développement local autorisé. Périmètre complet conservé ; le premier lot préparation/panier est **partiellement connecté**, pas terminé.

Pilotage actif : [docs/COORDINATION.md](COORDINATION.md) — responsables, fichiers réservés, contrats et recette.

## Objectif et méthode

Interface Volvo indépendante couvrant My Account et les parcours flotte/pièces, réutilisant VTEX avant toute extension. Compte `volvoemea`, organisation WanderGarage, USA/USD. Le projet FastStore existant est une référence en lecture seule ; son checkout partagé et son parcours guest sont hors périmètre.

William demande des lots fonctionnels complets, lectures ciblées, sorties courtes et contrôles regroupés en fin de lot. **Il effectue les tests de parcours manuels par défaut** : lui fournir 3 à 5 actions et résultats attendus ; réserver le navigateur agent aux diagnostics précis ou à sa demande. Avant tout nouvel adaptateur, confirmer écran existant → appel → source → portée → preuve. Ne pas multiplier les explorations ou demander une nouvelle autorisation pour chaque étape locale. Maintenir ce document synthétique ; historique technique dans `docs/SUIVI_REALISATION.md`.

## État fonctionnel

| Lot | Réalisé | Reste à livrer |
|---|---|---|
| Socle | Shell Volvo, navigation, aperçu, connexion réelle, unité WanderGarage, profil en lecture | Permissions effectives, sessions adaptées à la production |
| 1 — Préparation/panier | Saisie, CSV/import/export, brouillon serveur, préparation depuis commande/liste ; résolution exacte SKU/référence, vendeur, simulation prix/disponibilité ; transfert BFF codé avec comparaison avant/après | Listes GraphQL et handoff vers checkout ; vérification/transfert/relecture du panier local validés par William |
| 2 — Commandes/devis | Historique commandes connecté (vide), détail codé ; lecture devis personnalisés Master Data filtrée par organisation codée | Commande réelle, accès aux devis et recette à qualifier ; détail/actions/création/conversion |
| 3 — Entreprise | Contexte en lecture | Organisation, équipe, adresses, contrats, paiements, budgets, approbations, comptabilité |
| 4 — Volvo | 16 véhicules fixtures, flotte/détail, recherche catalogue public et ajout au brouillon ; relus avec réserves | Corrections de revue, recette connectée, fitment/WO/fiche produit/sourcing/délais, concessionnaire, XLSX et extensions |
| 5 — Publication | Git/remote initialisés, CLI Vercel authentifiée | Sessions production, commit/push, création et déploiement Vercel |

Les pages d’attente et fixtures ne sont pas des fonctionnalités intégrées.

## Dernier lot — préparation et panier

- Bouton **Check prices & availability** sur `/quick-order`, tableau SKU résolu, vendeur, quantité demandée, quantité acceptée en simulation, prix et problème par ligne.
- Référence ambiguë ou absente refusée ; références pointant vers le même SKU/vendeur fusionnées ; quantité cumulée bornée. Recherche exacte parmi les résultats du catalogue, limitée aux 50 premiers résultats par référence.
- Contexte commercial obtenu de `/api/sessions`, identité vérifiée ; devise/pays/canal non inventés. Cookies VTEX conservés dans la session serveur, y compris cookies émis pour le domaine FastStore via X-FORWARDED-HOST. POST de création de session puis PATCH de rafraîchissement.
- Simulation sans création de commande. La disponibilité ne constitue pas une promesse de livraison ; adresse/délai non qualifiés. Aucun total de stock entrepôt présenté.
- Transfert : préparation serveur valable cinq minutes, droit d’achat obligatoire, verrou par session, préparation consommée une seule fois ; panier réutilisé et cookies de propriété gardés côté serveur. Différence avant/après par SKU et vendeur, y compris ajout partiel ou diminution. Aucun endpoint de paiement ou passage de commande.
- Test navigateur réel avec WanderGarage : SKU 1 reconnu (« Clutch Kit for Volvo Buses - Reman 85021811 »), prix retourné 13 678,86 USD, disponibilité `withoutStock`. Affichage corrigé pour ne pas montrer la quantité demandée comme disponible quand le statut est hors stock.
- Le transfert consulte désormais la ressource officielle `PlaceOrders` via le BFF License Manager, à la préparation et avant chaque ajout. William a confirmé le fonctionnement du parcours proposé : vérification des articles, transfert puis relecture du panier local. Refus et indisponibilité bloquent l’ajout. Aucun droit global du contexte n’est déduit de cette vérification. Le transfert et la relecture du panier local sont désormais validés manuellement par William, en complément des tests simulés. Les références et quantités exactes de sa recette ne sont pas consignées. Aucun passage de commande testé ; handoff checkout codé, recette en attente.

## Blocages précis et prochaine reprise

**Sources du lot cartographiées dans `docs/SOURCES_PARCOURS.md`.** Point Git initial créé : `d0fb2d3`. William a confirmé le parcours devis personnalisé via `/pvt/account/create-quote`. La distinction des sources listes reste à qualifier côté API. Aucun changement de wireframes/look and feel demandé. Le plan opérationnel et la méthode sont dans la section 6 du cadrage. Ne pas relancer un audit général.

1. **Droits d’achat** : contrôle `PlaceOrders` branché (documentation Storefront Roles + client commerce FastStore). Recette réelle confirmée par William. Bouton Refresh portal cart ajouté pour relire le panier conservé par cette session ; handoff checkout codé, recette en attente.
2. **Listes** : même la requête minimale `getLists { id }` avec provider `vtex.replenishment-service@1.x` reçoit « GraphQL validation failed » sur le domaine FastStore. Le service installé/schéma reste à vérifier. Ne pas annoncer un simple problème de rôle ni un historique vide.
3. **Devis** : le parcours personnalisé FastStore utilise Master Data `quotes`, tandis que notre adaptateur lit quoting. Confirmer le référentiel attendu et les unités monétaires ; le resolver personnalisé ne filtre pas visiblement par organisation et ne doit pas être copié tel quel.
4. Panier local déjà validé ; fournir à William la recette passage vers le checkout et vérifier les devis personnalisés. Compléter les refus/ajouts partiels sans déclencher de commande.
5. Puis poursuivre commandes/devis et les lots suivants, sans réduire le périmètre.

## Preuves et limites existantes

- Login réel corrigé : `/granted` n’est pas la porte d’entrée générale ; revalidation via `users/{userId}/units`, en-tête du cookie de compte ; unité racine avec `path.names: null` acceptée.
- Profil réel via `/api/sessions`. Historique commandes : réponse réelle vide. Devis : source personnalisée quotes confirmée ; nouvel adaptateur filtré sous session acheteur codé, accès réel à qualifier. Détail commande, documents et renouvellement non vérifiés avec une commande réelle disponible.
- Brouillons sauvegardés dans la session opaque, perdus à la déconnexion/expiration/redémarrage/changement d’unité ; CSV pour conservation durable.
- Sessions locales en mémoire, 4 h (SESSION_TTL_SECONDS, durée absolue ; expiration du jeton VTEX toujours contrôlée), cookies HttpOnly/SameSite strict. Authentification désactivée en production. Avant Vercel : décider du flux d’authentification, puis adapter stockage partagé, domaines/origines autorisés, HTTPS/Secure, expiration/révocation et autorisations. Changements de code nécessaires, pas seulement variables d’environnement.
- ESLint fixé à 9.39.5 à cause de l’incompatibilité du plugin React avec ESLint 10. QA initiale du shell dans `design-qa.md`.

## Vérification et lancement

Node 24, npm, Next 16.3.5/React 19.3.0. `npm run dev` sur `http://127.0.0.1:3000`.

Dernière revue intégrée : **37 tests réussis, 1 HTTP sauté**, TypeScript réussi. Lint/build des deux lots rapportés réussis par Claude ; non répétés durant cette revue. Panier local validé séparément par William ; flotte/parts connectés et handoff checkout restent à recetter.

Commandes : `npm run typecheck`, `npm run lint`, `PORTAL_INTEGRATION_TESTS=true npm test` (serveur lancé), `npm run build`.

## GitHub / Vercel / documents

Remote : https://github.com/Willjeanne/customer-portal-volvo.git. Premier commit local `d0fb2d3` créé ; aucun push ni déploiement effectué. CLI Vercel `willjeanne` disponible ; création du projet possible à la phase publication.

Entrée : `START.md`. Périmètre : `docs/CADRAGE_PORTAIL_VOLVO.md`, `docs/MATRICE_CAPACITES_VOLVO.md`, `docs/DECISIONS_PORTAIL_VOLVO.md`. Historique : `docs/SUIVI_REALISATION.md`. Aucun secret à stocker dans ces documents.

## Revue des travaux parallèles — 20 septembre

Deux lots Claude intégrés au plan avec réserves : voir `docs/REVUE-FLOTTE-PARTS.md`. Cinq changements de contrat acceptés (vehicle=id, filtres live sans changement d’unité, parts sans purchase, restauration brouillon, facettes nulles). Brouillon corrigé par Codex : ajout atomique, dépassement refusé, sauvegarde versionnée (409 si périmée). Tests réussis ; recette William attendue. Claude a terminé facettes VIN, pagination, offres publiques et recherche exacte ; lot 3 relu et intégré, recette connectée William attendue. Aucun retrait de périmètre issu du handoff.

Répartition proposée dans `docs/LOT-CLAUDE-SUIVANT.md` : Claude fiabilise recherche/flotte ; Codex garde API partagée, brouillon atomique, panier, droits et devis. Mission écrite, pas envoyée à un autre agent. William réalise la recette connectée.

Derniers ajouts Codex avant cette revue : Continue to checkout (handoff local FastStore par orderFormId), lecture Master Data quotes filtrée par organisation. Codés et testés sur réponses simulées, pas validés en réel ; création/actions de devis non branchées. Source devis identifiée, accès shopper direct à qualifier.

## Dernier lot Codex — brouillon atomique

POST draft-add remplace la lecture/remplacement côté PartsPicker. Les quantités annoncées viennent de la réponse serveur. Save draft porte désormais une révision ; Restore la recharge, et Quick Order reçoit la révision initiale du serveur. Les pages périmées ne peuvent plus écraser les ajouts d’autres onglets. Limites refusées sans écrêtage, préparation invalidée après sauvegarde et modification du brouillon refusée pendant une opération panier. Contrat détaillé dans COORDINATION.md.

Contrôles : TypeScript/lint réussis, 43 tests unitaires + scénario HTTP exécuté séparément réussi. Aucun test navigateur refait. Le handoff lot 3 de Claude est reçu ; les modifications du fichier partagé parts-picker ont été relues et coexistent. Le fonctionnement du checkout et l’accès réel aux devis restent à faire confirmer par William avant le lot suivant.

## Décision courante — cible de checkout modifiée

William autorise le checkout intégré au Customer Portal et la création de devis depuis le panier. Le checkout externe demande une reconnexion et reste un mécanisme transitoire, pas la cible. Panier/adresse/livraison codés dans le portail, recette réelle attendue ; prochaine réalisation : moyens de paiement/confirmation ; devis persistants dans quotes avec identité/prix/organisation serveur et relecture. Aucun achat automatique de recette.

Lot 3 Claude reçu et relu : VIN conserve les facettes secondaires, pagination bornée avec lien vers dernière page réelle, référence exacte comparée, offre publique correctement identifiée et facettes supplémentaires accessibles. Maintenir 12 articles/page pour ce lot ; profondeur limitée explicitement. Premier SKU, seller non transmis et fitment illustratif restent ouverts. Aucun nouveau lot attribué à Claude avant découpage explicite.


## Dernier lot Codex — checkout A intégré (20 septembre)

Continue to checkout ouvre désormais /checkout dans le portail. Lecture du panier existant, sélection d’une adresse enregistrée, choix des options de livraison VTEX et affichage des frais/totaux. Le serveur vérifie les droits, la révision du panier et l’appartenance des adresses/options avant modification. Aucun paiement ni commande soumis.

Validation automatisée : typecheck et build réussis, 45 tests réussis, scénario HTTP sauté. Recette réelle à William : transférer un panier, ouvrir checkout, appliquer une adresse puis une livraison et vérifier le total. Disponibilité réelle des adresses et SLA à confirmer. Création d’adresse, retrait, créneaux programmés, paiement/confirmation et création/relecture de devis restent ouverts. Le lot 3 Claude reste intégré, sans nouveau périmètre attribué.


## Dernière avancée — continuité de navigation et travail parallèle

Cadre Volvo sorti de la zone de chargement des sections : menu/en-tête entourent maintenant le message Loading… au lieu de disparaître. Formulaires recherche pièces et filtres devis passent en navigation interne. Contrôles de session conservés. Recette visuelle confiée à William ; aucun navigateur automatisé lancé.

Autre codeur : import XLSX réservé (module/tests/exemple et branchement import Quick Order), handoff attendu. Codex : navigation et devis. Checkout en attente du flag B2B signalé par William, encore non identifié. Source de création des devis relue : le site utilise une clé applicative pour Master Data quotes ; accès et isolation organisation doivent être qualifiés pour le portail avant raccordement. Création non implémentée, aucune écriture VTEX effectuée.


### Devis : blocage désormais mesuré

Qualification réelle : connexion acheteur valide, identité confirmée, profile.email absent après création puis mise à jour de session. Lecture et écriture Master Data non atteintes, droits encore non qualifiés. Diagnostic corrigé en QUOTE_ORGANIZATION_MISSING, test ciblé réussi sans appel hors organisation. Aucune écriture devis. Détails et question équipe B2B dans docs/SOURCES_PARCOURS.md. Ne pas confondre avec le flag checkout dont la portée reste inconnue.


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


### Navigation organisation — présentation affinée

Liens à puces remplacés par des lignes pleine largeur, icône bâtiment, libellé secondaire et chevron. Fil d’Ariane discret avec unité courante non cliquable, focus clavier visible et adaptation mobile. CSS limité aux classes organization-*. Aucun changement API ou droits. Recette visuelle William attendue.


## Adaptation Vercel — sessions partagées

Projet customer-portal-volvo lié au dossier. Stockage partagé Upstash Redis REST implémenté pour production ; local conserve la Map. Cookie opaque HttpOnly/Secure, expiration 4 heures (auparavant 30 minutes), conservation serveur des cookies VTEX et brouillon/panier. Verrou Redis de 180 secondes pour les requêtes API d’une même session, sauvegarde conditionnée au propriétaire du verrou, révocation sans résurrection ; durée route limitée à 120 secondes. Pas de relance automatique des opérations distantes. Origine exacte customer-portal-volvo.vercel.app autorisée, aperçu interdit en production, limite login partagée par IP.

Déploiement fonctionnel en attente de configuration stockage : UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN absents du projet Vercel inspecté. Connexion bloquée tant qu’ils manquent. Connecter une base Upstash Redis au projet en Production, configurer PORTAL_ORIGIN=https://customer-portal-volvo.vercel.app, PORTAL_ENABLE_VTEX_LOGIN=true et PORTAL_ENABLE_PREVIEW=false, puis redéployer. Aucune base temporaire ou facturable créée. Recette réelle production (login/navigation/logout) à faire après raccordement.

Tests ajoutés : persistance entre requêtes, exclusion concurrente, sauvegarde après erreur, révocation, configuration production et refus origine étrangère. Documentation technique REST de référence : https://upstash.com/docs/redis/features/restapi .


## 22 septembre — connexion Vercel validée

Redis Marketplace connecté sous KV_REST_API_URL / KV_REST_API_TOKEN ; aliases pris en charge par 243fe63. Paramètres non secrets Production recréés : origine HTTPS exacte, VTEX login true, preview false. Redéploiement CU3dHmnvzGEU3vkZtSYu9UtZ4Z6e prêt et alias public actif. Test HTTP réel WanderGarage : login 200, contexte 200, home 200, organization 200, logout 200 puis ancienne session refusée 401. Aucun achat, création utilisateur ou centre de coût effectué. La recette des fonctions métier reste inchangée.


## 22 septembre — scénarios flotte pour la démo

Truck 147 : alerte usure → Brakes/FH13 Classic/référence 3095196. Truck 203 : nouvelle alerte illustrative entretien filtre à air → Filters/FM13 New/21337557MOBIT. CTA Find suggested parts sur panneau et fiche véhicule ; bandeau de contexte et retour à toutes les pièces. Catalogue réel, fixtures et absence de certification VIN explicites. Script dans docs/DEMO-VOLVO.md. Recette navigateur William attendue ; aucune écriture métier.


## 22 septembre — onglet AI Assistant et canal WWC

Nouvel onglet `ai-assistant` dans la navigation (entre Support / Dealer et My Profile), avec écran d'accueil et fil de conversation. Le socket WebChat est ouvert depuis le navigateur ; aucun cookie de session ne part vers Weni.

Protocole isolé dans `src/domain/wwc.ts`, sans DOM ni réseau, donc testable : 14 tests dans `tests/wwc.test.ts`. Règles du guide `references/GUIA-WEBSOCKET-Y-CATALOGO.md` tenues explicitement — `catalog_message` lu par `retailer_id` (et non `product_retailer_id`), fusion des quatre sources de produits avec déduplication, historique `direction: "in"` = agent et trié du plus ancien au plus récent, horodatage en secondes promu en millisecondes, historique plus court jamais substitué au fil local. Le troisième segment du `retailer_id` est une trade policy : il est analysé puis volontairement écarté, jamais transmis comme `?sc=`.

Cycle de vie : enregistrement confirmé par le premier frame non-`forbidden` (y compris un ping précoce, marqué prêt avant le pong), `forbidden` terminal sans reconnexion, reconnexion avec backoff jusqu'à 15 s en réutilisant le même `from` conservé en `sessionStorage`. Un socket remplacé ne peut plus écrire dans l'état ni déclencher de reconnexion.

Paramètres du canal relevés dans le bootstrap du widget natif (`.../apptypes/wwc/bb4a6378-.../script.js` — cet identifiant est celui de l'**intégration**, distinct de celui du **canal**) : `wss://websocket.weni.ai/ws`, `https://flows.weni.ai`, canal `6d7f6ee7-884a-4070-b9ad-8f9212991965`. Variables `NEXT_PUBLIC_WENI_*` dans `.env.example`. Handshake vérifié en réel : `register` accepté, `ready_for_message` reçu, y compris après remontage avec le même `from`.

L'accueil n'affiche que des données existantes : véhicules, compteurs et suggestions viennent de `domain/fleet.ts`, donc les fixtures de démonstration. Le salut utilise le prénom de `context.user.name`, lu à la connexion depuis `shopper.firstName/lastName` de `/api/sessions` (même source que My Profile) ; à défaut, l'identifiant de connexion est conservé. Ni micro ni pièce jointe : le canal les désactive (`showVoiceRecordingButton`, `showCameraButton`).

Contrôles : typecheck, lint, build réussis ; 71 tests, 70 réussis, 1 sauté (scénario HTTP). Rendu vérifié en HTTP sous session preview.

**Reste ouvert.** Allowlist d'origines à déclarer sur la plateforme pour `http://127.0.0.1:3000` et `https://customer-portal-volvo.vercel.app`, sinon le canal renvoie `forbidden`. Aucun message n'a été envoyé à l'agent : le parcours complet (réponse, catalogue) reste à recetter. Panier interne ajouté (23 septembre), aligné sur le widget natif hors boutique VTEX (`views/Cart.jsx` de weni-ai/webchat-react) : Add to cart sur chaque carte prix connu, bouton Cart avec compteur, panneau latéral Continue shopping / Place order. Place order envoie un seul message `order` (`product_items` : `product_retailer_id`, `name`, `price` liste, `sale_price`, `currency`, `image`, `description`, `seller_id`, `quantity`) ; bulle « Cart sent », jamais « commande passée ». Aucune écriture brouillon/panier portail ni orderForm VTEX ; la suite dépend du flow Weni. Panier en sessionStorage, vidé par New conversation. Recette William attendue.

**Pont de jeton — conçu, non réalisé.** Les tools Weni tourneront sur l'infrastructure Weni et ne peuvent pas s'authentifier auprès du portail aujourd'hui : `requireSession()` ne lit la session que dans le cookie (`server/session.ts`), et `assertMutationOrigin` refuse toute requête sans l'`Origin` exact du portail (`server/security.ts`). Le cookie est `HttpOnly` et `SameSite=strict` : le navigateur ne peut ni le lire ni le transmettre. La voie retenue est un jeton opaque de courte durée, émis par le portail pour la session en cours, portée lecture seule, accompagné d'un secret partagé côté Weni. Sans lui, aucune tool ne peut identifier l'acheteur ni hériter de ses droits VTEX.
