@AGENTS.md

# Volvo Customer Portal — état de reprise

Mise à jour : **20 septembre 2026**. Développement local autorisé. Périmètre complet conservé ; le premier lot préparation/panier est **partiellement connecté**, pas terminé.

Pilotage actif : [docs/COORDINATION.md](docs/COORDINATION.md) — responsables, fichiers réservés, contrats et recette.

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
- Sessions locales en mémoire, 30 min, cookies HttpOnly/SameSite strict. Authentification désactivée en production. Avant Vercel : décider du flux d’authentification, puis adapter stockage partagé, domaines/origines autorisés, HTTPS/Secure, expiration/révocation et autorisations. Changements de code nécessaires, pas seulement variables d’environnement.
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

William autorise le checkout intégré au Customer Portal et la création de devis depuis le panier. Le checkout externe demande une reconnexion et reste un mécanisme transitoire, pas la cible. Prochaine réalisation Codex : panier/adresse/livraison VTEX dans le portail, puis moyens de paiement/confirmation ; devis persistants dans quotes avec identité/prix/organisation serveur et relecture. Aucun achat automatique de recette.

Lot 3 Claude reçu et relu : VIN conserve les facettes secondaires, pagination bornée avec lien vers dernière page réelle, référence exacte comparée, offre publique correctement identifiée et facettes supplémentaires accessibles. Maintenir 12 articles/page pour ce lot ; profondeur limitée explicitement. Premier SKU, seller non transmis et fitment illustratif restent ouverts. Aucun nouveau lot attribué à Claude avant découpage explicite.
