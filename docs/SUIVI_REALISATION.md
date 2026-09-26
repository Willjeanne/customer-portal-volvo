# Suivi de réalisation et preuves

Consolidation au **25 septembre 2026**. Le [plan](CADRAGE_PORTAIL_VOLVO.md) donne les priorités ; ce document ne décrit que les preuves disponibles et leurs limites. Les anciens relevés détaillés restent dans [l’archive](archive/2026-09-25/SUIVI_REALISATION.md) et les handoffs.

| Date / lot | Preuve disponible | Ce qu’elle ne prouve pas |
|---|---|---|
| 19–20/09 — identité, panier | Connexion corrigée, panier local validé William | Pas toutes les permissions administratives |
| 20/09 — flotte/parts | Lots Claude relus, lot 3 et tests intégrés | Pas de source Volvo VIN/télématique ; fixtures assumées |
| 20–21/09 — XLSX | Import confirmé fonctionnel par William | Pas tous les formats de classeur possibles |
| 21/09 — organisation | Captures William : sous-unités/équipe ; navigation affinée acceptée | Création utilisateur/centre de coût non recettée en réel ; travail reporté |
| 22/09 — Vercel | Login/context/home/organization/logout testés, session révoquée après logout | Pas de validation automatique de tous les métiers |
| 22/09 — maintenance | Références 3095196 et 21337557MOBIT qualifiées catalogue ; parcours ensuite confirmé William | Aucun fitment technique garanti |
| 24/09 — checkout | Adresse/livraison/Promissory et persistance au rechargement testés avant soumission | L’agent n’avait pas envoyé de commande lors de ce test |
| 25/09 — commande | William : OMS 1664170500031-01, 956 USD, Promissory autorisé, puis commande visible dans Orders | Pas carte bancaire ni bank transfer réel ; pas règlement bancaire acquitté démontré |
| 25/09 — listes | Liste visible et création confirmées William | Remplissage depuis draft/commande encore à recetter |
| Publication 2146772 | Typecheck/lint/build réussis ; 100 tests passés, 1 HTTP sauté lors de cette suite ; Vercel Ready constaté | Ne couvre pas les modifications locales suivantes |
| Claims A, statuts anglais | Typecheck/lint/test formulaire ; écran accepté William | Pas soumission SAV réelle |
| Claims B local | Typecheck/lint + 2 tests ciblés passés : lignes/quantités, isolation, révisions, répétition, soumission | Pas recette UI complète B ni test contre Redis réel |
| Mise à jour documentaire | Revue du code pertinent, état Git local et liens documentaires | Aucun nouveau test métier, appel VTEX ou déploiement |

## Purchasing Insights — lots 1–3 locaux, 25 septembre

Navigation remplacée sans ajout de menu, redirection /services → /insights ; analyses, remises tracées, catalogue à la demande, comparaison de quantités et préparation. Typecheck/lint/build réussis ; suite complète **108 réussis, 1 test HTTP optionnel sauté**, dont six tests insights. Aucun test live de remise ou simulation privée : wandergarage-buyer retourne zéro commande ; compte utilisé par William pour afficher son historique demandé. Lecture publique SKU 1437 réussie (catégories et Application). Aucun achat, push ou déploiement.

Détails des limites, règles de calcul et recette : [PURCHASING-INSIGHTS](PURCHASING-INSIGHTS.md).

## Dernière publication confirmée

Commit `2146772`, fusion de `d05a019` et du travail distant incluant `afe69e0` (session 4 h, nom utilisateur). Déploiement Vercel constaté Ready : `dpl_DxPUYxWHp5ks24Z1jnUh9nkpsg9A`, alias https://customer-portal-volvo.vercel.app. Cet état n’a pas été réinterrogé pendant la consolidation documentaire.

La partie IA était conservée dans la fusion. Conversation live de bout en bout non reconduite après ce merge ; ne pas la déclarer recettée sur cette seule base.

## Changements locaux depuis cette publication

Espacement Lists ; Claims A/B (formulaire, validation, stockage et historique DEMO) ; mapping anglais des statuts Orders/détails/Claims ; documentation. Pas de nouvelle publication demandée dans la présente tâche.

## Recettes encore utiles

1. Claims : sauvegarder/reprendre un brouillon, soumettre DEMO, retrouver détail et état.
2. Lists : ajouter des pièces depuis préparation ou commande, relire les quantités ; ne pas relancer aveuglément un résultat partiel.
3. Lors du prochain déploiement Claims : vérifier persistance après reconnexion avec même utilisateur/unité et isolation avec un autre périmètre.
4. IA : conversation réelle avec le collègue CX, réception des produits et ajout à la préparation.

Les anciennes mentions « flag checkout bloquant », « listes GraphQL rejetées » ou « aucune publication » sont des constats datés, remplacés par les résultats ci-dessus. Le contexte devis, lui, reste une dépendance ouverte.
