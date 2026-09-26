# État de reprise — Volvo Customer Portal

Mis à jour le **25 septembre 2026**. Ce fichier donne l’état courant ; [START](START.md) indexe les autres documents. Les anciens bilans contradictoires sont conservés en [archives](docs/archive/README.md).

## Nouveau lot local — Purchasing Insights

Lots 1–3 implémentés : `/insights` remplace Contracts & Services dans le menu, sans ajout d’onglet ; ancien `/services` redirigé. Références récurrentes, connaissance catalogue, remises enregistrées avec commandes sources, comparaison de deux quantités via simulation acheteur, ajout au brouillon/liste et CSV. Aucune intégration IA nouvelle. [Qualification et recette](docs/PURCHASING-INSIGHTS.md).

Qualification live limitée : wandergarage-buyer renvoie zéro commande dans cette session ; login utilisé par William pour voir les commandes demandé. Catalogue réel SKU 1437 qualifié. Pas de remise ni simulation privée live prétendue validée ; pas de données fictives pour remplir le dashboard. Historique borné à 30 commandes, couverture visible, devises séparées, pas de somme des tags promotionnels avec le total Discounts.

## Où en est le projet

Le portail fonctionne en local sur **3001** et possède une production Vercel. La dernière publication confirmée est le merge **2146772**, incluant checkout Promissory, gestion des listes et travaux IA du collègue CX. Ne pas confondre cette publication avec le travail local suivant : **Returns & Claims lots A/B, espacement Lists, statuts des commandes en anglais**, et cette consolidation documentaire ne sont pas encore publiés.

William a confirmé une commande réelle **1664170500031-01**, **956 USD**, Promissory, puis sa visibilité dans Orders. Le checkout n’est donc plus bloqué globalement par le flag B2B historique. La carte bancaire et un véritable bank transfer restent à intégrer ; les moyens affichés viennent de VTEX, sans libellé inventé.

## Fonctionnel aujourd’hui

- Connexion VTEX, contexte acheteur, session quatre heures, stockage Redis en production.
- Flotte de 16 véhicules fictifs ; Truck 147 → freinage/réf. **3095196**, Truck 203 → filtre/réf. **21337557MOBIT** ; résultats catalogue réels, sans certification VIN.
- Find Parts, Quick Order, import CSV/XLSX, brouillon, contrôle prix/stock, panier et checkout Promissory intégré.
- Orders : historique, détail, liens de suivi/facture lorsqu’ils existent, réapprovisionnement depuis une commande.
- Lists : lecture native, création vide, ajout de pièces depuis préparation ou commande. Création validée par William ; remplissage réel encore à recetter.
- Returns & Claims local : commande réelle → lignes/quantités → formulaire → revue → brouillon reprenable ou dossier DEMO soumis et figé → historique/détail. Aucun envoi Volvo, remboursement ou autorisation de retour.
- My Organization : navigation des unités, équipe, formulaires utilisateur/centre de coût. Recette d’écriture et extensions reportées après la démo.
- AI Assistant : intégration WWC/Weni du collègue CX conservée, conversation et cartes produits ; recette live de bout en bout non reconduite après merge.

## Limites et difficultés ouvertes

Devis : `custom-quotes.ts` lit l’entité `quotes` avec scope issu de `profile.email`. Ce champ était absent lors de la qualification ; lecture live à requalifier. Création, détail/actions et conversion ne sont pas raccordés. Ne pas substituer l’email acheteur ou un accès global pour faire disparaître le blocage.

Claims : stockage séparé par utilisateur/unité/contrat, 100 dossiers maximum, contrôle de révision et répétition sans doublon, commande relue avant sauvegarde. Mémoire locale éphémère ; Redis en production sans TTL de dossier. Branche Redis non recettée contre le service réel. Pas de fichiers joints, échanges, SAV, RMA ni gestion d’éligibilité.

Contracts & Services, Payment Methods dédié et Support / Dealer restent des écrans d’attente. Budgets/approbations, délégation concessionnaire, garantie/consigne et intégrations Volvo ne sont pas une couverture livrée complète.

## Prochaine reprise

1. William recette Purchasing Insights avec le compte ayant des commandes (sources, catalogue, comparaison de quantités, ajout au brouillon).
2. William recette Save draft → Resume draft → Submit demo request → View request sur `/claims`.
3. Corriger tout retour concret, puis publier le lot local lorsque William le demande. Vérifier le commit et Vercel Ready.
4. Cadrer le lot C Claims (pièces jointes/échanges et destination réelle), ou reprendre les devis avec une source de contexte établie. Aucun nouveau chantier implicite en parallèle.
5. Garder My Organization en pause pour la démo ; carte/bank transfer restent au backlog explicite.

## Validation et méthode

Dernier lot Purchasing Insights : typecheck/lint/build réussis, suite complète 108 tests réussis et 1 test HTTP optionnel sauté. Qualification privée en attente comme indiqué ci-dessus.

Lot Claims : typecheck, lint et deux tests ciblés réussis (formulaire, quantités, isolation, révisions, soumission, répétition). Le serveur 3001 répondait 307 vers login sans session. Pas de recette Redis réelle ni de nouvelle transaction effectuée par l’agent. Publication précédente : typecheck/lint/build et 100 tests réussis, un HTTP sauté dans cette exécution ; ce chiffre est historique, pas une exécution du lot courant.

Cette mise à jour documentaire n’a modifié aucun code fonctionnel ni exécuté de tests métier. Démarrage et commandes : [README](README.md). William préfère les lots ciblés, peu de vérifications intermédiaires et une courte recette manuelle. Codex tient le plan global ; préserver le travail IA et coordonner les fichiers partagés. Aucun secret dans les documents.
