# Sources des parcours — 25 septembre 2026

État établi à partir du code du portail et des qualifications déjà réalisées. Cette consolidation n’a effectué aucun nouvel appel VTEX. Le site emeafaststore est une référence de données ; les wireframes Volvo restent la référence visuelle.

| Parcours | Source / implémentation du portail | Limite courante |
|---|---|---|
| Identité et session | Adaptateurs `src/server`, cookies acheteur serveur, session opaque | Connexion portail indépendante des cookies navigateur d’emeafaststore |
| Permission d’achat | `purchase-permission.ts`, ressource PlaceOrders | Ne pas substituer granted-order-entry ni déduire d’un rôle affiché |
| Catalogue | `parts.ts`, Intelligent Search | Offre publique, Application catalogue ; plafond moteur page 50 ; pas fitment VIN |
| Préparation/panier | `draft.ts`, `cart.ts`, simulation et orderForm VTEX | Prix/stock/seller revalidés ; brouillon versionné |
| Checkout | `checkout.ts`, `checkout-payment.ts` | Livraison et paiement rattachés au panier ; transaction → paiement Promissory → callback ; pas de carte intégrée |
| Orders | `account.ts`, `/api/oms/user/orders` et détail par ID | Identité acheteur ; suivi/facture uniquement si présents |
| Replenishment Lists | `lists.ts`, `list-items.ts` | GraphQL privé du storefront, provider `vtex.replenishment-service@1.x` ; getLists/getListItems/createList/addListItem/updateListItem |
| Devis custom | `custom-quotes.ts`, Master Data `quotes`, schéma v1 | organizationId issu de profile.email ; pas de resolver applicatif global ; création non raccordée |
| Devis natifs historiques | `/api/quoting/quotes`, lecture conservée dans account.ts | Distincts des devis custom affichés sur /quotes ; une réponse vide ne prouve rien sur ceux-ci |
| Organisation | `organization.ts`, références clients Buyer Portal 2.0.27 | Arbre parent/enfant revalidé ; users/roles ; centres de coût = valeurs comptables du contrat |
| Claims | `claims.ts`, `/api/portal/save-claim` | Stockage custom de démo du portail, pas une API SAV VTEX/Volvo |
| Purchasing Insights | `insights.ts`, détails OMS, catalogue SKU exact et simulation Checkout | Remises via total Discounts, pas somme des priceTags ; qualification privée live ouverte, voir [dossier](PURCHASING-INSIGHTS.md) |
| AI Assistant | `ai-assistant.tsx`, `domain/wwc.ts` | Canal WWC/Weni côté navigateur, produits des messages ; pas de cookies acheteur transmis au chat |

## Listes : blocage historique résolu

Le rejet GraphQL 400 observé le 21 septembre n’est plus reproduit lors de la qualification du 25 septembre. William a confirmé une liste visible puis la création d’une nouvelle liste. Le portail utilise le même service natif que le front. Les demandes anciennes visant à confirmer l’installation ne sont donc plus le prochain blocage à traiter.

Les listes Master Data PL et les anciens resolvers getProductLists sont des parcours distincts : ne pas les utiliser comme substitut. Le remplissage de liste n’est pas une transaction multi-lignes ; le code relit les quantités, signale un résultat partiel et ne relance pas automatiquement.

## Devis : dépendance toujours ouverte

Le parcours `/pvt/account/create-quote` du site stocke `person.email` comme organizationId. Le portail cherche cette valeur dans `profile.email` de session. Lors de la dernière qualification, authentification valide mais champ absent, y compris après initialisation/actualisation de session. Cela précède la lecture Master Data : aucun refus de droit Master Data n’est établi par ce seul résultat.

Question technique utile : « Quelle source serveur fournit exactement le contexte person.email / organizationId utilisé par create-quote pour WanderGarage, ou quelle étape initialise profile.email ? » Ne pas remplacer cette valeur par customerId ou email acheteur sans contrat confirmé.

## Claims : contrat de démo

POST `save-claim` reçoit id UUID, révision attendue, orderId, action draft/submit et formulaire validé. Session/origine contrôlées ; la commande est relue sous identité acheteur. Stockage par empreinte utilisateur/unité/contrat ; données de pièces recopiées depuis OMS, maximum 200 lignes et 100 dossiers par périmètre. Révision et empreinte de payload rendent la répétition identique sans doublon ; un dossier soumis ne s’édite plus. Redis en production, mémoire en développement. Pas de pièce jointe ni de service externe de ticketing.

## Références de provenance

Sources FastStore inspectées historiquement dans `/Users/williamjeanne/faststore-volvo/faststore-volvoemea` : `src/graphql/thirdParty/resolvers/queryResolver.ts`, `src/features/replenishment-lists/lib/replenishmentApi.ts`, `src/features/quotes/hooks/useQuotesList.ts`, clients commerce de `@faststore/api`. Leur présence est une référence d’intégration, pas une garantie de stabilité de toutes les routes.

Détails des sondages et questions anciennes dans [l’archive des sources](archive/2026-09-25/SOURCES_PARCOURS.md). Ne relancer un diagnostic que sur information nouvelle ou échec actuel.
