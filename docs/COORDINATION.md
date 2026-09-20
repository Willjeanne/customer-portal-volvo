# Coordination du portail — source de suivi commune

Mise à jour : 20 septembre 2026. Codex tient le plan global ; Claude livre une tranche bornée ; William valide les parcours. Aucun nouveau chantier avant d’avoir terminé ou nommé le blocage du chantier actif. Design et périmètre convenus conservés.

| Responsable | Chantier | État / prochaine preuve |
|---|---|---|
| Codex | Ajout atomique et sauvegarde du brouillon | Codé, contrôles automatisés réussis ; recette multi-onglets William à faire |
| Claude | VIN/facettes, pagination, référence exacte, offres publiques | Terminé ; handoff lot 3 reçu et code relu par Codex, intégré avec recette navigateur William en attente |
| Codex + William | Checkout intégré | Autorisé par William ; remplace la cible externe qui redemande une connexion. Prochain chantier Codex : livraison puis paiement/confirmation |
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
