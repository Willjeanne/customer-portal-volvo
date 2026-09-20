# Revue des lots flotte et recherche — 20 septembre 2026

Relecture Codex sur le code présent et HANDOFF-FLOTTE.md. Intégration au plan **avec réserves**, sans modification applicative dans cette revue. Les déclarations de validation navigateur sont celles de Claude ; aucune recette connectée de ces deux lots n’est encore confirmée par William.

## Changements acceptés

- `context.vehicle` devient un identifiant stable de fixture ; les anciennes sessions peuvent afficher aucun véhicule jusqu’à une nouvelle sélection.
- Véhicule et urgence modifiables en session VTEX : contexte de démonstration uniquement, sans droit ni politique commerciale. Changement d’unité toujours refusé en connecté.
- Recherche `/parts` ouverte sans permission purchase ; achat toujours protégé côté serveur par PlaceOrders.
- Restauration automatique du brouillon de session à l’arrivée dans Quick Order : cohérente avec l’ajout depuis les pièces. Ne pas écraser les modifications d’une page déjà ouverte.
- Valeurs nulles des facettes tolérées : correction appropriée.

## Acquis, preuves et limites

16 véhicules de démonstration, filtres, détail, recherche par identifiant de fixture, systèmes/facettes catalogue et ajout au brouillon implémentés. Catalogue réel lu via Intelligent Search ; les VIN, flotte, alertes et contrats restent fictifs. Le lien Application est une donnée catalogue, pas un fitment validé Volvo. Le prix/disponibilité retourné est **public, trade-policy 1, sans cookie acheteur**. La devise de session ne transforme pas cette offre en prix contractuel. La simulation acheteur dans Quick Order reste la référence avant transfert.

La chaîne flotte/pièces → brouillon a été testée en aperçu selon Claude. Le panier a été validé par William séparément. Ne pas fusionner ces preuves en une recette bout en bout connectée.

## Corrections prioritaires

1. **Perte d’ajouts au brouillon** — `parts-picker.tsx` lit puis remplace le brouillon ; seul le bouton de la référence en cours est bloqué. Deux ajouts de pièces différentes peuvent partir du même état et s’écraser. Plusieurs onglets gardent ce risque même avec un verrou UI. Prévoir un ajout atomique côté serveur, sans remplacer tout le brouillon.
2. **Quantité annoncée fausse** — `Math.min(9999, ancien + ajouté)` écrête silencieusement mais le message annonce la quantité demandée comme ajoutée. Refuser le dépassement ou afficher le delta réellement appliqué.
3. **Facettes ignorées après VIN** — `FindParts` remplace toutes les facettes par Application lorsque `vehicleByIdentifier(query)` correspond. Les liens conservent q=VIN : sélectionner un système ne change donc pas la requête effective. Conserver le modèle du véhicule et les facettes secondaires ; définir clairement comment retirer le véhicule.
4. **Pagination au-delà de la limite** — l’UI calcule toutes les pages, mais `partsPageSchema` s’arrête à 50. Avec 1 764 produits et 12/page, les liens annoncent 147 pages alors que la page 51 est refusée. Harmoniser navigation et limite de l’API, en indiquant toute limite réelle.
5. **Offre publique présentée trop largement** — remplacer les formulations suggérant des conditions acheteur par une indication de prix/disponibilité catalogue à confirmer dans Quick Order. Ne pas utiliser la devise acheteur pour étiqueter une offre d’une autre politique commerciale sans preuve de correspondance.
6. **Référence exacte non garantie** — `/parts?q=…` utilise la recherche textuelle, sans filtrage exact du SKU/RefId. La mesure d’un exemple unique ne garantit pas le contrat « exact match ». Qualifier ou corriger la promesse. La résolution exacte de Quick Order est distincte.

À conserver au backlog : seulement le premier SKU de chaque produit est mappé ; facettes tronquées aux 14 premières sans accès au reste ; choix vendeur non transmis au brouillon ; fitment et photos substitutives restent documentés.

## Périmètre

Les fonctions qualifiées « hors périmètre » dans le handoff deviennent **non implémentées / source à qualifier**, pas supprimées du plan : fiche produit, restrictions/éligibilité, supersessions, délais/sourcing, WO et entrée par commande précédente. L’absence actuelle de commande réelle bloque sa recette, pas sa place dans le périmètre.
