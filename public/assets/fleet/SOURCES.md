# Photos de la flotte de démonstration

> ⚠️ Dossier préparé par Claude (lot « flotte de démonstration », 20/09/2026).
> À relire avant intégration. Voir [../../../docs/HANDOFF-FLOTTE.md](../../../docs/HANDOFF-FLOTTE.md).

## Provenance

Visuels produit **officiels d'AB Volvo**, récupérés le **20 septembre 2026** depuis le DAM
public de Volvo, `assets.volvo.com`, tel que servi par les pages modèles de
`volvotrucks.com`. Téléchargement autorisé par William pour cette démonstration.

| Fichier         | Octets | Asset d'origine                                                                                 | Page qui le sert                         |
| --------------- | ------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `volvo-fh.webp` | 36 692 | `assets.volvo.com/is/image/VolvoInformationTechnologyAB/trucks-landing-volvo-fh-cgi-exterior-2` | volvotrucks.com/en-en/trucks/models.html |
| `volvo-fm.webp` | 30 388 | `assets.volvo.com/is/image/VolvoInformationTechnologyAB/trucks-landing-volvo-fm-cgi-exterior-2` | volvotrucks.com/en-en/trucks/models.html |
| `volvo-vm.webp` | 19 092 | `assets.volvo.com/is/image/VolvoInformationTechnologyAB/volvo_vm`                               | volvotrucks.com/en-en/trucks/models.html |

Paramètres de rendu appliqués à l'URL d'origine : `?wid=1024&fmt=webp&qlt=85`. Le DAM est
un Adobe Scene7 : changer `wid` suffit à obtenir une autre taille depuis la source.

Les trois vues sont homogènes — trois quarts avant, fond blanc, éclairage studio — ce qui
était le critère : le tableau de la flotte ne doit pas être bariolé.

**Ces images appartiennent à AB Volvo.** Elles sont utilisées ici dans une démonstration
présentée à Volvo. Tout autre usage doit être validé avec eux.

## Trois fichiers pour six gammes — et pourquoi

Volvo ne publie de vue studio que pour les modèles **au catalogue**. Les générations
« Classic » (FH12/FH13/FM11/FM12/FM13 Classic) et le NH12 sont retirés depuis longtemps :
aucune vue produit équivalente n'existe sur le site officiel.

La section patrimoine (`/about-us/history.html`) propose bien un FH vert de la bonne
époque, mais c'est une **photo de scène panoramique** sur route de montagne. Placée dans un
tableau à côté de vues studio, elle jurerait. Écartée pour cette raison, pas par manque de
disponibilité.

Report retenu, dans `cabFamilies` (`src/domain/fleet.ts`) :

| Gamme        | Fichier utilisé | Nature du report                                                  |
| ------------ | --------------- | ----------------------------------------------------------------- |
| `fh-new`     | `volvo-fh.webp` | exact                                                             |
| `fm-new`     | `volvo-fm.webp` | exact                                                             |
| `vm`         | `volvo-vm.webp` | exact                                                             |
| `fh-classic` | `volvo-fh.webp` | **écart de génération** — même modèle, cabine plus récente        |
| `fm-classic` | `volvo-fm.webp` | **écart de génération**                                           |
| `nh12`       | `volvo-fh.webp` | **écart de modèle** — le NH12 est un capoté, l'image montre un FH |

Le seul report vraiment discutable est `nh12`, qui concerne **2 véhicules sur 16**
(Truck 087 et Truck 298). Si quelqu'un obtient une vue officielle du NH12 ou des
générations Classic, il suffit de déposer le fichier ici et de corriger la ligne
correspondante dans `cabFamilies`.

## Taille

Un seul fichier par modèle : `next/image` produit les dérivées, y compris la vignette de
64 px du tableau. Le fichier source n'est jamais envoyé tel quel au navigateur.

Garde-fou — aucun fichier ne doit dépasser 120 Ko :

```bash
find public/assets/fleet -name "*.webp" -size +120k
```

Doit ne rien renvoyer.

## Image encore référencée ailleurs

`public/assets/volvo-truck.png` (1,2 Mo) est un Volvo VNL nord-américain, hérité de la
maquette. Il ne sert plus de repli à la flotte. Il reste le repli défini dans
`vehiclePhoto()` si une gamme repassait à `photo: null`. À supprimer une fois qu'aucun
écran ne le référence.
