# Purchasing Insights — lots 1 à 3

25 septembre 2026. Implémentation **locale**, non publiée. L’entrée remplace Contracts & Services dans le menu, au même emplacement ; `/services` redirige vers `/insights`. Contracts & Services reste au backlog. IA explicitement exclue de ce lot.

## Lot 1 — qualification

Sources : commandes accessibles à l’acheteur via `/api/oms/user/orders`, détail OMS, catalogue public par SKU exact, contexte de session et simulation Checkout via BFF. Aucun accès OMS administratif, aucune API de gestion des promotions, aucune clé applicative ajoutée.

Lecture réelle avec `wandergarage-buyer` pendant ce lot : `total: 0`, `pages: 0`. Ce résultat ne signifie pas qu’il n’existe aucune commande WanderGarage : il décrit cette identité à cet instant. Login utilisé par William pour voir ses commandes demandé ; aucune remise historique réelle ni offre actuelle privée n’a donc été qualifiée dans cette exécution. L’écran reste utilisable avec tout compte connecté dont OMS expose les commandes. Les calculs et intégrations sont testés sur réponses contrôlées, jamais affichées comme données démo live.

Lecture catalogue réelle : SKU 1437 / référence 3095196, Brake Shoes Set, marque Volvo, `/Trucks/Brakes/`, Application FH13 Classic et FH13 New. Le catalogue fournit ainsi une source utile pour connaître les pièces ; Application n’est pas une certification VIN.

Références officielles consultées : [champs orderForm](https://developers.vtex.com/docs/guides/orderform-fields) et [Checkout API](https://developers.vtex.com/docs/api-reference/checkout-api). `priceDefinition.total` évite les différences d’arrondi du prix unitaire ; les `priceTags` décrivent des modifications de prix, pas nécessairement une économie promotionnelle à additionner.

## Lot 2 — achats, habitudes et remises

Périodes 30/90/365 jours et tout l’historique accessible. Lecture bornée à trois pages de 10 commandes, détails par lots de cinq ; période appliquée aux dates de création, commandes annulées/en demande d’annulation exclues. Si historique supérieur à 30 ou détails indisponibles, couverture partielle visible ; les indicateurs ne prétendent pas couvrir toute l’entreprise.

- Références achetées et achats répétés par SKU/vendeur/devise.
- Montants d’articles calculés à partir de `priceDefinition.total`, sinon sellingPrice × quantité.
- Familles issues des catégories du détail OMS, « Unclassified » si absentes. Un bouton lit les familles/applications actuelles du catalogue par SKU exact.
- Intervalle moyen observé seulement après trois dates distinctes. Ce n’est pas une prévision de stock ni une date de remplacement.
- Co-achats observés dans au moins deux commandes ; recherche des paires bornée aux 30 premiers SKU distincts par commande, trois paires affichées. Aucun lien de compatibilité déduit.
- Export CSV des références, quantités et commandes sources ; protection contre formules CSV.

Remises : total `Discounts` de la commande uniquement, une seule fois. Sans totalizers pertinents, donnée indisponible ; pas zéro inventé. Devises séparées, agrégats monétaires masqués si devise absente. Écart au prix catalogue jamais additionné. Noms de bénéfices seulement si l’identifiant correspond à une priceTag négative ; pas d’allocation d’un montant par promotion. Les remises ne prouvent ni paiement encaissé ni gain net après retours/remboursements.

## Lot 3 — préparation et comparaison actuelle

Dans une référence achetée : quantité souhaitée, seconde quantité optionnelle, puis comparaison à la demande. Le serveur relit la commande, prend SKU et vendeur d’origine, vérifie l’identité, utilise channel/country/currency de session et appelle la simulation Checkout. Pas de changement du panier ou de la préparation lors du contrôle ; les cookies Checkout peuvent être actualisés par le transport existant.

Prix unitaires et totaux présentés séparément. Stock partiel ou indisponible : aucune offre complète. Comparaison au prix historique seulement si devise identique. Noms de bénéfices retournés affichés ; absence d’identifiant = aucune attribution inventée. Un prix unitaire inférieur ne prouve pas une promotion ni une règle de quantité. Pas de recherche globale des promotions futures ou réservées à d’autres clients.

Simulation sans adresse de livraison ni coupon : prix commercial, fret et conditions finales à revalider dans Quick Order/checkout. Ajout à un brouillon existant via l’opération atomique draft-add ou à une liste via le parcours existant. Le brouillon reste SKU/quantité : le vendeur est revalidé par Quick Order, la comparaison ne verrouille pas une offre d’achat.

## Recette William

1. Se connecter avec le compte qui affiche des commandes dans Orders, ouvrir Purchasing Insights, choisir All available history si besoin.
2. Vérifier les commandes sources et les remises indiquées (ou explicitement absentes), puis sélectionner une pièce.
3. Load product families & applications : vérifier la marque, famille et modèles du catalogue.
4. Compare current offer : comparer la quantité habituelle et une autre quantité utile ; lire prix unitaire et montant total, sans attendre obligatoirement une remise.
5. Add to draft → Quick Order → nouveau contrôle prix/stock. Le panier ne doit pas avoir changé avant ce transfert volontaire.

Validation automatisée : six tests ciblés couvrent remises/devises/arrondis, récurrence, scope OMS, identité, quantités simulées, non-mutation du panier/brouillon, stock partiel, historique incomplet et SKU catalogue exact. Résultats de la suite globale/build consignés dans SUIVI_REALISATION.md. Aucun achat ni liste créée par l’agent.
