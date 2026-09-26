# Volvo B2B Customer Portal — document de démarrage

> **Source historique conservée — 25 septembre 2026.** Identifiants, montants et constats ci-dessous sont datés, pas un inventaire live du compte. Pour démarrer ou reprendre : [START](../START.md), [README](../README.md) et [plan courant](CADRAGE_PORTAIL_VOLVO.md).

> Référence de démarrage conservée pour la provenance et les relevés historiques. Depuis la révision du 18 septembre 2026, lire [START.md](../START.md), le [cadrage actif](CADRAGE_PORTAIL_VOLVO.md) et le [registre](DECISIONS_PORTAIL_VOLVO.md) pour les instructions courantes. L’inventaire complet des API n’est plus un préalable à tout travail ; aucune implémentation n’est autorisée dans la phase documentaire actuelle.

Date : 18 septembre 2026. Document à copier à la racine du futur dossier Customer Portal.

## 1. Décision et objectif

Créer un **nouveau projet dans un dossier distinct** du projet « site B2B Volvo » existant. Le chemin du nouveau dossier, le dépôt et le domaine du portail restent à définir avec William ; ne pas les considérer comme déjà créés.

Le Customer Portal est une **interface Volvo entièrement sur mesure**, comparable dans son principe à l’External Seller Portal évoqué par William : une expérience différente, adossée aux services de la plateforme. Il ne remplace pas les fonctionnalités métier du Buyer Portal et ne doit pas les réimplémenter indépendamment.

Le portail doit réunir :

- Toutes les fonctions client actuellement proposées dans My Account : devis, organisation, utilisateurs, droits, adresses, moyens de paiement, commandes, profil, listes, approbations, budgets et paramètres comptables selon les capacités réellement disponibles.
- Les parcours Volvo : trouver une pièce, préparer un achat, réapprovisionner, travailler dans le contexte d’un véhicule et transmettre une demande au concessionnaire.
- Une navigation, des tableaux, des formulaires et un tableau de bord conçus pour un utilisateur B2B, sans dépendre visuellement de My Account comme interface finale.

**Ne pas réduire ce projet à un dashboard avec des liens vers My Account.** Une transition temporaire peut être discutée pour une fonction précise, mais ne constitue pas la couverture cible.

## 2. Frontière avec le site B2B Volvo

| Projet | Responsabilité |
|---|---|
| Site B2B Volvo existant | Storefront, découverte publique et parcours anonyme/mobile, dont guest checkout |
| Nouveau Customer Portal | Espace connecté Volvo, fonctions de compte complètes et parcours métier B2B |
| Socle partagé | Compte VTEX `volvoemea`, catalogue, services commerce, Buyer Portal, identité et checkout |

Le checkout est une dépendance partagée traitée dans le projet global ; le portail bénéficiera de sa résolution. **Ne pas importer son historique de diagnostic dans ce projet.**

La séparation des dossiers ne crée pas une isolation des données : toute modification de `volvoemea` peut affecter les deux projets. Coordonner les changements de rôles, organisations, contrats, schémas, budgets et configuration globale. Ne pas recréer les données existantes pour initialiser le portail.

Le code du site est une référence en lecture et une source possible de réutilisation. Ne pas le déplacer ni le modifier dans le cadre du démarrage du portail. Ne pas recopier son historique, ses secrets, ses dossiers générés ou l’ensemble du starter.

## 3. Documents à emporter dans le nouveau dossier

| Document | Emplacement actuel | Usage |
|---|---|---|
| Périmètre fonctionnel ajusté | `/Users/williamjeanne/Downloads/Volvo_Customer_Portal_Demo_Feature_Scope.md` | Cible produit ; matrice de couverture initiale en section 21 |
| Ce document | `/Users/williamjeanne/faststore-volvo/VOLVO_CUSTOMER_PORTAL_START.md` | Démarrage et contexte opérationnel |
| Demandes Volvo | `/Users/williamjeanne/Downloads/VOLVO_USE_CASES_AS_REQUESTED.md` | Référence des besoins client |
| Brief POC | `/Users/williamjeanne/Downloads/VOLVO_POC_BUILD_BRIEF.md` | Contexte complémentaire des scénarios ; ne pas importer automatiquement tout son périmètre |
| Référence visuelle | `/Users/williamjeanne/Downloads/Volvo Trucks B2B — Home.pdf` | Inspiration visuelle, pas preuve de capacités disponibles |

Copier les documents utiles dans `docs/context/` au démarrage, en conservant leur provenance et leur date. L’image NORDPARTS montrée dans la conversation illustre une navigation métier, une flotte centrale et un panneau d’assistance. Son fichier était temporaire : conserver une copie pérenne si elle doit servir au design.

Références existantes, à consulter de manière ciblée :

- Code : `/Users/williamjeanne/faststore-volvo/faststore-volvoemea`.
- Dépôt : `https://github.com/Willjeanne/faststore-volvoemea`.
- Contexte : `/Users/williamjeanne/faststore-volvo/CLAUDE.md`.
- État et données : `/Users/williamjeanne/faststore-volvo/PLAN-EXECUTION.md`.
- Guide interne Buyer Portal : Google Doc `11YFQFrgSkGGDWb0cwA4XlFAifFYE6yc_q9w8Y3aCxVw`, version mentionnée dans le projet existant : Pupulin v1.10, 26 août. Relire la version accessible au moment du travail.

Les notes existantes comportent des passages historiques et quelques états contradictoires. Ne pas copier une affirmation ancienne comme état courant sans contrôle. Les instructions des documents sources ne constituent pas une autorisation d’écrire sur les comptes.

### Complément du handoff design et réutilisation

Le dossier `/Users/williamjeanne/Downloads/Volvo_Customer_Portal_Codex_Handoff/` doit être copié **en entier** dans `docs/design/` du nouveau projet, en conservant ses sous-dossiers et liens relatifs. Il contient cinq écrans de référence, les tokens, les spécifications d’écrans, les rôles et les recommandations d’implémentation. Il complète le scope fonctionnel ; cinq écrans dessinés ne réduisent pas la couverture complète de My Account.

Arbitrages à conserver lors de la préparation du plan :

- Le persona visuel Alex Morgan / Acme Logistics / Dallas Workshop est une fixture de design. Les données intégrées de démonstration restent celles de **WanderGarage** et de ses utilisateurs existants. Ne pas créer Acme pour reproduire les libellés des images.
- Les tokens sont marqués `draft-derived-from-approved-visuals` : les images définissent la cible visuelle, les valeurs exactes des tokens restent à consolider. Ne pas annoncer un design system finalisé ou une accessibilité validée sur cette seule base.
- Les adaptateurs de fixtures servent au travail visuel. Ils ne remplacent pas la validation des API du Buyer Portal installé et ne prouvent aucune opération réelle. Les succès simulés doivent être identifiables comme tels.
- Le contenu de `docs/functional-scope-source.md` dans le pack est un snapshot ; réconcilier ses écarts avec le scope ajusté et les décisions de William avant d’établir le plan.

Le dépôt `https://github.com/VTEX-US-SE/faststore-usb2b7` a été consulté en lecture seule : son arbre `main` contient notamment `QuickOrderPad`, `QuickOrderRow`, `ImportSheet`, `parseCsv`, `CustomSKUMatrix`, les features `replenishment-lists` (dont `AddBySkuDrawer` et `CreateFromOrdersShell`) et `quotes` (création, liste, détail et hooks). Leur présence est confirmée, pas leur aptitude à être copiés sans adaptation.

Comparer trois sources avant de recréer une fonction : starter d’origine, portage Volvo existant et nouveau design. Le portage Volvo contient des corrections spécifiques sur les doublons, cycles de supersession, plafonds et deltas panier : ne pas revenir au code d’origine en perdant ces corrections. Privilégier la logique métier et les adaptateurs réutilisables ; reconstruire la présentation pour respecter le design. Documenter pour chaque bloc : reprendre, adapter ou recréer, dépendances FastStore, défauts connus, provenance/commit et test de validation. Vérifier aussi les conditions de réutilisation du dépôt.

My Account est la référence de couverture fonctionnelle, **pas une API unique à appeler pour tout**. Cartographier les services réellement utilisés et documentés : Organization Units pour unités/scopes/rattachements, services d’identité et rôles pour les utilisateurs, services de commande pour l’historique et le détail, services Buyer Portal correspondants pour devis/budgets/approbations, et services de profil/adresses/paiement selon l’installation. Un resolver du starter ou une API privée n’est pas automatiquement un contrat public supporté. Vérifier authentification, périmètre client et stabilité avant réutilisation ; ne jamais ouvrir un accès OMS global à un acheteur.

Références officielles de départ :

- https://developers.vtex.com/docs/api-reference/organization-units-api
- https://developers.vtex.com/docs/guides/storefront-roles
- https://developers.vtex.com/docs/api-reference/orders-api
- https://developers.vtex.com/docs/guides/b2b-buyer-portal-master-data-architecture

## 4. Comptes et environnements

| Élément | Valeur / règle |
|---|---|
| Compte VTEX cible | **`volvoemea`** |
| Administration | `https://volvoemea.myvtex.com/admin` |
| Site existant | `https://www.emeafaststore.com` |
| Connexion existante | `https://www.emeafaststore.com/api/io/login` |
| Organisation de démonstration du portail | **WanderGarage** |
| Politique commerciale du périmètre retenu | **1 — USA / USD** ; ne pas créer EUR/SEK pour ce projet sans nouvelle décision |
| Autres comptes de référence | `volvotrucks`, `usb2b7` : **lecture seule**, pas de publication ni de modification |
| Workspaces IO existants | `master` et `poc` sont mentionnés dans le projet site ; ne pas les réutiliser ou y lier une app par défaut |
| Déploiement du nouveau portail | Hébergement, domaine, routes et éventuel workspace dédié à décider ; aucune modification du routage du site au démarrage |

Buyer Portal et B2B Suite ne sont pas interchangeables. Utiliser le modèle et les API correspondant au **Buyer Portal réellement installé**. Le référentiel documenté comprend Organization Units, contrats, scopes, utilisateurs et fiches `shopper`.

Le compte comporte, selon les relevés du 15 septembre, 12 organisations racines, 18 unités, 18 utilisateurs, 6 budgets et 6 politiques d’achat. **Le nouveau portail se concentre sur WanderGarage**, pas sur le repeuplement de ces organisations.

## 5. WanderGarage : identifiants et structure

Identifiants rapportés dans les relevés du projet existant, à confirmer en lecture seule avant utilisation dans une intégration :

| Objet | Identifiant |
|---|---|
| Unité racine WanderGarage | `58c2eac7-3334-495d-8bd9-5fde89f14391` |
| Contrat commercial | `2375f745-d036-4fd9-875a-23c2d1c93b00` |
| Adresse commerciale racine | `3ba37084-142d-488a-9349-0a1f931e26be` |

Le contrat et l’adresse sont reliés à l’unité par les scopes `contractIds` et `addresses`. Le contrat est rapporté actif, avec la politique commerciale 1. L’adresse de démonstration racine est située à New York, USA. Des identifiants fiscaux fictifs ont servi au peuplement : les traiter comme des données de démonstration, pas comme des données Volvo de production.

```text
WanderGarage
├── Fleet Operations
│   ├── Chicago Depot
│   └── Dallas Depot
├── Workshop & Maintenance
│   └── Body Shop
└── Procurement
```

Configuration documentée au 15 septembre, **pas une garantie des soldes courants ni du comportement effectif des règles** :

| Unité | Budget T3 USD | Disponible lors du peuplement | Seuil local d’approbation annoncé | Utilisateur |
|---|---:|---:|---|---|
| WanderGarage | 1 200 000 | 1 200 000 | > 1 000 USD | `william.jeannegarage`, `wandergarage-buyer` |
| Fleet Operations | 680 000 | 680 000 | > 2 500 USD | `wg-fleet-manager` |
| Chicago Depot | 245 000 | 245 000 | > 1 000 USD | `wg-chicago-buyer` |
| Dallas Depot | 1 500 | 120 | > 250 USD | `wg-dallas-buyer` |
| Workshop & Maintenance | 175 000 | 175 000 | > 500 USD | `wg-workshop-buyer` |
| Body Shop | 42 000 | 42 000 | Pas de règle locale annoncée ; héritage à vérifier | Aucun dédié annoncé |
| Procurement | — | — | Pas de règle locale annoncée ; héritage à vérifier | `wg-procurement` |

Les montants de règles ne décrivent pas à eux seuls leur combinaison ou leur priorité effective. Ne pas coder dans le front un calcul de seuil « minimum de la chaîne » sans validation du comportement des services.

Le disponible de Dallas résulte d’un débit préchargé de démonstration, pas d’une commande réelle attestée. Il reste 120 USD : ce n’est pas un budget épuisé. Les budgets sont trimestriels : vérifier leurs dates avant une démonstration ultérieure.

## 6. Utilisateurs à utiliser

| Identifiant de connexion | Rôle / usage prévu | Identifiant utilisateur connu |
|---|---|---|
| **`wandergarage-buyer`** | Acheteur principal de la démo, rôle Buyer seul ; parcours ordinaires et vérification des restrictions | `0e7a4f04-6d0b-411b-afb7-2d1e1e5fe1a0` |
| **`william.jeannegarage`** | Administrateur de l’organisation, Buyer, Address Manager et Order Approver rapportés ; administration et approbation | `8cebb05a-b75a-4dd8-b1fb-d068830dd7b6` |
| `wg-fleet-manager` | Gestionnaire Fleet ; approbation dans son périmètre à vérifier | Relire via les services |
| `wg-chicago-buyer` | Achat pour Chicago | Relire via les services |
| `wg-dallas-buyer` | Achat pour Dallas ; scénario budgétaire | Relire via les services |
| `wg-workshop-buyer` | Achat pour Workshop & Maintenance | Relire via les services |
| `wg-procurement` | Gestion des politiques et budgets, sans rôle Buyer selon le peuplement | Relire via les services |

Les rôles storefront documentés incluent : 1 Organizational Unit Admin, 2 Order Approver, 4 Buyer, 9 Address Manager. Vérifier les attributions actuelles ; un intitulé de persona n’est pas une autorisation.

William fournit ou saisit les accès par le mécanisme prévu. **Aucun mot de passe, OTP, cookie, AppToken ou clé applicative ne doit figurer dans ce document, le code ou les fixtures.** Ne pas copier les fichiers d’environnement de l’ancien projet. Les chemins d’accès ou adresses de contact doivent être relus dans le service concerné si nécessaires : certaines notes anciennes comportent des erreurs de transcription.

Points d’attention :

- L’acheteur restreint a été confirmé revenu dans WanderGarage après un ancien test de déplacement. Ne pas le déplacer pour tester le sélecteur d’organisation.
- Le projet a observé qu’un ajout d’utilisateur à une autre unité pouvait le déplacer plutôt que cumuler les appartenances. Ne pas inventer un sélecteur multi-organisation à partir de ce seul modèle.
- Des doublons `shopper` ont été rapportés pour l’administrateur. Ne pas les supprimer ou choisir arbitrairement une fiche ; identifier la référence utilisée par le service.
- Ne pas mesurer l’expérience acheteur avec le compte administrateur.

## 7. Données commerciales et comptables

Le catalogue existant contient des données Volvo brésiliennes importées pour la démonstration, pas un catalogue EMEA de production. Référence historique du 10 septembre : 1 820 produits importés, 1 743 indexés, 77 hors index. Ces chiffres sont à dater et à recontrôler si utilisés. Prix et stock ne prouvent pas la commandabilité pour un acheteur, un seller, une quantité et une destination donnés.

Les sellers `volvodistributor1` et `volvoreseller1` existaient mais sans offres lors du relevé initial. Ne pas présenter un sourcing multi-seller opérationnel sans nouvelle preuve.

**État temporaire des champs comptables rapporté au 17 septembre** :

| Champ | État rapporté |
|---|---|
| Cost Center | Désactivé ; quatre valeurs créées : 4100, 4120, 4210, 4300 ; obligation conservée dans sa configuration |
| PO Number | Désactivé ; passé non obligatoire |
| Release, Location | Désactivés ; facultatifs |

Ne pas les réactiver, les recréer ni en changer le type automatiquement. Confirmer l’état actuel et la configuration cible avec le projet global avant les validations fonctionnelles. Les champs sont liés au contrat selon les observations du projet. Vérifier la saisie groupée et la persistance des valeurs à la ligne et à la commande ; ne pas supposer disponible une valeur par défaut encore annoncée en développement.

## 8. Périmètre fonctionnel à couvrir

Le fichier `Volvo_Customer_Portal_Demo_Feature_Scope.md` est la référence détaillée. Le minimum de couverture cible comprend :

1. Tableau de bord et navigation métier, contexte organisation/site/contrat.
2. Profil, préférences disponibles et déconnexion.
3. Organisation, unités, utilisateurs, rôles et permissions.
4. Adresses de facturation et livraison, rattachements et restrictions.
5. Moyens de paiement et conditions commerciales ; opérations de gestion effectivement exposées par les services.
6. Devis : liste, détail, statuts et transitions supportées, conversion quand disponible.
7. Commandes : liste, détail, suivi, documents, renouvellement et actions autorisées.
8. Approbations, budgets, règles d’achat et champs comptables.
9. Listes enregistrées, commande rapide, collage et import en masse.
10. Flotte, fiche véhicule, recherche de pièces et transmission au concessionnaire selon les sources retenues.

Le véhicule est **facultatif** : une commande de stock peut ne concerner aucun véhicule ou plusieurs. Prévoir des associations à la ligne si nécessaires. Ne pas confondre unité organisationnelle, site physique, adresse et centre de coût comptable.

Le contrat commercial Buyer Portal, la couverture Parts Assure et l’abonnement numérique restent trois objets métier distincts.

Retours, réclamations, avoirs, maintenance, télématique et réservation de service requièrent une source ou solution métier identifiée. Un mock limité est possible s’il est déclaré. Ne pas les annoncer comme fonctions natives disponibles parce qu’un écran est dessiné. Les boutons de soumission, réservation et activation doivent avoir un résultat réel identifié ou un statut de simulation explicite.

La compatibilité, les supersessions et les indications de sécurité viennent de sources Volvo faisant autorité ou de fixtures clairement délimitées. Une IA ne décide pas si un véhicule peut continuer à rouler.

## 9. Architecture à décider avant d’implémenter

Ne pas imposer automatiquement FastStore au nouveau projet parce que le site l’utilise. Choisir la stack du portail après l’inventaire des APIs, du besoin d’authentification, du routage et des composants réutilisables. Documenter ce choix et les commandes de développement/vérification.

Principes attendus :

- UI Volvo indépendante ; règles métier conservées dans Buyer Portal et les services VTEX.
- Intégrations serveur lorsque nécessaires ; aucune clé privilégiée exposée au navigateur.
- Propagation du contexte acheteur et contrôle d’accès par les services. Cacher un bouton ne remplace pas une permission.
- Accès inter-organisations et délégation explicitement autorisés ; ne pas utiliser une clé Owner pour contourner les droits acheteurs.
- Données sensibles de paiement gérées via les mécanismes supportés du fournisseur, sans stockage de données carte dans le portail.
- Pas de base parallèle pour recréer devis, budgets, permissions ou statuts de commandes.
- Changement de contexte organisation/site : revalidation du panier, des prix, des droits et des devis concernés.
- Domaine, session et SSO du nouveau portail à concevoir et tester ; le partage du compte ne garantit pas à lui seul une session partagée entre applications.

Dans le code existant, examiner de façon ciblée `src/features/bulk-order`, `src/utils/measure` et les composants de commande, listes et opérations GraphQL. Réutiliser seulement ce qui est pertinent et vérifié. Le harnais de mesure a fait l’objet de corrections et réserves : ne pas le copier en le considérant validé ni importer son backlog dans ce projet par défaut.

## 10. Première séquence de travail dans le nouveau dossier

### Étape A — Inventaire et contrat d’intégration

- Lire ce document, le scope ajusté et les besoins Volvo.
- Charger les règles William et les skills VTEX pertinents ; utiliser le skill FastStore seulement si cette stack est retenue.
- Confirmer en lecture seule l’organisation WanderGarage, ses utilisateurs, rôles, contrats, scopes, adresses et données utiles.
- Inventorier toutes les fonctions et actions de My Account, y compris celles réservées aux administrateurs et approbateurs.
- Pour chaque action, identifier l’API réelle, sa version, son authentification, son périmètre d’accès, ses données, ses erreurs et ses transitions autorisées. Ne pas deviner de routes à partir des noms d’écrans.
- Compléter la matrice : fonction → écran → rôle → API/source → réel/mock/storyboard → état → preuve attendue → écart restant.

### Étape B — Structure et conception

- Proposer la stack, l’organisation du dépôt et les frontières client/serveur.
- Définir les parcours et la navigation Volvo, avec visibilité par rôle.
- Préparer les écrans du socle client et un premier parcours complet avant d’étendre la flotte et les scénarios externes.
- Distinguer clairement design, fixture, intégration et validation réelle.

### Étape C — Réalisation par tranches

1. Shell du portail, session, déconnexion, contexte et contrôles d’accès.
2. Première tranche d’achat avec suivi de commande et approbation selon les règles existantes.
3. Couverture My Account complète : devis, organisation, équipe, adresses, paiements, listes, budgets, profil et paramètres comptables.
4. Une tranche Volvo véhicule → pièce → achat ou transmission au concessionnaire.
5. Extensions bornées Parts Assure, réclamations et besoin connecté, selon les sources et le mode de démonstration convenus.

La conception et les lectures peuvent avancer indépendamment des dépendances globales. Ne pas déclarer un parcours validé si son exécution réelle n’a pas abouti.

## 11. Validation et critères de fin

Employer quatre états : **configuré**, **implémenté**, **testé techniquement**, **validé en parcours réel**. Le mode réel/mock/storyboard est une dimension séparée.

Vérifications prioritaires :

- Acheteur, administrateur et approbateur : fonctionnalités visibles et opérations autorisées conformes aux rôles.
- Refus côté serveur d’une opération ou d’un accès hors périmètre.
- Données et modifications retrouvées via le service de référence, pas seulement dans l’état local de l’UI.
- Devis : transitions conformes au backend ; commandes : contexte, quantités et sources conservés.
- Adresses et moyens de paiement : visibilité et sélection conformes au contexte réel.
- Budget et approbation testés séparément. Exemples à revalider avec les soldes actuels : Chicago autour de 1 500 USD pour l’approbation ; Dallas autour de 200 USD pour le budget. Un test peut modifier le disponible : garder la trace du jeu utilisé.
- Recherche/commande sans véhicule, avec un véhicule et avec plusieurs associations si supportées.
- Saisie comptable en masse, conservation des données et absence de ressaisie cachée qui annulerait le gain du bulk order.
- États vides, chargement, erreurs, clavier et affichage mobile.
- Toutes les fonctions My Account inventoriées disposent d’une couverture ou d’un écart explicitement arbitré ; aucun mock silencieux pour compenser une API manquante.

## 12. Livrables et garde-fous de démarrage

Livrables initiaux attendus dans le nouveau projet :

- README avec objectif, installation et commandes réelles du projet choisi.
- Périmètre et sources datés dans `docs/context/`.
- Matrice de couverture My Account / portail et contrat d’intégration.
- Architecture décidée, parcours, rôles et plan de réalisation.
- Registre court des décisions, hypothèses, dépendances et preuves de validation.
- Exemple de configuration sans secrets, adapté aux services effectivement retenus.

L’autorisation de préparer ce dossier ne vaut pas autorisation de modifier le compte VTEX, de publier une application, de changer le domaine ou d’envoyer des messages à des tiers. Respecter les autorisations que William donne ensuite pour les étapes concrètes ; ne pas les redemander si elles sont déjà établies.

**Mission de reprise : construire l’expérience Customer Portal Volvo dans un projet distinct, réutiliser Buyer Portal et les services VTEX, prendre WanderGarage comme organisation de référence et assurer la couverture complète de My Account. Commencer par la matrice des capacités et le choix d’architecture ; ne pas reconstituer un nouveau référentiel B2B ni relancer le diagnostic du checkout global.**
