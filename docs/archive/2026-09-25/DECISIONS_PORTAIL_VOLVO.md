> Archive antérieure à la consolidation du 25 septembre 2026. Les états et consignes ci-dessous sont historiques ; voir [START](../../../START.md).

# Registre de décisions — Volvo Customer Portal

18 septembre 2026. Registre ouvert lors de la mise au propre documentaire autorisée par William. Le [cadrage](CADRAGE_PORTAIL_VOLVO.md) contient le plan détaillé ; la [matrice](MATRICE_CAPACITES_VOLVO.md) conserve les preuves techniques.

« Confirmé » désigne une instruction utilisateur établie. « Direction » désigne une recommandation de travail, sans prétendre que sa faisabilité est démontrée ou son déploiement autorisé.

| ID | Statut | Décision / instruction | Conséquence |
|---|---|---|---|
| D01 | Confirmé | Montrer ce que VTEX + custom permettent pour les use cases Volvo | Priorité aux fonctions et parcours utilisables ; pas de nouveau cycle de cadrage exhaustif |
| D02 | Confirmé | Portail indépendant, interface Volvo, compte `volvoemea`, WanderGarage | Réutiliser les identités et données existantes ; pas de duplication Acme |
| D03 | Confirmé | Fonctions My Account prévues conservées | Pas de réduction à la lecture ; tout retrait proposé sera nommé et décidé par William |
| D04 | Confirmé | Date d’atelier et matrice des questions ne sont pas des prérequis | Le rattachement aux use cases reste dans les parcours existants, sans livrable bloquant supplémentaire |
| D05 | Confirmé | Mise à jour documentaire uniquement pour cette étape | Aucun code, scaffold, dépendance, déploiement ou modification VTEX |
| D06 | Remplacé le 20/09 par décision William | Finalisation dans le Customer Portal, services VTEX conservés ; guest sur site existant inchangé | Construire adresse/livraison/paiement/récapitulatif/confirmation dans le portail ; le handoff externe devient transitoire |
| D07 | Direction | Next.js/React/TypeScript avec BFF intégré ; Vercel proposé | Vérifier un accès session/unité/permissions ; ne pas porter tous les services d’un coup |
| D08 | Direction | Plugin Buyer Portal comme référence d’implémentation | Qualifier les routes et adapter les clients ; aucune garantie implicite de support hors FastStore |
| D09 | Direction | Natif existant en priorité, custom ciblé pour les lacunes | Devis et autres fonctions ne sont pas automatiquement abandonnés ; persistance et règles serveur explicites |
| D10 | Direction | Mutualiser acheteur et concessionnaire | Réutiliser composants et parcours ; vérifier délégation avant accès à un client réel |
| D11 | Direction | Données Volvo réelles ou fixtures clairement identifiées | Un mapping véhicule → SKU/offres réels rend le parcours démontrable sans attendre tous les systèmes Volvo |
| D12 | Consolidation documentaire | Navigation canonique dans le cadrage ; sources/design comme références | Aucun retrait fonctionnel dû aux différences de menus ; corriger noms, montants et promesses pendant réalisation |
| D13 | Maintenu | USA/USD ; anglais proposé pour la démo ; interface responsive | Pas de nouvelle devise ou migration ; langue de travail non présentée comme exigence Volvo validée |
| D14 | Confirmé — instruction du 18 septembre 2026 après cadrage | Démarrer le plan en local, utiliser ensuite `Willjeanne/customer-portal-volvo` et Vercel | Remplace D05 pour l’initialisation, le code et les tests locaux. Aucun push/déploiement réalisé. William saisira les accès acheteur dans le navigateur pour le test VTEX. |
| D15 | Implémentation locale provisoire | Next.js 16.3.5 / React 19.3 / TypeScript, npm, Node 24 ; session opaque dans le processus local | Connexion et aperçu désactivés en production. Un stockage de session partagé et le flux d’authentification de déploiement doivent être qualifiés avant Vercel. |

## Vérifications techniques restantes, au moment utile

- Premier accès : portée/renouvellement du cookie, identité et contexte autorisé, lecture Buyer Portal depuis le BFF. Pas de partage inter-domaines supposé.
- Par fonction : API existante, permissions et persistance ; si lacune, extension ciblée ou blocage expliqué. La matrice se complète progressivement.
- Devis : service propriétaire ou backend custom, transitions et prix validés serveur ; les resolvers actuels ne sont pas copiés tels quels.
- Mode assisté : clients/contrats accessibles, actions déléguées et traçabilité ; un champ JWT décodé seul n’est pas une autorisation.
- Achat : handoff et retour checkout partagé, quantités/sellers et comptabilité. Dépendance storefront/offres pour le multi-seller.

Ces vérifications ne rouvrent pas le périmètre confirmé. Les montants, identifiants et états historiques restent dans le document de démarrage pour éviter les copies divergentes. Une nouvelle décision sera enregistrée seulement si elle change le périmètre ou la direction de réalisation.

## Décision William — checkout intégré et devis, 20 septembre

William autorise la finalisation de commande dans le Customer Portal et la création de devis depuis le panier. Cela remplace la cible de handoff checkout partagé ; aucune modification du site public/guest n’est nécessaire. Les services VTEX restent responsables des prix, livraison, droits, politiques d’achat et paiement. L’interface ne doit pas demander une nouvelle connexion sur emeafaststore pour son parcours normal ; les éventuelles authentifications propres au paiement restent dépendantes du moyen choisi.

La capture fournie montre une reconnexion au checkout externe et une liste Quotes vide sur le site. Le handoff n’est donc pas validé comme parcours transparent. La capture ne prouve pas que la nouvelle lecture des devis du portail fonctionne. La création d’un devis persistant puis sa relecture permettra de qualifier le parcours. Aucun achat réel n’est autorisé implicitement par la recette.

Arbitrage pagination catalogue : conserver pour ce lot 12 résultats/page avec plafond explicite (600 accessibles par recherche). Utiliser les filtres ; envisager une taille réglable ultérieurement après mesure, sans annoncer que tout le catalogue est parcourable.
