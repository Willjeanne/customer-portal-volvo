# Lot « import .xlsx » dans Quick Order — document de reprise

> ⚠️ **Écrit par Claude le 20 septembre 2026**, sur mission de Codex. **Non relu.**
> Marqueurs : en-tête `ÉCRIT PAR CLAUDE — lot « import xlsx »` sur les fichiers créés,
> bornes `>>> CLAUDE — lot import xlsx` / `<<< CLAUDE` dans `quick-order.tsx`.

```bash
grep -rn "lot import xlsx" src tests
```

## Fichiers

| Fichier                                   | Nature   | Changement                                                           |
| ----------------------------------------- | -------- | -------------------------------------------------------------------- |
| `src/domain/order-xlsx.ts`                | **créé** | Lecture du classeur, sans dépendance                                 |
| `tests/order-xlsx.test.ts`                | **créé** | 5 tests ciblés                                                       |
| `public/assets/quick-order-template.xlsx` | **créé** | Modèle d'exemple, 4,9 Ko                                             |
| `src/components/quick-order.tsx`          | modifié  | **Uniquement** l'import du module et le bloc du sélecteur de fichier |
| `docs/HANDOFF-XLSX.md`                    | créé     | Ce document                                                          |

`src/domain/order-draft.ts` n'est **pas** modifié. Aucun fichier réservé à Codex n'est
touché : API partagée, session store, panier, checkout, permissions, devis, navigation,
CSS global sont intacts. Dans Quick Order, les fonctions de sauvegarde, de contrôle VTEX,
de transfert et de checkout ne sont pas modifiées — `git diff` sur ce fichier montre aussi
tes propres changements non commités (`useRouter`, `openCheckout` vers `/checkout`) ; ma
seule empreinte est l'import en tête et le bloc encadré du sélecteur.

## Aucune dépendance ajoutée — et pourquoi

Les trois candidates ont été auditées avant de décider :

| Paquet            | Audit npm                     | Verdict                                       |
| ----------------- | ----------------------------- | --------------------------------------------- |
| `xlsx` (SheetJS)  | **1 vulnérabilité haute**     | Écarté — le projet revendique un audit propre |
| `exceljs`         | **2 vulnérabilités modérées** | Écarté                                        |
| `read-excel-file` | aucune                        | Écarté pour une autre raison                  |

`read-excel-file` est saine, mais son entrée navigateur n'est pas exposée à l'ESM de Node :
les tests auraient dû passer par son entrée `node`, donc **ne pas exercer le code que le
navigateur exécute**. Deux chemins de code pour une fonction d'import, c'est précisément ce
qu'on ne veut pas tester à moitié.

Un `.xlsx` est une archive ZIP de fichiers XML, et il n'en faut que deux colonnes.
`DecompressionStream('deflate-raw')` existe côté navigateur **et** sous Node : le module
lit l'archive lui-même, en un seul chemin de code, testé tel qu'il s'exécute. Zéro
dépendance, zéro poids de bundle, rien à surveiller côté chaîne d'approvisionnement.

## Les règles ne sont pas réécrites

Le module lit la feuille, puis **repasse les lignes à `parseOrderCsv`**, qui reste seul
juge des références, des quantités, des doublons, de l'en-tête, du plafond de 200 lignes
et du refus d'import partiel. Le round-trip par CSV suit une convention déjà présente dans
le fichier (`add()` fait `parseOrderCsv(draftCsv(...))`).

Conséquence voulue : un import qui échoue **ne remplace pas le brouillon**, exactement
comme le CSV, puisque c'est la même fonction qui décide.

## Vérifié sur des fichiers réels

| Cas                                                             | Résultat                                    |
| --------------------------------------------------------------- | ------------------------------------------- |
| Modèle livré (openpyxl, `inlineStr`)                            | 3 lignes importées                          |
| Classeur à la manière d'Excel (`sharedStrings`, cible relative) | 3 lignes importées                          |
| Sans ligne d'en-tête                                            | importé, règle CSV                          |
| Doublons `21811707` ×2 puis ×3                                  | fusionné à 5                                |
| Quantité `0`                                                    | refus complet, message existant             |
| Classeur à deux onglets                                         | lit bien le **premier** onglet              |
| Fichier CSV renommé `.xlsx`                                     | « This file is not an Excel workbook. »     |
| Archive tronquée                                                | « This workbook is damaged or incomplete. » |
| Feuille vide                                                    | « The first sheet is empty. »               |

Un défaut trouvé et corrigé en chemin : une feuille à **une seule colonne** produisait
« CSV formatting is invalid. Check quotes and separators. » — incompréhensible après
l'import d'un Excel, parce que Papa ne détecte aucun séparateur sur une colonne unique.
Les lignes sont désormais complétées à deux colonnes, ce qui rend le message juste :
en-tête attendu, ou quantité manquante sur la ligne.

## Limites connues

- **Premier onglet uniquement**, résolu par `workbook.xml` puis ses relations, avec repli
  sur `sheet1.xml`. Un classeur dont les données sont sur le deuxième onglet ne sera pas lu.
- **Pas de vérification CRC** des entrées de l'archive. Un fichier corrompu au milieu
  produira une feuille illisible, donc « empty » ou une erreur de ligne, jamais un plantage.
- **ZIP64 non géré** : sans objet ici, le plafond est 100 Ko.
- **Formules non évaluées** : seule la valeur mise en cache par le tableur est lue. Une
  cellule calculée jamais enregistrée par Excel sera vide.
- **Dates et formats ignorés** : on ne lit que du texte et des nombres, ce dont les deux
  colonnes ont besoin.
- Le plafond de 100 Ko porte sur le **fichier compressé**, comme pour le CSV ; la limite
  réelle qui protège reste les 200 lignes de `parseOrderCsv`.

## Hors périmètre — à valider par Codex avant de le faire

Le dépliant qui contient le sélecteur s'intitule toujours **« Paste or import CSV »** et
son paragraphe ne parle que de CSV. Le sélecteur, lui, annonce « Choose CSV or Excel
file ». Changer ce titre et cette phrase améliorerait la découvrabilité, mais sort de
« uniquement le sélecteur de fichier et le branchement » : **je ne l'ai pas fait.**

Le modèle `public/assets/quick-order-template.xlsx` est livré mais **aucun lien ne le
propose dans l'interface**, pour la même raison. Il est accessible à
`/assets/quick-order-template.xlsx`. Ajouter le lien est une ligne, à ton accord.

## Recette pour William — 3 étapes

1. **Quick Order → « Paste or import CSV » → Choose CSV or Excel file.** Prendre
   `public/assets/quick-order-template.xlsx` (ou l'ouvrir depuis
   `http://127.0.0.1:3000/assets/quick-order-template.xlsx`). Le brouillon doit afficher
   **3 pièces · 7 unités** : 21811707 ×2, 3987120 ×1, 20526087 ×4.
2. **Ouvrir ce même fichier dans Excel, mettre une quantité à `0`, enregistrer, réimporter.**
   Attendu : un message « Row N: provide a SKU and a whole quantity from 1 to 9999. » et
   **le brouillon précédent intact** — aucun import partiel.
3. **Renommer un `.csv` en `.xlsx` et l'importer.** Attendu : « This file is not an Excel
   workbook. » Puis réimporter le vrai `.csv` : l'import CSV doit fonctionner comme avant.

## Vérifications

```
npm run typecheck   ✓
npm run lint        ✓
npm run build       ✓
npm test            ✓  50 passés, 1 sauté (scénario HTTP, nécessite le serveur)
prettier --check    ✓  quick-order.tsx conforme sans avoir été reformaté
npm audit           inchangé : aucune dépendance ajoutée
```
