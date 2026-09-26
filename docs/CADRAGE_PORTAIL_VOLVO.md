# Plan global — Volvo Customer Portal

**25 septembre 2026 — état courant.** Propriétaire du plan : Codex, arbitrages William. [Matrice](MATRICE_CAPACITES_VOLVO.md) pour la couverture ; [preuves](SUIVI_REALISATION.md) pour les validations. Le cadrage original complet est [archivé](archive/2026-09-25/CADRAGE_PORTAIL_VOLVO.md) ; le besoin source n’est pas réduit par cette consolidation.

## Objectif et périmètre

Démontrer les parcours Volvo dans une interface dédiée, avec identité et commerce VTEX `volvoemea` / WanderGarage. Conserver les wireframes convenus, les fonctions My Account cibles et les extensions Volvo. Une fonction non livrée reste au backlog ; elle n’est pas déclarée acquise grâce à une maquette.

Priorité : **démo Volvo**. La préparation au partage aux autres SEs vient ensuite. My Organization est jugé suffisant visuellement ; sa recette d’écriture est reportée. Le storefront emeafaststore et son parcours guest restent distincts.

## Architecture livrée

Next.js/React/TypeScript, BFF à opérations limitées, cookies acheteur conservés côté serveur. Vérification de session et origine aux mutations ; droits d’achat vérifiés côté serveur, VTEX conservant l’autorité métier. Redis partagé en production, mémoire locale en développement. Session portail de quatre heures ; pas de partage automatique avec un autre domaine.

Catalogue public → préparation → simulation commerciale acheteur → panier VTEX → checkout dans le shell Volvo. Promissory est le seul moyen raccordé à la soumission. Les offres publiques, la compatibilité catalogue et les autorisations d’achat sont des notions distinctes.

Listes : service natif de réapprovisionnement utilisé par FastStore. Devis : service custom `quotes`, contexte à qualifier. Claims : stockage de dossiers de démo propre au portail, sans intégration SAV. IA : canal WWC/Weni du collègue CX.

## Navigation et couverture

Home, Fleet & Vehicles, Find Parts, Quick / Bulk Order, Lists, Quotes, Orders, Returns & Claims, Purchasing Insights, My Organization, Payment Methods, Support / Dealer, AI Assistant, My Profile. Checkout est un parcours interne depuis le panier. Les menus d’attente ne constituent pas des fonctions intégrées.

## Plan par lots

| Lot | État | Prochaine action / critère de sortie |
|---|---|---|
| Session, contexte, publication | Livré et connexion Vercel validée | Maintenir origine exacte et stockage partagé |
| Catalogue, flotte, alertes | Livré ; fixtures identifiées | Corriger seulement les retours de démo ; fitment VIN réel hors preuve |
| Quick Order, import, panier | Livré ; import et panier validés par William | Préserver révisions, quantités et contrôle d’achat |
| Checkout Promissory | Publié ; commande réelle confirmée | Carte/bank transfer : intégration dédiée avant de les rendre utilisables |
| Orders | Livré ; nouvelle commande visible | Publier les libellés anglais locaux ; suivi/facture selon données disponibles |
| Lists | Publié ; création validée | Recette d’ajout de pièces ; publier espacement local |
| Returns & Claims A/B | Code local terminé | Recette William des brouillons et dossiers DEMO, puis publication demandée |
| Returns & Claims C | À cadrer | Pièces jointes, échanges, destinataire et statut réels ; ne pas annoncer de SAV connecté |
| Devis | Lecture filtrée codée, contexte live non qualifié | Source `profile.email` équivalente au contrat FastStore, lecture autorisée, puis création/relecture/actions/conversion |
| Purchasing Insights | Lots 1–3 locaux implémentés | Recette avec compte ayant des commandes, qualification remises/offres privées ; IA reportée |
| AI Assistant | Travail CX intégré et préservé | Recette live conversation → produits → préparation avec le collègue |
| My Organization | Écrans et créations codés, écritures non recettées | Report après démo, puis rôles, pagination, CRUD et recette par persona |
| Autres extensions | Backlog conservé | Budgets/approbations, contrats/services, délégation, garanties, consignes, DMS/punch-out, notifications et support |

## Purchasing Insights — décision et livraison locale

William autorise lots 1 à 3, IA plus tard. L’entrée Contracts & Services est remplacée par Purchasing Insights ; le périmètre contrats reste au backlog. Voir [qualification détaillée](PURCHASING-INSIGHTS.md). Remises = total Discounts, prix comparés via simulation, pas de promotions inventées. La lecture actuelle wandergarage-buyer retourne zéro commande ; finaliser la recette sur le login qui voit les commandes, sans élargissement arbitraire des droits.

## Ordre immédiat

1. Valider le lot local Claims avec une courte recette ; ne pas déclencher de retour ou remboursement réel.
2. Sur demande de publication, contrôler le diff commun (IA comprise), commit/push, puis état Vercel et recette ciblée Redis.
3. Choisir le prochain lot entre Claims C et déblocage des devis ; les dépendances doivent être nommées avant une nouvelle série de sondages.
4. Reprendre les fonctionnalités post-démo selon priorité William, sans élargir spontanément la tranche active.

## Critères de démonstration

Conserver l’utilisateur dans le portail jusqu’à confirmation Promissory. Montrer les vraies données commerce, préciser les fixtures de flotte et les dossiers SAV de démo. Afficher les erreurs et états incertains au lieu d’un succès supposé. Ne pas présenter une méthode visible comme un paiement intégré, une cadence de liste comme une commande automatique, ni une unité d’organisation comme un centre de coût.

## Façon de travailler

Lire l’état courant et les fichiers concernés ; appliquer les skills pertinents et les guides Next installés avant code. Petits lots cohérents, contrôles automatisés utiles regroupés, recette navigateur par William sauf diagnostic ciblé. Documenter le résultat dans le suivi, actualiser le bilan et le plan sans recopier un journal entier dans chaque document. Aucun retrait de périmètre ou refonte visuelle implicite.
