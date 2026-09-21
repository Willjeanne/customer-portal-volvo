# Sources des parcours — qualification ciblée

20 septembre 2026. Le code sur disque prouve les appels prévus, pas le déploiement de chaque parcours. William a fourni `https://www.emeafaststore.com/pvt/account/create-quote` : le parcours devis personnalisé est la référence de données. Les wireframes et le look and feel du portail restent inchangés. La distinction des parcours listes reste à qualifier côté API.

| Parcours local existant | Source constatée | Portée et décision |
|---|---|---|
| Listes historiques, resolver getProductLists | Master Data PL | Recherche ownerEmail et organizationEmail/visibility. Distinct des listes de réapprovisionnement ; ne pas substituer l’un à l’autre. |
| Réapprovisionnement, replenishmentApi.ts | GraphQL getLists/getListItems/CRUD, provider vtex.replenishment-service@1.x | Le portail reproduit cette lecture mais reçoit une erreur de validation GraphQL. Installation/contrat réellement actif à confirmer depuis le parcours visible. |
| Validation et panier des listes | Routes poc-harness validate-items/add-to-cart ; client interne Master Data sur les entités vtex_replenishment_service_* | Ce service n’expose pas le CRUD des listes. Ses lectures internes servent aux contrôles de propriété avant persistance. Pas de remplacement direct de la lecture GraphQL par une route supposée. |
| Devis personnalisés, features/quotes → getQuotes | Master Data quotes | Resolver existant avec clé applicative et sans filtre organisation visible : non réutilisable tel quel. Les prix d’articles sont en centimes dans l’UI existante. |
| Devis natifs, client commerce FastStore → listUserQuotes | /api/quoting/quotes | Le portail utilise actuellement ce service, réponse vide constatée. Ce n’est pas une preuve de lecture des devis personnalisés. Mention explicite dans l’écran. |
| Autorisation d’achat | License Manager Storefront BFF → ressource PlaceOrders | Clé documentée par VTEX ; transport repris de commerce.users.isResourceGranted. Nouvelle vérification côté serveur à la préparation et avant transfert. Réponse booléenne uniquement ; aucun privilège global déduit. Réponse réelle WanderGarage à tester. |
| Panier portail | Checkout simulation puis orderForm, sous cookies acheteur conservés côté serveur | Simulation réelle constatée ; transfert et relecture du panier local ensuite validés manuellement par William. Le panier du site et le handoff ne sont pas encore qualifiés. |

Source officielle des ressources : https://developers.vtex.com/docs/guides/storefront-roles

Chemins de référence sous `/Users/williamjeanne/faststore-volvo/faststore-volvoemea` :
- `src/graphql/thirdParty/resolvers/queryResolver.ts`
- `src/features/replenishment-lists/lib/replenishmentApi.ts`
- `src/features/quotes/hooks/useQuotesList.ts`
- `io/poc-harness/node/service.json` et `node/clients/replenishmentStore.ts`
- `node_modules/@faststore/api/src/platforms/vtex/clients/commerce/index.ts`

Ne pas utiliser `granted-order-entry` comme synonyme de PlaceOrders : son usage local concerne l’accès à la page Order Entry. Ne pas supposer la B2B Suite installée pour qualifier le Buyer Portal.

Le hook useCreateQuote confirme : mutation createQuote, organisation issue de person.email, auteur issu de b2b.userEmail, prix multipliés par 100 ; le resolver écrit dans quotes avec le schéma v1. Ces champs doivent être dérivés et contrôlés côté serveur dans le portail, pas simplement acceptés du navigateur.


## Qualification réelle des devis — 20 septembre

Connexion WanderGarage réussie ; authentication.storeUserId correspond au compte. POST /api/sessions retourne HTTP 201, mais profile est vide : profile.email absent. Confirmation avec le transport à cookies conservés : POST puis PATCH sur session existante, même absence. Aucune clé applicative utilisée, aucun panier ni devis créé.

Le périmètre organisation est donc indisponible avant même la lecture Master Data. Les droits de lecture/écriture quotes restent NON TESTÉS ; ne pas confondre ce résultat avec un refus Master Data ni avec le flag checkout non identifié. Pas de substitution par customerId ou email acheteur : le contrat existant stocke person.email dans organizationId.

Correctif local : absence de contexte reconnue comme QUOTE_ORGANIZATION_MISSING (409), message explicite au lieu de CUSTOM_QUOTES_FORMAT. Test ciblé réussi : aucun appel quotes sans organisation ; isolation utilisateur/organisation et refus API toujours couverts.

Question technique à transmettre : « Pour volvoemea / WanderGarage, le login B2B est valide mais /api/sessions ne fournit pas profile.email, même après POST puis PATCH avec cookies conservés et X-FORWARDED-HOST www.emeafaststore.com. Le parcours create-quote utilise person.email comme organizationId. Quelle étape initialise ce champ, ou quelle source serveur fournit exactement la même valeur ? Le flag checkout conditionne-t-il cette transformation de session ? »


## 21 septembre — qualification réelle des listes

Source locale comparée : replenishmentApi.ts utilise bien getLists/getListItems et provider vtex.replenishment-service@1.x, comme le portail. Authentification WanderGarage réussie. Requête portail complète puis minimale getLists { id } : HTTP 400 GraphQL validation failed sur www.emeafaststore.com. Même requête minimale sur volvoemea.myvtex.com : même erreur. Aucun appel d’écriture, aucune modification d’installation.

Conclusion bornée : le contrat appelé n’est pas accepté sur les deux chemins testés. Ce n’est pas une liste vide ni un refus d’accès établi. L’absence d’installation, une version différente ou un problème de composition du schéma ne sont pas distinguables avec cette réponse sans détail. Ne pas remplacer les listes par l’entité historique PL ou un accès Master Data administratif.

Correctif : code LISTS_CONTRACT_UNAVAILABLE et message expliquant la vérification du contrat nécessaire, au lieu d’une invitation générique à réessayer. JSON invalide traité en LISTS_RESPONSE. Tests ciblés distinguent contrat rejeté, refus 403 et réponse invalide.

À transmettre à l’équipe VTEX : « Sur volvoemea, avec WanderGarage authentifié, POST /_v/private/graphql/v1 et query { getLists @context(provider: "vtex.replenishment-service@1.x") { id } } renvoient HTTP 400 GraphQL validation failed, sur www.emeafaststore.com et volvoemea.myvtex.com. Pouvez-vous confirmer l’app/version active, le workspace et le contrat de lecture des listes, ou fournir une requête fonctionnelle du parcours ? »
