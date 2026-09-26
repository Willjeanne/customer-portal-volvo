> Archive antérieure à la consolidation du 25 septembre 2026. Les états et consignes ci-dessous sont historiques ; voir [START](../../../START.md).

# Matrice de couverture — Volvo Customer Portal

> Mise à jour de phase : William a autorisé le démarrage de la réalisation locale après ce cadrage. Les mentions de phase documentaire ci-dessous sont historiques. Voir [le suivi de réalisation](SUIVI_REALISATION.md) pour l’état implémenté et les limites actuelles.

18 septembre 2026 — révisée après échanges avec William ; complément du [cadrage actif](CADRAGE_PORTAIL_VOLVO.md).

**Fonctions My Account conservées intégralement.** Cette matrice aide à réaliser les fonctions, elle n’impose pas de qualifier ses 76 lignes avant de commencer. Lecture et mutations utiles restent dans la cible ; les opérations d’administration découvertes dans les API ne sont pas automatiquement ajoutées au produit. Aucun retrait n’est décidé : toute réduction proposée sera nommée et soumise à William.

**Natif puis custom ciblé si nécessaire.** Une API manquante n’impose ni suppression ni storyboard. Identifier d’abord le service existant ; sinon définir une extension backend avec persistance et contrôles, sans dupliquer un référentiel existant. Les modes M/S ci-dessous sont des options de démonstration provisoires pour les données externes, pas des exclusions de réalisation custom. La qualification se fait dans la tranche concernée.

**Cette matrice décrit la cible et les preuves disponibles, pas une intégration terminée.** Aucun appel authentifié ni aucune mutation VTEX réalisés. Nouveau portail : toutes les lignes non implémentées. `R` = réel visé, `M` = mock proposé, `S` = storyboard proposé ; ces modes proposés ne sont pas des décisions déjà acceptées. `D` = documentation officielle, `C` = code inspecté, `H` = relevé historique, `?` = à établir. La preuve porte uniquement sur ce qui est précisé.

Les ressources de permission indiquées sont des pistes documentées ; le mapping exact action/ressource/portée reste à valider sur le compte. Un rôle métier tel que Fleet Manager ne crée aucun droit. Toutes les opérations ci-dessous s’entendent dans l’unité, le contrat et les objets autorisés.

## 1. Compte, organisation et gouvernance

| ID | Action cible / écran | Acteur et contrôle | API / source de vérité | Mode visé, preuve disponible | Point à confirmer / acceptation |
|---|---|---|---|---|---|
| A01 | Se connecter / login | Identité VTEX existante | VTEX ID / Authenticator ; login hébergé existant | R ; H+C | Flux supporté sur nouveau domaine, callback et session acheteur |
| A02 | Se déconnecter / profil | Utilisateur courant | Session portail + mécanisme logout VTEX | R ; C | Session et données privées inaccessibles après logout |
| A03 | Récupérer/changer l’accès / sécurité | Utilisateur ou gestionnaire autorisé | Flux d’identité hébergé ; service reset-password présent dans plugin | R ; C | Distinguer reset par admin et récupération personnelle ; ne pas recréer la gestion des mots de passe |
| A04 | Lire/modifier son profil | Utilisateur courant | B2B Buyer Data / `shopper`, identité selon attribut | R ; D+C | Record canonique et champs modifiables ; gestion des doublons existants |
| A05 | Gérer préférences disponibles | Utilisateur courant | Services profil et paramètres effectivement installés | R ; ? | Inventorier préférences My Account ; aucune sauvegarde fictive |
| A06 | Charger/sélectionner contexte | Acheteur ; scopes et contrat | Organization Units v1, session Buyer Portal, mécanisme de changement de contrat | R ; D+C+H | Pas de multi-appartenance supposée ; changement réel de contexte et invalidation des anciennes données |
| A07 | Lire organisation/arbre/détail | Membre autorisé | Organization Units v1 | R ; D+C+H | Racine/unité/enfants visibles conformes aux permissions |
| A08 | Créer/renommer une unité | Admin autorisé | Organization Units v1 | R ; D+C | Preuve distincte pour création et renommage ; relecture persistante |
| A09 | Déplacer/supprimer une unité | Administration hiérarchique autorisée | Organization Units v1 ; scopes et dépendances | R ; D | API documentée ; exposition My Account, impacts et autorisations à vérifier |
| A10 | Lire/modifier scopes et paramètres | Admin selon ressource | Organization Units scopes ; services du plugin | R ; D+C | Validation par type de scope ; pas de dépassement de délégation |
| A11 | Voir contrats commerciaux | Utilisateur autorisé | B2B Contracts / `CL`, scopes `contractIds` | R ; D+C+H | Contrat actif, conditions et portée de lecture |
| A12 | Rattacher/retirer/sélectionner contrat par défaut | Gestionnaire autorisé | Services Contracts du plugin, Organization Units/scopes | R ; C | Contrat supporté, permissions et effet session pour chaque action |
| A13 | Modifier informations/statut du contrat si exposé | Gestionnaire autorisé | B2B Contracts ; service update-contract-status présent | R ; D+C | Distinguer édition client et administration marchande ; ne pas promettre tous les champs |
| A14 | Voir/configurer assortiment par unité | Gestionnaire autorisé | Services ProductAssortment du plugin, contrats/scopes/collections | R ; C | Étendue de délégation et effet recherche ; pas de gestion du catalogue fournisseur |
| A15 | Lister équipe et consulter un utilisateur | `ViewUsers` ou droit équivalent | Organization Units + services utilisateurs | R ; D+C | Visibilité unité/racine, pagination et absence de données hors périmètre |
| A16 | Ajouter/inviter un utilisateur | `ManageUsers` et délégation | Authenticator, rattachement unité, rôles, Buyer Data | R ; D+C | Invitation par email distincte de création ; orchestration et erreurs partielles à qualifier |
| A17 | Modifier/détacher/réaffecter utilisateur | Gestionnaire autorisé | Services Users / Organization Units | R ; D+C | Réaffectation peut déplacer ; chaque action doit être explicitée avant confirmation |
| A18 | Lire rôles et permissions | Utilisateur/gestionnaire selon portée | Storefront Roles API | R ; D+C | Droits effectifs, pas inférence depuis persona ou simple ID de rôle |
| A19 | Attribuer/révoquer rôles | Gestionnaire explicitement autorisé | Storefront Roles API | R ; D+C | Aucun acheteur ne peut élever ses droits ; attribution différente de création de rôle custom |
| A20 | Lister adresses facturation/livraison | Droit de lecture et scopes | B2B Addresses / `AD`, scopes `addresses` | R ; D+C+H | Adresse liée au bon contrat ; unité et adresse distinctes |
| A21 | Créer/modifier/supprimer une adresse | `ManageAddresses` ou ressource requise | B2B Addresses et services Addresses du plugin | R ; D+C | Contrat shopper/API, dépendances et opérations permises à confirmer séparément |
| A22 | Gérer destinataires et points de livraison | Gestionnaire d’adresses autorisé | `contact_information`, Custom Fields / locations | R ; D+C | Quai/localisation interne distinct du site ; rattachements vérifiés |
| A23 | Gérer valeurs par défaut d’une unité | Admin autorisé | Default Values API / services plugin | R ; D+C | Disponibilité compte ; priorité et application effective à la session |
| A24 | Lire méthodes et conditions de paiement | Acheteur selon contrat/scopes | Contrat, scopes, services PaymentMethods et checkout partagé | R ; D+C | Les options affichées doivent être celles réellement autorisées |
| A25 | Attribuer/retirer méthodes à une unité | Admin autorisé | Services PaymentMethods / scopes | R ; C | Contrat d’API supporté et absence d’élargissement non autorisé |
| A26 | Voir cartes enregistrées masquées | Droit de lecture cartes | Services SavedCards/Gateway/CTV à réconcilier | R ; D+C | Cartes personnelles et contractuelles distinctes ; endpoint précis selon installation |
| A27 | Ajouter/retirer carte, définir défaut si disponible | Gestionnaire autorisé / utilisateur selon type | Services cartes supportés, mécanisme hébergé/tokenisé | R ; C+D partiel | Aucune donnée carte brute dans portail/BFF ; preuve distincte de chaque opération |
| A28 | Lire budgets, allocations, soldes/historique | Droit de lecture budget | Budgets API ; route storefront observée | R ; D+C+H | Solde daté, unité et période correctes ; pas de calcul de solde local |
| A29 | Créer/modifier/supprimer budget | Gestionnaire budget autorisé | Budgets API | R ; D+C | Droits, dates, dépendances, effets et persistance par opération |
| A30 | Ajouter/retirer allocations | Gestionnaire budget autorisé | Budgets API / services allocations | R ; D+C | Portée utilisateur/adresse/champ ; ne pas confondre allocation et dépense |
| A31 | Voir/créer/modifier/supprimer règles d’achat | Lecture ou gestion selon action | Buying Policies API / services du plugin | R ; D+C+H | Priorité et héritage réels ; aucune règle du « seuil minimum » inventée |
| A32 | Voir/gérer définitions et options comptables | Lecture ou gestion selon action | Custom Fields API | R ; D+C+H | État actuel désactivé rapporté ; modification globale à coordonner, pas à exécuter maintenant |
| A33 | Associer valeurs comptables à une unité | Gestionnaire autorisé | Services accounting-fields/scopes | R ; C | Valeurs visibles/permises ; centre de coût distinct d’une unité physique |

## 2. Achats et suivi

| ID | Action cible / écran | Acteur et contrôle | API / source de vérité | Mode visé, preuve disponible | Point à confirmer / acceptation |
|---|---|---|---|---|---|
| B01 | Voir tâches/indicateurs / accueil | Chaque rôle dans son périmètre | Agrégation des lectures commandes, devis, budgets, alertes | R, M pour alertes proposées ; C partiel | Compteurs issus des mêmes filtres que les listes ; indisponibilité ≠ zéro |
| B02 | Chercher une pièce, voir résultats/PDP | Acheteur ; assortiment/contrat | Intelligent Search, catalogue, offre contextualisée | R ; C+H | Recherche publique distincte des prix/assortiments privés ; commandabilité non déduite du stock |
| B03 | Voir disponibilité/délai/options | Acheteur, destination et quantité | Services commerce/logistiques via intégration supportée | R ; C partiel | Disponibilité finale, seller, fret ; multi-seller/backorder non prouvés |
| B04 | Saisie rapide/collage | Acheteur | Logique bulk existante + résolution catalogue | R ; C | Quantités, doublons, erreurs et sélection des lignes vérifiées |
| B05 | Importer CSV | Acheteur | `parseCsv`, `resolveLines` du site | R ; C | Entiers/plafonds et erreurs de parsing ; `.csv` n’établit pas `.xlsx` |
| B06 | Importer XLSX | Acheteur | Parseur dédié à sélectionner, même validation métier | R cible ; ? | Colonnes/format, taille et limite de lignes ; capacité supplémentaire à réaliser |
| B07 | Lister/lire listes enregistrées | Propriétaire ou partage autorisé | Entité existante `PL`, services de listes à qualifier | R ; C | Modèle officiel/custom, ownership et portée de partage |
| B08 | Créer/renommer/supprimer liste | Propriétaire/gestionnaire autorisé | Services existants de listes | R ; C | Autorisation serveur et persistance pour chaque opération |
| B09 | Ajouter/retirer articles, changer quantités | Éditeur autorisé | Services listes existants | R ; C | Concurrence, quantités et seller si porté par le modèle |
| B10 | Partager une liste | Propriétaire avec droit de partage | Service de visibilité `PL` | R ; C | Ne pas assimiler visibilité globale à partage dans l’organisation |
| B11 | Créer liste depuis commandes / ajouter au panier | Acheteur autorisé sur les sources | Historique + listes + cart handoff | R ; C | Quantités consolidées et offres revalidées ; aucune fuite via commande source |
| B12 | Préparer/modifier panier | Acheteur | Checkout partagé, adaptateur portail | R ; C | Panier lié à identité/contrat ; deltas conservés ; pas de double moteur checkout |
| B13 | Saisir références comptables en masse | Acheteur, configuration active | Custom Fields API + intégration panier | R ; D | Champs commande/article conservés ; pas de réactivation implicite |
| B14 | Passer au checkout puis consulter confirmation | Acheteur | Contrat de handoff partagé et Orders | R ; dépendance globale | Retour autorisé, identité, panier et références ; validation différée jusqu’à disponibilité globale |
| B15 | Lister/lire devis | Acheteur/lecteur autorisé | `quotes` dans l’existant ; service métier définitif à identifier | R (existant ou custom) ; C, ? natif | Filtrage serveur manquant dans resolver observé ; aucun accès global par clé |
| B16 | Créer/supprimer devis | Acheteur/gestionnaire selon état | Service devis existant ou extension backend custom à définir | R (existant ou custom) ; C custom | Ne pas confondre document Master Data et devis métier ; état et audit persistants |
| B17 | Demander ajustement, commenter, joindre fichier | Participant autorisé | Service devis et stockage documentaire à identifier | R (existant ou custom) ; ? | Chaque action, limites fichiers et destinataire à vérifier |
| B18 | Accepter/refuser devis | Participant autorisé selon service | Workflow backend du service existant ou de l’extension custom | R (existant ou custom) ; ? | Aucun rôle/état inventé ; approbation commande différente d’acceptation devis |
| B19 | Convertir devis en achat | Acheteur sur devis utilisable | Service devis → checkout | R (existant ou custom) ; C custom seulement | Validité/prix/état du devis décidés serveur ; ne pas reprendre les prix reçus du client |
| B20 | Voir commandes personnelles/organisation/contrat | Droits de visibilité appropriés | Orders ; `/api/oms/user/orders` observé dans site | R ; C | Sémantique réelle du contexte Buyer Portal, filtres et pagination |
| B21 | Consulter détail, livraisons et tracking | Lecteur autorisé sur commande | Orders et transport/logistique selon données | R ; C partiel | Expéditions partielles, ETA et liens réellement fournis ; pas de données fournisseur privées |
| B22 | Télécharger facture/documents | Lecteur autorisé sur document | Commande + source documentaire/ERP | R cible ; ? par type | Facture fiscale, facture crédit et document technique distincts ; propriété et accès fichiers |
| B23 | Recommander depuis commande | Acheteur ayant accès à la source | Orders + résolution offre + panier | R ; C partiel | Prix/stock actuels, produits retirés, quantités et droits revalidés |
| B24 | Modifier/annuler commande si proposé par My Account | Droit et état backend appropriés | Services Orders / change-order selon installation | R cible ; ? | Inventorier l’action réellement exposée ; annulation ≠ retour ; opération conditionnelle |
| B25 | Voir file d’approbation | Approbateur autorisé | Orders en attente + contexte Buying Policies | R ; C+D | Un filtre de statut seul ne prouve pas que l’utilisateur peut décider |
| B26 | Approuver/refuser, commenter si supporté | Approbateur sur étape courante | Buying Policies / opération de décision supportée | R ; D, C partiel | Décision backend, refus hors périmètre, conflit de décision et état relu ; commentaire séparément confirmé |

## 3. Domaines Volvo et extensions

| ID | Action cible / écran | Acteur et contrôle | API / source de vérité | Mode visé, preuve disponible | Point à confirmer / acceptation |
|---|---|---|---|---|---|
| V01 | Voir flotte/fiche véhicule | Utilisateur autorisé sur flotte | Source Volvo à nommer ; `Vehicles` existant insuffisant | M proposé ; C technique, ? métier | Véhicules autorisés ou fixtures fictives ; mapping vers SKU/offres réels et résultat attendu dans la tranche Volvo |
| V02 | Chercher par VIN/diagramme/problème | Acheteur/technicien autorisé | Source technique Volvo ; adaptateur dédié | M/S proposé ; ? | Couverture réelle de chaque entrée ; aucune confiance technique inventée par IA |
| V03 | Confirmer fitment/éligibilité/restrictions | Acheteur et contexte véhicule | Autorité technique Volvo | M proposé ; ? | Cas compatible, incompatible et inconnu ; sécurité/installation issues de la source |
| V04 | Résoudre supersessions/alternatives | Acheteur | Fixture de supersession existante ; cible Volvo | M ; C fixture | Chaînes/cycles et provenance ; pas d’alternative garantie techniquement par simple proximité catalogue |
| V05 | Associer VIN/WO/urgence aux lignes | Acheteur | Brouillon UI puis mécanisme de persistance à établir | R cible ; ? | Véhicule facultatif ; stock multi-véhicule ; preuve de conservation après achat |
| V06 | Voir contrat Parts Assure/éligibilité | Client éligible | Système couverture Volvo à nommer | M/S proposé ; ? | Distinct du contrat commercial ; pièces à coût nul uniquement si autorité le décide |
| V07 | Créer/suivre claim Parts Assure et service record | Client/service autorisé | Système claims/maintenance à nommer | M/S proposé ; ? | Délai, pièces, opération, kilométrage, code de paiement ; référence réelle si intégré |
| V08 | Demander retour de marchandise | Acheteur sur commande admissible | Système RMA à nommer | M/S proposé ; ? | Éligibilité, quantité, pièces jointes et statut ; OMS seul insuffisant |
| V09 | Initier core return | Client éligible | Processus retour consigne à nommer | M/S proposé ; ? | Distinct du retour standard et des conditions de remboursement |
| V10 | Initier réclamation garantie | Client éligible | Système warranty à nommer | M/S proposé ; ? | Autorité de décision, preuves et suivi |
| V11 | Voir statut d’avoir | Lecteur autorisé | ERP/comptabilité à nommer | M/S proposé ; ? | Avoir émis différent d’une demande acceptée |
| V12 | Voir alertes et construire solution | Gestionnaire flotte | Télématique/maintenance Volvo | S proposé ; ? | Source et fraîcheur ; aucune inférence « peut continuer à rouler » |
| V13 | Réserver service / activer abonnement | Client autorisé | Booking/provisioning externes | S ; ? | Pas de bouton annonçant une réservation/activation réelle sans destination |
| V14 | Consulter/contact concessionnaire avec contexte | Client autorisé | Référentiel concessionnaire + outil de réception à nommer | M proposé ; ? | VIN, besoin, panier/devis transmis avec droits ; réception et référence si réel |
| V15 | Acheter pour un autre client | Concessionnaire délégué | Délégation/accès contrats supportés à vérifier | R si délégation vérifiée, illustration sinon ; ? | Composants communs avec acheteur ; sélection autorisée et traçable ; aucune impersonation arbitraire |
| V16 | Lire notifications métier | Utilisateur dans son périmètre | Événements/services source ou fixtures | R pour sources établies, M sinon ; ? | Pas de faux retard/alerte ; état lu/non lu nécessite service propre identifié |
| V17 | Entrée DMS/punch-out | Acheteur via intégrateur autorisé | Punchout documenté ; intégration métier absente de preuve | S, futur ; D | Authentification, retour panier et contexte à traiter séparément d’un import CSV |

## 4. Contrats d’API : ce qui est exact et ce qui reste une piste

| Référence | Opérations ou routes établies | Limite de preuve |
|---|---|---|
| Organization Units v1 | `GET /api/organization-units/v1/{organizationUnitId}`, `GET .../{organizationUnitId}/children`, `GET .../{organizationUnitId}/scopes`, `GET /api/organization-units/v1/users/{userId}/scopes`, `GET /api/organization-units/v1/{userId}/unit` | Routes de lecture documentées ; comportement WanderGarage non testé |
| Utilisateurs d’unité | `GET /api/vtexid/organization-units/{organizationUnitId}/users` | Lecture documentée ; authentification et permissions compte à confirmer |
| Budgets dans le site | `GET /_v/store-front/customers/{customerId}/units/{contextId}/budgets?page=1&pageSize=20` | Route observée dans `getBudgets`, pas contrat public garanti ; comparer avec Budgets API |
| Commandes dans le site | `GET /api/oms/user/orders` | Présence observée, pas preuve de visibilité unité/contrat ni de toutes les actions |
| Listes dans le site | `/api/dataentities/PL/...` ; opérations GraphQL `getPurchaseLists`, `createPurchaseList`, `updatePurchaseListVisibility` | Custom/existant ; schéma, filtres et autorisations à qualifier |
| Devis dans le site | `/api/dataentities/quotes/...`, GraphQL `getQuotes`, `createQuote`, `deleteQuote`, `useQuote` | Resolver custom ; ne pas annoncer une API native de négociation |
| Plugin Buyer Portal local | Clients sous `src/features/*/clients`, base storefront `/_v/store-front/` ; clients cartes `saved-cards` ; mécanisme `switch-properties` pour contrat | API observée ≠ surface stable/supportée hors FastStore ; inventorier opération par opération |

Les routes d’écriture documentées ne sont pas appelées pendant le cadrage. Pour les services encore inconnus, conserver une case ouverte plutôt qu’un endpoint supposé. Les paramètres `userId`, `organizationUnitId`, `customerId` ou `contextId` ne doivent jamais être utilisés comme autorisation simplement parce qu’ils sont transmis par le navigateur.

Sources : [Organization Units](https://developers.vtex.com/docs/api-reference/organization-units-api), [Storefront Roles](https://developers.vtex.com/docs/guides/storefront-roles), [Budgets](https://developers.vtex.com/docs/api-reference/budgets-api), [Buying Policies](https://developers.vtex.com/docs/api-reference/buying-policies-api), [Custom Fields](https://developers.vtex.com/docs/api-reference/custom-fields-api), [architecture des entités](https://developers.vtex.com/docs/guides/b2b-buyer-portal-master-data-architecture), [carte des intégrations](https://developers.vtex.com/docs/guides/b2b-buyer-portal-integration-overview). Provenance locale et versions dans le cadrage.

## 5. Réutilisation : reprendre, adapter, recréer

| Bloc | Proposition | Condition avant portage |
|---|---|---|
| Résolution bulk, regroupement et validation | Reprendre après isolation | Conserver corrections Volvo ; vérifier plafonds, doublons, cycles, convergence des références et tests existants |
| CSV et cart handoff | Adapter | Validation stricte et indépendance des hooks FastStore ; preuve des quantités/sellers transmis |
| UI et navigation | Reconstruire selon références Volvo | Réutiliser concepts accessibles, pas le rendu standard My Account ; tokens encore provisoires |
| Listes | Adapter après validation du service | Portée serveur, partage, cohérence des modifications et provenance/licence |
| Devis | Requalifier avant toute reprise | Service propriétaire, workflow et prix autorisés ; ne pas copier le resolver global |
| Services du plugin | Référence d’intégration | Support hors runtime FastStore et licence ; ne pas importer un paquet uniquement pour contourner une API non supportée |
| Mesure existante | Ne reprendre qu’un minimum utile après qualification | Types événement/session inspectés ; harnais non déclaré validé et backlog non importé |
| Flotte/fitment et autres systèmes Volvo | Adaptateurs séparés | Source propriétaire nommée, fixtures délimitées, aucune base métier parallèle implicite |

Comparer au starter `VTEX-US-SE/faststore-usb2b7` avant portage effectif : le présent travail confirme les fichiers du portage Volvo, pas l’intégralité du diff upstream ni ses conditions de licence. Conserver provenance/commit et test de validation par bloc.

## 6. Fermeture de la couverture My Account

La complétude n’est pas encore revendiquée. Au fil des tranches fonctionnelles, confronter les lignes concernées aux écrans/actions visibles avec acheteur, administrateur et approbateur, puis aux permissions et services réels. Cet inventaire progressif ne bloque pas le premier accès connecté. Inclure actions secondaires, confirmations, menus de lignes, pages détail, sécurité, paramètres par défaut et opérations de commande.

Chaque ligne doit ensuite porter : acteur testé, unité/contrat, mode, état de livraison, API/version, date et preuve de lecture ou mutation, résultat attendu/observé et écart. Une fonction absente d’API déclenche la recherche d’un service existant ou d’une extension custom adaptée ; elle ne disparaît pas de la cible. Une redirection temporaire ou un mock ne ferme pas la couverture cible. Toutes les mutations et transactions de validation seront convenues ultérieurement, sans créer ni déplacer d’utilisateurs pendant cet inventaire.

## 7. Précisions de réalisation issues de la revue

- **Devis (B15–B19)** : la maquette ajoute main-d’œuvre, couverture sous contrat de service, limite d’approbation par devis et création d’un work order. Ces comportements restent à relier au service existant/custom, ou à déclarer simulés. Ne pas confondre approbation du devis, approbation de commande et couverture Parts Assure. Recalculer les totaux/taxes depuis les lignes ; ne pas copier les montants incohérents de l’image.
- **Volvo (V01–V05)** : livrer explicitement le mapping véhicule de démo → référence/SKU réel → offre/seller utilisable → résultat attendu. Le fitment fictif reste identifié même dans un achat VTEX réel.
- **Concessionnaire (V14–V15)** : mutualiser les fonctions avec l’acheteur dès la conception. Les droits délégués sont requis pour agir sur un client réel, pas pour concevoir les composants communs ou illustrer un scénario fictif.
- **Multi-seller (B03, B12, B21)** : dépendance avec le chantier storefront/offres ; vérifier l’existant avant toute création de seller. Distinguer vendeurs multiples, entrepôts multiples et expéditions multiples.
- **XLSX (B06)** : conservé dans la cible après CSV ; aucun retrait proposé.
- **Navigation et preuves** : navigation canonique dans le cadrage ; les groupes de documentation ne sont pas des menus supplémentaires. Mettre à jour les preuves au fil de la réalisation, sans nouvelle matrice exhaustive préalable.
