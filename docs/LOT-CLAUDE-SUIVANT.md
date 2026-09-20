# Lot proposé à Claude — fiabiliser flotte / Find Parts

Mission prête à transmettre par William ; aucun message externe envoyé et aucun agent lancé. Codex conserve le plan global et les services panier/devis/droits.

## Périmètre et fichiers réservés

Corriger les points 3 à 6 de REVUE-FLOTTE-PARTS.md : facettes après VIN, pagination bornée, présentation des offres publiques, recherche exacte ou libellé fidèle au comportement. Préserver les wireframes et le look and feel. Ajouter l’accès aux facettes au-delà des 14 premières si nécessaire pour rendre le parcours utilisable.

Fichiers autorisés : `src/components/find-parts.tsx`, `src/domain/parts.ts`, `src/server/parts.ts`, `src/domain/volvo-models.ts`, `src/app/fleet/[vehicleId]/page.tsx`, tests flotte/parts/find-parts, `docs/HANDOFF-FLOTTE.md`. CSS limité aux classes du lot et coordonné avant édition si une autre session y écrit. `parts-picker.tsx` : seul texte d’offre/currency autorisé, annoncer ce changement à Codex ; pas de modification de la logique d’ajout pendant son travail sur l’atomicité.

Ne pas modifier : route API partagée, page section partagée, session store, cart, quick-order, purchase-permission, custom-quotes, quotes, plan global, dépendances/configuration. Si un changement transversal est nécessaire, proposer son contrat dans le handoff avant de toucher au fichier.

## Sources attendues

Code Intelligent Search existant, son contrat réel observé, fixtures fleet, wireframes Design ; distinguer toujours catalogue public, simulation acheteur et compatibilité illustrative. Ne pas modifier la configuration VTEX ou le projet FastStore de référence.

## Critères de sortie

- VIN + système produit une requête contenant Application ET système ; retirer un filtre fonctionne.
- Aucun lien de pagination ne conduit à une page rejetée par le schéma ; limite de recherche explicitée si nécessaire.
- Prix et disponibilité publics ne sont pas qualifiés de contractuels. Devise associée à une source compatible.
- Contrat de référence exacte démontré par test, ou promesse corrigée sans inventer une nouvelle API.
- Tests ciblés sur ces régressions et contrôles regroupés ; pas de relecture globale ni recette navigateur longue.
- Handoff court : fichiers modifiés, preuves, limites, 3 à 5 étapes de recette pour William. Aucun retrait de scope.

En parallèle, Codex : ajout atomique au brouillon et refus des quantités excessives ; checkout et devis personnalisés. William : recette connectée après corrections. Ne pas commiter les fichiers d’une autre session ; point commun de sauvegarde coordonné par Codex.
