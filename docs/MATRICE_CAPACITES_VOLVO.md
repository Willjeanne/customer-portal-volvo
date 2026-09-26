# Matrice des capacités — état au 25 septembre 2026

Cette matrice décrit la livraison courante. L’inventaire complet des exigences A/B/V et leurs identifiants est conservé dans [la matrice source archivée](archive/2026-09-25/MATRICE_CAPACITES_VOLVO.md). Les fonctions non livrées restent au périmètre cible.

« Publié » = inclus dans la dernière publication confirmée `2146772`, pas une nouvelle inspection de production. « Local » = changements non publiés. « Validé William » = retour utilisateur identifié ; le code et les tests seuls ne prouvent pas un parcours live.

| Capacité | Code / disponibilité | Preuve et limite |
|---|---|---|
| Connexion, contexte, logout | Publié, Redis production | Connexion Vercel validée ; sessions 4 h ; contrôle VTEX toujours nécessaire |
| Home et contexte véhicule/urgence | Publié | Interface de démo ; ne pas présenter tous les indicateurs comme télématiques réels |
| Fleet & Vehicles | Publié | 16 fixtures ; modèles/alertes illustratifs |
| Alerte → recherche suggérée | Publié | Truck 147 / 3095196 ; Truck 203 / 21337557MOBIT ; qualification catalogue réalisée |
| Find Parts : référence, texte, VIN de démo, facettes | Publié | Catalogue réel ; filtre Application, pas certification VIN ; plafond moteur 50 pages, 12 résultats/page |
| Offres catalogue | Publié | Offre publique à confirmer dans Quick Order ; premier SKU, seller à conserver de bout en bout encore au backlog catalogue |
| Quick Order, CSV, XLSX | Publié | XLSX validé William ; contrôle erreurs/quantités ; pas une intégration DMS |
| Brouillon et contrôle prix/disponibilité | Publié | Révisions et ajout atomique ; simulation acheteur avant panier |
| Panier et achat autorisé | Publié | Panier validé William ; permission PlaceOrders recontrôlée ; budget non contourné |
| Checkout livraison | Publié | Adresses disponibles, options retournées ; pas de création d’adresse ni livraison planifiée complète |
| Checkout Promissory | Publié | Commande 1664170500031-01, 956 USD, confirmée William ; ce n’est pas la preuve d’un virement bancaire acquitté |
| Carte bancaire / bank transfer réel | Non raccordés à la soumission | Méthodes VTEX visibles, non supportées désactivées ; IDs/libellés non inventés |
| Orders : liste, détail, suivi, facture | Publié | Nouvelle commande visible ; liens seulement si fournis ; annulation/modification non intégrées |
| Statuts de commande anglais | Local | Mapping des codes VTEX ; code inconnu → Status unavailable |
| Recommander depuis commande | Publié | Préparation et nouveau contrôle des prix/stock, pas reproduction des prix historiques |
| Lists : lire et préparer | Publié | Liste réelle visible confirmée William ; service natif, pas entité PL historique |
| Lists : créer | Publié | Création vide validée William ; nom/description/fréquence |
| Lists : ajouter depuis draft/commande | Publié | Code/test ; écriture live de remplissage à recetter ; résultat partiel possible, pas transaction multi-lignes |
| Lists : espacement | Local | Cartes espacées ; pas de changement métier |
| Lists : édition complète/partage/suppression/achat planifié | Non livrés | Une cadence ne déclenche pas une commande automatique |
| Quotes : historique filtré | Publié, qualification ouverte | Contexte profile.email absent lors de la dernière qualification ; accès live pas déclaré validé |
| Quotes : création, détail/actions, conversion | Non livrés | Service, scope, prix et transitions à qualifier |
| Claims : sélection commande, lignes, texte, revue | Local | Commande réelle, contrôles serveur ; premier écran accepté William |
| Claims : brouillon, soumission DEMO, historique/détail | Local | Tests ciblés réussis ; recette UI et Redis réel à faire ; mémoire locale éphémère |
| Claims : fichiers, échanges, RMA/remboursement/garantie | Non livrés | Aucun destinataire SAV connecté ni éligibilité décidée |
| Organisation : unités et équipe | Publié | Lecture observée avec profil autorisé ; scope hiérarchique contrôlé |
| Organisation : création utilisateur/centre de coût | Publié, non recetté en écriture | Unité administrative sélectionnable ; centre de coût distinct ; report post-démo |
| Organisation : rôles existants, CRUD unités/centres, pagination complète | Non livrés | Backlog post-démo |
| Profil | Lecture publiée | Édition/préférences non raccordées |
| AI Assistant | Publié, travail CX conservé | WWC/Weni, conversation/cartes ; recette conversation réelle après merge non reconduite |
| Purchasing Insights | Local, lots 1–3 | Achats/remises/produits, comparaison actuelle et préparation ; qualification privée live en attente du bon compte, détail dans PURCHASING-INSIGHTS.md |
| Contracts & Services | Backlog, entrée menu remplacée | Pas de retrait de périmètre ; ancien lien redirigé vers Insights |
| Payment Methods dédié / Support | Écrans d’attente | Ne pas confondre Payment Methods et choix de paiement au checkout |
| Budgets/approbations et comptabilité avancée | Non livrés dans le portail | VTEX peut appliquer ses règles à l’achat ; cela ne livre pas leur administration |
| Délégation concessionnaire, Parts Assure, consignes, maintenance réelle, punch-out | Backlog | Sources Volvo/services et droits à établir |

Les [besoins source](context/VOLVO_USE_CASES_AS_REQUESTED.md) et le [scope complet](context/Volvo_Customer_Portal_Demo_Feature_Scope.md) restent les références du périmètre futur ; cette matrice n’est pas une déclaration de complétude My Account.
