@AGENTS.md

# Volvo Customer Portal — état de reprise

Mise à jour : **20 septembre 2026**. Développement local autorisé. Périmètre complet conservé ; le premier lot préparation/panier est **partiellement connecté**, pas terminé.

## Objectif et méthode

Interface Volvo indépendante couvrant My Account et les parcours flotte/pièces, réutilisant VTEX avant toute extension. Compte `volvoemea`, organisation WanderGarage, USA/USD. Le projet FastStore existant est une référence en lecture seule ; son checkout partagé et son parcours guest sont hors périmètre.

William demande des lots fonctionnels complets, lectures ciblées, sorties courtes et contrôles regroupés en fin de lot. **Il effectue les tests de parcours manuels par défaut** : lui fournir 3 à 5 actions et résultats attendus ; réserver le navigateur agent aux diagnostics précis ou à sa demande. Avant tout nouvel adaptateur, confirmer écran existant → appel → source → portée → preuve. Ne pas multiplier les explorations ou demander une nouvelle autorisation pour chaque étape locale. Maintenir ce document synthétique ; historique technique dans `docs/SUIVI_REALISATION.md`.

## État fonctionnel

| Lot | Réalisé | Reste à livrer |
|---|---|---|
| Socle | Shell Volvo, navigation, aperçu, connexion réelle, unité WanderGarage, profil en lecture | Permissions effectives, sessions adaptées à la production |
| 1 — Préparation/panier | Saisie, CSV/import/export, brouillon serveur, préparation depuis commande/liste ; résolution exacte SKU/référence, vendeur, simulation prix/disponibilité ; transfert BFF codé avec comparaison avant/après | Droits d’achat réels pour activer le transfert, listes GraphQL, preuve d’un ajout réel et handoff vers checkout |
| 2 — Commandes/devis | Historique commandes connecté (vide) ; API quoting répond (vide), source attendue non confirmée ; détail commande/documents/suivi codés | Commande réelle à qualifier ; confirmer la source des devis personnalisés Master Data, puis détail/actions/création/conversion |
| 3 — Entreprise | Contexte en lecture | Organisation, équipe, adresses, contrats, paiements, budgets, approbations, comptabilité |
| 4 — Volvo | Éléments visuels et fixtures véhicule | Flotte, VIN/WO, véhicule/pièces, concessionnaire, XLSX ; retours, garantie/consigne, Parts Assure, services, alertes/P2 |
| 5 — Publication | Git/remote initialisés, CLI Vercel authentifiée | Sessions production, commit/push, création et déploiement Vercel |

Les pages d’attente et fixtures ne sont pas des fonctionnalités intégrées.

## Dernier lot — préparation et panier

- Bouton **Check prices & availability** sur `/quick-order`, tableau SKU résolu, vendeur, quantité demandée, quantité acceptée en simulation, prix et problème par ligne.
- Référence ambiguë ou absente refusée ; références pointant vers le même SKU/vendeur fusionnées ; quantité cumulée bornée. Recherche exacte parmi les résultats du catalogue, limitée aux 50 premiers résultats par référence.
- Contexte commercial obtenu de `/api/sessions`, identité vérifiée ; devise/pays/canal non inventés. Cookies VTEX conservés dans la session serveur, y compris cookies émis pour le domaine FastStore via X-FORWARDED-HOST. POST de création de session puis PATCH de rafraîchissement.
- Simulation sans création de commande. La disponibilité ne constitue pas une promesse de livraison ; adresse/délai non qualifiés. Aucun total de stock entrepôt présenté.
- Transfert : préparation serveur valable cinq minutes, droit d’achat obligatoire, verrou par session, préparation consommée une seule fois ; panier réutilisé et cookies de propriété gardés côté serveur. Différence avant/après par SKU et vendeur, y compris ajout partiel ou diminution. Aucun endpoint de paiement ou passage de commande.
- Test navigateur réel avec WanderGarage : SKU 1 reconnu (« Clutch Kit for Volvo Buses - Reman 85021811 »), prix retourné 13 678,86 USD, disponibilité `withoutStock`. Affichage corrigé pour ne pas montrer la quantité demandée comme disponible quand le statut est hors stock.
- Le transfert réel reste désactivé : `permissionsVerified` est faux pour le compte réel. L’algorithme de transfert est testé avec réponses simulées uniquement. Aucun panier réel modifié, aucune commande passée ; handoff checkout non livré.

## Blocages précis et prochaine reprise

**Avant de nouvelles fonctions :** établir la correspondance des sources pour le lot courant et un premier point de sauvegarde Git local. Le plan opérationnel et la méthode sont dans la section 6 du cadrage. Ne pas relancer un audit général.

1. **Droits d’achat** : identifier la ressource effective autorisant l’action pour l’utilisateur connecté. Le plugin expose les définitions de rôles d’une unité, pas une preuve directe du droit de cet utilisateur. Ne pas transformer le nom buyer, un JWT ou un accès My Account en permission d’achat. Aucune clé de ressource inventée.
2. **Listes** : même la requête minimale `getLists { id }` avec provider `vtex.replenishment-service@1.x` reçoit « GraphQL validation failed » sur le domaine FastStore. Le service installé/schéma reste à vérifier. Ne pas annoncer un simple problème de rôle ni un historique vide.
3. **Devis** : le parcours personnalisé FastStore utilise Master Data `quotes`, tandis que notre adaptateur lit quoting. Confirmer le référentiel attendu et les unités monétaires ; le resolver personnalisé ne filtre pas visiblement par organisation et ne doit pas être copié tel quel.
4. Après résolution des droits : fournir à William la recette SKU disponible → ajout → consultation/handoff du même panier. Compléter les refus/ajouts partiels sans déclencher de commande.
5. Puis poursuivre commandes/devis et les lots suivants, sans réduire le périmètre.

## Preuves et limites existantes

- Login réel corrigé : `/granted` n’est pas la porte d’entrée générale ; revalidation via `users/{userId}/units`, en-tête du cookie de compte ; unité racine avec `path.names: null` acceptée.
- Profil réel via `/api/sessions`. Historique commandes : réponse réelle vide. Devis : API quoting vide, source métier non confirmée ; cela ne valide pas la lecture des devis du parcours personnalisé. Détail commande, documents et renouvellement non vérifiés avec une commande réelle disponible.
- Brouillons sauvegardés dans la session opaque, perdus à la déconnexion/expiration/redémarrage/changement d’unité ; CSV pour conservation durable.
- Sessions locales en mémoire, 30 min, cookies HttpOnly/SameSite strict. Authentification désactivée en production. Avant Vercel : décider du flux d’authentification, puis adapter stockage partagé, domaines/origines autorisés, HTTPS/Secure, expiration/révocation et autorisations. Changements de code nécessaires, pas seulement variables d’environnement.
- ESLint fixé à 9.39.5 à cause de l’incompatibilité du plugin React avec ESLint 10. QA initiale du shell dans `design-qa.md`.

## Vérification et lancement

Node 24, npm, Next 16.3.5/React 19.3.0. `npm run dev` sur `http://127.0.0.1:3000`.

Dernière vérification : **20 tests réussis avec intégration HTTP locale**, TypeScript et lint réussis. Build de production réussi. Les tests de panier simulent VTEX ; seule la résolution/simulation mentionnée ci-dessus est une preuve réelle.

Commandes : `npm run typecheck`, `npm run lint`, `PORTAL_INTEGRATION_TESTS=true npm test` (serveur lancé), `npm run build`.

## GitHub / Vercel / documents

Remote : https://github.com/Willjeanne/customer-portal-volvo.git. Aucun commit/push ni déploiement effectué. CLI Vercel `willjeanne` disponible ; création du projet possible à la phase publication.

Entrée : `START.md`. Périmètre : `docs/CADRAGE_PORTAIL_VOLVO.md`, `docs/MATRICE_CAPACITES_VOLVO.md`, `docs/DECISIONS_PORTAIL_VOLVO.md`. Historique : `docs/SUIVI_REALISATION.md`. Aucun secret à stocker dans ces documents.
