# Lots Claude — document de reprise

> **Statut au 25 septembre 2026 : lots 1–3 relus par Codex et intégrés.** Les avertissements « à relire » ci-dessous appartiennent à la remise initiale ; ils ne signifient pas que le lot reste en attente. Les évolutions de scénarios Truck 147/203 et les limites courantes figurent dans la [matrice](MATRICE_CAPACITES_VOLVO.md) et la [démo](DEMO-VOLVO.md). Ce handoff conserve les mesures techniques d’origine.

**Deux lots** sont documentés ici : « flotte de démonstration » puis « find parts ».
Les deux ont été écrits le 20 septembre 2026 et **ne sont pas relus**.

> ⚠️ **Ce lot a été écrit par Claude le 20 septembre 2026, sur demande de William.**
> Il n'a pas été relu par un humain. **À réviser avant de l'intégrer** à un travail en
> cours sur ce dépôt. Chaque fichier créé porte un en-tête `ÉCRIT PAR CLAUDE` et chaque
> bloc inséré dans un fichier existant est encadré par `>>> CLAUDE` / `<<< CLAUDE`.

Pour retrouver l'intégralité des insertions :

```bash
grep -rn "CLAUDE" src tests next.config.ts
```

## Ce que fait ce lot

Permettre à un utilisateur de choisir un camion de sa flotte et d'acheter les pièces
correspondantes, sans quitter le portail :

```
/fleet  →  panneau de détail  →  /fleet/{id}  →  système  →  pièces  →  brouillon  →  /quick-order  →  panier
```

## Réel contre fixture — la ligne de partage

| Élément                                                                  | Nature                                                         |
| ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Les 16 véhicules, VIN, immatriculations, kilométrages, contrats, alertes | **Fixture**, inventée de bout en bout                          |
| Les sites (Dallas, Houston, Austin, San Antonio)                         | **Fixture**                                                    |
| Le lien modèle → pièces (facette `application`)                          | **Réel** — spécification du catalogue volvoemea                |
| Les pièces, noms, références, images                                     | **Réels** — Intelligent Search, compte volvoemea               |
| Les prix et la disponibilité                                             | **Réels**                                                      |
| L'ajout au panier                                                        | **Réel** — passe par le brouillon puis `cart.ts` déjà en place |

## Approximations assumées

1. **La compatibilité n'est pas du fitment Volvo.** Les pièces sont listées d'après la
   spécification catalogue `Application`, elle-même issue d'une donnée brésilienne
   substitutive. Aucune source technique Volvo n'a validé ces correspondances. William a
   tranché : pour une démonstration, montrer que le parcours existe prime sur l'exactitude
   du mapping. Le bouton garde donc le libellé de la maquette, `Find compatible parts`,
   et une seule phrase de provenance figure en pied de liste.
2. **Les modèles de la maquette ont été remplacés.** Les visuels affichent des VNL 860 et
   VNR 300, nord-américains. Le catalogue volvoemea ne contient que des FH / FM / NH / VM,
   et **le nom des produits contient le modèle** (« Relay Valve for Volvo Trucks FH12
   Classic, FH13 Classic… ») : un VNL au-dessus de pièces FH se verrait immédiatement.
   La flotte utilise donc des modèles européens réels.
3. **Les VIN sont inertes.** Format à 17 caractères, WMI `YV2`, mais la position 9 — la clé
   de contrôle d'un VIN réel — porte un `Q`, lettre interdite dans un VIN. Aucun de ces
   numéros ne peut désigner un véhicule existant. Ils ne servent qu'à l'affichage et à la
   recherche locale : aucune requête VTEX ne les utilise.
4. **Trois photos officielles pour six gammes.** Visuels produit d'AB Volvo récupérés le
   20/09/2026 sur `assets.volvo.com` : FH, FM et VM. Volvo ne publie de vue studio que pour
   les modèles au catalogue, donc les générations Classic et le NH12 reprennent la vue de
   leur gamme actuelle. Écart de génération pour les Classic ; **écart de modèle pour le
   NH12**, un capoté représenté par un FH — 2 véhicules sur 16. Détail, provenance et
   procédure de remplacement dans `public/assets/fleet/SOURCES.md`.

## Fichiers créés

| Fichier                                                               | Rôle                                                                                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/parts.ts`                                                 | Slugs `application` vérifiés en production, schémas zod des réponses Intelligent Search, construction des facettes, mappeurs |
| `src/domain/fleet.ts`                                                 | Les 16 véhicules, gammes de cabine, compteurs, `vehicleSelection`                                                            |
| `src/server/parts.ts`                                                 | Client Intelligent Search                                                                                                    |
| `src/components/fleet-list.tsx`                                       | Recherche, 5 filtres, onglets, tableau, pagination                                                                           |
| `src/components/fleet-detail-panel.tsx`                               | Panneau latéral de la maquette                                                                                               |
| `src/components/parts-picker.tsx`                                     | Grille de pièces et ajout au brouillon                                                                                       |
| `src/app/fleet/[vehicleId]/page.tsx`                                  | Fiche véhicule, systèmes, pièces                                                                                             |
| `tests/fleet.test.ts`, `tests/parts.test.ts`                          | 8 tests                                                                                                                      |
| `public/assets/fleet/volvo-fh.webp`, `volvo-fm.webp`, `volvo-vm.webp` | Visuels produit officiels AB Volvo, 36 / 30 / 19 Ko                                                                          |
| `public/assets/fleet/SOURCES.md`                                      | Provenance des photos et report des gammes sans visuel                                                                       |

## Fichiers modifiés

| Fichier                                   | Changement                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/app/[section]/page.tsx`              | La section `fleet` rend `<FleetList>` ; la restriction au mode aperçu est levée                         |
| `src/components/shell.tsx`                | Options du sélecteur issues de la flotte ; véhicule **et** urgence modifiables en session VTEX          |
| `src/app/api/portal/[operation]/route.ts` | Voir « Changement de contrat » ci-dessous                                                               |
| `src/components/home.tsx`                 | Photo, modèle et alerte lus depuis la fixture ; `<img>` remplacé par `next/image`                       |
| `src/domain/fixtures.ts`                  | Véhicule d'aperçu par défaut : `defaultVehicleId`                                                       |
| `src/components/icons.tsx`                | Ajout de `MapPin` et `Handshake`                                                                        |
| `next.config.ts`                          | `images.remotePatterns` pour `volvoemea.vtexassets.com`                                                 |
| `src/components/replenishment.tsx`        | Quick Order recharge d'office un brouillon déjà enregistré en session — voir « Changements de contrat » |
| `src/app/globals.css`                     | Styles de l'écran flotte et de la liste de pièces                                                       |
| `tests/api.integration.test.ts`           | Le contexte prend `truck-147` et non `Truck 147`                                                        |

## Changements de contrat — à relire en priorité

**1. `context.vehicle` contient désormais un identifiant, plus un libellé.**
Avant : `"Truck 147"`. Après : `"truck-147"`. Validé par `vehicleSelection`
(`src/domain/fleet.ts`), qui n'accepte que la chaîne vide ou un identifiant de la flotte.
Toute session ouverte avant ce lot porte l'ancienne valeur : elle sera simplement ignorée
à l'affichage. Le test d'intégration a été mis à jour en conséquence.

**2. Le changement de véhicule et d'urgence est autorisé en session VTEX.**
Avant, `/api/portal/context` répondait `403 CONTEXT_NOT_QUALIFIED` hors mode aperçu, ce qui
rendait le sélecteur inerte pendant une démonstration connectée.

Le raisonnement : le véhicule et l'urgence ne sont **que des filtres d'affichage**. Ils ne
confèrent aucun droit et ne conditionnent aucun achat — conformément à
`docs/CADRAGE_PORTAIL_VOLVO.md:148`. Le **changement d'unité reste refusé** hors aperçu :
il touche la portée commerciale et vide panier, brouillon et préparation.

C'est le seul assouplissement de garde de ce lot. Si vous le jugez trop large, le point
d'entrée est le bloc `>>> CLAUDE` de la section `context` dans
`src/app/api/portal/[operation]/route.ts`.

**3. Quick Order recharge d'office un brouillon déjà enregistré.**
`Preparation` (`src/components/replenishment.tsx`) passe `session.draft` en `initialLines`
quand aucune commande ni liste n'est demandée. Sans cela, l'ajout d'une pièce depuis une
fiche véhicule menait à une page qui paraît vide : le brouillon n'était rechargé que par le
bouton « Restore saved draft ». Ce bouton reste présent et inchangé.

C'est le seul endroit où ce lot modifie le comportement d'une fonction écrite par
quelqu'un d'autre. Si le rechargement explicite était un choix délibéré, le retour arrière
tient en une ligne — le bloc `>>> CLAUDE` de ce fichier.

**4. `statusModifier` vit dans `src/domain/fleet.ts`, pas dans un composant.**
Il était d'abord exporté depuis `fleet-detail-panel.tsx`, qui porte `"use client"` : la
fiche véhicule, rendue côté serveur, ne pouvait pas l'appeler et la page répondait 500.
Les helpers partagés entre serveur et client doivent rester dans `src/domain/`.

## Décision technique à connaître

**`category-1` n'est pas épinglé dans les requêtes Intelligent Search.** Mesuré le 20/09 :

| Modèle         | Sans `category-1` | Avec |
| -------------- | ----------------- | ---- |
| `fh13-classic` | 323               | 313  |
| `vm`           | 465               | 442  |
| `nh12-classic` | 284               | 272  |

Le dépôt storefront documente 175 produits dont la `category-1` contredit les modèles
déclarés. Épingler en perd. Un test verrouille cette décision (`tests/parts.test.ts`).

## Vérifications passées

```
npm run typecheck   ✓
npm run lint        ✓
npm run build       ✓
npm test            ✓  31 passés, 1 sauté (scénario HTTP, nécessite le serveur)
```

Pour inclure le scénario HTTP : démarrer le serveur puis
`PORTAL_INTEGRATION_TESTS=true npm test`.

Contrôle des données réelles, sans authentification :

```bash
curl -s "https://volvoemea.vtexcommercestable.com.br/api/io/_v/api/intelligent-search/product_search/trade-policy/1/application/fh13-classic/category-2/brakes?query=&count=3"
```

## Reste à faire

- Obtenir, si possible, une vue officielle du NH12 et des générations Classic, puis
  corriger la ligne correspondante dans `cabFamilies` (`src/domain/fleet.ts`).
- Supprimer `public/assets/volvo-truck.png` (1,2 Mo, Volvo VNL) une fois qu'aucun écran ne
  le référence ; il ne sert plus que de repli théorique.
- Vérification navigateur en session VTEX réelle : **non faite**. Le parcours complet a été
  vérifié en mode aperçu (flotte → Truck 147 → Brakes → 25 pièces réelles → ajout →
  Quick Order). En session connectée, la devise viendra de la session VTEX au lieu d'être
  omise, et `validateVtexSession` s'exécutera à chaque rendu de la fiche véhicule.
- Association véhicule / ordre de travail par ligne de commande : hors périmètre, le
  brouillon reste `{sku, quantity}`.
- Le dépôt n'a toujours aucun commit. Deux sessions y écrivent en parallèle.

---

# Lot 2 — « find parts » : l'écran `/parts`

> ⚠️ **Écrit par Claude le 20 septembre 2026, après le lot flotte. Non relu.**
> Marqueurs : en-tête `ÉCRIT PAR CLAUDE — lot « find parts »` sur les fichiers créés,
> bornes `>>> CLAUDE — lot find parts` / `<<< CLAUDE` dans les fichiers existants.

```bash
grep -rn "lot find parts" src tests
```

## Ce que fait ce lot

`/parts` rendait le panneau générique « This workspace is coming next », alors que la
tuile n°1 de l'accueil promet « Search parts by vehicle, category or part number ».
L'écran existe maintenant, avec quatre points d'entrée :

| Entrée              | Exemple                                          | Résultat mesuré                                  |
| ------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Référence exacte    | `21811707`                                       | 1 pièce                                          |
| Mot-clé             | `clutch`                                         | 85 pièces                                        |
| VIN ou n° de flotte | `YV2RT40AQFB312947`                              | bascule sur Truck 147 → FH13 Classic, 323 pièces |
| Facettes            | `application:fh13-classic` + `category-2:brakes` | 25 pièces                                        |

Puis : ajout → brouillon de session → Quick Order → panier existant. Aucun nouvel
endpoint d'achat.

## Choix d'architecture

**Composant serveur piloté par l'URL**, comme la fiche véhicule. Les facettes sont des
liens (`/parts?q=…&f=application:vm&f=category-2:brakes`), pas de l'état client, donc
**aucune route d'API supplémentaire** — rien n'a été ajouté à
`src/app/api/portal/[operation]/route.ts` dans ce lot.

## Fichiers créés

| Fichier                         | Rôle                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| `src/domain/volvo-models.ts`    | Port de `isPresentableModel()` et `modelFamily()` depuis le storefront |
| `src/components/find-parts.tsx` | L'écran : recherche, facettes, résultats, pagination                   |
| `tests/find-parts.test.ts`      | 6 tests                                                                |

## Fichiers modifiés

| Fichier                                               | Changement                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/domain/parts.ts`                                 | Recherche libre : `facetValueSchema`, `displayedFacets`, `selectedFacetPath`, `parseSelectedFacets`, `readFacetGroups` |
| `src/server/parts.ts`                                 | `searchParts()` — produits et facettes en parallèle                                                                    |
| `src/domain/fleet.ts`                                 | `vehicleByIdentifier()` — VIN / n° de flotte / immatriculation, correspondance **exacte**                              |
| `src/app/[section]/page.tsx`                          | `section === "parts"` rend `<FindParts>`                                                                               |
| `src/domain/portal.ts`                                | **Retrait de `permission: "purchase"` sur `parts`** — voir ci-dessous                                                  |
| `src/app/globals.css`                                 | Styles de la barre de recherche et des groupes de facettes                                                             |
| `tests/order-draft.test.ts`, `tests/security.test.ts` | Deux assertions mises à jour — voir ci-dessous                                                                         |

## Changement de contrat — à relire en priorité

**`/parts` n'exige plus la permission `purchase`.**

Avant : `canVisit()` masquait l'écran à tout contexte sans `purchase`. Comme une session
VTEX réelle porte `permissions: []` (`src/server/vtex.ts`), l'écran aurait été **invisible
en démonstration connectée**.

Décision de William : chercher une pièce n'est pas l'acheter. Le projet avait déjà tranché
ainsi pour la préparation de commande.

**Ce qui n'a pas bougé :** l'achat reste protégé par votre `mayPlaceOrders()`, appelé à la
préparation et avant chaque ajout au panier. Ce lot ne touche pas
`src/server/purchase-permission.ts`, `cart.ts`, `custom-quotes.ts`, `quotes.tsx` ni
`quick-order.tsx`.

**Deux tests portaient l'ancienne règle** et affirmaient `canVisit(procurement, "parts") ===
false`. Ils affirment maintenant `true`, avec un commentaire encadré expliquant pourquoi.
Les assertions de sécurité réelles des deux tests — l'approbation reste fermée à un
acheteur, une route inventée est refusée — sont **intactes**. Si vous jugez le
changement trop large, le point de retour est le bloc `>>> CLAUDE` dans
`src/domain/portal.ts`.

## Décisions de données

- **Les libellés composés sont masqués du chemin guidé.** `Application` contient des
  étiquettes comme « FH13 / FM11 / FM13 » et une valeur `Teste` : 35 entrées sur 80.
  `isPresentableModel()` les écarte **à l'affichage**. Conséquence assumée, identique à
  celle du storefront : environ **6 % du catalogue** n'est pas atteignable par la cascade,
  mais le reste par la recherche texte.
- **`category-1` n'est jamais épinglé**, ici comme dans le lot flotte. Un test le verrouille.
- **La facette `price` rend des valeurs nulles.** Le schéma les tolère ; sans cela toute la
  réponse était rejetée et les facettes disparaissaient de la fiche véhicule. C'était un
  vrai défaut du lot flotte, corrigé pendant celui-ci.
- **L'autocomplete d'Intelligent Search renvoie une liste vide sur ce compte.** Aucune
  saisie assistée n'a été construite.

## Déclaré hors périmètre, avec la raison

- **Diagramme technique, éligibilité, restrictions, supersessions, délai, source
  d'approvisionnement** — demandés par le scope, aucune source faisant autorité. Non
  affichés plutôt qu'inventés.
- **Ordre de travail** — aucun mécanisme de persistance établi.
- **Commande précédente comme point d'entrée** — le compte acheteur a zéro commande ; une
  entrée qui ne peut rien renvoyer n'a pas sa place dans une démonstration. À rebrancher
  quand une commande réelle existera.
- **Fiche produit détaillée** — pas de source pour l'information technique. Les résultats
  restent une liste.

## Vérifications

```
npm run typecheck   ✓
npm run lint        ✓
npm run build       ✓
npm test            ✓  37 passés, 1 sauté (scénario HTTP, nécessite le serveur)
prettier --check    ✓  les fichiers des deux lots ont été reformatés à votre convention
```

Rendu réel mesuré en session d'aperçu, côté serveur :

| URL                          | Résultat                | Temps  |
| ---------------------------- | ----------------------- | ------ |
| `/parts`                     | Browse 1764 parts       | 0,87 s |
| `/parts?q=clutch`            | 85 parts found          | 0,46 s |
| `/parts?q=21811707`          | 1 part found            | 0,37 s |
| `/parts?q=YV2RT40AQFB312947` | Matched Truck 147 → 323 | 0,59 s |

Navigateur : recherche référence, mot-clé et VIN vérifiées ; ajout depuis `/parts`
retrouvé dans Quick Order (« From your saved preparation ») ; largeur 375 px sans
débordement horizontal.

**Non vérifié :** session VTEX réelle. En connecté, la devise viendra de la session au lieu
d'être omise.

---

# Lot 3 — fiabilisation flotte / Find Parts

> ⚠️ **Écrit par Claude le 20 septembre 2026**, sur le périmètre confié par Codex
> (`docs/LOT-CLAUDE-SUIVANT.md`). Corrige les points **3 à 6** de
> `docs/REVUE-FLOTTE-PARTS.md`. Non relu. Recette navigateur à faire par William.

```bash
grep -rn "lot fiabilisation" src tests
```

## Fichiers modifiés

| Fichier                              | Changement                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/domain/parts.ts`                | `MAX_PARTS_PAGE`, `reachablePages`, `isTruncated`, `clampPartsPage`, `exactReferenceMatch`, `withVehicleModel`     |
| `src/server/parts.ts`                | `pages` et `truncated` exposés par les deux recherches ; note de contrat sur le schéma strict                      |
| `src/components/find-parts.tsx`      | Points 3 à 6, facettes dépliables, page hors plage                                                                 |
| `src/app/fleet/[vehicleId]/page.tsx` | Pagination bornée, retrait de la devise acheteur, page hors plage                                                  |
| `src/components/parts-picker.tsx`    | **Textes d'offre et de devise uniquement.** Logique d'ajout, verrou et quantités inchangés ; fichier non reformaté |
| `src/app/globals.css`                | Uniquement dans le bloc `find parts` existant                                                                      |
| `tests/find-parts.test.ts`           | 4 tests de non-régression, un par point                                                                            |

Fichiers réservés à Codex **non touchés**, vérifié par horodatage : route API,
page section, session store, cart, quick-order, purchase-permission,
custom-quotes, quotes. Aucun changement transversal n'a été nécessaire.

## Ce qui est corrigé, avec la preuve

**Point 3 — facettes ignorées après VIN.** Le véhicule impose sa facette
`application` et les autres facettes de l'URL sont conservées. Mesuré :

| URL                                        | Avant                   | Après  |
| ------------------------------------------ | ----------------------- | ------ |
| `?q=YV2RT40AQFB312947`                     | 323                     | 323    |
| `?q=YV2RT40AQFB312947&f=category-2:brakes` | **323** (filtre ignoré) | **25** |

Le bandeau du véhicule porte **« Remove vehicle »**, qui retire le VIN et
conserve le modèle en facette visible et retirable, comme demandé.

**Point 4 — pagination.** Limite **mesurée**, pas supposée : Intelligent Search
s'arrête à la **page 50, quel que soit `count`** — sept sondages (count 1, 12,
24, 50 × pages 50 et 51). Au-delà il rend `products: []` **et omet
`recordsFiltered`**.

| URL                        | Avant             | Après                                                         |
| -------------------------- | ----------------- | ------------------------------------------------------------- |
| `/parts`                   | Page 1 of **147** | Page 1 of **50** + mention de la limite                       |
| `/parts?page=999`          | erreur de schéma  | Page 50 of 50                                                 |
| `/fleet/truck-147?page=99` | erreur de schéma  | « No results on page 50. The last page is 27. » + lien retour |

Le schéma reste **strict volontairement** : l'appelant ne demande jamais
au-delà de la borne, donc une réponse sans `recordsFiltered` **dans** la plage
autorisée reste une anomalie remontée en `PARTS_FORMAT`, pas une fin de liste.

**Point 5 — offre publique.** `getBuyerProfile` retiré des deux écrans
catalogue : l'offre lue est publique, politique commerciale 1, sans cookie
acheteur, et ne doit pas être étiquetée avec la devise de session. Les montants
s'affichent sans symbole, sous le libellé « Catalogue price », et chaque écran
renvoie la confirmation vers Quick Order. Effet de bord : un aller-retour VTEX
de moins par rendu.

**Point 6 — référence exacte.** La promesse était fausse, **mesuré** : sur sept
références, `85021811` rend **6** produits (`85021811k-MO-GotemburgoCAN`…) et
`1521910` en rend **2** (`1521910`, `1521910k`). L'étiquette « Exact reference »
n'apparaît donc qu'après **comparaison effective** des références rendues au
terme saisi, jamais d'après la position dans la liste. Les autres résultats sont
annoncés comme des correspondances de texte.

**Facettes au-delà de 14.** Dépliant « Show N more » par groupe, sans JavaScript.

## Limites qui restent

- **La compatibilité reste la spécification catalogue `Application`**, pas un
  fitment Volvo. Inchangé.
- **Profondeur de catalogue** : 600 produits atteignables à 12 par page. Monter
  `PARTS_PAGE_SIZE` repousserait la borne (50 × 50 = 2 500) au prix de pages plus
  lourdes — non fait, à arbitrer.
- **Seul le premier SKU de chaque produit est mappé**, et le choix du vendeur
  n'est pas transmis au brouillon. Backlog, inchangé par ce lot.
- **Recette navigateur non faite** : tout ce qui précède est vérifié par test et
  par rendu serveur en session d'aperçu. Aucune session VTEX connectée.

## Recette pour William — 5 étapes

1. `/parts`, chercher **`1521910`** : 2 résultats, bandeau vert « Exact reference
   1521910 found — the other 1 result matches the text of your search ».
2. Chercher **`YV2RT40AQFB312947`** : bandeau « Matched Truck 147 », 323 pièces.
   Cliquer le système **Brakes** : doit tomber à **25 pièces**, le bandeau
   véhicule restant affiché.
3. Depuis là, cliquer **« Remove vehicle »** : le VIN disparaît du champ, le
   modèle **FH13 Classic** apparaît en facette active et reste retirable d'un clic.
4. `/parts` sans recherche : pied de liste « Page 1 of 50 » et mention de la
   limite des 50 pages. Taper `/parts?page=999` dans l'URL : doit afficher
   « Page 50 of 50 », pas une erreur.
5. Sur n'importe quelle pièce : le prix s'affiche **sans symbole monétaire**,
   sous-titré « Catalogue price », avec « Listed as available · confirm in Quick
   Order ». L'ajout au brouillon doit continuer de fonctionner comme avant.

## Vérifications

```
npm run typecheck   ✓
npm run lint        ✓
npm run build       ✓
npm test            ✓  41 passés, 1 sauté (scénario HTTP, nécessite le serveur)
prettier --check    ✓  parts-picker.tsx conforme sans avoir été reformaté
```
