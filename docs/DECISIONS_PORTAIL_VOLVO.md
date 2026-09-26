# Décisions courantes — 25 septembre 2026

Ce registre remplace les statuts provisoires du [registre initial](archive/2026-09-25/DECISIONS_PORTAIL_VOLVO.md), conservé avec ses identifiants D01–D15.

| Sujet | Décision en vigueur | Conséquence |
|---|---|---|
| Produit | Démo Volvo, portail indépendant, compte volvoemea / WanderGarage | Design convenu conservé ; sources emeafaststore pour les intégrations |
| Périmètre | Fonctions My Account cibles conservées | Une fonction non livrée est un backlog explicite, pas un retrait implicite |
| Architecture | Next.js/React/TypeScript, BFF, Vercel | Direction initiale devenue implémentation ; Redis partagé production |
| Autorisation | Développement local puis publications demandées par William | L’ancienne phase « documentation seulement » et le « aucun push » initial sont historiques |
| Checkout | Finaliser dans le Customer Portal | Le handoff externe n’est plus le parcours cible ; Promissory réalisé |
| Paiements | Moyens du panier issus de VTEX ; Promissory utilisable pour la démo | Carte/bank transfer à intégrer ; ne pas renommer Promissory ni coder les méthodes du compte en dur |
| Organisation | Écrans suffisants pour la démo | Recette des écritures et extensions après démo, avant partage élargi SEs |
| Recherche | Chercher n’exige pas la permission d’achat | Achat garde ses contrôles serveur ; VIN/fitment ne sont pas certifiés par la recherche |
| Flotte | Fixtures explicites, catalogue réel | Deux scénarios alerte → recherche ciblée ; pas de télématique ou diagnostic réel annoncé |
| Pagination | 12 résultats/page, plafond moteur 50 pages | 600 produits accessibles par recherche ; filtres pour affiner, augmentation non réalisée |
| Lists | Réutiliser le service natif de réapprovisionnement FastStore | Ne pas substituer PL ; cadence descriptive, pas achat automatique |
| Claims | Dossiers internes DEMO, avec commande réelle en référence | Aucun envoi SAV, remboursement ou retour logistique dans A/B |
| Purchasing Insights | Lots 1–3 autorisés, remplace Contracts & Services dans le menu | Pas d’IA à ce stade ; remises prouvées, comparaisons via simulation, contrats au backlog |
| IA | Collègue CX responsable de WWC/Weni | Préserver onglet, conversation et cartes ; coordonner les interfaces panier |
| Méthode | Lots ciblés, tests utiles groupés, recette William | Éviter sondages et vérifications navigateur répétés sans information nouvelle |
| Documentation | Une synthèse actuelle, preuves séparées et archives | Les sources/design restent références de besoins, pas preuves de livraison |

## Questions encore ouvertes

Contexte organisation exact pour les devis ; intégration carte/bank transfer ; destination réelle Claims et stockage des pièces jointes ; rôle/portée des actions post-démo ; fitment et systèmes Volvo. Ces questions n’annulent pas les parcours déjà démontrés. Toute réduction de périmètre ou évolution importante du design revient à William.
