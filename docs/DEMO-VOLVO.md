# Démo Volvo — script et recette

Mis à jour le **25 septembre 2026**. Production : https://customer-portal-volvo.vercel.app/login. Pour Claims, l’espacement Lists et les statuts anglais récents : **http://127.0.0.1:3001/login**, tant que le lot local n’est pas publié. Se connecter et vérifier le compte/unité avant présentation.

## Script court — environ 7 minutes

### 1. Flotte → besoin de maintenance

Ouvrir Fleet & Vehicles, sélectionner **Truck 147**, Volvo FH13 Classic, Dallas Workshop. Montrer **Brake wear detected**.

À dire : « L’alerte guide le gestionnaire vers une recherche de pièces adaptée au modèle et au système concerné. Les véhicules et alertes sont illustratifs ; le catalogue est réel. »

Cliquer **Find suggested parts** : Brakes / FH13 Classic / référence **3095196**, Brake Shoes Set. Le SKU **1437** a été relevé pendant la recette du 24 septembre. Référence et SKU sont deux identifiants distincts. Montrer le bandeau et **View all vehicle parts** pour élargir.

### 2. Préparation et prix acheteur

Ajouter quantité 1, ouvrir Quick Order, lancer **Check prices & availability**. Montrer prix, quantité et résultat, puis transférer vers le panier si VTEX autorise l’achat. Les prix et stocks du jour font foi ; ne pas annoncer le montant de la recette historique comme offre courante.

Alternative : scénario **Truck 203**, FM13 New, **Air filter service due** → Filters → référence **21337557MOBIT** (Air Filter). Autre chemin : import CSV/Excel, puis même contrôle commercial.

### 3. Checkout dans le portail

Enregistrer l’adresse disponible, les options de livraison, puis le moyen **Promissory réellement retourné**. Cliquer **Save payment method**, vérifier le récapitulatif et le total. Les autres moyens retournés sont affichés, mais leur soumission n’est pas intégrée.

Pour une démonstration sans nouvelle commande, s’arrêter au récapitulatif. **Place order crée réellement une commande** : si c’est le parcours choisi, cocher la confirmation puis soumettre une seule fois et relever la référence. Si le résultat est incertain, vérifier avant toute nouvelle tentative.

À dire : « Le parcours reste dans le Customer Portal ; VTEX contrôle prix, livraison et autorisation. » Une commande Promissory de **956 USD**, **1664170500031-01**, a déjà été confirmée par William ; ce n’est pas une simulation de création ni une preuve de virement acquitté.

### 4. Historique et réapprovisionnement

Ouvrir Orders et une commande disponible pour le compte. Montrer les lignes et les liens de suivi/facture lorsqu’ils existent. Les libellés anglais sont dans le lot local récent.

Ouvrir Lists : montrer une liste existante, **Create a list**, puis **Prepare from this list**. L’ajout via **Save parts to a replenishment list** dans Quick Order ou depuis une commande est codé ; le recetter avant de le présenter comme acquis. Une cadence ne commande pas automatiquement.

### 5. Returns & Claims — local pour l’instant

Depuis Orders, **Return or report an issue**, ou ouvrir Returns & Claims : sélectionner une commande et une pièce, quantité 1. Exemple : Claim / Damaged part, sujet « Damaged part received », description « The packaging and the part were damaged on arrival. », résolution Replacement.

**Review request → Save draft → View request history → Resume draft → Review request → Submit demo request → View request history → View request.**

À dire : « Le dossier reprend les lignes de la commande et conserve la demande dans le portail. Pour cette démo il n’est pas transmis au SAV Volvo. » Le dossier soumis est figé ; les brouillons locaux disparaissent au redémarrage/rechargement serveur.

## Purchasing Insights — nouveau parcours local

L’onglet remplace Contracts & Services. Avec un compte qui voit des commandes : afficher les remises enregistrées et leurs sources, sélectionner une référence récurrente, lire ses familles/applications catalogue, puis comparer l’offre actuelle pour deux quantités. Montrer le prix unitaire et le total avant Add to draft → Quick Order. En l’absence de remises ou d’offre plus avantageuse, ne pas présenter d’économie inventée. Recette privée live encore attendue ; [détails et limites](PURCHASING-INSIGHTS.md).

## Extensions à montrer seulement si préparées

- **AI Assistant** : collègue CX, conversation et recommandations ; confirmer le canal/origine et le parcours réel avant la démo.
- **My Organization** : montrer les écrans tels quels ; pas de recette de création durant la démo. Unités d’organisation et centres de coût sont distincts.
- **Quotes** : ne pas annoncer création/négociation/conversion ; le contexte de lecture reste à qualifier.
- **Support, Payment Methods dédié** : écrans d’attente ; **Contracts & Services** reste au backlog, son entrée est remplacée par Insights.

## Préparation rapide avant présentation

Vérifier connexion, bonne origine/port, produit trouvable et offre acheteur actuelle. Choisir à l’avance si une vraie commande sera créée. Pour Claims, garder le serveur local actif et préparer un dossier ; ne pas compter sur la mémoire locale après redémarrage. Aucun long parcours de recette automatisée n’est requis pour une simple revue documentaire.
